# Vale & Vine — The Light Model (demo elevation pilot)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace Vale's four crossfading photographs with one continuous, astronomically real sky — the actual light at Rosa Brook for whatever date you have scrolled to — so the page *computes* the claim it currently only makes, and drops from a 28.7 s mobile LCP to under 2.5 s.

**Architecture:** A persistent full-viewport WebGL stage owning the whole document (the cortex pattern). A pure solar-position module gives sun elevation and azimuth for any date/time at Rosa Brook; an analytic sky shader renders Rayleigh + Mie scattering from that sun vector; a thin instanced vine-row silhouette grounds it and carries the seasonal state. Scroll position maps to a day of the year. Everything else on the page keeps reading from the existing `VV.SEASONS` model.

**Tech Stack:** three.js (already vendored) · GSAP + ScrollTrigger (already vendored) · custom GLSL · `node:test` for the pure modules

## Why this demo, and why this signature

The page's own copy already asserts "the light, the season and the price move with it" and prints real sunset times. Today four 600 KB–1 MB JPEGs crossfade — 3.3 MB of the 4.8 MB page, and the direct cause of a **28.7 s mobile LCP** on a site whose landing page sells "it's slow or broken on mobile". Computing the light instead of photographing it makes the demo faster *and* makes its central claim literally true. Metaphor and mechanism become the same object, which is what separates the NeuroTrocity home page from the rest of the demo set.

## Global Constraints

- **The solar model must be real.** Rosa Brook, Margaret River: latitude −33.95, longitude 115.07, UTC+8, no DST. The model's output is verified against the figures already printed on the page — June sunset 5:16 pm, January sunset 7:32 pm — within ±4 minutes. If the model disagrees with the copy, the model is wrong; do not edit the copy to fit.
- **One continuous system.** A single stage owns the document. No per-section canvases, no effect that starts and stops at section boundaries.
- **Causal, not choreographed.** Sky colour, shadow direction and the sun's position derive from the solar model. Nothing is keyframed to look like sunset.
- **Content-aware.** Running text stays legible against the live stage with no full-page scrim: reuse the home page's quiet-rect attenuation (`src/motion/cortex/attenuation.ts` is the reference implementation; port the idea, not the file — this demo is standalone vanilla JS).
- **Mobile is the point.** Target: Lighthouse mobile **performance ≥ 90, LCP ≤ 2.5 s, total weight ≤ 1.2 MB**, measured on `/rewire/sample/vale/`. Current baseline: 65 / 28.7 s / 4.8 MB. Accessibility must not drop below its current 96, and should reach 100.
- **Tiering like the cortex.** Device capability chooses fibre-equivalent detail; `prefers-reduced-motion` and no-WebGL both get a static rendered sky, never a blank stage.
- **Honesty.** Vale is a fictional brand and is labelled as such. The rendered sky is an abstract brand visual, not a photograph of a real place. Remaining photography stays as venue detail only, never presented as a specific real venue.
- **Nothing else on the page changes.** The pricing model, the calendar, the copy and the section structure are already good. This plan replaces the stage, not the site.
- Commit after each task, conventional prefixes, trailer `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## File structure

| Path | Responsibility |
|---|---|
| `js/sun.js` | Pure NOAA solar position + sunrise/sunset. No DOM, no THREE. |
| `js/sky.glsl.js` | Sky fragment shader source (Rayleigh + Mie, sun disc, ground haze) |
| `js/stage.js` | three.js stage: sky dome, vine rows, tiering, quiet-rect attenuation, lifecycle |
| `js/year.js` | Scroll ↔ day-of-year mapping and the section anchor table |
| `js/seasons.js` | **Unchanged** — the existing fact model |
| `js/main.js` | Wiring only; the stage replaces the photo crossfade |
| `tests/sun.test.js` | Solar model vs. known Margaret River figures |
| `tests/year.test.js` | Scroll mapping monotonicity and anchor alignment |

---

## Task 1: Solar position model (pure)

**Files:** Create `js/sun.js`, `tests/sun.test.js`

**Interfaces produced:**
- `sunPosition(date: Date, lat: number, lon: number, tzHours: number): { elevation: number, azimuth: number }` — degrees; elevation negative below horizon, azimuth 0 = north, clockwise.
- `sunTimes(date, lat, lon, tzHours): { sunriseMin: number, sunsetMin: number }` — local minutes from midnight.
- `dayOfYear(date): number`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/sun.js');

const LAT = -33.95, LON = 115.07, TZ = 8;                 // Rosa Brook, Margaret River
const at = (y, m, d, hh, mm) => new Date(Date.UTC(y, m, d, hh - TZ, mm || 0));
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`;

