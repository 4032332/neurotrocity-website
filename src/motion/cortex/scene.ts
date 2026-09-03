/**
 * Builds every three.js object the cortex needs and knows how to throw it away.
 * No per-frame logic lives here — see index.ts for the loop.
 */
import * as THREE from 'three';
import { buildClusters, type Cluster, type Fibre } from './geometry';
import { FIELD_VERT, FIELD_FRAG } from './field.glsl';
import { MAX_RECTS } from './attenuation';
import type { Palette } from './palette';

export interface Budget { fibresPerCluster: number; maxPulses: number; dust: number }

export interface FieldUniforms extends Record<string, THREE.IUniform> {
  uTime: { value: number };
  uProg: { value: number };
  uAspect: { value: number };
  uAmt: { value: number };
  uPointer: { value: THREE.Vector2 };
  uC1: { value: THREE.Vector3 };
  uC2: { value: THREE.Vector3 };
  uQuiet: { value: Float32Array };
  /** Drawing-buffer size (DPR-scaled) — the scene materials map gl_FragCoord through it. */
  uResolution: { value: THREE.Vector2 };
  /** How much light a fibre/soma/pulse keeps under a quiet rect. */
  uQuietFloor: { value: number };
}

export interface Soma {
  sprite: THREE.Sprite;
  spriteMat: THREE.SpriteMaterial;
  core: THREE.Mesh;
  flare: number;
}

export interface PulseBuffers {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  pos: Float32Array;
  col: Float32Array;
}

export interface CortexScene {
  clusters: Cluster[];
  fibres: Fibre[];
  /** Cluster hue as flat [r,g,b] triples, indexed by cluster * 3. */
  clusterRgb: Float32Array;
  group: THREE.Group;
  world: THREE.Scene;
  bgScene: THREE.Scene;
  bgCamera: THREE.Camera;
  uniforms: FieldUniforms;
  fibreHot: THREE.LineBasicMaterial;
  fibreDim: THREE.LineBasicMaterial;
  somata: Soma[];
  pulses: PulseBuffers;
  dispose(): void;
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,.72)');
  grad.addColorStop(0.45, 'rgba(255,255,255,.20)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Injected into every scene material so fibres, somata, dust and pulses part
// around text the same way the nebula does. quietness() must stay identical to
// the copy in field.glsl.ts (it reads the same uQuiet uniform).
const QUIET_GLSL = [
  `uniform vec4 uQuiet[${MAX_RECTS}]; uniform vec2 uResolution; uniform float uQuietFloor;`,
  'float quietness(vec2 p){',
  '  float q = 1.0;',
  `  for(int i = 0; i < ${MAX_RECTS}; i++){`,
  '    if(uQuiet[i].z <= 0.0) continue;',
  '    vec2 d = abs(p - uQuiet[i].xy) - uQuiet[i].zw;',
  '    float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);',
  '    q = min(q, smoothstep(-0.02, 0.10, sd));',
  '  }',
  '  return q;',
  '}',
].join('\n');

// In three r185 meshbasic (which LineBasicMaterial also uses), points and
// sprite all close with `#include <opaque_fragment>` then
// `#include <colorspace_fragment>`; hooking the latter lands after the final
// gl_FragColor write and before the colour-space conversion.
const QUIET_HOOK = '#include <colorspace_fragment>';
const QUIET_APPLY = [
  'float qk = mix(uQuietFloor, 1.0, quietness(gl_FragCoord.xy / uResolution * 2.0 - 1.0));',
  'gl_FragColor.rgb *= qk; gl_FragColor.a *= qk;',
  QUIET_HOOK,
].join('\n');

/** Every material in the world scene goes through this; none is left unhooked. */
function honourQuiet<T extends THREE.Material>(mat: T, u: FieldUniforms): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uQuiet = u.uQuiet;
    shader.uniforms.uResolution = u.uResolution;
    shader.uniforms.uQuietFloor = u.uQuietFloor;
    if (!shader.fragmentShader.includes(QUIET_HOOK)) {
      throw new Error(`cortex: ${mat.type} fragment shader lacks ${QUIET_HOOK}`);
    }
    shader.fragmentShader = QUIET_GLSL + '\n' +
      shader.fragmentShader.replace(QUIET_HOOK, QUIET_APPLY);
  };
  return mat;
}

