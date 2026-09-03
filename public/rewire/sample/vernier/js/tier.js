/* VERNIER — adaptive quality. Pure; no THREE, no DOM. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Vernier = root.Vernier || {}).tier = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TIERS = {
    high:   { pixelRatio: 2,   shadowMap: 2048, softShadows: true,  post: { bloom: true,  vignette: true,  dof: true  }, transmission: true  },
    medium: { pixelRatio: 1.5, shadowMap: 1024, softShadows: true,  post: { bloom: true,  vignette: true,  dof: false }, transmission: true  },
    low:    { pixelRatio: 1,   shadowMap: 0,    softShadows: false, post: { bloom: false, vignette: false, dof: false }, transmission: false }
  };
  const ORDER = ['low', 'medium', 'high'];

  /* Median so one garbage-collection spike cannot demote a fast device. */
  function chooseTier(frameTimes) {
    if (!frameTimes || frameTimes.length < 10) return 'medium';
    const s = frameTimes.slice().sort((a, b) => a - b);
    const med = s[Math.floor(s.length / 2)];
    if (med <= 17.5) return 'high';    // ≈57 fps and up
    if (med <= 26)   return 'medium';  // ≈38 fps and up
    return 'low';
  }
  function rank(tier) { return ORDER.indexOf(tier); }
  function stepDown(tier) { return ORDER[Math.max(0, rank(tier) - 1)]; }

  return { TIERS, chooseTier, stepDown, rank };
});