test('sunset matches the figures printed on the page (±4 min)', () => {
  // The page states: "5:16 pm in June, 7:32 pm in January"
  const june = S.sunTimes(at(2026, 5, 21, 12), LAT, LON, TZ);
  const jan  = S.sunTimes(at(2026, 0, 15, 12), LAT, LON, TZ);
  assert.ok(Math.abs(june.sunsetMin - (17 * 60 + 16)) <= 4, 'June sunset ' + hhmm(june.sunsetMin));
  assert.ok(Math.abs(jan.sunsetMin  - (19 * 60 + 32)) <= 4, 'Jan sunset '  + hhmm(jan.sunsetMin));
});

test('southern hemisphere: the sun is due north at local solar noon', () => {
  const p = S.sunPosition(at(2026, 5, 21, 12, 10), LAT, LON, TZ);   // near solar noon
  assert.ok(p.azimuth > 340 || p.azimuth < 20, 'azimuth ' + p.azimuth);
  assert.ok(p.elevation > 0 && p.elevation < 40, 'midwinter noon elevation ' + p.elevation);
});

test('summer noon is higher than winter noon', () => {
  const s = S.sunPosition(at(2026, 0, 15, 12), LAT, LON, TZ);
  const w = S.sunPosition(at(2026, 5, 21, 12), LAT, LON, TZ);
  assert.ok(s.elevation > w.elevation + 30, `${s.elevation} vs ${w.elevation}`);
});

test('elevation is negative at midnight and positive at midday, every month', () => {
  for (let m = 0; m < 12; m++) {
    assert.ok(S.sunPosition(at(2026, m, 15, 0), LAT, LON, TZ).elevation < 0, 'midnight m' + m);
    assert.ok(S.sunPosition(at(2026, m, 15, 12), LAT, LON, TZ).elevation > 0, 'midday m' + m);
  }
});

