# VERNIER Calibre 01 — Flagship Demo Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/rewire/sample/vernier/` — a sixth Rewire demo model: a premium, scroll-driven 3D showcase of a fictional mechanical watch movement, benchmarked against Apple's flagship device pages.

**Architecture:** A fixed full-viewport WebGL stage (three.js) sits behind a scrolling content column. Pure geometry math and the adaptive-quality decision live in dependency-free modules that are unit-tested in Node; the three.js scene, materials, custom post-processing and page wiring are plain browser scripts verified in the browser. GSAP + ScrollTrigger drive every camera move, explode and count-up; Lenis smooths the scroll.

**Tech Stack:** three.js (vendored, pre-r152 API: `outputEncoding = sRGBEncoding`, `physicallyCorrectLights = true`), GSAP 3.13 + ScrollTrigger, Lenis 1.1.14, Node's built-in `node --test` runner for pure modules, Python/PIL for the tile image. No build step, no npm.

## Global Constraints

- Static site, no build step: plain `<script>` tags, no ES modules, no bundler.
- All libraries are copied from `rewire/sample/apex/js/vendor/` — never loaded from a CDN.
- three.js is the pre-r152 build: use `renderer.outputEncoding = THREE.sRGBEncoding`, `renderer.physicallyCorrectLights = true`. `outputColorSpace` does NOT exist in this build.
- Palette tokens exactly as spec: `--void #F7F7F8`, `--void-2 #EDEDEF`, `--ink #101114`, `--ink-2 #4A4C54`, `--muted #6E7078`, `--blued #2B4C8C`. No cream, no warm tint.
- Fonts: Familjen Grotesk (display + body) and Fragment Mono (readouts only), via Google Fonts `<link>`.
- Every page text lives in the DOM, never only in the canvas.
- `prefers-reduced-motion` must be honoured in JS (GSAP and the render loop), not just CSS.
- Footer must link to `/` (neurotrocity.com), like every page on the domain.
- Total transferred weight under 1MB.
- No eyebrow label above every section, no `01/02/03` section markers, no gradient text, no glassmorphism, no side-stripe borders.
- Copy: at most two em-dashes in prose across the whole page.
- Commit after every task with the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer.

## File Structure

```
rewire/sample/vernier/
  index.html            page shell + all copy (Task 1)
  css/style.css         tokens, type, layout, focus, reduced-motion (Task 1)
  js/vendor/            three.min.js, gsap.min.js, ScrollTrigger.min.js, lenis.min.js (Task 1, copied)
  js/profile.js         PURE: gear / spring / screw profiles. UMD, Node-testable (Task 2)
  js/tier.js            PURE: adaptive quality tiers + chooser. UMD, Node-testable (Task 3)
  js/materials.js       PBR materials + canvas-generated roughness maps (Task 4)
  js/geometry.js        builds the ~140-part movement from profile.js (Task 5)
  js/movement.js        renderer, camera, IBL, lights, shadows, escapement, API (Task 6)
  js/post.js            custom post pass: bloom + vignette + depth-of-field (Task 7)
  js/main.js            DOM wiring, Lenis, ScrollTriggers, crown drag, tiers (Task 8)
  assets/vernier-fallback.jpg   captured from the real render (Task 9)
  tests/profile.test.js, tests/tier.test.js   node --test (Tasks 2, 3)
rewire/sample/assets/vernier-tile.jpg          1200x750 grid tile (Task 9)
rewire/sample/index.html, rewire/landing/index.html   add the sixth card (Task 9)
```

Each browser module attaches one namespace: `window.Vernier.profile`, `.tier`, `.materials`, `.geometry`, `.movement`, `.post`. `main.js` is the only file that knows about the DOM.

---

### Task 1: Scaffold, vendor libraries, page shell with all copy, stylesheet

**Files:**
- Create: `rewire/sample/vernier/index.html`
- Create: `rewire/sample/vernier/css/style.css`
- Create: `rewire/sample/vernier/js/vendor/{three.min.js,gsap.min.js,ScrollTrigger.min.js,lenis.min.js}` (copied)

**Interfaces:**
- Produces: DOM ids used by `main.js` in Task 8 — `#stage` (canvas), `#fallback` (img), `#crown` (drag control), `#reserveH`, `#tensionPct`, `#beats`, `[data-count]` elements, `section#hero #wind #exploded #escapement #materials #tolerances #spec`, `[data-view]` on each section giving the camera view name.

- [ ] **Step 1: Create the folder and copy the vendored libraries**

```bash
cd /Users/robbrown/CodingProjects/Apps/neurotrocity-website
mkdir -p rewire/sample/vernier/{css,js/vendor,assets,tests}
cp rewire/sample/apex/js/vendor/{gsap.min.js,ScrollTrigger.min.js,lenis.min.js} rewire/sample/vernier/js/vendor/
cp rewire/sample/forge/js/vendor/three.min.js rewire/sample/vernier/js/vendor/
ls -la rewire/sample/vernier/js/vendor/
```
Expected: four files; three.min.js ≈ 592K.

- [ ] **Step 2: Write `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vernier — Calibre 01</title>
<meta name="description" content="Calibre 01: a hand-finished manual movement, rendered live in your browser. Wind it, take it apart, watch the escapement run.">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;700&family=Fragment+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>

<a class="skip" href="#main">Skip to content</a>

<header class="top">
  <a class="mark" href="#hero">Vernier</a>
  <nav class="topnav" aria-label="Sections">
    <a href="#wind">Wind</a>
    <a href="#exploded">Parts</a>
    <a href="#escapement">Escapement</a>
    <a href="#materials">Materials</a>
    <a href="#spec">Specification</a>
  </nav>
  <a class="btn btn--ink" href="#spec">Enquire</a>
</header>

<!-- The 3D stage. Fixed, full viewport, behind the content column. -->
<div class="stage" aria-hidden="true">
  <canvas id="stage"></canvas>
  <img id="fallback" class="fallback" src="assets/vernier-fallback.jpg" alt="" hidden>
  <div class="scrim"></div>
</div>

<main id="main">

  <section class="sec sec--hero" id="hero" data-view="hero">
    <div class="col">
      <p class="pre">Manual calibre · 26 mm · 21 jewels</p>
      <h1>Calibre<br>01.</h1>
      <p class="lede">A hand-finished manual movement. One hundred and forty parts, built to be looked at, running live in your browser right now.</p>
      <div class="ctas">
        <a class="btn btn--blued" href="#wind">Wind it</a>
        <a class="btn" href="#exploded">See every part</a>
      </div>
    </div>
  </section>

  <section class="sec" id="wind" data-view="wind">
    <div class="col">
      <h2>Wind it yourself.</h2>
      <p>Drag the crown. The mainspring takes up the tension, the ratchet wheel turns, and the power reserve fills. Fifty-two hours from full.</p>
      <div class="crownctl">
        <div id="crown" class="crown" role="slider" tabindex="0"
             aria-label="Wind the movement" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="crown__grip"></div>
        </div>
        <p class="hint">Drag sideways, or use the arrow keys.</p>
      </div>
      <dl class="read">
        <div><dt>Power reserve</dt><dd><span id="reserveH">0</span> h</dd></div>
        <div><dt>Mainspring tension</dt><dd><span id="tensionPct">0</span>%</dd></div>
      </dl>
    </div>
  </section>

  <section class="sec sec--tall" id="exploded" data-view="exploded">
    <div class="col">
      <h2>Every part, in its place.</h2>
      <p>Keep scrolling and the movement comes apart along its true axes. Nothing here is decorative. Every piece is doing a job.</p>
      <ul class="parts">
        <li><b>Mainplate</b><span>26.0 mm · brass, rhodium plated</span></li>
        <li><b>Barrel bridge</b><span>Holds the mainspring barrel and the winding train</span></li>
        <li><b>Train bridge</b><span>Centre, third and fourth wheels</span></li>
        <li><b>Balance cock</b><span>Carries the balance, the hairspring and the regulator</span></li>
        <li><b>Jewels</b><span>21 synthetic rubies in polished settings</span></li>
      </ul>
    </div>
  </section>

  <section class="sec sec--tall" id="escapement" data-view="escapement">
    <div class="col">
      <h2>Four beats a second.</h2>
      <p>The balance swings through 270 degrees, twenty-eight thousand eight hundred times an hour. This one is running in real time, against your clock.</p>
      <dl class="read">
        <div><dt>Frequency</dt><dd>4 Hz · 28,800 vph</dd></div>
        <div><dt>Amplitude</dt><dd>270°</dd></div>
        <div><dt>Beats since you arrived</dt><dd id="beats">0</dd></div>
      </dl>
    </div>
  </section>

  <section class="sec sec--tall" id="materials" data-view="sapphire">
    <div class="col">
      <h2>Three materials, up close.</h2>
      <div class="mat" data-view="sapphire">
        <h3>Sapphire</h3>
        <p>Refractive index 1.77, hardness 9. The caseback is a window, not a lid.</p>
      </div>
      <div class="mat" data-view="screw">
        <h3>Blued steel</h3>
        <p>Heated to 290 °C until the oxide layer turns. That colour is not paint.</p>
      </div>
      <div class="mat" data-view="striping">
        <h3>Côtes de Genève</h3>
        <p>Cut by hand across the bridges. Only ever seen through the back.</p>
      </div>
    </div>
  </section>

  <section class="sec" id="tolerances" data-view="spec">
    <div class="col col--wide">
      <h2>Measured, not described.</h2>
      <ul class="figs">
        <li><b data-count="140">0</b><span>parts</span></li>
        <li><b data-count="21">0</b><span>jewels</span></li>
        <li><b data-count="52">0</b><span>hours reserve</span></li>
        <li><b data-count="28800" data-sep="1">0</b><span>vibrations per hour</span></li>
        <li><b>±2</b><span>seconds a day</span></li>
        <li><b>3.6</b><span>mm thick</span></li>
      </ul>
    </div>
  </section>

  <section class="sec" id="spec" data-view="spec">
    <div class="col col--wide">
      <h2>Specification.</h2>
      <table class="spec">
        <tr><th>Calibre</th><td>01, manual wind</td></tr>
        <tr><th>Diameter</th><td>26.0 mm</td></tr>
        <tr><th>Height</th><td>3.6 mm</td></tr>
        <tr><th>Frequency</th><td>4 Hz, 28,800 vph</td></tr>
        <tr><th>Power reserve</th><td>52 hours</td></tr>
        <tr><th>Jewels</th><td>21</td></tr>
        <tr><th>Balance</th><td>Free sprung, four-arm, adjustable mass</td></tr>
        <tr><th>Finishing</th><td>Côtes de Genève, anglage, perlage, blued screws</td></tr>
      </table>
      <div class="enq">
        <p>Calibre 01 is a demonstration. The people who built this page are not.</p>
        <a class="btn btn--blued" href="/rewire/contact/">Talk to Rewire</a>
      </div>
    </div>
  </section>

</main>

<footer class="foot">
  <span>Demo model · De-identified · Built by Rewire</span>
  <nav aria-label="Rewire">
    <a href="/rewire/sample/">Demo models</a>
    <a href="/rewire/landing/">Rewire</a>
    <a href="/">neurotrocity.com</a>
  </nav>
</footer>

<script src="js/vendor/three.min.js"></script>
<script src="js/vendor/gsap.min.js"></script>
<script src="js/vendor/ScrollTrigger.min.js"></script>
<script src="js/vendor/lenis.min.js"></script>
<script src="js/profile.js"></script>
<script src="js/tier.js"></script>
<script src="js/materials.js"></script>
<script src="js/geometry.js"></script>
<script src="js/post.js"></script>
<script src="js/movement.js"></script>
<script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write `css/style.css`**

```css
/* ═══════════════════════════════════════════════════════
   VERNIER — Calibre 01 · clinical white void
   ═══════════════════════════════════════════════════════ */
