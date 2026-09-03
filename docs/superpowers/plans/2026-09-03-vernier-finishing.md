# VERNIER Finishing Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Take the shipped VERNIER demo (`rewire/sample/vernier/`) from "crude and low-contrast" to a dark-stage, anti-aliased, finished movement, per spec §12.

**Architecture:** Same modules. `post.js` gains MSAA and a depth pass; `geometry.js` gains tessellation, anglage via material groups, turned pillars, countersinks; `materials.js` gains visible striping/perlage maps; `movement.js` flips the stage; `css/style.css` flips the tokens; `main.js` drives caseback visibility on the master timeline.

**Tech Stack:** three.js r128 (`WebGLMultisampleRenderTarget`, `MeshDepthMaterial`, `ExtrudeGeometry` groups), GSAP 3.13, no build step.

## Global Constraints
- three.js is r128 — `outputEncoding = sRGBEncoding`; no post-r152 names.
- Tokens exactly as spec §12. Every text pairing ≥ 4.5:1 (verified by script).
- Metals keep their authored colours; the ground goes dark, the metals do not go lighter.
- Asset URLs carry content hashes; recompute after every file change (script in Task 1).
- After every task: `node --check` on changed JS, `node --test` on the two test files (12 pass), commit with the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer.
- Do the work yourself in the working tree; do not delegate to sub-agents or background jobs.

## Hash script (run after any css/js change)
```bash
python3 - <<'EOF'
import hashlib, re
d='rewire/sample/vernier/'
s=open(d+'index.html').read()
def h(p): return hashlib.md5(open(d+p,'rb').read()).hexdigest()[:8]
s=re.sub(r'href="css/style\.css(\?v=\w+)?"','href="css/style.css?v=%s"'%h('css/style.css'),s)
for js in ['profile','tier','materials','geometry','post','movement','main']:
    s=re.sub(r'src="js/%s\.js(\?v=\w+)?"'%js,'src="js/%s.js?v=%s"'%(js,h('js/%s.js'%js)),s)
open(d+'index.html','w').write(s); print(re.findall(r'(?:href|src)="(?:css|js)/[^"]*\?v=\w+"',s))
EOF
```

---

### Task 1: Dark stage — tokens, stage ground, exposure

**Files:** Modify `css/style.css`, `js/movement.js`, `index.html` (hashes).

- [ ] **Step 1: Tokens.** In `css/style.css` `:root`, replace the six colour tokens and add one:
```css
  --void:   #1B1D21;
  --void-2: #24272C;
  --ink:    #F3F4F6;
  --ink-2:  #B9BDC6;
  --muted:  #8F949E;
  --blued:  #7FA3E8;      /* text and links */
  --blued-cta: #3D63B3;   /* button fill; white on it is 5.78:1 */
  --line:   rgba(243,244,246,.14);
```
Then: `.btn{ background:var(--void-2); }` (was `#fff`), `.btn:hover{ border-color:var(--ink); }` unchanged, `.btn--ink{ background:var(--ink); color:#141619; border-color:var(--ink); }`, `.btn--blued{ background:var(--blued-cta); border-color:var(--blued-cta); }`, `.btn--blued:hover{ background:#325396; }`, `::selection{ background:var(--blued-cta); }`, `.skip{ background:var(--ink); color:#141619; }`, `.scrim` gradient stops become `rgba(27,29,33,0) 40%, rgba(27,29,33,.86) 68%, var(--void) 100%`, `.crown{ background:var(--void-2); }`, `.crown__grip{ background:var(--ink); background-image:repeating-linear-gradient(90deg, rgba(20,22,25,.35) 0 2px, transparent 2px 6px); }`, `.enq{ background:var(--void-2); }`, `.enq p{ color:var(--ink); }`. Leave everything else.

- [ ] **Step 2: Stage.** In `js/movement.js`: `scene.background = new THREE.Color(0x1b1d21);`, `renderer.toneMappingExposure = 0.95;`, key light intensity `2.4`. Replace the ground pair (ShadowMaterial plane + AO disc) with a light pool plus a stronger shadow catcher:
```js
    /* a soft light pool under the object: on a dark ground the movement needs
       something to sit on, and shadows need something lighter to fall onto */
    const pool = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshBasicMaterial({ map: poolTexture(), transparent: true, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = -0.63; scene.add(pool);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.42 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.62; ground.receiveShadow = true; scene.add(ground);
```
and replace `aoTexture()` with:
```js
  function poolTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'), gr = g.createRadialGradient(256, 256, 40, 256, 256, 256);
    gr.addColorStop(0, 'rgba(120,124,132,0.55)'); gr.addColorStop(0.55, 'rgba(120,124,132,0.18)'); gr.addColorStop(1, 'rgba(120,124,132,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  }
```
- [ ] **Step 3: Verify.** Contrast script (all pairings PASS): ink/ink-2/muted/blued on void and void-2; white on blued-cta. `node --check js/movement.js`. Rehash. Commit: `Vernier: dark stage — charcoal ground, inverted tokens, light pool`.