test('day length is longest in December and shortest in June', () => {
  const len = (m, d) => { const t = S.sunTimes(at(2026, m, d, 12), LAT, LON, TZ); return t.sunsetMin - t.sunriseMin; };
  assert.ok(len(11, 21) > len(5, 21) + 200, 'summer/winter day length gap');
});
```

- [ ] **Step 2: Run it — expect module-not-found**

Run: `cd public/rewire/sample/vale && node --test tests/sun.test.js`

- [ ] **Step 3: Implement `js/sun.js`** using the NOAA solar position algorithm

```js
/* VALE & VINE — solar position. NOAA algorithm, no dependencies.
   Everything the stage renders derives from these two numbers, so the sky is
   the real sky for the date you are looking at, not a colour ramp. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.VV = root.VV || {}).sun = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;

  function dayOfYear(date) {
    const start = Date.UTC(date.getUTCFullYear(), 0, 0);
    return Math.floor((date.getTime() - start) / 86400000);
  }

  /** Fractional-year terms shared by position and rise/set. */
  function solarTerms(date, tzHours) {
    const localMs = date.getTime() + tzHours * 3600000;
    const l = new Date(localMs);
    const doy = dayOfYear(l);
    const hour = l.getUTCHours() + l.getUTCMinutes() / 60 + l.getUTCSeconds() / 3600;
    const g = (2 * Math.PI / 365) * (doy - 1 + (hour - 12) / 24);
    const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
      - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
      - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
      - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    return { doy, hour, eqtime, decl, minutes: hour * 60 };
  }

  function sunPosition(date, lat, lon, tzHours) {
    const t = solarTerms(date, tzHours);
    const timeOffset = t.eqtime + 4 * lon - 60 * tzHours;
    const tst = t.minutes + timeOffset;
    const ha = (tst / 4 - 180) * RAD;
    const la = lat * RAD;
    const cosZen = Math.sin(la) * Math.sin(t.decl) + Math.cos(la) * Math.cos(t.decl) * Math.cos(ha);
    const zen = Math.acos(Math.max(-1, Math.min(1, cosZen)));
    let az = Math.acos(Math.max(-1, Math.min(1,
      (Math.sin(la) * Math.cos(zen) - Math.sin(t.decl)) / (Math.cos(la) * Math.sin(zen)))));
    az = ha > 0 ? (az * DEG + 180) % 360 : (540 - az * DEG) % 360;
    return { elevation: 90 - zen * DEG, azimuth: az };
  }

  /** Local minutes from midnight for the geometric horizon (−0.833° refraction). */
  function sunTimes(date, lat, lon, tzHours) {
    const t = solarTerms(date, tzHours);
    const la = lat * RAD, z = 90.833 * RAD;
    const cosH = (Math.cos(z) - Math.sin(la) * Math.sin(t.decl)) / (Math.cos(la) * Math.cos(t.decl));
    if (cosH > 1) return { sunriseMin: NaN, sunsetMin: NaN };      // polar night
    if (cosH < -1) return { sunriseMin: 0, sunsetMin: 1440 };      // midnight sun
    const ha = Math.acos(cosH) * DEG;
    const noon = 720 - 4 * (lon - 0) - t.eqtime + 60 * tzHours;
    return { sunriseMin: noon - 4 * ha, sunsetMin: noon + 4 * ha };
  }

  return { sunPosition, sunTimes, dayOfYear };
});
```

- [ ] **Step 4: Run to green.** Expect 5 passing. If June/January sunset are outside ±4 min, the bug is in `sunTimes`'s noon term or the timezone handling — fix the model, never the assertion.

- [ ] **Step 5: Commit** `feat(vale): real solar position for Rosa Brook, verified against the page's own figures`

---

## Task 2: Sky shader

**Files:** Create `js/sky.glsl.js`

**Interfaces produced:** `VV.sky.VERT`, `VV.sky.FRAG`, uniform contract `{ uSunDir: vec3, uTurbidity: float, uExposure: float, uQuiet: vec4[8], uResolution: vec2, uSeason: float }`

An analytic Rayleigh + Mie single-scattering model driven entirely by `uSunDir` (from Task 1). Requirements, in order of importance:

1. **Sun below horizon must read as night**, not black — a graded dusk with the horizon still warm for ~10° below.
2. **Golden hour must emerge on its own** from the Mie phase function at low elevation, not from a hand-tuned colour ramp.
3. A soft sun disc with atmospheric bloom near the horizon.
4. A ground plane in shadow at the bottom third, tinted by `uSeason` (0 bare/winter → 1 gold/vintage) so the horizon reads seasonally.
5. The same `quietness()` attenuation the home page uses, applied to the final colour so text stays legible with no scrim.

- [ ] **Step 1:** Write the shader with a structural unit test (`tests/sky.test.js`) asserting: `precision highp float;` first, `uniform vec4 uQuiet[8]` present, `quietness(` present, balanced braces, no GLSL 3.00 syntax (`in`/`out`/`texture(`).
- [ ] **Step 2:** Run red, implement, run green.
- [ ] **Step 3:** Commit `feat(vale): analytic sky — Rayleigh and Mie driven by the real sun vector`

---

## Task 3: Vine rows and the stage

**Files:** Create `js/stage.js`; modify `js/main.js`

**Interfaces produced:** `mountStage(canvas, opts) → { setDay(dayOfYear), setQuietRects(els), destroy() }`