:root{
  --void:   #F7F7F8;
  --void-2: #EDEDEF;
  --ink:    #101114;
  --ink-2:  #4A4C54;
  --muted:  #6E7078;
  --blued:  #2B4C8C;
  --line:   rgba(16,17,20,.12);
  --sans:   "Familjen Grotesk", system-ui, sans-serif;
  --mono:   "Fragment Mono", ui-monospace, monospace;
  --pad:    clamp(20px, 5vw, 80px);
  --col:    520px;
  --ease:   cubic-bezier(.22,1,.36,1);
  --z-stage: 0; --z-scrim: 1; --z-main: 2; --z-top: 10;
}
*,*::before,*::after{ box-sizing:border-box; }
html{ -webkit-text-size-adjust:100%; }
body{
  margin:0; background:var(--void); color:var(--ink);
  font-family:var(--sans); font-weight:400; font-size:clamp(15.5px,1.05vw,17px);
  line-height:1.6; overflow-x:hidden; -webkit-font-smoothing:antialiased;
}
a{ color:inherit; text-decoration:none; }
h1,h2,h3,p,dl,dd,ul{ margin:0; }
img{ display:block; max-width:100%; }
::selection{ background:var(--blued); color:#fff; }

/* keyboard focus is visible on every control */
:focus-visible{ outline:2px solid var(--blued); outline-offset:3px; border-radius:3px; }
:focus:not(:focus-visible){ outline:none; }
.skip{ position:absolute; left:-999px; top:8px; background:var(--ink); color:#fff; padding:8px 12px; z-index:var(--z-top); }
.skip:focus{ left:8px; }

/* ── stage ─────────────────────────────────────────── */
.stage{ position:fixed; inset:0; z-index:var(--z-stage); }
.stage canvas{ display:block; width:100%; height:100%; }
.fallback{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.no-webgl .fallback{ display:block; }
.no-webgl #stage{ display:none; }
/* on phones the object sits in the upper half; this keeps the text legible over it */
.scrim{ position:absolute; inset:0; z-index:var(--z-scrim); pointer-events:none;
  background:linear-gradient(180deg, rgba(247,247,248,0) 40%, rgba(247,247,248,.86) 68%, var(--void) 100%); opacity:0; }
@media (max-width:820px){ .scrim{ opacity:1; } }

/* ── top bar ───────────────────────────────────────── */
.top{ position:fixed; top:0; left:0; right:0; z-index:var(--z-top);
  display:flex; align-items:center; gap:28px; padding:18px var(--pad); }
.mark{ font-weight:700; letter-spacing:-.02em; font-size:1.15rem; }
.topnav{ display:flex; gap:22px; margin-left:auto; font-size:.92rem; color:var(--ink-2); }
.topnav a:hover{ color:var(--ink); }
@media (max-width:820px){ .topnav{ display:none; } .top .btn{ margin-left:auto; } }

/* ── buttons ───────────────────────────────────────── */
.btn{ display:inline-flex; align-items:center; gap:8px; padding:12px 20px; border-radius:999px;
  border:1px solid var(--line); font-weight:500; font-size:.95rem; background:#fff;
  transition:transform .25s var(--ease), background .25s, border-color .25s; }
.btn:hover{ transform:translateY(-1px); border-color:var(--ink); }
.btn--ink{ background:var(--ink); color:#fff; border-color:var(--ink); }
.btn--blued{ background:var(--blued); color:#fff; border-color:var(--blued); }
.btn--blued:hover{ background:#23407a; }

/* ── sections ──────────────────────────────────────── */
main{ position:relative; z-index:var(--z-main); }
.sec{ min-height:100vh; display:flex; align-items:center; padding:120px var(--pad); }
.sec--tall{ min-height:180vh; align-items:flex-start; padding-top:22vh; }
.sec--hero{ min-height:100vh; }
.col{ max-width:var(--col); }
.col--wide{ max-width:820px; }
.pre{ font-family:var(--mono); font-size:.72rem; letter-spacing:.06em; color:var(--muted); margin-bottom:22px; }
h1{ font-size:clamp(3.4rem,9vw,6rem); line-height:.92; letter-spacing:-.04em; font-weight:700; text-wrap:balance; margin-bottom:26px; }
h2{ font-size:clamp(2rem,4.2vw,3.2rem); line-height:1.02; letter-spacing:-.03em; font-weight:700; text-wrap:balance; margin-bottom:18px; }
h3{ font-size:1.25rem; font-weight:700; letter-spacing:-.01em; margin-bottom:6px; }
.lede{ font-size:1.12rem; color:var(--ink-2); max-width:44ch; text-wrap:pretty; }
.sec p{ color:var(--ink-2); max-width:52ch; text-wrap:pretty; }
.ctas{ display:flex; gap:12px; flex-wrap:wrap; margin-top:30px; }
@media (max-width:820px){
  .sec{ align-items:flex-end; padding-bottom:12vh; }
  .sec--hero{ align-items:flex-end; }
  .sec--tall{ align-items:flex-end; padding-top:60vh; }
}

/* readouts */
.read{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:18px 28px; margin-top:28px;
  padding-top:18px; border-top:1px solid var(--line); }
.read dt{ font-family:var(--mono); font-size:.68rem; letter-spacing:.06em; color:var(--muted); margin-bottom:4px; }
.read dd{ font-size:1.25rem; font-weight:500; font-variant-numeric:tabular-nums; }

/* crown control */
.crownctl{ margin-top:30px; }
.crown{ width:220px; height:64px; border-radius:999px; border:1px solid var(--line); background:#fff;
  position:relative; cursor:grab; touch-action:pan-y; user-select:none; overflow:hidden; }
.crown:active{ cursor:grabbing; }
.crown__grip{ position:absolute; top:6px; bottom:6px; left:6px; width:52px; border-radius:999px; background:var(--ink);
  background-image:repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 2px, transparent 2px 6px); }
.hint{ font-family:var(--mono); font-size:.7rem; color:var(--muted); margin-top:10px; }

/* parts list */
.parts{ list-style:none; padding:0; margin-top:26px; border-top:1px solid var(--line); }
.parts li{ display:flex; flex-direction:column; gap:2px; padding:12px 0; border-bottom:1px solid var(--line); }
.parts b{ font-weight:500; }
.parts span{ font-family:var(--mono); font-size:.72rem; color:var(--muted); }

/* materials */
.mat{ padding:22px 0; border-top:1px solid var(--line); }
.mat:first-of-type{ margin-top:14px; }

/* figures */
.figs{ list-style:none; padding:0; display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:26px 34px; margin-top:26px; }
.figs b{ display:block; font-size:clamp(2.2rem,4vw,3.2rem); font-weight:700; letter-spacing:-.03em; line-height:1; font-variant-numeric:tabular-nums; }
.figs span{ font-family:var(--mono); font-size:.7rem; color:var(--muted); letter-spacing:.04em; }

/* spec */
.spec{ width:100%; border-collapse:collapse; margin-top:22px; }
.spec th,.spec td{ text-align:left; padding:12px 0; border-bottom:1px solid var(--line); vertical-align:top; }
.spec th{ font-family:var(--mono); font-weight:400; font-size:.72rem; color:var(--muted); width:38%; letter-spacing:.04em; }
.enq{ margin-top:40px; padding:26px; background:var(--void-2); border-radius:14px; display:flex; gap:18px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
.enq p{ color:var(--ink); font-weight:500; max-width:40ch; }

/* footer */
.foot{ position:relative; z-index:var(--z-main); display:flex; justify-content:space-between; gap:20px; flex-wrap:wrap;
  padding:28px var(--pad) 40px; font-family:var(--mono); font-size:.7rem; color:var(--muted); border-top:1px solid var(--line); background:var(--void); }
.foot nav{ display:flex; gap:18px; }
.foot a:hover{ color:var(--ink); }

/* reduced motion: CSS side. The JS side is handled in main.js. */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ transition-duration:.01ms!important; animation-duration:.01ms!important; scroll-behavior:auto!important; }
}
```

- [ ] **Step 4: Serve and check the shell renders, and the detector is clean**

```bash
cd /Users/robbrown/CodingProjects/Apps/neurotrocity-website
(python3 -m http.server 8123 --bind 127.0.0.1 >/dev/null 2>&1 &) ; sleep 1
curl -s -o /dev/null -w "vernier %{http_code}\n" http://127.0.0.1:8123/rewire/sample/vernier/
node /Users/robbrown/.claude/plugins/cache/impeccable/impeccable/3.9.1/skills/impeccable/scripts/detect.mjs --json rewire/sample/vernier/index.html; echo "detector exit=$?"
grep -c 'href="/"' rewire/sample/vernier/index.html
```
Expected: `vernier 200`; detector prints `[]` and `exit=0`; grep prints `1`. (A JS console error about `Vernier` being undefined is expected until Task 8; the shell must still render.)

- [ ] **Step 5: Commit**

```bash
git add rewire/sample/vernier
git commit -m "Vernier: scaffold, vendored libs, page shell and stylesheet

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: `profile.js` — pure geometry math, unit-tested in Node

**Files:**
- Create: `rewire/sample/vernier/js/profile.js`
- Test: `rewire/sample/vernier/tests/profile.test.js`

**Interfaces:**
- Produces (used by Task 5):
  - `gearProfile(teeth:int>=6, module:number>0, opts?:{samplesPerTooth?:int}) -> Array<{x,y}>` closed polygon in XY, `teeth*samplesPerTooth` points, counter-clockwise.
  - `gearRadii(teeth, module) -> {pitch, addendum, root}`
  - `springPath(turns, r0, r1, n, tension=0) -> Array<{x,y,z:0}>` Archimedean spiral; `tension` 1 pulls the outer coils inward by 45%.
  - `screwProfile(headR, headH, shankR, length, steps=8) -> Array<{r,y}>` lathe profile from top-centre down to shank tip.
- UMD: in Node `require()` returns the object; in the browser it is `window.Vernier.profile`.

- [ ] **Step 1: Write the failing tests**

`rewire/sample/vernier/tests/profile.test.js`:
```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/robbrown/CodingProjects/Apps/neurotrocity-website
node --test rewire/sample/vernier/tests/profile.test.js
```
Expected: FAIL — `Cannot find module '../js/profile.js'`.

- [ ] **Step 3: Write `js/profile.js`**

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
node --test rewire/sample/vernier/tests/profile.test.js
```
Expected: `# pass 6`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add rewire/sample/vernier/js/profile.js rewire/sample/vernier/tests/profile.test.js
git commit -m "Vernier: pure gear, spring and screw profiles with Node tests

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: `tier.js` — adaptive quality decision, unit-tested in Node

**Files:**
- Create: `rewire/sample/vernier/js/tier.js`
- Test: `rewire/sample/vernier/tests/tier.test.js`

**Interfaces:**
- Produces (used by Tasks 6, 8):
  - `TIERS: { high|medium|low: { pixelRatio, shadowMap, softShadows, post:{bloom,vignette,dof}, transmission } }`
  - `chooseTier(frameTimesMs:number[]) -> 'high'|'medium'|'low'` — median-based; fewer than 10 samples returns `'medium'`.
  - `stepDown(tier) -> tier` — one tier lower, `'low'` stays `'low'`.
  - `rank(tier) -> 0|1|2` (`high`=2) so callers can compare tiers.

- [ ] **Step 1: Write the failing tests**

`rewire/sample/vernier/tests/tier.test.js`:
```js
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
  for (const k of ['high', 'medium', 'low']) {
    const t = T.TIERS[k];
    for (const key of ['pixelRatio', 'shadowMap', 'softShadows', 'post', 'transmission']) assert.ok(key in t, k + '.' + key);
    for (const key of ['bloom', 'vignette', 'dof']) assert.equal(typeof t.post[key], 'boolean');
  }
  assert.equal(T.TIERS.low.shadowMap, 0);
  assert.equal(T.TIERS.low.transmission, false);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
node --test rewire/sample/vernier/tests/tier.test.js
```
Expected: FAIL — `Cannot find module '../js/tier.js'`.

- [ ] **Step 3: Write `js/tier.js`**

```js
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
```

- [ ] **Step 4: Run to verify pass**

```bash
node --test rewire/sample/vernier/tests/
```
Expected: `# pass 12`, `# fail 0` (both files).

- [ ] **Step 5: Commit**

```bash
git add rewire/sample/vernier/js/tier.js rewire/sample/vernier/tests/tier.test.js
git commit -m "Vernier: adaptive quality tiers with median-based chooser and tests

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: `materials.js` — PBR materials with generated roughness maps

**Files:**
- Create: `rewire/sample/vernier/js/materials.js`

**Interfaces:**
- Consumes: global `THREE`.
- Produces (used by Tasks 5, 6): `Vernier.materials.create({transmission?:boolean}) -> { plate, bridge, steel, polished, blued, brass, ruby, sapphire, spring, dark, isTransmission }` — all `THREE.Material` instances; `sapphire` is a real-transmission `MeshPhysicalMaterial` when `transmission !== false`, otherwise a cheap translucent approximation for the low tier.

- [ ] **Step 1: Write `js/materials.js`**

```js
/* VERNIER — materials. Brushed and striped finishes come from canvas-drawn
   roughness maps, so there is nothing to download. */
(function () {
  'use strict';
  const V = window.Vernier = window.Vernier || {};

  function grey(v) { const k = Math.round(v * 255); return 'rgb(' + k + ',' + k + ',' + k + ')'; }

  /* Fine parallel streaks: a brushed finish is just anisotropic roughness. */
  function brushedMap(size, base, spread) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = grey(base); g.fillRect(0, 0, size, size);
    for (let i = 0; i < size * 2; i++) {
      const y = Math.random() * size;
      g.strokeStyle = grey(Math.min(1, Math.max(0, base + (Math.random() - 0.5) * spread)));
      g.globalAlpha = 0.35; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y); g.lineTo(size, y + (Math.random() - 0.5) * 2); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
    return t;
  }

  /* Côtes de Genève: soft parallel bands, rotated like the real thing. */
  function genevaMap(size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    const bands = 9, w = size / bands;
    for (let i = 0; i < bands; i++) {
      const gr = g.createLinearGradient(i * w, 0, (i + 1) * w, 0);
      gr.addColorStop(0, grey(0.36)); gr.addColorStop(0.5, grey(0.62)); gr.addColorStop(1, grey(0.36));
      g.fillStyle = gr; g.fillRect(i * w, 0, w + 1, size);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 1.6);
    t.center.set(0.5, 0.5); t.rotation = Math.PI / 7;
    return t;
  }

  V.materials = {
    create: function (opts) {
      opts = opts || {};
      const transmission = opts.transmission !== false;
      const brushed = brushedMap(512, 0.42, 0.5);
      const geneva  = genevaMap(512);
      const m = {
        plate:    new THREE.MeshStandardMaterial({ color: 0xd8d5ce, metalness: 1, roughness: 0.6,  roughnessMap: brushed }),
        bridge:   new THREE.MeshStandardMaterial({ color: 0xdedcd6, metalness: 1, roughness: 0.55, roughnessMap: geneva }),
        steel:    new THREE.MeshStandardMaterial({ color: 0xcfd2d6, metalness: 1, roughness: 0.38, roughnessMap: brushed }),
        polished: new THREE.MeshStandardMaterial({ color: 0xe8eaed, metalness: 1, roughness: 0.1 }),
        blued:    new THREE.MeshStandardMaterial({ color: 0x2b4c8c, metalness: 1, roughness: 0.16 }),
        brass:    new THREE.MeshStandardMaterial({ color: 0xc9a55a, metalness: 1, roughness: 0.3,  roughnessMap: brushed }),
        spring:   new THREE.MeshStandardMaterial({ color: 0x3a3f47, metalness: 1, roughness: 0.35 }),
        dark:     new THREE.MeshStandardMaterial({ color: 0x14161a, metalness: 0.6, roughness: 0.5 }),
        ruby:     new THREE.MeshPhysicalMaterial({ color: 0xb0122f, metalness: 0, roughness: 0.05,
                    clearcoat: 1, clearcoatRoughness: 0.05, ior: 1.76, thickness: 0.3,
                    transmission: transmission ? 0.35 : 0 }),
        sapphire: transmission
          ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02,
              transmission: 1, ior: 1.77, thickness: 0.6, transparent: true, side: THREE.DoubleSide })
          : new THREE.MeshPhysicalMaterial({ color: 0xf2f6fa, metalness: 0, roughness: 0.04,
              transparent: true, opacity: 0.2, clearcoat: 1, side: THREE.DoubleSide })
      };
      m.isTransmission = transmission;
      return m;
    }
  };
})();
```

- [ ] **Step 2: Verify in the browser that every material constructs**

Serve (`python3 -m http.server 8123 --bind 127.0.0.1` from the repo root if not already running), open `http://127.0.0.1:8123/rewire/sample/vernier/` in the Browser pane, then run:
```js
(function(){ var m=Vernier.materials.create(); var keys=Object.keys(m).filter(k=>k!=='isTransmission');
  return JSON.stringify({count:keys.length, allMaterials:keys.every(k=>m[k].isMaterial),
    sapphireTransmission:m.sapphire.transmission, lowTier:Vernier.materials.create({transmission:false}).sapphire.transmission}); })()
```
Expected: `{"count":10,"allMaterials":true,"sapphireTransmission":1,"lowTier":0}`.

- [ ] **Step 3: Commit**

```bash
git add rewire/sample/vernier/js/materials.js
git commit -m "Vernier: PBR materials with canvas-generated brushed and Geneva roughness maps

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: `geometry.js` — build the movement

**Files:**
- Create: `rewire/sample/vernier/js/geometry.js`

**Interfaces:**
- Consumes: `Vernier.profile` (Task 2), a materials object from `Vernier.materials.create()` (Task 4), global `THREE`.
- Produces (used by Task 6): `Vernier.geometry.build(mat) -> movement` where
  ```
  movement = {
    group: THREE.Group,                       // everything, centred at origin, plate top at y=0.6
    parts: Array<{ name, obj:THREE.Object3D, base:THREE.Vector3, dist:number }>,  // explode along +Y by dist
    escapement: { balance:THREE.Group, palletFork:THREE.Group, escapeWheel:THREE.Mesh },
    train: Array<{ obj:THREE.Object3D, rpm:number }>,   // wheels turning while running
    mainspring: { rebuild(tension:0..1):void },
    ratchet: THREE.Mesh, crown: THREE.Group,
    caseback: THREE.Mesh,                     // the sapphire disc; its material is swapped by tier
    partCount: number
  }
  ```

- [ ] **Step 1: Write `js/geometry.js`**

```js
/* VERNIER — the movement, generated part by part. Units are millimetres.
   Layers (y): mainplate 0 (top at +0.6) · wheels 1.35 · bridges 2.55 · screws 3.0
   Every part records its rest position and an explode distance along +Y. */
(function () {
  'use strict';
  const V = window.Vernier = window.Vernier || {};
  const P = V.profile;

  function shapeFrom(pts) {
    const s = new THREE.Shape();
    pts.forEach((p, i) => i ? s.lineTo(p.x, p.y) : s.moveTo(p.x, p.y));
    s.closePath(); return s;
  }
  /* Extrude along Z then stand it up so thickness runs along Y, centred. */
  function extrude(shape, depth, bevel) {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6
    });
    g.rotateX(-Math.PI / 2); g.translate(0, -depth / 2, 0);
    return g;
  }
  function gear(teeth, module, thick, mat, opts) {
    opts = opts || {};
    const shape = shapeFrom(P.gearProfile(teeth, module, { samplesPerTooth: opts.samples || 10 }));
    const root = P.gearRadii(teeth, module).root;
    const hub = opts.hub || Math.max(0.35, root * 0.22);
    if (opts.spokes) {                       // drilled openings read as spokes
      const n = opts.spokes, rm = (root + hub) / 2, rh = (root - hub) * 0.27;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, h = new THREE.Path();
        h.absarc(rm * Math.cos(a), rm * Math.sin(a), rh, 0, Math.PI * 2, true);
        shape.holes.push(h);
      }
    }
    return new THREE.Mesh(extrude(shape, thick, Math.min(0.03, thick * 0.2)), mat);
  }
  function cyl(r, h, mat, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 32), mat); }
  function tube(pts, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, 0, p.y)));
    return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(600, pts.length), radius, 6, false), mat);
  }
  function screw(headR, headH, shankR, len, headMat, slotMat) {
    const g = new THREE.Group();
    const pts = P.screwProfile(headR, headH, shankR, len).map(p => new THREE.Vector2(p.r, p.y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 24), headMat));
    const slot = new THREE.Mesh(new THREE.BoxGeometry(headR * 1.5, 0.06, 0.14), slotMat);
    slot.position.y = headH * 0.97; slot.rotation.y = Math.random() * Math.PI; g.add(slot);
    return g;
  }
  function jewel(r, mat) {
    const g = new THREE.Group();
    g.add(cyl(r, 0.32, mat.ruby, 24));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.12, 0.085, 8, 28), mat.polished);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.1; g.add(ring);
    return g;
  }
  /* Bridges are hand-drawn outlines. */
  function bridge(pts, mat, thick) { return new THREE.Mesh(extrude(shapeFrom(pts), thick || 0.9, 0.08), mat); }

  V.geometry = {
    build: function (mat) {
      const group = new THREE.Group(), parts = [], train = [];
      let count = 0;
      function add(name, obj, x, y, z, dist) {
        obj.position.set(x, y, z);
        obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        group.add(obj);
        parts.push({ name, obj, base: new THREE.Vector3(x, y, z), dist });
        count++; return obj;
      }

      /* mainplate: a 26mm disc with a rim step */
      add('mainplate', cyl(13, 1.2, mat.plate, 96), 0, 0, 0, 0);
      add('rim', (function(){ const m = new THREE.Mesh(new THREE.TorusGeometry(12.7, 0.25, 8, 96), mat.polished); m.rotation.x = Math.PI/2; return m; })(), 0, 0.6, 0, 0);
      for (let i = 0; i < 6; i++) {                                   // pillars
        const a = i / 6 * Math.PI * 2 + 0.3;
        add('pillar' + i, cyl(0.42, 2.2, mat.polished, 18), 11.6 * Math.cos(a), 1.6, 11.6 * Math.sin(a), 4);
      }

      /* barrel: open drum so the spring is visible, teeth ring underneath */
      const barrel = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(5.3, 5.3, 1.9, 64, 1, true), mat.steel); wall.material = wall.material.clone(); wall.material.side = THREE.DoubleSide;
      barrel.add(wall);
      const floor = cyl(5.3, 0.15, mat.steel, 64); floor.position.y = -0.95; barrel.add(floor);
      const teeth = gear(88, 0.128, 0.35, mat.steel, { samples: 8, hub: 4.9 }); teeth.position.y = -1.1; barrel.add(teeth);
      add('barrel', barrel, -5.6, 1.9, 1.4, 5);
      const arbor = cyl(0.55, 4.2, mat.polished, 20); add('barrelArbor', arbor, -5.6, 1.6, 1.4, 5);

      /* mainspring: rebuilt on demand so winding is visible */
      let springMesh = null;
      const spring = { rebuild: function (tension) {
        if (springMesh) { barrel.remove(springMesh); springMesh.geometry.dispose(); }
        springMesh = tube(P.springPath(9, 1.05, 4.9, 700, tension), 0.085, mat.spring);
        springMesh.position.y = 0.1; springMesh.castShadow = true; barrel.add(springMesh);
      } };
      spring.rebuild(0); count++;

      /* ratchet + crown wheel + click */
      const ratchet = add('ratchetWheel', gear(60, 0.13, 0.28, mat.steel, { spokes: 5, hub: 0.9 }), -5.6, 3.35, 1.4, 12);
      add('crownWheel', gear(44, 0.095, 0.28, mat.steel, { spokes: 4 }), -9.2, 3.35, -2.6, 12);
      add('click', (function(){ const g=new THREE.Group(); const arm=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.2,0.32), mat.polished); arm.position.x=0.6; g.add(arm); g.add(cyl(0.3,0.3,mat.polished,16)); g.rotation.y=0.9; return g; })(), -8.2, 3.35, 1.3, 12);

      /* going train: wheel + pinion, each a part */
      function wheel(name, teeth, module, x, z, spokes, rpm) {
        const w = gear(teeth, module, 0.2, mat.brass, { spokes: spokes, samples: 10 });
        const g = new THREE.Group(); g.add(w);
        const pin = gear(8, module * 1.6, 0.9, mat.polished, { samples: 8, hub: 0.15 }); pin.position.y = 0.5; g.add(pin);
        const staff = cyl(0.14, 2.6, mat.polished, 12); staff.position.y = 0.6; g.add(staff);
        add(name, g, x, 1.35, z, 6); count += 2;
        train.push({ obj: g, rpm: rpm }); return g;
      }
      wheel('centreWheel', 64, 0.11, 0.2, -1.0, 5, 1 / 60);
      wheel('thirdWheel', 56, 0.10, 4.6, -3.9, 5, 1 / 7.5);
      wheel('fourthWheel', 56, 0.088, 7.6, 0.6, 5, 1);
      const escape = new THREE.Group();
      const ew = gear(20, 0.17, 0.16, mat.steel, { samples: 12, hub: 0.3 }); escape.add(ew);
      const es = cyl(0.12, 2.4, mat.polished, 12); es.position.y = 0.4; escape.add(es);
      add('escapeWheel', escape, 5.6, 1.35, 5.4, 6); count++;

      /* pallet fork: a Y with two ruby stones */
      const fork = new THREE.Group();
      fork.add(new THREE.Mesh(extrude(shapeFrom([{x:-0.2,y:-0.3},{x:0.2,y:-0.3},{x:0.25,y:1.4},{x:1.3,y:2.3},{x:1.05,y:2.55},{x:0,y:1.75},{x:-1.05,y:2.55},{x:-1.3,y:2.3},{x:-0.25,y:1.4}]), 0.22, 0.02), mat.polished));
      [[-1.15, 2.4], [1.15, 2.4]].forEach(([x, z]) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.18), mat.ruby); s.position.set(x, 0.05, z); s.rotation.y = 0.5; fork.add(s); count++; });
      add('palletFork', fork, 3.3, 1.75, 7.0, 7);
      add('palletBridge', bridge([{x:-1.2,y:-1.3},{x:1.4,y:-1.5},{x:2.0,y:0.4},{x:1.1,y:1.8},{x:-1.3,y:1.6}], mat.bridge, 0.7), 3.3, 2.55, 7.0, 13);

      /* balance: rim, four arms, hub, eight timing weights, staff, hairspring */
      const balance = new THREE.Group();
      const rim = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.22, 10, 64), mat.polished); rim.rotation.x = Math.PI / 2; balance.add(rim);
      for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.16, 0.26), mat.polished); a.rotation.y = i * Math.PI / 4; balance.add(a); count++; }
      balance.add(cyl(0.5, 0.5, mat.polished, 24));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, w = cyl(0.17, 0.34, mat.brass, 12); w.position.set(3.2 * Math.cos(a), 0, 3.2 * Math.sin(a)); balance.add(w); count++; }
      const staff = cyl(0.13, 2.8, mat.polished, 12); staff.position.y = 0.4; balance.add(staff);
      const hair = tube(P.springPath(11, 0.5, 2.6, 600, 0), 0.025, mat.blued); hair.position.y = 0.7; balance.add(hair); count++;
      add('balance', balance, 0.4, 1.9, 8.1, 9);
      add('balanceCock', bridge([{x:-1.1,y:-0.9},{x:1.1,y:-0.9},{x:1.3,y:2.2},{x:3.6,y:5.9},{x:2.2,y:6.6},{x:-0.6,y:2.4},{x:-1.3,y:1.2}], mat.bridge, 0.8), -1.4, 3.3, 3.2, 15);
      add('regulator', (function(){ const g=new THREE.Group(); const arm=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.12,0.22),mat.blued); arm.position.x=0.8; g.add(arm); g.add(cyl(0.45,0.14,mat.polished,20)); return g; })(), 0.4, 3.85, 8.1, 17);
      add('capJewel', jewel(0.38, mat), 0.4, 3.9, 8.1, 17);

      /* bridges over the barrel and the train */
      add('barrelBridge', bridge([{x:-7.2,y:-6.4},{x:-0.4,y:-7.2},{x:1.6,y:-3.2},{x:0.8,y:2.6},{x:-3.2,y:6.4},{x:-9.6,y:5.2},{x:-11.8,y:0.4},{x:-10.4,y:-4.6}], mat.bridge), 0, 2.55, 0, 13);
      add('trainBridge', bridge([{x:2.2,y:-7.6},{x:8.8,y:-6.2},{x:11.4,y:-0.8},{x:10.2,y:3.8},{x:6.2,y:3.4},{x:4.0,y:0.4},{x:2.0,y:-2.6}], mat.bridge), 0, 2.55, 0, 13);
      add('motionBridge', bridge([{x:-1.6,y:-2.6},{x:3.4,y:-3.4},{x:4.4,y:-0.8},{x:2.0,y:1.2},{x:-1.6,y:0.6}], mat.bridge, 0.6), 0, 3.7, -1.0, 16);

      /* jewels: 21, in plate and bridges */
      const jewelSpots = [
        [-5.6, 1.4, 0.55], [0.2, -1.0, 0.45], [4.6, -3.9, 0.4], [7.6, 0.6, 0.38], [5.6, 5.4, 0.34], [3.3, 7.0, 0.32], [0.4, 8.1, 0.36],
        [-9.2, -2.6, 0.4], [2.6, -2.4, 0.34], [8.9, -4.2, 0.3], [-2.4, 4.8, 0.3]
      ];
      jewelSpots.forEach(([x, z, r], i) => {
        add('jewelPlate' + i, jewel(r, mat), x, 0.6, z, 2);      // plate side
        if (i < 10) add('jewelBridge' + i, jewel(r, mat), x, 3.05, z, 14.5);  // bridge side
      });

      /* screws: bridge screws blued, the rest polished */
      const screwSpots = [
        [-6.8, -5.4, 1], [-2.0, 5.6, 1], [-10.6, -3.0, 1], [-0.4, -6.4, 1], [3.4, -6.8, 1], [10.2, -2.6, 1], [9.0, 3.0, 1], [5.0, 2.6, 1],
        [-0.2, 4.0, 1], [2.4, 8.4, 1], [1.4, 0.4, 0], [3.0, -3.0, 0], [-7.8, 0.4, 0], [-4.2, 2.8, 0], [7.2, -1.6, 0], [-8.6, 3.8, 0]
      ];
      screwSpots.forEach(([x, z, isBridge], i) => {
        const s = screw(0.42, 0.22, 0.14, 0.9, isBridge ? mat.blued : mat.polished, mat.dark);
        add('screw' + i, s, x, isBridge ? 3.0 : 4.1, z, isBridge ? 19 : 21);
      });
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; add('pillarScrew' + i, screw(0.36, 0.2, 0.12, 0.8, mat.polished, mat.dark), 11.6 * Math.cos(a), 2.7, 11.6 * Math.sin(a), 19); }

      /* keyless works and crown */
      add('stem', (function(){ const s = cyl(0.28, 6.4, mat.polished, 14); s.rotation.z = Math.PI/2; return s; })(), -12.2, 1.2, -2.6, 3);
      add('windingPinion', gear(14, 0.12, 0.6, mat.polished, { samples: 8, hub: 0.2 }), -11.6, 1.2, -2.6, 3);
      add('slidingPinion', gear(12, 0.12, 0.6, mat.polished, { samples: 8, hub: 0.2 }), -10.3, 1.2, -2.6, 3);
      add('settingLever', (function(){ const g=new THREE.Group(); const a=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.16,0.3),mat.polished); a.rotation.y=-0.6; g.add(a); g.add(cyl(0.34,0.24,mat.polished,16)); return g; })(), -9.6, 3.35, -4.4, 12);
      add('cannonPinion', cyl(0.42, 1.4, mat.polished, 16), 0.2, 2.9, -1.0, 8);
      add('minuteWheel', gear(30, 0.1, 0.18, mat.brass, { spokes: 4 }), 2.6, 2.75, -2.4, 8);
      add('hourWheel', gear(36, 0.1, 0.16, mat.brass, { spokes: 4, hub: 0.6 }), 0.2, 3.35, -1.0, 8);
      const crown = new THREE.Group();
      const knurl = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 1.3, 40), mat.polished);
      const knurlProfile = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2; const r = 1.35 + (i % 2 ? 0.07 : -0.07); knurlProfile.push({ x: r * Math.cos(a), y: r * Math.sin(a) }); }
      const knurlMesh = new THREE.Mesh(extrude(shapeFrom(knurlProfile), 1.3, 0.04), mat.polished);
      crown.add(knurlMesh); crown.add(cyl(0.9, 1.6, mat.polished, 24));
      crown.rotation.z = Math.PI / 2;
      add('crown', crown, -15.4, 1.2, -2.6, 3); count++;

      /* the sapphire caseback: a window over everything */
      const caseback = cyl(13.4, 0.5, mat.sapphire, 96);
      add('caseback', caseback, 0, 4.9, 0, 24);

      return {
        group, parts, train,
        escapement: { balance, palletFork: fork, escapeWheel: escape },
        mainspring: spring, ratchet, crown, caseback,
        partCount: count
      };
    }
  };
})();
```

- [ ] **Step 2: Verify part count and bounds in the browser**

Reload `http://127.0.0.1:8123/rewire/sample/vernier/` and run:
```js
(function(){ var m=Vernier.geometry.build(Vernier.materials.create());
  var box=new THREE.Box3().setFromObject(m.group), s=new THREE.Vector3(); box.getSize(s);
  return JSON.stringify({partCount:m.partCount, tracked:m.parts.length, train:m.train.length,
    sizeMM:[+s.x.toFixed(1),+s.y.toFixed(1),+s.z.toFixed(1)],
    hasEscapement:!!(m.escapement.balance&&m.escapement.palletFork&&m.escapement.escapeWheel),
    caseback:m.caseback.material.transmission}); })()
```
Expected: `partCount` ≥ 130, `tracked` ≥ 70, `train` = 3, `sizeMM` ≈ `[31, 6, 27]` (crown sticks out in x), `hasEscapement:true`, `caseback:1`.

