/* ═══════════════════════════════════════════════════════════════
   VALE & VINE — the sky.

   A single-scattering atmosphere, ray-marched. Nothing here is a colour
   ramp keyed to the clock: the only thing that changes between a January
   noon and a June dusk is `uSunDir`, which comes from the NOAA solar model
   in js/sun.js. Blue midday, gold at low elevation, the warm band that
   survives ten degrees below the horizon and the blue hour that follows
   are all consequences of two physical facts — Rayleigh scattering goes
   as 1/λ⁴, and the path length through the atmosphere explodes as the
   view (or the sun) approaches grazing incidence.

   Model, term by term:
     · Rayleigh β = (5.5, 13.0, 22.4)e-6 /m, scale height 8 km — molecular
       scattering. Its λ⁻⁴ bias is what makes the zenith blue and what
       strips blue out of a long horizon path, leaving gold and red.
     · Mie β = 21e-6 /m × turbidity, scale height 1.2 km, Henyey-Greenstein
       g = 0.758 — aerosol scattering. Forward-peaked, so it lights the
       sky *around* the sun; at low elevation that halo is both huge and
       already reddened by the Rayleigh path. That is golden hour, and it
       arrives on its own.
     · Transmittance is Beer–Lambert along both the view ray and a shadow
       ray toward the sun (nested march), so the sun disc reddens and dims
       into the horizon without being told to.
     · Earth shadow: the light ray is soft-occluded by the planet sphere.
       The softness band (0.9975–1.0085 R⊕) is the real geometry of the
       terminator climbing the atmosphere, and it is what produces the
       graded dusk instead of a switch to black.
     · Night floor: a small airglow + integrated-starlight term, brightest
       at the zenith, faded in as the sun sets. Never flat black.
     · Ground: the bottom of the frame in shadow, albedo lerped by uSeason
       (0 bare winter earth → 1 gold vintage), lit by an air-mass-attenuated
       sun plus horizon skylight, dissolving into haze at the horizon line.
     · quietness(): the home page's signed-distance rect attenuation, so
       running text stays legible with no full-page scrim.

   GLSL ES 1.00 (three r128 ShaderMaterial). No `in`/`out`/`texture()`.
   ═══════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.VV = root.VV || {}).sky = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Vertex stage. uInvProj / uCamWorld are plumbing — they build the view
     ray and take no part in the colour model. Every uniform the fragment
     stage reads is in the documented contract. */
  const VERT = [
    'precision highp float;',
    'uniform mat4 uInvProj;',
    'uniform mat4 uCamWorld;',
    'varying vec3 vRay;',
    'varying vec2 vNdc;',
    'void main(){',
    '  vNdc = position.xy;',
    '  vec4 v = uInvProj * vec4(position.xy, 1.0, 1.0);',
    '  vRay = (uCamWorld * vec4(v.xyz / v.w, 0.0)).xyz;',
    '  gl_Position = vec4(position.xy, 1.0, 1.0);',
    '}'
  ].join('\n');

  const FRAG = [
    'precision highp float;',
    '',
    'varying vec3 vRay;',
    'varying vec2 vNdc;',
    '',
    'uniform vec3  uSunDir;',
    'uniform float uTurbidity;',
    'uniform float uExposure;',
    'uniform vec4  uQuiet[8];',
    'uniform vec2  uResolution;',
    'uniform float uSeason;',
    'uniform float uTime;',
    '',
    '#ifndef PRIMARY_STEPS',
    '#define PRIMARY_STEPS 12',
    '#endif',
    '#ifndef LIGHT_STEPS',
    '#define LIGHT_STEPS 4',
    '#endif',
    '',
    '#define PI 3.141592653589793',
    'const float R_PLANET = 6371000.0;',
    'const float R_ATMOS  = 6471000.0;',
    'const vec3  BETA_R   = vec3(5.5e-6, 13.0e-6, 22.4e-6);',
    'const float BETA_M   = 21.0e-6;',
    'const float H_R      = 8000.0;',
    'const float H_M      = 1200.0;',
    'const float G_M      = 0.758;',
    'const float SUN_I    = 22.0;',
    'const float MS_R     = 0.25;',   // isotropic multiple-scatter, vs phR max 0.119
    '',
    // Content-aware attenuation: the signed-distance-to-rect field the
    // NeuroTrocity cortex uses. Nearest rect wins; the smoothstep is the feather.
    'float quietness(vec2 p){',
    '  float q = 1.0;',
    '  for(int i = 0; i < 8; i++){',
    '    if(uQuiet[i].z <= 0.0) continue;',
    '    vec2 d = abs(p - uQuiet[i].xy) - uQuiet[i].zw;',
    '    float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);',
    '    q = min(q, smoothstep(-0.06, 0.34, sd));',
    '  }',
    '  return q;',
    '}',
    '',
    'float hash12(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float vnoise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),',
    '             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',
    '',
    // Near/far intersection with a sphere centred on the origin. x > y is a miss.
    'vec2 raySphere(vec3 o, vec3 d, float r){',
    '  float b = dot(o, d);',
    '  float c = dot(o, o) - r * r;',
    '  float h = b * b - c;',
    '  if(h < 0.0) return vec2(1.0, -1.0);',
    '  h = sqrt(h);',
    '  return vec2(-b - h, -b + h);',
    '}',
    '',
    // Beer-Lambert transmittance for a sun at elevation asin(sinEl), using the
    // flat air-mass approximation 1/sin(el). Same physics as the marched view
    // transmittance, cheap enough to call per pixel for ground lighting.
    'vec3 sunTint(float sinEl){',
    '  float am = 1.0 / max(sinEl, 0.045);',
    '  vec3 tau = BETA_R * H_R * am + BETA_M * uTurbidity * H_M * am;',
    '  return exp(-tau);',
    '}',
    '',
    // Airglow + integrated starlight. Small, blue-violet, brightest away from
    // the horizon where the air column is thinnest. A moonless night stays a
    // graded dome instead of a dead rectangle.
    'vec3 nightFloor(vec3 rd){',
    '  float z = clamp(rd.y, 0.0, 1.0);',
    '  vec3 c = mix(vec3(0.0024, 0.0028, 0.0044), vec3(0.0015, 0.0023, 0.0056), z);',
    '  return c * (0.55 + 0.45 * z);',
    '}',
    '',
    'vec3 scatter(vec3 ro, vec3 rd, vec3 sd){',
    '  vec2 atm = raySphere(ro, rd, R_ATMOS);',
    '  if(atm.y < 0.0 || atm.x > atm.y) return vec3(0.0);',
    '  float tmin = max(atm.x, 0.0);',
    '  float tmax = atm.y;',
    '  vec2 gnd = raySphere(ro, rd, R_PLANET);',
    '  if(gnd.x <= gnd.y && gnd.x > 0.0) tmax = min(tmax, gnd.x);',
    '',
    '  float seg = (tmax - tmin) / float(PRIMARY_STEPS);',
    '  float t = tmin + seg * 0.5;',
    '  float odR = 0.0, odM = 0.0;',
    '  vec3 sumR = vec3(0.0), sumM = vec3(0.0);',
    '',
    '  float mu = dot(rd, sd);',
    '  float phR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);',
    '  float gg  = G_M * G_M;',
    '  float phM = 3.0 / (8.0 * PI) * ((1.0 - gg) * (1.0 + mu * mu))',
    '            / ((2.0 + gg) * pow(max(1.0 + gg - 2.0 * G_M * mu, 1e-4), 1.5));',
    '',
    '  for(int i = 0; i < PRIMARY_STEPS; i++){',
    '    vec3 sp = ro + rd * t;',
    '    float h = length(sp) - R_PLANET;',
    '    float hr = exp(-h / H_R) * seg;',
    '    float hm = exp(-h / H_M) * seg;',
    '    odR += hr; odM += hm;',
    '',
    // Soft planet shadow on the light ray. Closest approach of the sun ray to
    // the planet centre, feathered across a band a little thicker than the
    // atmosphere: this is the terminator, and this term alone is all of dusk.
    // When the sun is above the sample's own horizon (bs >= 0) the light ray
    // recedes from the planet and the sample is fully lit — it must NOT be
    // handed its own radius, which sat inside the feather and dimmed the whole
    // daytime atmosphere to about a quarter, midday hardest of all.
    '    float bs = dot(sp, sd);',
    '    float dmin = bs >= 0.0 ? R_ATMOS * 4.0 : sqrt(max(dot(sp, sp) - bs * bs, 0.0));',
    '    float shade = smoothstep(R_PLANET * 0.9975, R_PLANET * 1.0085, dmin);',
    '',
    '    float odRL = 0.0, odML = 0.0;',
    '    if(shade > 0.0){',
    '      float lmax = max(raySphere(sp, sd, R_ATMOS).y, 0.0);',
    '      float lseg = lmax / float(LIGHT_STEPS);',
    '      float lt = lseg * 0.5;',
    '      for(int j = 0; j < LIGHT_STEPS; j++){',
    '        float lh = length(sp + sd * lt) - R_PLANET;',
    '        odRL += exp(-lh / H_R) * lseg;',
    '        odML += exp(-lh / H_M) * lseg;',
    '        lt += lseg;',
    '      }',
    '    }',
    '',
    '    vec3 tau = BETA_R * (odR + odRL) + BETA_M * uTurbidity * (odM + odML);',
    '    vec3 att = exp(-tau) * shade;',
    '    sumR += att * hr;',
    '    sumM += att * hm;',
    '    t += seg;',
    '  }',
    '',
    // Single scattering alone is a Mie model in disguise: the aerosol lobe is
    // sharply forward, so a frame that does not contain the sun collapses to
    // the weak Rayleigh single-scatter term and a high sun renders DARKER than
    // a low one. Real daytime sky brightness away from the sun is mostly light
    // that has bounced more than once. One isotropic Rayleigh re-emission
    // approximates it: it costs nothing, it is largest exactly when the air
    // column is well lit, and it dies with the terminator like everything else.
    '  vec3 col = SUN_I * (sumR * BETA_R * (phR + MS_R) + sumM * BETA_M * uTurbidity * phM);',
    '',
    // Sun disc, ~0.27 degrees with a soft limb, extinguished by the very optical
    // depth the march just measured. It reddens, swells into the Mie halo and
    // dies as it meets the horizon because the aerosol path length says so.
    '  float lim = smoothstep(0.999955, 0.999990, mu);',
    '  vec3 discT = exp(-(BETA_R * odR + BETA_M * uTurbidity * odM));',
    '  col += SUN_I * 1.05 * lim * discT;',
    '  return col;',
    '}',
    '',
    'void main(){',
    '  vec3 rd = normalize(vRay);',
    '  vec3 sd = normalize(uSunDir);',
    '  vec3 ro = vec3(0.0, R_PLANET + 2.0, 0.0);',
    '',
    // Sky above the horizon, plus the same sky pinned to the horizon. That
    // pinned value is the haze the ground dissolves into, so the horizon line
    // is a real transition rather than a drawn edge.
    '  vec3 up = normalize(vec3(rd.x, max(rd.y, 0.0015), rd.z));',
    '  vec3 sky = scatter(ro, up, sd);',
    '  vec3 haze = scatter(ro, normalize(vec3(rd.x, 0.004, rd.z)), sd);',
    '',
    '  float night = 1.0 - smoothstep(-0.28, 0.02, sd.y);',
    '  sky += nightFloor(up) * night;',
    '  haze += nightFloor(vec3(0.0, 0.0, 1.0)) * night;',
    '',
    '  vec3 col = sky;',
    '',
    // Ground: in shadow, seasonal, hazing out at the horizon.
    '  if(rd.y < 0.0){',
    '    float dn = -rd.y;',
    // where this ray meets the ground plane, in metres. Real perspective, so
    // the ground has texture that recedes with it instead of a painted slab.
    '    vec2 gp = rd.xz / max(dn, 0.0015) * 1.7;',
    '    float tex = vnoise(gp * 0.055) * 0.6 + vnoise(gp * 0.21) * 0.4;',
    '    tex = mix(1.0, 0.55 + 0.90 * tex, smoothstep(0.0, 0.045, dn));',
    // Real dirt is not charcoal. Dry Margaret River gravel loam sits around
    // 0.18-0.22 reflectance and the winter/wet ground around 0.11; the old
    // 0.04 bare albedo was darker than fresh asphalt, which is why the block
    // rendered as murk however much sun fell on it.
    '    vec3 bare = vec3(0.118, 0.100, 0.082);',
    '    vec3 gold = vec3(0.258, 0.192, 0.114);',
    '    vec3 alb = mix(bare, gold, clamp(uSeason, 0.0, 1.0)) * tex;',
    '    float sinEl = max(sd.y, 0.0);',
    // the ground is a diffuse surface: direct sun by Lambert on a flat plane,
    // plus the whole sky dome as ambient. The haze value is the sky pinned to
    // the horizon, which is the best single sample of that dome we already have.
    '    vec3 direct = sunTint(sinEl) * sinEl * SUN_I * 0.32;',
    '    vec3 ambient = haze * 0.21 + nightFloor(vec3(0.0, 1.0, 0.0)) * 7.0;',
    '    vec3 gcol = alb * (direct + ambient);',
    // it falls into its own shadow toward the viewer — the near ground is
    // under the rows, and this is what keeps the lower third readable. That is
    // a low-sun effect: a raking sun leaves the near ground in the block's own
    // shadow, an overhead one does not, so the term lifts with the sun.
    '    float selfShadow = mix(0.20, 0.90, smoothstep(0.0, 0.38, sinEl));',
    '    gcol *= mix(1.0, selfShadow, smoothstep(0.0, 0.40, dn));',
    '    float mist = exp(-dn * 7.5);',
    '    col = mix(gcol, haze, mist);',
    '  }',
    '',
    '  col *= uExposure;',
    '',
    // Text legibility, no scrim.
    '  col *= mix(0.16, 1.0, quietness(vNdc));',
    '',
    // A sky is one enormous gradient; without a dither every 8-bit step is a
    // visible ring. Multiplicative, so it scales with the value and vanishes
    // in the shadows.
    '  float dth = hash12(gl_FragCoord.xy + fract(uTime) * uResolution);',
    '  col *= 1.0 + (dth - 0.5) * 0.010;',
    '',
    '  gl_FragColor = vec4(max(col, 0.0), 1.0);',
    '  #include <tonemapping_fragment>',
    '  #include <encodings_fragment>',
    '}'
  ].join('\n');

  return { VERT, FRAG };
});
