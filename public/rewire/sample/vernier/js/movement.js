/* VERNIER — the stage. Renderer, image-based lighting from a procedural room,
   soft shadows over a white void, the escapement running at a real 4Hz, and a
   small API the page drives with GSAP. */
(function () {
  'use strict';
  const V = window.Vernier = window.Vernier || {};
  const T = V.tier;

  const VIEWS = {
    hero:       { p: [ 12.5, 33,   52  ], t: [ 0,   1.2,  0   ] },
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
    /* a dark floor under the object: without it every metal reflects a
       uniformly bright room and reads as flat white */
    const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 32), new THREE.MeshBasicMaterial({ color: 0x1c1e22 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -6; s.add(floor);
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
  function poolTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'), gr = g.createRadialGradient(256, 256, 40, 256, 256, 256);
    gr.addColorStop(0, 'rgba(120,124,132,0.55)'); gr.addColorStop(0.55, 'rgba(120,124,132,0.18)'); gr.addColorStop(1, 'rgba(120,124,132,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  }

  function create(canvas, opts) {
    opts = opts || {};
    const reduced = !!opts.reduced;
    let renderer;
    try {
      /* Mobile: no default-framebuffer MSAA (a known iOS WebKit flicker source at
         large buffer sizes) and no high-performance hint. Both overridable. */
      /* preserveDrawingBuffer on phones: iOS clears the buffer as soon as a frame
         is handed to the compositor, and when the compositor samples between
         rAF frames (smooth scroll, other tickers, DOM updates) it shows that
         cleared buffer — a black blink independent of every quality setting.
         Keeping the last frame until it is overwritten removes that entirely. */
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, antialias: opts.antialias !== undefined ? !!opts.antialias : !opts.mobile,
        alpha: false, powerPreference: opts.mobile ? 'default' : 'high-performance',
        preserveDrawingBuffer: opts.preserve !== undefined ? !!opts.preserve : !!opts.mobile
      });
    } catch (e) { return null; }
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1b1d21);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 200);

    /* Environment: the synthetic room is instant and stands in until the
       real studio HDRI (CC0, Poly Haven "Studio Small 09") has loaded and been
       prefiltered; then every metal reflects real lights with real falloff. */
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(roomScene(), 0.04).texture;
    pmrem.dispose();
    const ENV_URL = opts.envUrl !== undefined ? opts.envUrl : 'assets/env/studio_small_09_1k.hdr';
    const envReady = (ENV_URL && V.hdr) ? V.hdr.loadEnvironment(ENV_URL, renderer).then(env => {
      const old = scene.environment; scene.environment = env; if (old) old.dispose();
      return env;
    }).catch(() => null) : Promise.resolve(null);

    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(12, 26, 14); key.castShadow = true;
    key.shadow.camera.left = key.shadow.camera.bottom = -20;
    key.shadow.camera.right = key.shadow.camera.top = 20;
    key.shadow.camera.near = 1; key.shadow.camera.far = 80;
    key.shadow.radius = 4; key.shadow.bias = -0.0004;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe8f0ff, 0.7); fill.position.set(-16, 10, -8); scene.add(fill);
    const rim  = new THREE.DirectionalLight(0xffffff, 0.9); rim.position.set(-6, 8, 22); scene.add(rim);

    /* a soft light pool under the object: on a dark ground the movement needs
       something to sit on, and shadows need something lighter to fall onto */
    const pool = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshBasicMaterial({ map: poolTexture(), transparent: true, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = -0.63; scene.add(pool);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.42 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.62; ground.receiveShadow = true; scene.add(ground);

    const matsHi = V.materials.create({ transmission: true });
    const matsLo = V.materials.create({ transmission: false });
    const M = V.geometry.build(matsHi);
    scene.add(M.group);

    const cam = { px: VIEWS.hero.p[0], py: VIEWS.hero.p[1], pz: VIEWS.hero.p[2], tx: VIEWS.hero.t[0], ty: VIEWS.hero.t[1], tz: VIEWS.hero.t[2] };
    const state = { explode: 0, spin: 0, autoRotate: !reduced, running: !reduced, wind: 0 };
    let post = null, tier = 'medium', beats = 0, sampling = null;
    let lastW = 0, lastH = 0;
    const t0 = performance.now();

    function setTier(name) {
      tier = name; const s = T.TIERS[name];
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, s.pixelRatio, opts.maxDpr || Infinity));
      const shadowSize = opts.shadows === false ? 0 : s.shadowMap;
      renderer.shadowMap.enabled = shadowSize > 0; key.castShadow = shadowSize > 0;
      if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
      if (shadowSize > 0) {
        key.shadow.mapSize.set(shadowSize, shadowSize);
      }
      renderer.shadowMap.type = s.softShadows ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      M.caseback.material = s.transmission ? matsHi.sapphire : matsLo.sapphire;
      if (post) post.setEnabled(s.post);
      lastW = lastH = 0;
      resize();
    }
    function resize() {
      const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return;
      if (r.width === lastW && r.height === lastH) return; lastW = r.width; lastH = r.height;
      const portrait = r.height > r.width;           // phones: object higher, text sits below it
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.fov = portrait ? 56 : 30;               // vertical FOV; portrait needs more of it to keep the plate in frame
      const W = Math.round(r.width), H = Math.round(r.height);
      camera.setViewOffset(W, H, portrait ? 0 : -Math.round(W * 0.06), portrait ? Math.round(H * 0.10) : 0, W, H);
      camera.updateProjectionMatrix();
      if (post) post.resize(renderer.domElement.width, renderer.domElement.height);
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
      return new Promise(function (resolve) {
        sampling = { n: n, arr: [], skip: 5, last: performance.now(), resolve: resolve };
        setTimeout(function () { if (sampling && sampling.resolve === resolve) { sampling = null; resolve([]); } }, 4000);
      });
    }
    function attachPost(p) { post = p; post.setEnabled(T.TIERS[tier].post); resize(); }
    /* Deterministic offline capture (build-time only): size once, then render
       any number of frames at explicit times, then restore. Used for the
       fallback still and for the phone videos. */
    let capPrev = null;
    function beginCapture(w, h) {
      capPrev = { size: new THREE.Vector2(), pr: renderer.getPixelRatio() }; renderer.getSize(capPrev.size);
      renderer.setPixelRatio(1); renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.clearViewOffset(); camera.updateProjectionMatrix();
      if (post) post.resize(w, h);
    }
    function captureAt(tSeconds, quality, mime) {
      tick(t0 + tSeconds * 1000);
      return canvas.toDataURL(mime || 'image/jpeg', quality || 0.9);
    }
    function endCapture() {
      if (!capPrev) return;
      renderer.setPixelRatio(capPrev.pr); renderer.setSize(capPrev.size.x, capPrev.size.y, false);
      capPrev = null; lastW = lastH = 0; resize();
    }
    function captureFrame(w, h) {
      beginCapture(w, h);
      const url = captureAt((performance.now() - t0) / 1000, 0.85);
      endCapture();
      return url;
    }

    new ResizeObserver(resize).observe(canvas.parentElement);
    resize(); setTier(opts.mobile ? 'mobile' : 'medium');

    return {
      renderer: renderer, scene: scene, camera: camera, movement: M, cam: cam, state: state, VIEWS: VIEWS,
      setTier: setTier, setView: setView, explode: explode, wind: wind, tick: tick,
      beginCapture: beginCapture, captureAt: captureAt, endCapture: endCapture, envReady: envReady,
      sampleFrameTimes: sampleFrameTimes, attachPost: attachPost, captureFrame: captureFrame, resize: resize,
      get tier() { return tier; }, get beats() { return beats; }
    };
  }

  V.movement = { VIEWS: VIEWS, create: create };
})();
