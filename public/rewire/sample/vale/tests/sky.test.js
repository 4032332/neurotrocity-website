/* Structural contract for the sky shader. These are not a GLSL parser —
   they assert the handful of things that, if they drift, break the shader
   silently at runtime on someone else's GPU: the ES 1.00 dialect, the
   uniform contract stage.js binds against, and the attenuation the page's
   legibility depends on. Colour is judged by looking at renders, not here. */
const test = require('node:test');
const assert = require('node:assert/strict');
const sky = require('../js/sky.glsl.js');

const { VERT, FRAG } = sky;

test('exports two non-trivial shader sources', () => {
  assert.equal(typeof VERT, 'string');
  assert.equal(typeof FRAG, 'string');
  assert.ok(FRAG.length > 1500, 'fragment source looks truncated');
});

test('precision is declared on the first line of both stages', () => {
  assert.equal(VERT.split('\n')[0].trim(), 'precision highp float;');
  assert.equal(FRAG.split('\n')[0].trim(), 'precision highp float;');
});

test('the fragment uniform contract is complete and exact', () => {
  const want = [
    /uniform\s+vec3\s+uSunDir\s*;/,
    /uniform\s+float\s+uTurbidity\s*;/,
    /uniform\s+float\s+uExposure\s*;/,
    /uniform\s+vec4\s+uQuiet\[8\]\s*;/,
    /uniform\s+vec2\s+uResolution\s*;/,
    /uniform\s+float\s+uSeason\s*;/,
    /uniform\s+float\s+uTime\s*;/
  ];
  for (const re of want) assert.match(FRAG, re, 'missing uniform: ' + re);
});

test('the sun vector drives the model: no season/time colour tables', () => {
  assert.match(FRAG, /uSunDir/);
  // A ramp keyed to the clock would need an hour or a season index in the
  // colour path. uSeason may appear exactly twice: its declaration, and the
  // one ground-albedo mix. Anything more means the sky itself is being posed.
  assert.equal((FRAG.match(/uSeason/g) || []).length, 2, 'uSeason read outside the ground albedo');
});

test('quiet-rect attenuation is present and applied with a measured floor', () => {
  assert.match(FRAG, /float\s+quietness\s*\(\s*vec2/);
  assert.match(FRAG, /quietness\(/);
  // The floor itself is set by the contrast gate in tests/e2e/vale.spec.ts,
  // which measures the composited page rather than reading the source. All
  // this test can honestly say is that a floor is applied, and that it is
  // dark enough to be doing real work.
  const m = /mix\(([0-9.]+),\s*1\.0,\s*quietness\(/.exec(FRAG);
  assert.ok(m, 'quietness() is not applied to the final colour');
  assert.ok(+m[1] > 0 && +m[1] <= 0.2, 'attenuation floor ' + m[1] + ' is not a floor');
});

test('the scattering terms are all there', () => {
  for (const t of ['BETA_R', 'BETA_M', 'H_R', 'H_M', 'G_M', 'raySphere', 'scatter'])
    assert.match(FRAG, new RegExp('\\b' + t + '\\b'), 'missing term ' + t);
});

test('GLSL ES 1.00 only — no 3.00 syntax', () => {
  for (const src of [VERT, FRAG]) {
    assert.doesNotMatch(src, /^\s*(in|out|flat|centroid)\s+\w/m, 'ES 3.00 in/out declaration');
    assert.doesNotMatch(src, /\btexture\s*\(/, 'ES 3.00 texture()');
    assert.doesNotMatch(src, /\bgl_FragColor\s*\[/);
    assert.doesNotMatch(src, /#version/);
  }
  assert.match(FRAG, /gl_FragColor/);
  assert.match(VERT, /\bvarying\b/);
  assert.match(FRAG, /\bvarying\b/);
});

test('braces and parentheses balance', () => {
  for (const [name, src] of [['VERT', VERT], ['FRAG', FRAG]]) {
    for (const [o, c] of [['{', '}'], ['(', ')'], ['[', ']']]) {
      const n = (src.split(o).length - 1) - (src.split(c).length - 1);
      assert.equal(n, 0, `${name}: unbalanced ${o}${c} (${n})`);
    }
  }
});

test('every varying written by the vertex stage is declared by the fragment stage', () => {
  const vs = [...VERT.matchAll(/varying\s+\w+\s+(\w+)\s*;/g)].map(m => m[1]).sort();
  const fs = [...FRAG.matchAll(/varying\s+\w+\s+(\w+)\s*;/g)].map(m => m[1]).sort();
  assert.deepEqual(vs, fs);
});
