/* ═══════════════════════════════════════════════════════
   FORGE ATHLETIC — the loading barbell
   A 20kg bar that gains plates as you scroll the pinned section. Progressive
   overload is the thing the gym actually sells, so the showpiece is that
   principle made physical rather than a decorative 3D object.
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.THREE || !window.gsap) return;

  const canvas = document.getElementById('barCanvas');
  const section = document.getElementById('load');
  if (!canvas || !section) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CHALK = 0xf2f1ec, IRON = 0x0e0f10, SULPHUR = 0xd8df25;

  /* ── plate loading order ───────────────────────────── */
  // Each step adds one plate per side. Weight is the running total including
  // the 20kg bar, which is why it starts at 20 and not 0.
  const STEPS = [
    { add: null, kg: 20,  label: 'Empty bar',        wk: 1,
      note: "You start with the bar and nothing on it. Everybody does, including the people who look like they didn't." },
    { add: 5,   kg: 30,  label: '5kg a side',        wk: 2,
      note: 'Week two and the movement is the point, not the number. Mara will not let you load it faster than your technique holds.' },
    { add: 10,  kg: 50,  label: '10 + 5 a side',     wk: 4,
      note: 'By the end of the first month most people are moving something that felt impossible on day one.' },
    { add: 15,  kg: 80,  label: '15 + 10 + 5',       wk: 8,
      note: 'This is where it stops being exercise and starts being training. Same session, same coach, heavier bar.' },
    { add: 20,  kg: 120, label: '20 + 15 + 10 + 5',  wk: 12,
      note: 'Twelve weeks in. For most of our members this is somewhere around bodyweight, and it is the first time they believe it.' },
    { add: 25,  kg: 170, label: 'Loaded',            wk: 24,
      note: "Six months. Nobody promised you this and we are not promising it now — but it happens often enough that we built the gym around it." }
  ];

  const PLATE = {                       // radius, thickness, colour by denomination
    5:  { r: .26, t: .045, c: 0x2c3033 },
    10: { r: .32, t: .055, c: 0x24282b },
    15: { r: .38, t: .062, c: 0x1e2124 },
    20: { r: .44, t: .070, c: 0x191c1f },
    25: { r: .45, t: .085, c: 0x141719 }
  };

  /* ── scene ─────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(0, .05, 5.5);

  scene.add(new THREE.AmbientLight(0xffffff, .28));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(SULPHUR, .85);
  rim.position.set(4, 1.5, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(CHALK, .3);
  fill.position.set(3, -2, 2); scene.add(fill);

  // rig holds the framing offset; group holds rotation and the load-dip, so the
  // two never fight each other
  const rig = new THREE.Group();
  scene.add(rig);
  const group = new THREE.Group();
  rig.add(group);

  // bar + sleeves + collars
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a3, metalness: .95, roughness: .28 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, 4.4, 24), steel);
  bar.rotation.z = Math.PI / 2; group.add(bar);

  [-1, 1].forEach(side => {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.05, 20), steel);
    sleeve.rotation.z = Math.PI / 2; sleeve.position.x = side * 1.68; group.add(sleeve);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .09, 20),
      new THREE.MeshStandardMaterial({ color: SULPHUR, metalness: .5, roughness: .4 }));
    collar.rotation.z = Math.PI / 2; collar.position.x = side * 2.18; group.add(collar);
  });

  // knurling marks, so the bar doesn't read as a plain rod
  const knurlMat = new THREE.MeshStandardMaterial({ color: 0x6d7376, metalness: .8, roughness: .65 });
  [-.72, -.36, .36, .72].forEach(x => {
    const k = new THREE.Mesh(new THREE.CylinderGeometry(.031, .031, .18, 20), knurlMat);
    k.rotation.z = Math.PI / 2; k.position.x = x; group.add(k);
  });

  /* ── plates, built once and revealed in order ──────── */
  const plates = [];                    // [{mesh, step}] two per step
  let offset = { '-1': 1.24, '1': 1.24 };
  STEPS.forEach((s, i) => {
    if (!s.add) return;
    const p = PLATE[s.add];
    [-1, 1].forEach(side => {
      const geo = new THREE.CylinderGeometry(p.r, p.r, p.t, 40);
      const mat = new THREE.MeshStandardMaterial({ color: p.c, metalness: .35, roughness: .62 });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.z = Math.PI / 2;
      m.position.x = side * (offset[side] + p.t / 2);
      m.scale.setScalar(.001);
      m.visible = false;
      group.add(m);

      // a thin chalk ring so each plate reads against the dark background
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(p.r * .62, .012, 8, 48),
        new THREE.MeshStandardMaterial({ color: 0x8d9194, metalness: .2, roughness: .85 }));
      ring.rotation.y = Math.PI / 2;
      ring.position.x = side * (offset[side] + p.t / 2 + (side > 0 ? p.t / 2 + .002 : -p.t / 2 - .002));
      ring.scale.setScalar(.001);
      ring.visible = false;
      group.add(ring);

      plates.push({ mesh: m, ring, step: i, side });
    });
    offset['-1'] += p.t + .012; offset['1'] += p.t + .012;
  });

  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    // pull the camera back on narrow screens so the loaded bar still fits
    // A portrait viewport has a far narrower horizontal field of view, so pulling
    // the camera back is not enough on its own — the rig has to shrink too.
    const narrow = r.width < 760, mid = r.width < 1100;
    camera.position.z = narrow ? 7.0 : (mid ? 6.5 : 5.5);
    rig.scale.setScalar(narrow ? 0.38 : (mid ? 0.72 : 1));
    // On wide screens the copy sits to the right at mid-height, so drop the bar
    // clear of it. Stacked layouts don't need the offset.
    rig.position.y = r.width < 900 ? 0 : -0.62;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  /* ── state driven by scroll ────────────────────────── */
  const state = { step: -1, spin: 0, tilt: 0 };
  const kgEl = document.getElementById('loadKg');
  const barEl = document.getElementById('loadBar');
  const wkEl = document.getElementById('loadWk');
  const noteEl = document.getElementById('loadNote');
  const kgTween = { v: 20 };

  function setStep(i) {
    if (i === state.step) return;
    const up = i > state.step;
    state.step = i;
    const s = STEPS[i];

    plates.forEach(p => {
      const on = p.step <= i;
      if (on && !p.mesh.visible) {
        p.mesh.visible = true; p.ring.visible = true;
        gsap.fromTo([p.mesh.scale, p.ring.scale], { x:.001, y:.001, z:.001 },
          { x:1, y:1, z:1, duration:.75, ease:'back.out(1.6)' });
        gsap.fromTo(p.mesh.position, { x: p.mesh.position.x + p.side * 1.6 },
          { x: p.mesh.position.x, duration:.75, ease:'power3.out' });
      } else if (!on && p.mesh.visible) {
        gsap.to([p.mesh.scale, p.ring.scale], { x:.001, y:.001, z:.001, duration:.35, ease:'power2.in',
          onComplete(){ p.mesh.visible = false; p.ring.visible = false; } });
      }
    });

    gsap.to(kgTween, { v: s.kg, duration: .8, ease: 'power2.out',
      onUpdate(){ kgEl.textContent = Math.round(kgTween.v); } });
    barEl.textContent = s.label;
    wkEl.textContent = String(s.wk).padStart(2, '0');

    // swap the note with a small vertical wipe so it doesn't just pop
    gsap.fromTo(noteEl, { opacity: 0, y: up ? 14 : -14 },
      { opacity: 1, y: 0, duration: .5, ease: 'power3.out' });
    noteEl.textContent = s.note;

    // the bar dips under the new weight, then recovers
    gsap.fromTo(group.position, { y: 0 }, { y: -.055, duration: .18, ease: 'power2.in',
      onComplete(){ gsap.to(group.position, { y: 0, duration: .9, ease: 'elastic.out(1,.5)' }); } });
  }

  ScrollTrigger.create({
    // finish the loading sequence before the section unpins, so the final
    // state is held on screen rather than scrolling away as it arrives
    trigger: section, start: 'top top', end: 'bottom bottom-=22%', scrub: .5,
    onUpdate(self) {
      const p = self.progress;
      setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length * .999)));
      state.spin = -0.58 + p * 0.46;         // stays off-axis the whole way through
      state.tilt = 0.20 - p * 0.30;
    }
  });

  if (reduced) { setStep(STEPS.length - 1); state.spin = -0.35; state.tilt = 0.05; }
  else setStep(0);

  let visible = true;
  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top',
    onToggle(self){ visible = self.isActive; } });

  (function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    group.rotation.y += (state.spin - group.rotation.y) * .07;
    group.rotation.x += (state.tilt - group.rotation.x) * .07;
    renderer.render(scene, camera);
  })();
})();
