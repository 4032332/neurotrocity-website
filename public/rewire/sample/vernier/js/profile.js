/* VERNIER — pure profile math. No THREE, no DOM. Testable in Node.
   Everything is in millimetres in the XY plane; the geometry module lifts
   these into 3D. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Vernier = root.Vernier || {}).profile = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function smooth(u) { return u * u * (3 - 2 * u); }

  /* One tooth as a smooth trapezoid over phase 0..1:
     root 0-.15 · rising flank .15-.35 · tip .35-.65 · falling .65-.85 · root .85-1 */
  function toothShape(p) {
    if (p < 0.15 || p >= 0.85) return 0;
    if (p < 0.35) return smooth((p - 0.15) / 0.2);
    if (p < 0.65) return 1;
    return 1 - smooth((p - 0.65) / 0.2);
  }

  function gearRadii(teeth, module) {
    const pitch = module * teeth / 2;
    return { pitch: pitch, addendum: pitch + module, root: pitch - 1.25 * module };
  }

  function gearProfile(teeth, module, opts) {
    if (!(teeth >= 6)) throw new Error('gearProfile: teeth must be >= 6');
    if (!(module > 0)) throw new Error('gearProfile: module must be > 0');
    const N = (opts && opts.samplesPerTooth) || 12;
    const r = gearRadii(teeth, module);
    const pts = [];
    for (let t = 0; t < teeth; t++) {
      for (let i = 0; i < N; i++) {
        const phase = i / N;
        const ang = (t + phase) * Math.PI * 2 / teeth;
        const rr = r.root + (r.addendum - r.root) * toothShape(phase);
        pts.push({ x: rr * Math.cos(ang), y: rr * Math.sin(ang) });
      }
    }
    return pts;
  }

  /* Archimedean spiral. A wound spring bunches toward the arbor, so tension
     compresses the outer radius. */
  function springPath(turns, r0, r1, n, tension) {
    tension = tension || 0;
    const rMax = r1 - (r1 - r0) * 0.45 * tension;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const ang = u * turns * Math.PI * 2;
      const r = r0 + (rMax - r0) * u;
      pts.push({ x: r * Math.cos(ang), y: r * Math.sin(ang), z: 0 });
    }
    return pts;
  }

  /* Lathe profile: domed head, flat underside, plain shank. */
  function screwProfile(headR, headH, shankR, length, steps) {
    steps = steps || 8;
    const pts = [{ r: 0, y: headH }];
    for (let i = 1; i <= steps; i++) {
      const a = (i / steps) * Math.PI / 2;
      pts.push({ r: headR * Math.sin(a), y: headH * (0.65 + 0.35 * Math.cos(a)) });
    }
    pts.push({ r: headR, y: 0 });
    pts.push({ r: shankR, y: 0 });
    pts.push({ r: shankR, y: -length });
    pts.push({ r: 0, y: -length });
    return pts;
  }

  return { gearProfile, gearRadii, springPath, screwProfile };
});