- [ ] **Step 3: Commit**

```bash
git add rewire/sample/vernier/js/geometry.js
git commit -m "Vernier: procedural movement — plate, barrel, train, escapement, balance, jewels, screws, crown

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: `movement.js` — renderer, IBL, lights, shadows, escapement, API

**Files:**
- Create: `rewire/sample/vernier/js/movement.js`

**Interfaces:**
- Consumes: `Vernier.tier.TIERS` (Task 3), `Vernier.materials.create` (Task 4), `Vernier.geometry.build` (Task 5), global `THREE`. Optionally a post object from Task 7 via `attachPost`.
- Produces (used by Task 8): `Vernier.movement.VIEWS` and `Vernier.movement.create(canvas, {reduced}) -> M | null` (null when WebGL is unavailable), where
  ```
  M = {
    renderer, scene, camera, movement,          // three objects
    cam: {px,py,pz,tx,ty,tz},                   // tween this; tick() applies it to the camera
    state: {explode:0..1, spin, autoRotate, running, wind},
    VIEWS,                                      // name -> {p:[x,y,z], t:[x,y,z]}
    setTier(name), setView(name), explode(t), wind(v),
    tick(nowMs), sampleFrameTimes(n) -> Promise<number[]>,
    attachPost(post), captureFrame(w,h) -> dataURL, resize(),
    get tier(), get beats()
  }
  ```

- [ ] **Step 1: Write `js/movement.js`**

```js
/* VERNIER — the stage. Renderer, image-based lighting from a procedural room,
   soft shadows over a white void, the escapement running at a real 4Hz, and a
   small API the page drives with GSAP. */