---

### Task 2: Rendering fidelity — MSAA, depth pass, tessellation, caseback visibility

**Files:** Modify `js/post.js`, `js/geometry.js`, `js/main.js`, `index.html`.

- [ ] **Step 1: MSAA + depth pass in `post.js`.** Replace `make`/`resize`/`render` so the scene target is multisampled on WebGL2 and DOF depth comes from a separate half-res depth pass:
```js
    const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    function make(w, h, ms) {
      const o = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, stencilBuffer: false };
      if (ms && isGL2) { const t = new THREE.WebGLMultisampleRenderTarget(Math.max(2, w), Math.max(2, h), o); t.samples = 4; return t; }
      return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), o);
    }
    let rtDepth;
    function resize(W, H) {
      const w = W | 0, h = H | 0; if (w === curW && h === curH) return; curW = w; curH = h;
      [rtScene, rtHalf, rtA, rtB, rtD, rtD2, rtDepth].forEach(function (r) { if (r) r.dispose(); });
      rtScene = make(w, h, true); rtScene.texture.encoding = THREE.sRGBEncoding;
      rtDepth = make(w >> 1, h >> 1, false);
      rtHalf = make(w >> 1, h >> 1); rtA = make(w >> 2, h >> 2); rtB = make(w >> 2, h >> 2); rtD = make(w >> 1, h >> 1); rtD2 = make(w >> 1, h >> 1);
    }
```
In `render(cam)`, after the scene render and only `if (flags.dof)`: `scene.overrideMaterial = depthMat; renderer.setRenderTarget(rtDepth); renderer.render(scene, cam); scene.overrideMaterial = null;` and pass `u.tDepth.value = rtDepth.texture`. In the composite shader replace `float z = lin(texture2D(tDepth, vUv).x);` with `float z = lin(unpackRGBAToDepth(texture2D(tDepth, vUv)));` and add `#include <packing>` as the first line of the COMP fragment source. `setEnabled` keeps `flags.dof = !!f.dof && isGL2`. Remove the `DepthTexture` usage entirely.
- [ ] **Step 2: Tessellation in `geometry.js`.** `samplesPerTooth: opts.samples || 16`; `bevelSegments: 4, curveSegments: 16`; `cyl(..., seg || 64)`; `TubeGeometry(curve, Math.min(600, pts.length), radius, 10, false)`; `LatheGeometry(pts, 48)`; mainplate `cyl(13, 1.2, mat.plate, 128)`; balance rim `TorusGeometry(3.2, 0.22, 16, 96)`; jewel ring `TorusGeometry(r + 0.12, 0.085, 12, 40)`.
- [ ] **Step 3: Caseback only in the sapphire view.** `geometry.js`: after creating the caseback set `caseback.visible = false;`. `main.js`: in `buildMaster()` after the camera loop, fade it in over the sapphire window and out over the screw window: 
```js
    const cb = M.movement.caseback, sT = topOf(trig.sapphire), scT = topOf(trig.screw);
    cb.material.transparent = true;
    master.to({}, { duration: 0.0005, onStart: () => { cb.visible = true; }, onReverseComplete: () => { cb.visible = false; } }, f(sT - 0.9 * VH));
    master.fromTo(cb.material, { opacity: 0 }, { opacity: 1, duration: Math.max(0.0005, f(sT - 0.3 * VH) - f(sT - 0.9 * VH)) }, f(sT - 0.9 * VH));
    master.to(cb.material, { opacity: 0, duration: Math.max(0.0005, f(scT - 0.3 * VH) - f(scT - 0.9 * VH)), onComplete: () => { cb.visible = false; }, onReverseComplete: () => { cb.visible = true; } }, f(scT - 0.9 * VH));
```
Reduced branch: sapphire `.mat` trigger `onEnter/onEnterBack: cb.visible = true, opacity 1`; `onLeave/onLeaveBack: cb.visible = false`. `captureFrame` unaffected (hero has it hidden — good).
- [ ] **Step 4: Verify.** `node --check` on the three files; `node --test` 12 pass; rehash; commit: `Vernier: 4x MSAA with a depth pass, doubled tessellation, caseback only in its own view`.

