const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../js/tier.js');

const fill = (n, v) => Array.from({ length: n }, () => v);

test('too few samples returns the safe middle tier', () => {
  assert.equal(T.chooseTier([]), 'medium');
  assert.equal(T.chooseTier(fill(9, 16)), 'medium');
});

test('60fps-class frames choose high', () => {
  assert.equal(T.chooseTier(fill(60, 16.4)), 'high');
});

test('40fps-class frames choose medium, 25fps chooses low', () => {
  assert.equal(T.chooseTier(fill(60, 24)), 'medium');
  assert.equal(T.chooseTier(fill(60, 40)), 'low');
});

test('a single GC spike does not knock a fast device down (median, not mean)', () => {
  const f = fill(59, 16); f.push(240);
  assert.equal(T.chooseTier(f), 'high');
});

test('stepDown and rank', () => {
  assert.equal(T.stepDown('high'), 'medium');
  assert.equal(T.stepDown('medium'), 'low');
  assert.equal(T.stepDown('low'), 'low');
  assert.ok(T.rank('high') > T.rank('medium') && T.rank('medium') > T.rank('low'));
});

test('every tier declares the settings the renderer reads', () => {
  for (const k of ['high', 'medium', 'low', 'mobile']) {
    const t = T.TIERS[k];
    for (const key of ['pixelRatio', 'shadowMap', 'softShadows', 'post', 'transmission']) assert.ok(key in t, k + '.' + key);
    for (const key of ['bloom', 'vignette', 'dof']) assert.equal(typeof t.post[key], 'boolean');
  }
  assert.equal(T.TIERS.low.shadowMap, 0);
  assert.equal(T.TIERS.low.transmission, false);
});

test('the mobile tier never renders through an off-screen target', () => {
  const m = T.TIERS.mobile;
  assert.equal(m.post.bloom, false);
  assert.equal(m.post.dof, false);
  assert.equal(m.post.vignette, false);
  assert.equal(m.transmission, false);
  assert.ok(m.pixelRatio >= 2, 'phones are high-DPR; keep it sharp');
});