(function () {
  'use strict';
  const V = window.Vernier = window.Vernier || {};
  const T = V.tier;

  const VIEWS = {
    hero:       { p: [ 7,   19,   30  ], t: [ 0,   1.2,  0   ] },
    wind:       { p: [-16,  13,   9   ], t: [-7,   1.6,  0   ] },
    exploded:   { p: [ 3,   30,   36  ], t: [ 0,   9,    0   ] },
    escapement: { p: [ 7.5, 7.5,  13.5], t: [ 3.6, 2.2,  7.2 ] },
    sapphire:   { p: [ 0,   10.5, 9   ], t: [ 0,   3.0,  0   ] },
    screw:      { p: [ 4.8, 5.6, -3.4 ], t: [ 3.4, 3.0, -6.8 ] },
    striping:   { p: [ 6.5, 6.8, -1.2 ], t: [ 6.5, 2.6, -3.4 ] },
    spec:       { p: [ 0,   34,   10  ], t: [ 0,   0,    0   ] }
  };

  function roomScene() {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.MeshBasicMaterial({ color: 0xdedfe3, side: THREE.BackSide })));
    function panel(w, h, x, y, z, ry, rx, color, k) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: color }));
      m.material.color.multiplyScalar(k); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); s.add(m);
    }
    panel(24, 12,   0, 22,   0, 0,           Math.PI / 2, 0xffffff, 1.0);  // top softbox
    panel(10, 18, -22,  8,   0, Math.PI / 2,  0,          0xf4f6ff, 0.8);  // cool left
    panel(10, 18,  22,  8,   0, -Math.PI / 2, 0,          0xfff7ee, 0.6);  // warm right
    panel(30,  6,   0,  4, -26, 0,            0,          0xffffff, 0.5);  // back strip
    return s;
  }
  function aoTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'), gr = g.createRadialGradient(256, 256, 20, 256, 256, 250);
    gr.addColorStop(0, 'rgba(16,17,20,0.28)'); gr.addColorStop(0.45, 'rgba(16,17,20,0.10)'); gr.addColorStop(1, 'rgba(16,17,20,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  }

  function create(canvas, opts) {
    opts = opts || {};
    const reduced = !!opts.reduced;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f7f8);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 200);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(roomScene(), 0.04).texture;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(12, 26, 14); key.castShadow = true;
    key.shadow.camera.left = key.shadow.camera.bottom = -20;
    key.shadow.camera.right = key.shadow.camera.top = 20;
    key.shadow.camera.near = 1; key.shadow.camera.far = 80;
    key.shadow.radius = 4; key.shadow.bias = -0.0004;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe8f0ff, 0.7); fill.position.set(-16, 10, -8); scene.add(fill);
    const rim  = new THREE.DirectionalLight(0xffffff, 0.9); rim.position.set(-6, 8, 22); scene.add(rim);

    /* a shadow catcher plus a soft AO disc: together they sell the white void */
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.62; ground.receiveShadow = true; scene.add(ground);
    const ao = new THREE.Mesh(new THREE.PlaneGeometry(42, 42), new THREE.MeshBasicMaterial({ map: aoTexture(), transparent: true, depthWrite: false }));
    ao.rotation.x = -Math.PI / 2; ao.position.y = -0.61; scene.add(ao);

    const matsHi = V.materials.create({ transmission: true });
    const matsLo = V.materials.create({ transmission: false });
    const M = V.geometry.build(matsHi);
    scene.add(M.group);

    const cam = { px: VIEWS.hero.p[0], py: VIEWS.hero.p[1], pz: VIEWS.hero.p[2], tx: VIEWS.hero.t[0], ty: VIEWS.hero.t[1], tz: VIEWS.hero.t[2] };
    const state = { explode: 0, spin: 0, autoRotate: !reduced, running: !reduced, wind: 0 };
    let post = null, tier = 'medium', beats = 0, sampling = null;
    const t0 = performance.now();

    function setTier(name) {
      tier = name; const s = T.TIERS[name];
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, s.pixelRatio));
      renderer.shadowMap.enabled = s.shadowMap > 0; key.castShadow = s.shadowMap > 0;
      if (s.shadowMap > 0) {
        key.shadow.mapSize.set(s.shadowMap, s.shadowMap);
        if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
      }
      renderer.shadowMap.type = s.softShadows ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      M.caseback.material = s.transmission ? matsHi.sapphire : matsLo.sapphire;
      if (post) post.setEnabled(s.post);
      resize();
    }
    function resize() {
      const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
      if (post) post.resize(renderer.domElement.width, renderer.domElement.height);
      const portrait = r.height > r.width;           // phones: object higher, text sits below it
      M.group.position.set(portrait ? 0 : 3, portrait ? 5 : 0, 0);
    }
    function setView(name) {
      const v = VIEWS[name]; if (!v) return;
      cam.px = v.p[0]; cam.py = v.p[1]; cam.pz = v.p[2]; cam.tx = v.t[0]; cam.ty = v.t[1]; cam.tz = v.t[2];
    }
    function explode(t) { state.explode = t; }
    function wind(v) {
      v = Math.max(0, Math.min(1, v)); state.wind = v;
      M.mainspring.rebuild(v);
      M.ratchet.rotation.y = v * Math.PI * 6;
      M.crown.rotation.x = v * Math.PI * 14;
    }
    function tick(now) {
      const t = (now - t0) / 1000;
      camera.position.set(cam.px, cam.py, cam.pz); camera.lookAt(cam.tx, cam.ty, cam.tz);
      if (state.autoRotate) state.spin += 0.0018;
      M.group.rotation.y = state.spin;
      for (let i = 0; i < M.parts.length; i++) { const p = M.parts[i]; p.obj.position.y = p.base.y + p.dist * state.explode; }
      if (state.running) {
        const phase = Math.PI * 2 * 4 * t;                      // 4Hz, real time
        M.escapement.balance.rotation.y = 2.356 * Math.sin(phase);   // ±135° = 270° amplitude
        M.escapement.palletFork.rotation.y = 0.14 * Math.tanh(6 * Math.sin(phase));
        const steps = Math.floor(t * 8), frac = (t * 8) % 1;     // escape wheel: one tooth per half-swing
        const ease = frac < 0.18 ? (frac / 0.18) * (frac / 0.18) : 1;
        M.escapement.escapeWheel.rotation.y = -((steps + ease) * Math.PI * 2 / 20);
        beats = steps;
        for (let i = 0; i < M.train.length; i++) { const w = M.train[i]; w.obj.rotation.y = -t * w.rpm * Math.PI * 2 / 60; }
      }
      if (post && post.enabled) post.render(camera); else renderer.render(scene, camera);
      if (sampling) {
        const dt = now - sampling.last; sampling.last = now;
        if (sampling.skip > 0) sampling.skip--; else sampling.arr.push(dt);
        if (sampling.arr.length >= sampling.n) { const d = sampling; sampling = null; d.resolve(d.arr); }
      }
    }
    function sampleFrameTimes(n) {
      return new Promise(function (resolve) { sampling = { n: n, arr: [], skip: 5, last: performance.now(), resolve: resolve }; });
    }
    function attachPost(p) { post = p; post.setEnabled(T.TIERS[tier].post); resize(); }
    function captureFrame(w, h) {
      const prev = new THREE.Vector2(); renderer.getSize(prev); const pr = renderer.getPixelRatio();
      renderer.setPixelRatio(1); renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      if (post) post.resize(w, h);
      tick(performance.now());
      const url = canvas.toDataURL('image/jpeg', 0.92);
      renderer.setPixelRatio(pr); renderer.setSize(prev.x, prev.y, false); resize();
      return url;
    }

    new ResizeObserver(resize).observe(canvas.parentElement);
    resize(); setTier('medium');

    return {
      renderer: renderer, scene: scene, camera: camera, movement: M, cam: cam, state: state, VIEWS: VIEWS,
      setTier: setTier, setView: setView, explode: explode, wind: wind, tick: tick,
      sampleFrameTimes: sampleFrameTimes, attachPost: attachPost, captureFrame: captureFrame, resize: resize,
      get tier() { return tier; }, get beats() { return beats; }
    };
  }

  V.movement = { VIEWS: VIEWS, create: create };
})();
```

- [ ] **Step 2: Verify it renders and the escapement runs**

Reload the page and run (the page's `main.js` does not exist yet, so drive it by hand):
```js
(function(){ var M = Vernier.movement.create(document.getElementById('stage'), {reduced:false});
  if(!M) return 'NO WEBGL';
  var t0=performance.now(); for (var i=0;i<30;i++) M.tick(t0 + i*16.7);
  var c=document.getElementById('stage'), g=c.getContext('webgl2')||c.getContext('webgl');
  var px=new Uint8Array(4); g.readPixels(c.width>>1, c.height>>1, 1,1, g.RGBA, g.UNSIGNED_BYTE, px);
  window.__M = M;
  return JSON.stringify({ tier:M.tier, canvas:[c.width,c.height], centrePixel:Array.from(px).slice(0,3),
    balanceAngle:+M.movement.escapement.balance.rotation.y.toFixed(2), beats:M.beats,
    bg:M.scene.background.getHexString(), toneMapping:M.renderer.toneMapping===THREE.ACESFilmicToneMapping,
    env:!!M.scene.environment }); })()