---

### Task 3: Finishing detail — anglage, striping, perlage, turned parts

**Files:** Modify `js/geometry.js`, `js/materials.js`, `index.html`.

- [ ] **Step 1: Materials.** In `materials.js` add two colour+bump canvases and use them:
```js
  function genevaColor(size) {  // visible bands: 9 stripes, light/dark alternating with a soft edge
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
    const bands = 9, w = size / bands;
    for (let i = 0; i < bands; i++) { const gr = g.createLinearGradient(i * w, 0, (i + 1) * w, 0);
      gr.addColorStop(0, '#c9ccd2'); gr.addColorStop(0.5, '#e9ebef'); gr.addColorStop(1, '#c9ccd2'); g.fillStyle = gr; g.fillRect(i * w, 0, w + 1, size); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 1.6); t.center.set(0.5, 0.5); t.rotation = Math.PI / 7; return t;
  }
  function perlage(size) {      // overlapping circular graining
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
    g.fillStyle = '#d7dadf'; g.fillRect(0, 0, size, size); const r = size / 9;
    for (let y = 0; y < size + r; y += r * 0.78) for (let x = 0; x < size + r; x += r * 0.78) {
      const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, 'rgba(236,238,242,0.9)'); gr.addColorStop(1, 'rgba(180,184,190,0.0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
  }
```
Then `plate: new THREE.MeshStandardMaterial({ color: 0xffffff, map: perl, bumpMap: perl, bumpScale: 0.02, metalness: 1, roughness: 0.55 })` and `bridge: new THREE.MeshStandardMaterial({ color: 0xffffff, map: gen, bumpMap: gen, bumpScale: 0.015, metalness: 1, roughness: 0.5 })` where `const gen = genevaColor(512), perl = perlage(512);` (the old roughness-only maps can go). Keep every other material.
- [ ] **Step 2: Anglage.** In `geometry.js`, make `extrude()` accept `bevel` and produce groups (ExtrudeGeometry already emits group 0 = caps, 1 = sides+bevels), and give bridges a two-material array:
```js
  function bridge(pts, mat, thick) {
    const g = extrude(shapeFrom(pts), thick || 0.9, 0.16);           // deeper bevel = the anglage
    return new THREE.Mesh(g, [mat.bridge, mat.polished]);          // caps striped, walls and bevels polished
  }
```
and in `extrude()` use `bevelSegments: 5` when `bevel >= 0.1`. Update the five `bridge(...)` call sites to pass `mat` (the whole materials object) instead of `mat.bridge` — i.e. `bridge([...], mat, 0.7)`.
- [ ] **Step 3: Turned pillars, sunk slots, countersinks.** Replace pillar creation with a lathe: profile `[{r:0,y:-1.1},{r:0.42,y:-1.1},{r:0.42,y:0.4},{r:0.52,y:0.45},{r:0.52,y:0.6},{r:0.42,y:0.65},{r:0.42,y:1.1},{r:0,y:1.1}]` → `new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p.r, p.y)), 48), mat.polished)`. In `screw()`: sink the slot (`slot.position.y = headH * 0.82`) and add a bright rim: `const rim = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.92, 0.03, 8, 48), mat.polished); rim.rotation.x = Math.PI / 2; rim.position.y = headH * 0.96; g.add(rim);`. In `jewel()`: add a countersink cone under the ring: `const sink = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(r + 0.05, -0.05), new THREE.Vector2(r + 0.32, 0.16), new THREE.Vector2(r + 0.32, 0.18)], 48), mat.polished); g.add(sink);`.
- [ ] **Step 4: Verify.** `node --check` both; `node --test` 12 pass; rehash; commit: `Vernier: anglage bevels, visible Geneva stripes and perlage, turned pillars, sunk slots, countersinks`.

---

### Task 4: Verification, re-capture, ship

- [ ] Controller-run: contrast script; detector; browser — MSAA active (`rtScene.samples === 4` via a fresh `Vernier.post.create` on an offscreen canvas), caseback hidden in hero and visible in the sapphire window, pixel stats on the dark ground (object luminance σ, no blown pixels), partCount ≥ 140 still, refresh-safety unchanged; iOS Simulator hero + escapement; re-capture `assets/vernier-fallback.jpg` and rebuild the tile (Task 9 of the original plan, Steps 1–3); weight ≤ 1 MB; merge to master; deploy; live check.
