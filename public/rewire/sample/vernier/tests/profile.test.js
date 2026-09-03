const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../js/profile.js');

const rad = p => Math.hypot(p.x, p.y);

test('gearProfile returns teeth*samples points, all between root and addendum radius', () => {
  const pts = P.gearProfile(20, 0.2, { samplesPerTooth: 12 });
  const { root, addendum } = P.gearRadii(20, 0.2);
  assert.equal(pts.length, 240);
  for (const p of pts) {
    assert.ok(rad(p) >= root - 1e-9, 'below root');
    assert.ok(rad(p) <= addendum + 1e-9, 'above addendum');
  }
  assert.ok(Math.abs(Math.max(...pts.map(rad)) - addendum) < 1e-9, 'reaches addendum');
  assert.ok(Math.abs(Math.min(...pts.map(rad)) - root) < 1e-9, 'reaches root');
});

test('gearRadii: pitch radius is module*teeth/2', () => {
  assert.deepEqual(P.gearRadii(64, 0.11), { pitch: 3.52, addendum: 3.63, root: 3.3825 });
});

test('gearProfile rejects fewer than 6 teeth or non-positive module', () => {
  assert.throws(() => P.gearProfile(5, 0.2));
  assert.throws(() => P.gearProfile(20, 0));
});

test('springPath: n points, starts at r0, ends at r1 when relaxed, radius monotonic', () => {
  const pts = P.springPath(9, 1.1, 4.9, 300, 0);
  assert.equal(pts.length, 300);
  assert.ok(Math.abs(rad(pts[0]) - 1.1) < 1e-9);
  assert.ok(Math.abs(rad(pts[299]) - 4.9) < 1e-9);
  for (let i = 1; i < pts.length; i++) assert.ok(rad(pts[i]) >= rad(pts[i - 1]) - 1e-12);
  assert.equal(pts[0].z, 0);
});

test('springPath: full tension pulls the outer coil in by 45%', () => {
  const relaxed = P.springPath(9, 1.1, 4.9, 50, 0);
  const wound   = P.springPath(9, 1.1, 4.9, 50, 1);
  const expected = 4.9 - (4.9 - 1.1) * 0.45;
  assert.ok(Math.abs(rad(wound[49]) - expected) < 1e-9);
  assert.ok(rad(wound[49]) < rad(relaxed[49]));
});

test('screwProfile: starts and ends on the axis, spans head height to shank tip, peaks at headR', () => {
  const pts = P.screwProfile(0.45, 0.22, 0.14, 0.9);
  assert.equal(pts[0].r, 0);
  assert.equal(pts[pts.length - 1].r, 0);
  assert.equal(pts[0].y, 0.22);
  assert.equal(pts[pts.length - 1].y, -0.9);
  assert.ok(Math.abs(Math.max(...pts.map(p => p.r)) - 0.45) < 1e-9);
});