```
Expected: `tier:"medium"`, canvas non-zero, `centrePixel` is NOT `[247,247,248]` (the object is there, not bare background), `balanceAngle` non-zero, `beats` ≥ 3, `bg:"f7f7f8"`, `toneMapping:true`, `env:true`. Then take a screenshot: a silver movement with soft shadow on a white ground.

- [ ] **Step 3: Verify the frame sampler and tier switch**

```js
__M.sampleFrameTimes(30).then(ft=>{ window.__ft=ft; });
// keep ticking so the promise can resolve:
(function(){ var n=0, id=setInterval(function(){ __M.tick(performance.now()); if(++n>60){ clearInterval(id);} },16); return 'ticking'; })()
```
then after a second:
```js
JSON.stringify({ samples: (window.__ft||[]).length, tierBefore: __M.tier, apply: (__M.setTier('low'), __M.tier), transmissionLow: __M.movement.caseback.material.transmission })
```
Expected: `samples:30`, `apply:"low"`, `transmissionLow:0`.

- [ ] **Step 4: Commit**

```bash
git add rewire/sample/vernier/js/movement.js
git commit -m "Vernier: renderer with ACES + IBL + soft shadows, live 4Hz escapement, view and tier API

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: `post.js` — bloom, vignette, depth of field

**Files:**
- Create: `rewire/sample/vernier/js/post.js`

