/* ═══════════════════════════════════════════════════════
   LUMEN & LARCH — the 610 system
   One shelving system, built from four parts. The scene assembles itself as
   you scroll the pinned section, then hands the same object over as a working
   configurator: add bays, change height, click a cell to change what's in it.
   ═══════════════════════════════════════════════════════ */
window.LL = (function () {
  'use strict';
  if (!window.THREE) return {};

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── dimensions, in metres ─────────────────────────── */
  const BAY = .76, POST = .032, DEPTH = .32, ROW = .36, SHELF_T = .022;

  const TIMBER = {
    ash:       { n:'Tasmanian ash', c:0xd8c3a2, price:0.94, note:'Pale, even, our most economical' },
    oak:       { n:'European oak',  c:0xc0a077, price:1.00, note:'The one most people choose' },
    blackbutt: { n:'Blackbutt',     c:0xa9835a, price:1.08, note:'Australian, warmer, a little harder' },
    walnut:    { n:'American walnut', c:0x6b4a33, price:1.42, note:'Dark, figured, and priced like it' }
  };

  // Nine modules. `open` is the default empty bay and costs nothing extra.
  const MODULES = [
    { id:'open',    n:'Open',            price:0,   weight:0 },
    { id:'cubby',   n:'Cubby box',       price:145, weight:5.4 },
    { id:'cabinet', n:'Cabinet door',    price:220, weight:7.8 },
    { id:'glass',   n:'Glass door',      price:295, weight:9.6 },
    { id:'drawer2', n:'Two drawers',     price:265, weight:9.1 },
    { id:'drawer3', n:'Three drawers',   price:310, weight:10.4 },
    { id:'divider', n:'Record dividers', price:88,  weight:2.2 },
    { id:'desk',    n:'Fold-out desk',   price:390, weight:12.6 },
    { id:'rack',    n:'Bottle rack',     price:175, weight:6.1 }
  ];
  const MOD = {}; MODULES.forEach(m => MOD[m.id] = m);

  const PRICE  = { post: 95, shelf: 68, back: 48, plinth: 120, brace: 64 };
  const WEIGHT = { post: 4.2, shelf: 2.6, back: 3.4, plinth: 5.8, brace: 1.9 };

  /* ── scene ─────────────────────────────────────────── */
  const canvas = document.getElementById('shelfCanvas');
  if (!canvas) return {};

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xdededa, .70));
  const key = new THREE.DirectionalLight(0xffffff, .62);
  key.position.set(-2.4, 3.4, 3.2); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, .24);
  fill.position.set(3, 1, 2); scene.add(fill);
  const back = new THREE.DirectionalLight(0xffffff, .22);
  back.position.set(1, 2, -3); scene.add(back);

  const rig = new THREE.Group(); scene.add(rig);
  const unit = new THREE.Group(); rig.add(unit);

  // a brass outline marking the selected opening
  const sel = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
    new THREE.LineBasicMaterial({ color: 0x2c4be0 }));
  sel.visible = false; unit.add(sel);

  // a soft contact shadow, painted rather than computed
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d').createRadialGradient(128, 128, 8, 128, 128, 126);
    g.addColorStop(0, 'rgba(16,16,16,.34)'); g.addColorStop(1, 'rgba(16,16,16,0)');
    const ctx = c.getContext('2d'); ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  rig.add(shadow);

  /* ── state ─────────────────────────────────────────── */
  const cfg = { bays: 3, rows: 4, timber: 'oak', back: false, plinth: false, brace: false, cells: {} };
  const key4 = (b, r) => b + ':' + r;
  const cellType = (b, r) => cfg.cells[key4(b, r)] || 'open';

  let parts = [];            // { mesh, order, kind, home, ghost }

  // The drawing before the object. Every part has a line-drawn twin that stands
  // on the empty stage and blinks out the moment the real thing materialises.
  const ghost = new THREE.Group(); 
  const ghostMat = new THREE.LineBasicMaterial({ color: 0x2c4be0, transparent: true, opacity: .5 });
  // On narrow viewports the drawing sits behind the opening type rather than
  // beside it, so it drops back to a watermark.
  let ghostBase = .5;
  let hitCells = [];         // invisible boxes for click-to-change

  // One material per mesh. The reveal animates material.opacity, so a shared
  // instance would make every part fade together.
  function timberMat(shade) {
    const col = new THREE.Color(TIMBER[cfg.timber].c);
    if (shade !== 1) col.multiplyScalar(shade);
    return new THREE.MeshStandardMaterial({ color: col, roughness: .74, metalness: .02 });
  }

  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  /* ── build ─────────────────────────────────────────── */
  function build() {
    parts.forEach(p => { unit.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); });
    hitCells.forEach(h => { unit.remove(h); h.geometry.dispose(); h.material.dispose(); });
    parts = []; hitCells = [];
    while (ghost.children.length) { const g = ghost.children.pop(); g.geometry.dispose(); }
    if (ghost.parent !== unit) unit.add(ghost);

    const W = cfg.bays * BAY, H = cfg.rows * ROW;
    const x0 = -W / 2, y0 = 0;
    let order = 0;

    // uprights
    for (let i = 0; i <= cfg.bays; i++) {
      const m = new THREE.Mesh(box(POST, H, DEPTH), timberMat(.82));
      m.position.set(x0 + i * BAY, y0 + H / 2, 0);
      unit.add(m); parts.push({ mesh: m, order: order++, kind: 'post' });
    }

    // shelves — one per bay per row line, plus the top
    for (let r = 0; r <= cfg.rows; r++) {
      for (let b = 0; b < cfg.bays; b++) {
        const m = new THREE.Mesh(box(BAY - POST, SHELF_T, DEPTH - .02), timberMat(1));
        m.position.set(x0 + b * BAY + BAY / 2, y0 + r * ROW, 0);
        unit.add(m); parts.push({ mesh: m, order: order++, kind: 'shelf' });
      }
    }

    // modules sit inside cells
    const dark = new THREE.MeshStandardMaterial({ color: 0x2b2823, roughness: .5, metalness: .45 });
    const pullAt = (x, y, w) => {
      const m = new THREE.Mesh(box(w, .008, .012), dark.clone());
      m.position.set(x, y, DEPTH / 2 - .004); return m;
    };

    for (let r = 0; r < cfg.rows; r++) {
      for (let b = 0; b < cfg.bays; b++) {
        const t = cellType(b, r);
        const cx = x0 + b * BAY + BAY / 2;
        const cy = y0 + r * ROW + ROW / 2;
        const iw = BAY - POST - .012, ih = ROW - SHELF_T - .012;
        const push = (m, baseOpacity) => { unit.add(m);
          parts.push({ mesh: m, order: order++, kind: t, base: baseOpacity == null ? 1 : baseOpacity }); };

        if (t === 'cubby') {
          // a recessed box: two sides and a back, no front
          [-1, 1].forEach(sx => {
            const side = new THREE.Mesh(box(.016, ih, DEPTH - .04), timberMat(.88));
            side.position.set(cx + sx * (iw / 2 - .008), cy, 0); push(side);
          });
          const bk = new THREE.Mesh(box(iw, ih, .012), timberMat(.58));
          bk.position.set(cx, cy, -DEPTH / 2 + .03); push(bk);
          const fl = new THREE.Mesh(box(iw - .03, .014, DEPTH - .05), timberMat(.94));
          fl.position.set(cx, cy - ih / 2 + .012, .004); push(fl);
        }

        if (t === 'cabinet') {
          const m = new THREE.Mesh(box(iw, ih, .02), timberMat(.94));
          m.position.set(cx, cy, DEPTH / 2 - .018); push(m);
          push(pullAt(cx + iw / 2 - .10, cy + ih / 2 - .055, .10));
        }

        if (t === 'glass') {
          const fr = new THREE.Mesh(box(iw, ih, .018), timberMat(.9));
          fr.position.set(cx, cy, DEPTH / 2 - .018); push(fr);
          const gl = new THREE.Mesh(box(iw - .05, ih - .05, .004),
            new THREE.MeshStandardMaterial({ color: 0xcfe0d8, roughness: .04, metalness: .05,
              transparent: true, opacity: .26, depthWrite: false }));
          gl.position.set(cx, cy, DEPTH / 2 - .004);
          gl.renderOrder = 2;
          push(gl, .26);
          push(pullAt(cx + iw / 2 - .10, cy + ih / 2 - .055, .10));
        }

        if (t === 'drawer2' || t === 'drawer3') {
          const n = t === 'drawer2' ? 2 : 3;
          const dh = (ih - (n - 1) * .006) / n;
          for (let d = 0; d < n; d++) {
            const y = cy - ih / 2 + dh / 2 + d * (dh + .006);
            const m = new THREE.Mesh(box(iw, dh, .02), timberMat(.94));
            m.position.set(cx, y, DEPTH / 2 - .018); push(m);
            push(pullAt(cx, y, n === 2 ? .14 : .11));
          }
        }

        if (t === 'divider') {
          for (let d = 1; d <= 3; d++) {
            const m = new THREE.Mesh(box(.014, ih - .02, DEPTH - .06), timberMat(.88));
            m.position.set(cx - iw / 2 + (iw / 4) * d, cy, 0); push(m);
          }
        }

        if (t === 'desk') {
          // a worktop that projects forward of the frame, plus its support
          const top = new THREE.Mesh(box(iw, .026, DEPTH + .16), timberMat(1));
          top.position.set(cx, cy - ih / 2 + .06, .08); push(top);
          [-1, 1].forEach(sx => {
            const br = new THREE.Mesh(box(.014, .09, .16), timberMat(.8));
            br.position.set(cx + sx * (iw / 2 - .05), cy - ih / 2 + .015, DEPTH / 2 - .02); push(br);
          });
        }

        if (t === 'rack') {
          // angled cradles for bottles
          for (let d = 0; d < 4; d++) {
            const m = new THREE.Mesh(box(iw * .21, .012, DEPTH - .06), timberMat(.86));
            m.position.set(cx - iw / 2 + iw * (.14 + d * .24), cy, 0);
            m.rotation.z = Math.PI / 2; m.rotation.x = .18; push(m);
          }
        }

        const hit = new THREE.Mesh(box(BAY - POST, ROW - SHELF_T, DEPTH),
          new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.set(cx, cy, 0);
        hit.userData = { b, r };
        unit.add(hit); hitCells.push(hit);
      }
    }

    // back panels
    if (cfg.back) {
      for (let b = 0; b < cfg.bays; b++) {
        const m = new THREE.Mesh(box(BAY - POST, H - .01, .012), timberMat(.7));
        m.position.set(x0 + b * BAY + BAY / 2, y0 + H / 2, -DEPTH / 2 + .01);
        unit.add(m); parts.push({ mesh: m, order: order++, kind: 'back' });
      }
    }

    // plinth lifts the whole unit off the floor
    if (cfg.plinth) {
      const pl = new THREE.Mesh(box(W - .02, .09, DEPTH - .07), timberMat(.68));
      pl.position.set(0, -.045, -.01);
      unit.add(pl); parts.push({ mesh: pl, order: order++, kind: 'plinth' });
    }
    // diagonal braces across the back of each bay
    if (cfg.brace) {
      for (let b = 0; b < cfg.bays; b++) {
        const len = Math.hypot(BAY, H);
        const m = new THREE.Mesh(box(.016, len, .01), timberMat(.76));
        m.position.set(x0 + b * BAY + BAY / 2, H / 2, -DEPTH / 2 + .02);
        m.rotation.z = Math.atan2(BAY, H);
        unit.add(m); parts.push({ mesh: m, order: order++, kind: 'brace' });
      }
    }

    parts.forEach(part => {
      part.home = part.mesh.position.clone();
      const g = new THREE.LineSegments(new THREE.EdgesGeometry(part.mesh.geometry), ghostMat);
      g.position.copy(part.mesh.position); g.rotation.copy(part.mesh.rotation);
      g.scale.copy(part.mesh.scale);
      ghost.add(g); part.ghost = g;
    });

    unit.position.y = -H / 2 + (cfg.plinth ? .09 : 0);   // centre, allowing for the plinth
    shadow.scale.set(W * 1.5, DEPTH * 5.5, 1);
    shadow.position.y = -H / 2 + .004;

    frame();
    applyAssembly(assembly);
    if (typeof placeSelection === 'function') placeSelection();
    return totals();
  }

  function totals() {
    const t = TIMBER[cfg.timber];
    const posts = cfg.bays + 1, shelves = (cfg.rows + 1) * cfg.bays;
    const mods = {};
    MODULES.forEach(m => mods[m.id] = 0);
    for (let r = 0; r < cfg.rows; r++)
      for (let b = 0; b < cfg.bays; b++) mods[cellType(b, r)]++;

    const backs = cfg.back ? cfg.bays : 0;
    const braces = cfg.brace ? cfg.bays : 0;
    let price = posts * PRICE.post + shelves * PRICE.shelf + backs * PRICE.back
              + (cfg.plinth ? PRICE.plinth : 0) + braces * PRICE.brace;
    let weight = posts * WEIGHT.post + shelves * WEIGHT.shelf + backs * WEIGHT.back
               + (cfg.plinth ? WEIGHT.plinth : 0) + braces * WEIGHT.brace;
    MODULES.forEach(m => { price += mods[m.id] * m.price; weight += mods[m.id] * m.weight; });
    price *= t.price;

    return { posts, shelves, mods, backs, braces, plinth: cfg.plinth, price, weight,
             w: cfg.bays * BAY, h: cfg.rows * ROW, timber: t };
  }

  /* ── camera framing ────────────────────────────────── */
  function frame() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    const W = cfg.bays * BAY, H = cfg.rows * ROW;
    const span = Math.max(W * 1.15, H * 1.1);
    // horizontal field of view is the binding constraint on a portrait canvas
    const vExtent = 2 * Math.tan((camera.fov * Math.PI / 180) / 2);
    const need = Math.max(span / (vExtent * camera.aspect), span / vExtent);
    camera.position.set(0, .10, need * 1.16 + .34);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', () => { frame(); });

  /* ── assembly reveal ───────────────────────────────── */
  let assembly = 1;
  function applyAssembly(p) {
    assembly = p;
    const total = parts.length || 1;
    const WINDOW = .12;
    parts.forEach(part => {
      // Squeeze the stagger into 1 - WINDOW so the last part still finishes its
      // reveal at p = 1. Otherwise late parts sit permanently semi-transparent.
      const at = (part.order / total) * (1 - WINDOW);
      const local = p >= 1 ? 1 : THREE.MathUtils.clamp((p - at) / WINDOW, 0, 1);
      const base = part.base == null ? 1 : part.base;
      part.mesh.visible = local > 0;
      const s = local < 1 ? .55 + local * .45 : 1;
      part.mesh.scale.setScalar(s);
      part.mesh.material.transparent = local < 1 || base < 1;
      part.mesh.material.opacity = local * base;

      // travel into place along the line from the centre out, so the unit
      // gathers itself rather than fading up in situ
      if (part.home) {
        const k = (1 - local) * (1 - local);
        part.mesh.position.set(
          part.home.x * (1 + k * .55),
          part.home.y + k * .55,
          part.home.z + k * .90
        );
      }
      if (part.ghost) part.ghost.visible = local < .92;
    });
    ghostMat.opacity = ghostBase * (1 - THREE.MathUtils.clamp(p * 1.25, 0, 1));
    ghost.visible = ghostMat.opacity > .004;
    shadow.material.opacity = THREE.MathUtils.clamp(p * 1.4, 0, 1);
  }

  /* ── interaction ───────────────────────────────────── */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let interactive = false, dragging = false, lastX = 0, spinTarget = -.42, spin = -.42, tilt = .06;

  canvas.addEventListener('pointerdown', e => {
    if (!interactive) return;
    dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    spinTarget += (e.clientX - lastX) * .006; lastX = e.clientX;
  });
  canvas.addEventListener('pointerup', e => {
    dragging = false;
    if (!interactive) return;
    if (Math.abs(e.clientX - lastX) > 4) return;
    const r = canvas.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(hitCells, false)[0];
    if (hit) { selectCell(hit.object.userData.b, hit.object.userData.r); }
    else { selectCell(null, null); }
  });

  let stageX = 0, stageXTarget = 0;
  (function tick() {
    requestAnimationFrame(tick);
    stageX += (stageXTarget - stageX) * .10;
    rig.position.x = stageX;
    spin += (spinTarget - spin) * .08;
    rig.rotation.y = spin;
    rig.rotation.x = tilt;
    renderer.render(scene, camera);
  })();

  /* ── selection ─────────────────────────────────────── */
  let selected = null;
  function selectCell(b, r) {
    selected = (b === null) ? null : { b, r };
    placeSelection();
    api.onSelect && api.onSelect(selected, selected ? cellType(b, r) : null);
  }
  function placeSelection() {
    if (!selected) { sel.visible = false; return; }
    const W = cfg.bays * BAY;
    const x0 = -W / 2;
    sel.visible = true;
    sel.scale.set(BAY - POST, ROW - SHELF_T, DEPTH);
    sel.position.set(x0 + selected.b * BAY + BAY / 2,
                     selected.r * ROW + ROW / 2, 0);
  }
  function setModule(id) {
    if (!selected) return null;
    if (id === 'open') delete cfg.cells[key4(selected.b, selected.r)];
    else cfg.cells[key4(selected.b, selected.r)] = id;
    const t = build();
    placeSelection();
    return t;
  }

  /* ── public api ────────────────────────────────────── */
  function visibleCounts() {
    const c = { post:0, shelf:0, module:0, back:0, plinth:0, brace:0 };
    const seen = new Set();
    parts.forEach(p => {
      const b = p.base == null ? 1 : p.base;
      if (!p.mesh.visible || p.mesh.material.opacity <= b * .5) return;
      if (p.kind === 'post' || p.kind === 'shelf' || p.kind === 'back'
       || p.kind === 'plinth' || p.kind === 'brace') { c[p.kind]++; return; }
      // module meshes come in groups; count each cell once by its position
      const k = p.kind + ':' + (p.home || p.mesh.position).x.toFixed(2);
      if (!seen.has(k)) { seen.add(k); c.module++; }
    });
    return c;
  }

  const api = {
    cfg, TIMBER, PRICE, MODULES, MOD,
    build, totals, frame, visibleCounts, selectCell, setModule,
    get selected(){ return selected; }, cellType,
    setAssembly: applyAssembly,
    setSpin(v){ spinTarget = v; },
    setStageX(v){ stageXTarget = v; },
    setGhost(v){ ghostBase = v; applyAssembly(assembly); },
    setInteractive(v){ interactive = v; canvas.style.cursor = v ? 'grab' : 'default'; },
    onChange: null, onSelect: null,
    reduced
  };
  return api;
})();
