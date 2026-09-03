/**
 * The cortex island: renderer lifecycle and the per-frame loop.
 * Object construction lives in scene.ts; everything simulated is pure
 * (geometry.ts, pulses.ts, attenuation.ts) and composed here.
 */
import * as THREE from 'three';
import { TIER_BUDGET, type Tier } from '../tier';
import { pointAtInto, type Vec3 } from './geometry';

// Scratch for the per-pulse walk — the hot loop must not allocate.
const _pt: Vec3 = { x: 0, y: 0, z: 0 };
import { createState, spawn, advance } from './pulses';
import { collectQuietRects } from './attenuation';
import { PALETTES, type Accent } from './palette';
import { createScene } from './scene';

export interface CortexOptions { tier: Tier; accent?: Accent }
export interface CortexHandle { destroy(): void }

const CLEAR = 0x07060E;
const BURST_EVERY = 2.6;
const QUIET_EVERY = 3;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function mountCortex(canvas: HTMLCanvasElement, opts: CortexOptions): CortexHandle {
  const budget = TIER_BUDGET[opts.tier];
  if (budget.fibresPerCluster === 0) return { destroy() {} };
  const palette = PALETTES[opts.accent ?? 'volt'];

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(budget.dpr, window.devicePixelRatio || 1));
  renderer.setClearColor(CLEAR, 1);
  renderer.autoClear = false;

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const sc = createScene(budget, palette, Math.random);
  const pulses = createState(sc.fibres, budget.maxPulses);
  const hero = document.querySelector<HTMLElement>('[data-hero]');

  // Smoothed inputs.
  let heroP = 0, px = 0, py = 0, tpx = 0, tpy = 0;
  let burstAt = -99, burstIdx = 0;
  let t0 = performance.now(), lastT = 0, frameNo = 0;
  let raf = 0, visible = true, pageShown = !document.hidden, contextLost = false;

  function resize(): void {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    sc.uniforms.uAspect.value = w / h;
    // gl_FragCoord is in drawing-buffer pixels (DPR-scaled), not CSS pixels.
    renderer.getDrawingBufferSize(sc.uniforms.uResolution.value);
  }

  function writePulses(): void {
    const { pos, col, geometry } = sc.pulses;
    const rgb = sc.clusterRgb;
    let n = 0;
    for (const p of pulses.pulses) {
      const f = sc.fibres[p.f];
      const pt = pointAtInto(f, p.t, _pt);
      const o = n * 3, c = f.cluster * 3;
      pos[o] = pt.x; pos[o + 1] = pt.y; pos[o + 2] = pt.z;
      // White-hot mid-fibre, cooling to the cluster hue at either end.
      const hot = Math.max(0, 1 - Math.abs(p.t - 0.5) * 1.1);
      col[o]     = rgb[c]     + (1 - rgb[c])     * hot;
      col[o + 1] = rgb[c + 1] + (1 - rgb[c + 1]) * hot;
      col[o + 2] = rgb[c + 2] + (1 - rgb[c + 2]) * hot;
      n++;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.setDrawRange(0, n);
  }

  function frame(): void {
    raf = 0;
    const t = (performance.now() - t0) / 1000;
    const dt = Math.min(0.05, t - lastT);
    lastT = t;
    frameNo++;

    // Coherence: the hero's scroll progress. No hero → fully coherent.
    let target = 1;
    if (hero) {
      const hr = hero.getBoundingClientRect();
      target = clamp01((-hr.top / Math.max(1, hr.height)) * 1.5 + 0.30);
    }
    heroP += (target - heroP) * 0.075;
    px += (tpx - px) * 0.05;
    py += (tpy - py) * 0.05;
    const coh = heroP;

    // Sustained traffic plus periodic cluster bursts.
    const want = Math.floor((0.4 + 0.6 * coh) * budget.maxPulses * 0.5);
    let tries = 0;
    while (pulses.pulses.length < want && tries++ < 10) {
      spawn(pulses, Math.floor(Math.random() * sc.fibres.length), Math.random() < 0.62);
    }
    if (coh > 0.12 && t - burstAt > BURST_EVERY) {
      burstAt = t;
      burstIdx = (burstIdx + 1) % sc.clusters.length;
      for (let i = 0; i < sc.fibres.length; i++) {
        if (sc.fibres[i].cluster === burstIdx && Math.random() < 0.6) spawn(pulses, i, true);
      }
      sc.somata[burstIdx].flare = 1;
    }

    // Soma flare is causal: only an inbound pulse reaching a soma lights it.
    for (const a of advance(pulses, dt * 1.15)) {
      const s = sc.somata[a.cluster];
      s.flare = Math.min(1, s.flare + 0.22);
    }
    writePulses();
    sc.pulses.material.opacity = 0.55 + coh * 0.45;

    sc.somata.forEach((s, i) => {
      s.flare *= 0.93;
      s.sprite.scale.setScalar((1.15 + coh * 0.7) + s.flare * 1.5 + Math.sin(t * 1.7 + i) * 0.06);
      s.spriteMat.opacity = (0.55 + coh * 0.35) + s.flare * 0.45;
      s.core.scale.setScalar(0.85 + s.flare * 0.9);
    });

    const appear = 0.55 + 0.45 * Math.pow(coh, 1.25);
    sc.fibreHot.opacity = 0.06 + appear * 0.50;
    sc.fibreDim.opacity = 0.03 + appear * 0.17;
    sc.group.scale.setScalar(0.94 + appear * 0.06);
    sc.group.rotation.y = t * 0.075 + px * 0.42;
    sc.group.rotation.x = -py * 0.26;

    // Camera drifts toward whichever cluster last burst, nudged by the pointer.
    const focus = sc.clusters[burstIdx].origin;
    camera.position.x += (focus.x * 0.30 + px * 0.28 - camera.position.x) * 0.014;
    camera.position.y += (focus.y * 0.22 - py * 0.18 - camera.position.y) * 0.014;
    camera.position.z += ((6.4 - coh * 1.5) - camera.position.z) * 0.03;
    camera.lookAt(0, 0, 0);

    if (frameNo % QUIET_EVERY === 0) {
      const quiet = Array.from(document.querySelectorAll('[data-quiet]'));
      sc.uniforms.uQuiet.value.set(collectQuietRects(quiet, innerWidth, innerHeight));
    }
    sc.uniforms.uTime.value = t;
    sc.uniforms.uProg.value = coh;
    sc.uniforms.uPointer.value.set(px, -py);

    renderer.clear();
    renderer.render(sc.bgScene, sc.bgCamera);
    renderer.render(sc.world, camera);

    // Scheduled last: an exception above ends the loop instead of re-throwing every frame.
    raf = requestAnimationFrame(frame);
  }

  function syncLoop(): void {
    const shouldRun = visible && pageShown && !contextLost;
    if (shouldRun && !raf) {
      lastT = (performance.now() - t0) / 1000;   // no dt spike after a pause
      raf = requestAnimationFrame(frame);
    } else if (!shouldRun && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  const onPointer = (e: PointerEvent) => {
    tpx = (e.clientX / innerWidth - 0.5) * 2;
    tpy = (e.clientY / innerHeight - 0.5) * 2;
  };
  const onVisibility = () => { pageShown = !document.hidden; syncLoop(); };
  const onLost = (e: Event) => { e.preventDefault(); contextLost = true; syncLoop(); };
  // three.js re-uploads every buffer, texture and program on restore; our
  // simulation state is CPU-side and survives, so resuming the loop rebuilds.
  const onRestored = () => { contextLost = false; resize(); syncLoop(); };
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; syncLoop(); });

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  io.observe(canvas);

  resize();
  syncLoop();

  return {
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      sc.dispose();
      renderer.dispose();
    },
  };
}