**Interfaces:**
- Consumes: `THREE`, a renderer/scene/camera from Task 6.
- Produces (used by Tasks 6, 8): `Vernier.post.create(renderer, scene, camera) -> { enabled:boolean, flags, resize(w,h), render(camera), setEnabled({bloom,vignette,dof}), setFocus(distance, range) }`. DOF silently stays off on WebGL1 (no depth texture).

- [ ] **Step 1: Write `js/post.js`**

```js
/* VERNIER — post pass. The bundled three.min.js has no EffectComposer, so this
   is a small hand-rolled chain: scene → (bright → blur ⇒ bloom), (half → blur ⇒
   DOF source), composite with vignette. Scene is rendered to an sRGB target and
   the composite writes it through untouched, so tone mapping happens exactly once. */
(function () {
  'use strict';
  const V = window.Vernier = window.Vernier || {};

  const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const COPY = 'uniform sampler2D tex; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tex, vUv); }';
  const BRIGHT = [
    'uniform sampler2D tex; uniform float thr; varying vec2 vUv;',
    'void main(){ vec4 c = texture2D(tex, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));',
    '  gl_FragColor = vec4(c.rgb * smoothstep(thr, thr + 0.15, l), 1.0); }'].join('\n');
  const BLUR = [
    'uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;',
    'void main(){ float w[5]; w[0]=0.227027; w[1]=0.1945946; w[2]=0.1216216; w[3]=0.054054; w[4]=0.016216;',
    '  vec4 s = texture2D(tex, vUv) * w[0];',
    '  for (int i = 1; i < 5; i++){ vec2 o = dir * float(i); s += texture2D(tex, vUv + o) * w[i]; s += texture2D(tex, vUv - o) * w[i]; }',
    '  gl_FragColor = s; }'].join('\n');
  const COMP = [
    'uniform sampler2D tScene, tBloom, tDof, tDepth;',
    'uniform float uBloomOn, uBloom, uVignetteOn, uVignette, uDofOn, uNear, uFar, uFocus, uRange;',
    'varying vec2 vUv;',
    'float lin(float d){ float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }',
    'void main(){',
    '  vec4 c = texture2D(tScene, vUv);',
    '  if (uDofOn > 0.5){ float z = lin(texture2D(tDepth, vUv).x); float coc = clamp(abs(z - uFocus) / uRange, 0.0, 1.0);',
    '    c = mix(c, texture2D(tDof, vUv), coc * 0.85); }',
    '  if (uBloomOn > 0.5){ c.rgb += texture2D(tBloom, vUv).rgb * uBloom; }',
    '  if (uVignetteOn > 0.5){ float v = smoothstep(1.3, 0.5, distance(vUv, vec2(0.5))); c.rgb = mix(c.rgb, c.rgb * v, uVignette); }',
    '  gl_FragColor = c; }'].join('\n');

  function create(renderer, scene, camera) {
    const isGL2 = renderer.capabilities.isWebGL2;
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    const quadScene = new THREE.Scene(); quadScene.add(quad);
    function mat(frag, uniforms) {
      return new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms: uniforms, depthTest: false, depthWrite: false, toneMapped: false });
    }
    const mCopy = mat(COPY, { tex: { value: null } });
    const mBright = mat(BRIGHT, { tex: { value: null }, thr: { value: 0.86 } });
    const mBlur = mat(BLUR, { tex: { value: null }, dir: { value: new THREE.Vector2() } });
    const mComp = mat(COMP, {
      tScene: { value: null }, tBloom: { value: null }, tDof: { value: null }, tDepth: { value: null },
      uBloomOn: { value: 0 }, uBloom: { value: 0.32 }, uVignetteOn: { value: 0 }, uVignette: { value: 0.22 },
      uDofOn: { value: 0 }, uNear: { value: camera.near }, uFar: { value: camera.far }, uFocus: { value: 24 }, uRange: { value: 14 }
    });
    let rtScene, rtHalf, rtA, rtB, rtD, rtD2;
    const flags = { bloom: false, vignette: false, dof: false };
    const api = { enabled: false, flags: flags, resize: resize, render: render, setEnabled: setEnabled, setFocus: setFocus };

    function make(w, h) {
      return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, stencilBuffer: false });
    }
    function resize(W, H) {
      const w = W | 0, h = H | 0;
      [rtScene, rtHalf, rtA, rtB, rtD, rtD2].forEach(function (r) { if (r) r.dispose(); });
      rtScene = make(w, h); rtScene.texture.encoding = THREE.sRGBEncoding;
      if (isGL2) { rtScene.depthTexture = new THREE.DepthTexture(w, h); rtScene.depthTexture.type = THREE.UnsignedIntType; }
      rtHalf = make(w >> 1, h >> 1); rtA = make(w >> 2, h >> 2); rtB = make(w >> 2, h >> 2); rtD = make(w >> 1, h >> 1); rtD2 = make(w >> 1, h >> 1);
    }
    function setEnabled(f) {
      flags.bloom = !!f.bloom; flags.vignette = !!f.vignette; flags.dof = !!f.dof && isGL2;
      api.enabled = flags.bloom || flags.vignette || flags.dof;
    }
    function setFocus(dist, range) { mComp.uniforms.uFocus.value = dist; mComp.uniforms.uRange.value = range; }
    function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(quadScene, quadCam); }
    function blur(src, a, b, px) {
      mBlur.uniforms.tex.value = src.texture; mBlur.uniforms.dir.value.set(px / a.width, 0); pass(mBlur, a);
      mBlur.uniforms.tex.value = a.texture; mBlur.uniforms.dir.value.set(0, px / a.height); pass(mBlur, b);
      return b;
    }
    function render(cam) {
      renderer.setRenderTarget(rtScene); renderer.render(scene, cam);
      let bloomTex = null, dofTex = null;
      if (flags.bloom) { mBright.uniforms.tex.value = rtScene.texture; pass(mBright, rtA); bloomTex = blur(rtA, rtB, rtA, 1.6).texture; }
      if (flags.dof) { mCopy.uniforms.tex.value = rtScene.texture; pass(mCopy, rtHalf); dofTex = blur(rtHalf, rtD, rtD2, 1.4).texture; }
      const u = mComp.uniforms;
      u.tScene.value = rtScene.texture; u.tBloom.value = bloomTex; u.tDof.value = dofTex; u.tDepth.value = rtScene.depthTexture || null;
      u.uBloomOn.value = flags.bloom ? 1 : 0; u.uVignetteOn.value = flags.vignette ? 1 : 0; u.uDofOn.value = (flags.dof && dofTex) ? 1 : 0;
      u.uNear.value = cam.near; u.uFar.value = cam.far;
      pass(mComp, null);
    }
    resize(renderer.domElement.width, renderer.domElement.height);
    return api;
  }

  V.post = { create: create };
})();
```

