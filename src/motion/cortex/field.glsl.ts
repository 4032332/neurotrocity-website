// uQuiet layout: [cx, cy, halfW, halfH] per rect, in clip space (-1..1, y up).
// Populated by collectQuietRects() in attenuation.ts. A zero halfW marks an
// inactive slot.

export const FIELD_VERT =
  'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }';

export const FIELD_FRAG = [
  'precision highp float;',
  'varying vec2 vUv;',
  'uniform float uTime,uProg,uAspect,uAmt; uniform vec2 uPointer;',
  'uniform vec3 uC1, uC2; uniform vec4 uQuiet[8];',
  'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
  'float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);',
  ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y); }',
  'float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }',
  // Duplicated verbatim as QUIET_GLSL in scene.ts (injected into every scene
  // material via onBeforeCompile) — change both together.
  'float quietness(vec2 p){',
  '  float q = 1.0;',
  '  for(int i = 0; i < 8; i++){',
  '    if(uQuiet[i].z <= 0.0) continue;',
  '    vec2 d = abs(p - uQuiet[i].xy) - uQuiet[i].zw;',
  '    float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);',
  '    q = min(q, smoothstep(-0.02, 0.10, sd));',
  '  }',
  '  return q;',
  '}',
  'void main(){',
  ' vec2 uv = vUv-0.5; uv.x *= uAspect;',
  ' float prog = clamp(uProg,0.0,1.0); float chaos = 1.0-prog;',
  ' vec2 q = uv*(2.0+chaos*6.5);',
  ' float w = fbm(q+uTime*0.045)*chaos*2.0;',
  ' vec2 p2 = q+vec2(w,-w*0.72)+uPointer*0.4;',
  ' float n = fbm(p2*1.45+uTime*0.03);',
  ' float d = length(uv); float pull = smoothstep(1.05,0.0,d);',
  ' float field = n*mix(1.0,pull*1.35,prog*0.35);',
  ' field = pow(clamp(field,0.0,1.0), mix(2.2,2.7,prog));',
  ' field *= mix(0.16, 1.0, quietness(vUv * 2.0 - 1.0));',
  ' vec3 col = mix(uC1,uC2, clamp(n*0.85+prog*0.3,0.0,1.0));',
  ' col *= field*mix(1.0,0.82,prog)*uAmt;',
  ' col += vec3(0.027,0.024,0.055)*max(uAmt,0.55);',
  ' col += (hash(vUv*900.0+uTime)-0.5)*0.03*uAmt;',
  ' gl_FragColor = vec4(col,1.0);',
  '}',
].join('\n');