- Sky dome (inverted sphere or fullscreen quad) with the Task 2 material.
- **Vine rows:** instanced thin geometry receding to the horizon, silhouetted against the sky, with parallax on scroll. Row state interpolates across the year — bare canes → budding → full canopy → gold — driven by day-of-year, not by season buckets, so it moves continuously.
- **Tiering** copied in spirit from `vernier/js/tier.js`: row count and DPR by device; `prefers-reduced-motion` or no WebGL2 → render one frame and stop.
- **Quiet rects** collected every third frame from `[data-quiet]` and uploaded as `uQuiet`.
- `destroy()` disposes every geometry, material and texture, cancels the loop, removes listeners.

- [ ] **Step 1:** Implement, mount behind the existing stage markup.
- [ ] **Step 2:** Verify in emulated iPhone WebKit and desktop Chromium: WebGL2 context present, zero console errors, a rendered frame that is not the clear colour.
- [ ] **Step 3:** Commit `feat(vale): continuous stage — sky, vine rows, tiering, content-aware attenuation`

---

## Task 4: Scroll ↔ year binding

**Files:** Create `js/year.js`, `tests/year.test.js`; modify `js/main.js`

**Interfaces produced:** `dayAt(scrollFraction): number`, `anchors(): {selector, day}[]`

The year runs **September → August** (the existing `ORDER`). Section anchors map to their season's midpoint so the sky is right when each section arrives; between anchors the day interpolates continuously.

- [ ] **Step 1:** Failing test — `dayAt` is monotonic across [0,1], returns 1..365, and each anchor's day falls inside its season's months per `VV.SEASONS`.
- [ ] **Step 2:** Implement, run green.
- [ ] **Step 3:** Wire: scroll drives `setDay`, the season chips still jump, `#year`'s existing readouts continue to read from `VV.SEASONS`. **The ceremony hour for the current season sets the time of day**, so the sky shows the light your ceremony would actually have.
- [ ] **Step 4:** Commit `feat(vale): scroll walks the vineyard year and the sky follows`

---

## Task 5: Strip the weight

**Files:** Delete the four `stage-*.jpg` and `stage-eve.jpg`; modify `index.html`, `css/style.css`

- [ ] Remove the `.stage__img` layers and their CSS; the WebGL stage replaces them entirely.
- [ ] Keep only genuine venue detail photography (`sup-*`, `detail-*`, `ceremony`, `interior`) — convert to AVIF + WebP with `srcset` at 640/1024/1600, `loading="lazy"`, explicit `width`/`height`.
- [ ] The two `.mp4` set pieces stay but get `preload="none"` and load only when their section is reached.
- [ ] Commit `perf(vale): the sky is computed, so 3.3 MB of season photographs are gone`

---

## Task 6: Gates — measured, not asserted

**Files:** Create `tests/e2e/vale.spec.ts` (root Playwright suite)

- [ ] **Contrast:** sample the composited canvas behind `.yr__facts`, the hero lede and a `#dates` label at four scroll positions; body ≥ 4.5:1, large ≥ 3:1, with no full-page scrim present.
- [ ] **Reduced motion:** two screenshots 1.2 s apart are byte-identical.
- [ ] **Mobile Lighthouse:** performance ≥ 90, LCP ≤ 2.5 s, total ≤ 1.2 MB, accessibility 100. Record before/after.
- [ ] **360 px:** no horizontal overflow.
- [ ] **Skip link** present (Vale currently has none) and focus visible throughout.
- [ ] Commit `test(vale): contrast, reduced-motion, overflow and mobile-performance gates`

---

## Definition of done

The sky at any scroll position is the real light at Rosa Brook for that date and ceremony hour; the June and January sunsets the page prints are the ones the model computes; mobile Lighthouse ≥ 90 with LCP ≤ 2.5 s; and the page carries one continuous signature rather than five section widgets. Then this becomes the reference the other four demos are rebuilt against.