- [ ] **Step 2: Verify the pass produces an image and can be toggled**

Reload, then:
```js
(function(){ var M = Vernier.movement.create(document.getElementById('stage'), {reduced:false});
  var post = Vernier.post.create(M.renderer, M.scene, M.camera); M.attachPost(post);
  M.setTier('high'); M.tick(performance.now());
  var c=document.getElementById('stage'), g=c.getContext('webgl2')||c.getContext('webgl');
  var px=new Uint8Array(4); g.readPixels(c.width>>1, c.height>>1, 1,1, g.RGBA, g.UNSIGNED_BYTE, px);
  var on = post.enabled;
  M.setTier('low'); var off = post.enabled;
  window.__M=M; window.__post=post;
  return JSON.stringify({ webgl2: M.renderer.capabilities.isWebGL2, highEnabled:on, lowEnabled:off, flagsAtLow:post.flags, centrePixel:Array.from(px).slice(0,3) }); })()
```
Expected: `highEnabled:true`, `lowEnabled:false`, `flagsAtLow:{bloom:false,vignette:false,dof:false}`, `centrePixel` not `[0,0,0]` and not `[247,247,248]`. Screenshot at high tier: the same movement, with soft highlights on the polished parts and slightly darker corners. No WebGL errors in the console.

- [ ] **Step 3: Commit**

```bash
git add rewire/sample/vernier/js/post.js
git commit -m "Vernier: hand-rolled post pass — bloom, vignette, depth of field, tier-toggled

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: `main.js` — scroll story, crown, tiers, reduced motion, fallback

**Files:**
- Create: `rewire/sample/vernier/js/main.js`

**Interfaces:**
- Consumes: everything above; DOM ids from Task 1.
- Produces: `window.__captureFallback(w,h) -> dataURL` used once in Task 9.

- [ ] **Step 1: Write `js/main.js`**

```js
/* VERNIER — page wiring. The only file that knows about the DOM. */
(function () {
  'use strict';
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const V = window.Vernier, T = V.tier;
  gsap.registerPlugin(ScrollTrigger);

  /* smooth scroll — off under reduced motion */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const el = $(a.getAttribute('href')); if (!el) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(el, { offset: -10 }) : el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));

  function fmtCount(n, sep) { return sep ? Math.round(n).toLocaleString() : String(Math.round(n)); }

  /* ── stage, or the static fallback ─────────────────── */
  const canvas = $('#stage');
  const M = V.movement.create(canvas, { reduced: reduced });
  if (!M) {
    document.body.classList.add('no-webgl');
    $('#fallback').hidden = false;
    $$('[data-count]').forEach(el => { el.textContent = fmtCount(+el.dataset.count, el.dataset.sep === '1'); });
    return;
  }
  const post = V.post.create(M.renderer, M.scene, M.camera);
  M.attachPost(post);
  gsap.ticker.add(() => M.tick(performance.now()));

  /* adaptive tier: measure once, re-check once, only ever step down */
  M.sampleFrameTimes(60).then(ft => M.setTier(T.chooseTier(ft)));
  ScrollTrigger.create({ trigger: '#exploded', start: 'top 80%', once: true, onEnter: () => {
    M.sampleFrameTimes(60).then(ft => { if (T.rank(T.chooseTier(ft)) < T.rank(M.tier)) M.setTier(T.stepDown(M.tier)); });
  } });

  /* ── camera story ──────────────────────────────────── */
  function focusFor(name) {
    const v = V.movement.VIEWS[name];
    const d = Math.hypot(v.p[0] - v.t[0], v.p[1] - v.t[1], v.p[2] - v.t[2]);
    post.setFocus(d, Math.max(6, d * 0.45));
  }
  const order = ['hero', 'wind', 'exploded', 'escapement', 'sapphire', 'screw', 'striping', 'spec'];
  const trig = {
    hero: '#hero', wind: '#wind', exploded: '#exploded', escapement: '#escapement',
    sapphire: '#materials .mat[data-view=sapphire]', screw: '#materials .mat[data-view=screw]',
    striping: '#materials .mat[data-view=striping]', spec: '#tolerances'
  };
  M.setView('hero'); focusFor('hero');
  order.forEach((name, i) => {
    if (i === 0) return;
    const v = V.movement.VIEWS[name], prev = order[i - 1];
    if (reduced) {
      ScrollTrigger.create({ trigger: trig[name], start: 'top 60%',
        onEnter: () => { M.setView(name); focusFor(name); }, onLeaveBack: () => { M.setView(prev); focusFor(prev); } });
      return;
    }
    gsap.to(M.cam, { px: v.p[0], py: v.p[1], pz: v.p[2], tx: v.t[0], ty: v.t[1], tz: v.t[2], ease: 'none',
      scrollTrigger: { trigger: trig[name], start: 'top 90%', end: 'top 30%', scrub: 0.6,
        onEnter: () => focusFor(name), onLeaveBack: () => focusFor(prev) } });
  });
  ScrollTrigger.create({ trigger: '#wind', start: 'top 85%',
    onEnter: () => { M.state.autoRotate = false; }, onLeaveBack: () => { M.state.autoRotate = !reduced; } });

  /* ── exploded view ─────────────────────────────────── */
  if (reduced) {
    ScrollTrigger.create({ trigger: '#exploded', start: 'top 50%', end: 'bottom 60%',
      onEnter: () => M.explode(1), onEnterBack: () => M.explode(1), onLeave: () => M.explode(0), onLeaveBack: () => M.explode(0) });
  } else {
    gsap.to(M.state, { explode: 1, ease: 'none', scrollTrigger: { trigger: '#exploded', start: 'top 40%', end: 'bottom 90%', scrub: 0.8 } });
  }

  /* ── crown: drag or arrow keys ─────────────────────── */
  const crown = $('#crown'), grip = $('.crown__grip'), reserveH = $('#reserveH'), tensionPct = $('#tensionPct');
  let windV = 0, dragX = null;
  function setWind(v) {
    windV = Math.max(0, Math.min(1, v)); M.wind(windV);
    grip.style.transform = 'translateX(' + (windV * (crown.clientWidth - grip.clientWidth - 12)) + 'px)';
    crown.setAttribute('aria-valuenow', Math.round(windV * 100));
    reserveH.textContent = Math.round(52 * windV); tensionPct.textContent = Math.round(100 * windV);
  }
  crown.addEventListener('pointerdown', e => { dragX = e.clientX; crown.setPointerCapture(e.pointerId); });
  crown.addEventListener('pointermove', e => { if (dragX === null) return; setWind(windV + (e.clientX - dragX) / 520); dragX = e.clientX; });
  crown.addEventListener('pointerup', () => { dragX = null; });
  crown.addEventListener('pointercancel', () => { dragX = null; });
  crown.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setWind(windV + 0.04); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setWind(windV - 0.04); e.preventDefault(); }
  });
  setWind(0);

  /* ── readouts ──────────────────────────────────────── */
  const beats = $('#beats');
  setInterval(() => { beats.textContent = M.beats.toLocaleString(); }, 250);
  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count, sep = el.dataset.sep === '1';
    if (reduced) { el.textContent = fmtCount(target, sep); return; }
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => {
      const o = { v: 0 };
      gsap.to(o, { v: target, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = fmtCount(o.v, sep); } });
    } });
  });

  /* build-time hook for the fallback image */
  window.__captureFallback = function (w, h) {
    const prev = M.tier; M.setTier('high'); M.setView('hero'); M.state.spin = 0.35;
    const url = M.captureFrame(w || 1600, h || 1000);
    M.setTier(prev); return url;
  };
})();
```

- [ ] **Step 2: Verify the full page in the Browser pane (desktop)**

Reload `http://127.0.0.1:8123/rewire/sample/vernier/?v=1`, wait 3 s, then:
```js
(function(){ return JSON.stringify({
  triggers: ScrollTrigger.getAll().length, lenis: !!window.Lenis, noWebgl: document.body.classList.contains('no-webgl'),
  beatsText: document.getElementById('beats').textContent, crownAria: document.getElementById('crown').getAttribute('aria-valuenow') }); })()
```
Expected: `triggers` ≥ 12, `noWebgl:false`, `beatsText` a number ≥ 8 (2+ seconds at 8 steps/s), `crownAria:"0"`.

Then exercise the crown with the keyboard and confirm state moves:
```js
(function(){ var c=document.getElementById('crown'); c.focus();
  for (var i=0;i<10;i++) c.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  return JSON.stringify({ aria:c.getAttribute('aria-valuenow'), reserve:document.getElementById('reserveH').textContent }); })()
```
Expected: `aria:"40"`, `reserve:"21"`.

Scroll to `#exploded` with a real scroll action (the `computer` tool, not JS) and screenshot: parts separated vertically. Scroll to `#escapement` and screenshot: macro of the balance. Check the console: no `THREE.WebGLProgram` shader errors.

- [ ] **Step 3: Verify mobile and reduced motion**

Set the Browser pane to the mobile preset, reload, screenshot the hero: object in the upper half, title legible over the scrim below it, no horizontal overflow (`document.documentElement.scrollWidth <= innerWidth`).

Reduced motion cannot be emulated in the pane; verify the branch by forcing it:
```js
matchMedia = (q) => ({ matches: /reduced-motion/.test(q), addEventListener(){} });
```
then reload and confirm `window.Lenis` glue is not active (`ScrollTrigger.getAll().length` is smaller and `M.state.running` is false via `__captureFallback` being defined but the balance angle unchanged across two `tick` calls). Restore with a normal reload.

- [ ] **Step 4: Commit**

```bash
git add rewire/sample/vernier/js/main.js
git commit -m "Vernier: scroll story, crown winding with keyboard support, adaptive tiers, reduced-motion path

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Fallback image, grid tile, link it from the demo pages, version the assets

**Files:**
- Create: `rewire/sample/vernier/assets/vernier-fallback.jpg`
- Create: `rewire/sample/assets/vernier-tile.jpg`
- Modify: `rewire/sample/index.html` (add a card first in `.rw-samples`)
- Modify: `rewire/landing/index.html` (add a card first in `.rw-samples`)
- Modify: `rewire/sample/vernier/index.html` (content-hash query on css/js)

- [ ] **Step 1: Start a tiny receiver that writes a POSTed data URL to disk**

Create `/private/tmp/claude-501/-Users-robbrown-CodingProjects-Apps-neurotrocity-website/15ba7017-7e88-4502-8d98-00112103356b/scratchpad/save_receiver.py`:
```python
from http.server import BaseHTTPRequestHandler, HTTPServer
import base64, sys
OUT = sys.argv[1]
class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', '*')
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0)); data = self.rfile.read(n).decode()
        open(OUT, 'wb').write(base64.b64decode(data.split(',', 1)[1]))
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b'saved')
    def log_message(self, *a): pass