function fibreGeometry(clusters: Cluster[], rgb: Float32Array): THREE.BufferGeometry {
  const lp: number[] = [], lc: number[] = [];
  clusters.forEach((cl, ci) => {
    const r = rgb[ci * 3], g = rgb[ci * 3 + 1], b = rgb[ci * 3 + 2];
    for (const f of cl.fibres) {
      const steps = f.pts.length - 1;
      for (let s = 0; s < steps; s++) {
        const a = f.pts[s], p = f.pts[s + 1];
        const f1 = 1 - (s / steps) * 0.78, f2 = 1 - ((s + 1) / steps) * 0.78;
        lp.push(a.x, a.y, a.z, p.x, p.y, p.z);
        lc.push(r * f1, g * f1, b * f1, r * f2, g * f2, b * f2);
      }
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
  return geo;
}

export function createScene(budget: Budget, palette: Palette, rng: () => number): CortexScene {
  const clusters = buildClusters(budget, rng);
  const fibres = clusters.flatMap((c) => c.fibres);
  const clusterRgb = new Float32Array(9);
  const tmp = new THREE.Color();
  palette.clusters.forEach((hex, i) => {
    tmp.setHex(hex);
    clusterRgb[i * 3] = tmp.r; clusterRgb[i * 3 + 1] = tmp.g; clusterRgb[i * 3 + 2] = tmp.b;
  });

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(o: T): T => { disposables.push(o); return o; };

  // Background quad — the FBM field, drawn first with its own orthographic camera.
  const uniforms: FieldUniforms = {
    uTime: { value: 0 }, uProg: { value: 0 }, uAspect: { value: 1 }, uAmt: { value: 1 },
    uPointer: { value: new THREE.Vector2() },
    uC1: { value: new THREE.Vector3(...palette.c1) },
    uC2: { value: new THREE.Vector3(...palette.c2) },
    uQuiet: { value: new Float32Array(MAX_RECTS * 4) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uQuietFloor: { value: 0.08 },
  };
  const bgScene = new THREE.Scene();
  const bgCamera = new THREE.Camera();
  bgScene.add(new THREE.Mesh(
    track(new THREE.PlaneGeometry(2, 2)),
    track(new THREE.ShaderMaterial({
      uniforms, vertexShader: FIELD_VERT, fragmentShader: FIELD_FRAG,
      depthTest: false, depthWrite: false,
    })),
  ));

  const glow = track(glowTexture());
  const world = new THREE.Scene();
  const group = new THREE.Group();
  world.add(group);

  // Fibres: two passes over one geometry — a wide dim halo and a thin bright core.
  const lineGeo = track(fibreGeometry(clusters, clusterRgb));
  const fibreDim = track(honourQuiet(new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.16,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), uniforms));
  const fibreHot = track(honourQuiet(new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.52,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), uniforms));
  const dimLines = new THREE.LineSegments(lineGeo, fibreDim);
  dimLines.scale.setScalar(1.012);
  group.add(dimLines, new THREE.LineSegments(lineGeo, fibreHot));

  // Somata: additive glow sprite plus a small white core.
  const coreGeo = track(new THREE.SphereGeometry(0.055, 18, 18));
  // transparent so the quiet alpha actually fades the core under text — an
  // opaque mesh would ignore gl_FragColor.a and land as a grey disc.
  const coreMat = track(honourQuiet(new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, depthWrite: false,
  }), uniforms));
  const somata: Soma[] = clusters.map((cl, i) => {
    const spriteMat = track(honourQuiet(new THREE.SpriteMaterial({
      map: glow, color: palette.clusters[i], transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    }), uniforms));
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(cl.origin.x, cl.origin.y, cl.origin.z);
    sprite.scale.setScalar(1.5);
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(sprite.position);
    group.add(sprite, core);
    return { sprite, spriteMat, core, flare: 0 };
  });

  // Dust.
  const dp = new Float32Array(budget.dust * 3);
  for (let i = 0; i < budget.dust; i++) {
    dp[i * 3] = (rng() - 0.5) * 11; dp[i * 3 + 1] = (rng() - 0.5) * 8; dp[i * 3 + 2] = (rng() - 0.5) * 11;
  }
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  group.add(new THREE.Points(dustGeo, track(honourQuiet(new THREE.PointsMaterial({
    color: palette.dust, size: 0.026, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), uniforms))));

  // Pulses: preallocated to the tier's ceiling; drawRange is set per frame.
  const pos = new Float32Array(budget.maxPulses * 3);
  const col = new Float32Array(budget.maxPulses * 3);
  const pulseGeo = track(new THREE.BufferGeometry());
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pulseGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  pulseGeo.setDrawRange(0, 0);
  const pulseMat = track(honourQuiet(new THREE.PointsMaterial({
    map: glow, size: 0.13, vertexColors: true, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }), uniforms));
  const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
  pulsePoints.frustumCulled = false;
  group.add(pulsePoints);

  return {
    clusters, fibres, clusterRgb, group, world, bgScene, bgCamera, uniforms,
    fibreHot, fibreDim, somata,
    pulses: { points: pulsePoints, geometry: pulseGeo, material: pulseMat, pos, col },
    dispose() { for (const d of disposables) d.dispose(); },
  };
}