HTTPServer(('127.0.0.1', 8124), H).serve_forever()
```
Run it in the background:
```bash
cd /Users/robbrown/CodingProjects/Apps/neurotrocity-website
nohup python3 /private/tmp/claude-501/-Users-robbrown-CodingProjects-Apps-neurotrocity-website/15ba7017-7e88-4502-8d98-00112103356b/scratchpad/save_receiver.py "$PWD/rewire/sample/vernier/assets/vernier-fallback.jpg" >/dev/null 2>&1 &
```

- [ ] **Step 2: Capture from the real render**

In the Browser pane on the vernier page (desktop size), run:
```js
fetch('http://127.0.0.1:8124/', { method:'POST', body: window.__captureFallback(1600, 1000) }).then(r => r.text())
```
Expected: `"saved"`. Then:
```bash
python3 -c "from PIL import Image; im=Image.open('rewire/sample/vernier/assets/vernier-fallback.jpg'); print(im.size, im.mode)"
pkill -f save_receiver.py
```
Expected: `(1600, 1000) RGB`. View the file: the assembled movement on the white void.

- [ ] **Step 3: Make the 1200×750 tile**

```bash
python3 - <<'EOF'
from PIL import Image
im = Image.open('rewire/sample/vernier/assets/vernier-fallback.jpg')   # 1600x1000 is already 1.6:1, same as the tiles
im.resize((1200, 750), Image.LANCZOS).save('rewire/sample/assets/vernier-tile.jpg', quality=88, optimize=True)
print(Image.open('rewire/sample/assets/vernier-tile.jpg').size)
EOF
```
Expected: `(1200, 750)`.

- [ ] **Step 4: Add the card to both grids, first**

Insert this block immediately after the opening `<div class="rw-samples"` tag in **both** `rewire/sample/index.html` and `rewire/landing/index.html` (the landing grid has a `style="margin-top:30px"` on that div; match whichever opening tag exists):
```html
        <a class="rw-sample" href="/rewire/sample/vernier/">
          <div class="rw-sample-img">
            <img src="/rewire/sample/assets/vernier-tile.jpg" alt="Vernier Calibre 01 demonstration website" loading="lazy">
            <span class="rw-sample-live">Live demo</span>
          </div>
          <div class="rw-sample-body">
            <div class="rw-sample-kick">Demo model &middot; De-identified</div>
            <div class="t">Vernier</div>
            <p>A mechanical movement rendered live in your browser. Wind it, scroll it apart into
              a hundred and forty pieces, and watch the escapement run in real time.</p>
            <span class="rw-sample-go">Open the demo &rarr;</span>
          </div>
        </a>
```
Use Python to do the insert so it is exact:
```bash
python3 - <<'EOF'
import re
CARD = '''        <a class="rw-sample" href="/rewire/sample/vernier/">
          <div class="rw-sample-img">
            <img src="/rewire/sample/assets/vernier-tile.jpg" alt="Vernier Calibre 01 demonstration website" loading="lazy">
            <span class="rw-sample-live">Live demo</span>
          </div>
          <div class="rw-sample-body">
            <div class="rw-sample-kick">Demo model &middot; De-identified</div>
            <div class="t">Vernier</div>
            <p>A mechanical movement rendered live in your browser. Wind it, scroll it apart into
              a hundred and forty pieces, and watch the escapement run in real time.</p>
            <span class="rw-sample-go">Open the demo &rarr;</span>
          </div>
        </a>
'''
for f in ['rewire/sample/index.html', 'rewire/landing/index.html']:
    s = open(f).read()
    if '/rewire/sample/vernier/' in s: print('already', f); continue
    m = re.search(r'<div class="rw-samples"[^>]*>\n', s); assert m, f
    s = s[:m.end()] + CARD + s[m.end():]
    open(f, 'w').write(s); print('inserted', f)
EOF
grep -c 'sample/vernier' rewire/sample/index.html rewire/landing/index.html
```
Expected: `inserted` twice, then `1` and `1`.

- [ ] **Step 5: Content-hash the stylesheet and script URLs**

```bash
python3 - <<'EOF'
import hashlib, re
d = 'rewire/sample/vernier/'
s = open(d + 'index.html').read()
def h(p): return hashlib.md5(open(d + p, 'rb').read()).hexdigest()[:8]
s = re.sub(r'href="css/style\.css(\?v=\w+)?"', 'href="css/style.css?v=%s"' % h('css/style.css'), s)
for js in ['profile', 'tier', 'materials', 'geometry', 'post', 'movement', 'main']:
    s = re.sub(r'src="js/%s\.js(\?v=\w+)?"' % js, 'src="js/%s.js?v=%s"' % (js, h('js/%s.js' % js)), s)
open(d + 'index.html', 'w').write(s)
print(re.findall(r'(?:href|src)="(?:css|js)/[^"]*\?v=\w+"', s))
EOF
```
Expected: eight versioned URLs printed (1 css + 7 js).

- [ ] **Step 6: Commit**

```bash
git add rewire/sample/vernier rewire/sample/assets/vernier-tile.jpg rewire/sample/index.html rewire/landing/index.html
git commit -m "Vernier: captured fallback image, grid tile, linked first from both demo grids, hashed asset URLs

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Verification against the definition of done, then ship

**Files:** none new. This task is the gate.

- [ ] **Step 1: Unit tests and detector**

```bash
cd /Users/robbrown/CodingProjects/Apps/neurotrocity-website
node --test rewire/sample/vernier/tests/
node /Users/robbrown/.claude/plugins/cache/impeccable/impeccable/3.9.1/skills/impeccable/scripts/detect.mjs --json rewire/sample/vernier/index.html; echo "exit=$?"
```
Expected: `# pass 12 / # fail 0`; detector `[]`, `exit=0`. If the detector reports `em-dash-overuse`, count prose em-dashes by hand — the page copy is written with at most two; placeholders and ranges are false positives, but fix any genuine prose overuse.

- [ ] **Step 2: Contrast of every text pairing**

```bash
python3 - <<'EOF'
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
for n,fg,bg in [("ink on void","#101114","#F7F7F8"),("ink-2 on void","#4A4C54","#F7F7F8"),("muted on void","#6E7078","#F7F7F8"),
                ("blued on void","#2B4C8C","#F7F7F8"),("white on blued","#FFFFFF","#2B4C8C"),("white on ink","#FFFFFF","#101114"),
                ("ink on void-2","#101114","#EDEDEF"),("muted on void-2","#6E7078","#EDEDEF")]:
    r=cr(fg,bg); print(f"{n:18} {r:5.2f}:1  {'PASS' if r>=4.5 else 'FAIL'}")
EOF
```
Expected: every line `PASS`. `muted on void` is the tightest; it must be ≥ 4.5:1 (it is ≈ 4.9:1). If any line fails, darken that token and re-run.

- [ ] **Step 3: Weight budget**

```bash
cd /Users/robbrown/CodingProjects/Apps/neurotrocity-website/rewire/sample/vernier
local=$(cat index.html css/style.css js/*.js js/vendor/*.js assets/vernier-fallback.jpg | wc -c)
fonts=$(curl -s -A "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;700&family=Fragment+Mono&display=swap" \
  | grep -oE 'https://fonts.gstatic.com[^)]+' | sort -u | head -8 \
  | while read u; do curl -sI "$u" | grep -i content-length | awk '{print $2}' | tr -d '\r'; done | awk '{s+=$1} END{print s+0}')
echo "local=$local fonts=$fonts total=$((local+fonts)) bytes  ($(( (local+fonts)/1024 )) KB)"
```
Expected: total under 1,048,576 bytes. three.min.js is ~606KB of it; if the total is over, the first lever is `assets/vernier-fallback.jpg` quality (re-save at 0.85), never the vendored libraries.

- [ ] **Step 4: Frame rate on desktop and on the iOS Simulator**

Desktop, in the Browser pane on the live-served page:
```js
(function(){ return new Promise(function(res){ var n=0,t0=performance.now(); function f(){ if(++n<120) requestAnimationFrame(f); else res(JSON.stringify({fps: Math.round(120000/(performance.now()-t0)), tier: Vernier && document.body.classList.contains('no-webgl') ? 'fallback' : 'webgl'})); } requestAnimationFrame(f); }); })()
```
Expected: `fps` ≥ 55.

iOS Simulator (iPhone 17 Pro Max is booted from earlier work; boot it with `xcrun simctl boot DEB8089D-C496-4D49-87C4-1DFA179DE63C` if not): serve on `0.0.0.0:8123`, `open_url` `http://127.0.0.1:8123/rewire/sample/vernier/`, screenshot the hero, then swipe up twice and screenshot the exploded view. Expected: object renders, text legible over the scrim, no blank canvas. The tier on a simulator is not representative of a real phone's GPU, so this checks correctness, not the ≥45fps target; note that in the ship summary.

- [ ] **Step 5: Ship, and confirm the deploy actually happened**

```bash
cd /Users/robbrown/CodingProjects/Apps/neurotrocity-website
git pull --rebase origin master
git push origin master
for i in $(seq 1 12); do sleep 20
  live=$(curl -s -H 'Cache-Control: no-cache' "https://neurotrocity.com/rewire/sample/vernier/?cb=$RANDOM" | grep -c 'Calibre')
  run=$(gh run list -L 1 --json status,conclusion --jq '.[0]|"\(.status)/\(.conclusion // "-")"')
  echo "t=$((i*20))s run:$run live=$live"; [ "$live" -ge 1 ] && break
  case "$run" in *failure*) gh api -X POST repos/4032332/neurotrocity-website/pages/builds >/dev/null; echo "re-dispatched";; esac
done
for u in /rewire/sample/vernier/ /rewire/sample/vernier/js/movement.js /rewire/sample/assets/vernier-tile.jpg /rewire/sample/ /rewire/landing/; do
  printf "%-42s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' https://neurotrocity.com$u)"
done
```
Expected: `live=1` within a few minutes, then five `200`s. Pages deploys on this repo have failed with GitHub-side internal errors before; a build that sits in `building` or reports `failure` is re-dispatched, not waited on.

- [ ] **Step 6: Final check on the live URL in the iOS Simulator**

`open_url` `https://neurotrocity.com/rewire/sample/vernier/` and screenshot. Expected: identical to the local check in Step 4. Done.
