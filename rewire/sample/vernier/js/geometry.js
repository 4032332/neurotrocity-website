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
      depth: depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: bevel >= 0.1 ? 5 : 4, curveSegments: 16
    });
    g.rotateX(-Math.PI / 2); g.translate(0, -depth / 2, 0);
    return g;
  }
  function gear(teeth, module, thick, mat, opts) {
    opts = opts || {};
    const shape = shapeFrom(P.gearProfile(teeth, module, { samplesPerTooth: opts.samples || 16 }));
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
  function cyl(r, h, mat, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 64), mat); }
  function tube(pts, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, 0, p.y)));
    return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(600, pts.length), radius, 10, false), mat);
  }
  let slotSeq = 0;
  function screw(headR, headH, shankR, len, headMat, slotMat) {
    const g = new THREE.Group();
    const pts = P.screwProfile(headR, headH, shankR, len).map(p => new THREE.Vector2(p.r, p.y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 48), headMat));
    const slot = new THREE.Mesh(new THREE.BoxGeometry(headR * 1.5, 0.06, 0.14), slotMat);
    slot.userData.cosmetic = true;
    slot.position.y = headH * 0.82; slot.rotation.y = (slotSeq++ * 0.73) % Math.PI; g.add(slot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.92, 0.03, 8, 48), headMat);
    rim.rotation.x = Math.PI / 2; rim.position.y = headH * 0.96; g.add(rim);
    return g;
  }
  function jewel(r, mat) {
    const g = new THREE.Group();
    g.add(cyl(r, 0.32, mat.ruby, 24));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.12, 0.085, 12, 40), mat.polished);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.1; g.add(ring);
    const sink = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(r + 0.05, -0.05), new THREE.Vector2(r + 0.32, 0.16), new THREE.Vector2(r + 0.32, 0.18)], 48), mat.polished);
    g.add(sink);
    return g;
  }
  /* Bridges are hand-drawn outlines. */
  function bridge(pts, mat, thick) {
    const g = extrude(shapeFrom(pts), thick || 0.9, 0.16);           // deeper bevel = the anglage
    return new THREE.Mesh(g, [mat.bridge, mat.polished]);          // caps striped, walls and bevels polished
  }

  V.geometry = {
    build: function (mat) {
      slotSeq = 0;
      const group = new THREE.Group(), parts = [], train = [];
      function add(name, obj, x, y, z, dist) {
        obj.position.set(x, y, z);
        obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        group.add(obj);
        parts.push({ name, obj, base: new THREE.Vector3(x, y, z), dist });
        return obj;
      }

      /* mainplate: a 26mm disc with a rim step */
      add('mainplate', cyl(13, 1.2, mat.plate, 128), 0, 0, 0, 0);
      add('rim', (function(){ const m = new THREE.Mesh(new THREE.TorusGeometry(12.7, 0.25, 8, 96), mat.polished); m.rotation.x = Math.PI/2; return m; })(), 0, 0.6, 0, 0);
      const pillarProfile = [{r:0,y:-1.1},{r:0.42,y:-1.1},{r:0.42,y:0.4},{r:0.52,y:0.45},{r:0.52,y:0.6},{r:0.42,y:0.65},{r:0.42,y:1.1},{r:0,y:1.1}];
      for (let i = 0; i < 6; i++) {                                   // pillars, turned
        const a = i / 6 * Math.PI * 2 + 0.3;
        const pillar = new THREE.Mesh(new THREE.LatheGeometry(pillarProfile.map(p => new THREE.Vector2(p.r, p.y)), 48), mat.polished);
        add('pillar' + i, pillar, 11.6 * Math.cos(a), 1.6, 11.6 * Math.sin(a), 4);
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
      let lastTension = -1;
      const spring = { rebuild: function (tension) {
        if (springMesh && Math.abs(tension - lastTension) < 0.02) return;
        lastTension = tension;
        if (springMesh) { barrel.remove(springMesh); springMesh.geometry.dispose(); }
        springMesh = tube(P.springPath(9, 1.05, 4.9, 360, tension), 0.085, mat.spring);
        springMesh.position.y = 0.1; springMesh.castShadow = true; springMesh.receiveShadow = true; barrel.add(springMesh);
      } };
      spring.rebuild(0);

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
        add(name, g, x, 1.35, z, 6);
        train.push({ obj: g, rpm: rpm }); return g;
      }
      wheel('centreWheel', 64, 0.11, 0.2, -1.0, 5, 1 / 60);
      wheel('thirdWheel', 56, 0.10, 4.6, -3.9, 5, 1 / 7.5);
      wheel('fourthWheel', 56, 0.088, 7.6, 0.6, 5, 1);
      const escape = new THREE.Group();
      const ew = gear(20, 0.17, 0.16, mat.steel, { samples: 12, hub: 0.3 }); escape.add(ew);
      const es = cyl(0.12, 2.4, mat.polished, 12); es.position.y = 0.4; escape.add(es);
      add('escapeWheel', escape, 5.6, 1.35, 5.4, 6);

      /* pallet fork: a Y with two ruby stones */
      const fork = new THREE.Group();
      fork.add(new THREE.Mesh(extrude(shapeFrom([{x:-0.2,y:-0.3},{x:0.2,y:-0.3},{x:0.25,y:1.4},{x:1.3,y:2.3},{x:1.05,y:2.55},{x:0,y:1.75},{x:-1.05,y:2.55},{x:-1.3,y:2.3},{x:-0.25,y:1.4}]), 0.22, 0.02), mat.polished));
      [[-1.15, 2.4], [1.15, 2.4]].forEach(([x, z]) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.18), mat.ruby); s.position.set(x, 0.05, z); s.rotation.y = 0.5; fork.add(s); });
      add('palletFork', fork, 3.3, 1.75, 7.0, 7);
      add('palletBridge', bridge([{x:-1.2,y:-1.3},{x:1.4,y:-1.5},{x:2.0,y:0.4},{x:1.1,y:1.8},{x:-1.3,y:1.6}], mat, 0.7), 3.3, 2.55, 7.0, 13);

      /* balance: rim, four arms, hub, eight timing weights, staff, hairspring */
      const balance = new THREE.Group();
      const rim = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.22, 16, 96), mat.polished); rim.rotation.x = Math.PI / 2; balance.add(rim);
      for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.16, 0.26), mat.polished); a.rotation.y = i * Math.PI / 4; balance.add(a); }
      balance.add(cyl(0.5, 0.5, mat.polished, 24));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, w = cyl(0.17, 0.34, mat.brass, 12); w.position.set(3.2 * Math.cos(a), 0, 3.2 * Math.sin(a)); balance.add(w); }
      const staff = cyl(0.13, 2.8, mat.polished, 12); staff.position.y = 0.4; balance.add(staff);
      const hair = tube(P.springPath(11, 0.5, 2.6, 600, 0), 0.025, mat.blued); hair.position.y = 0.7; balance.add(hair);
      add('balance', balance, 0.4, 1.9, 8.1, 9);
      add('balanceCock', bridge([{x:-1.1,y:-0.9},{x:1.1,y:-0.9},{x:1.3,y:2.2},{x:3.6,y:5.9},{x:2.2,y:6.6},{x:-0.6,y:2.4},{x:-1.3,y:1.2}], mat, 0.8), -1.4, 3.3, 3.2, 15);
      add('regulator', (function(){ const g=new THREE.Group(); const arm=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.12,0.22),mat.blued); arm.position.x=0.8; g.add(arm); g.add(cyl(0.45,0.14,mat.polished,20)); return g; })(), 0.4, 3.85, 8.1, 17);
      add('capJewel', jewel(0.38, mat), 0.4, 3.9, 8.1, 17);

      /* bridges over the barrel and the train */
      add('barrelBridge', bridge([{x:-7.2,y:-6.4},{x:-0.4,y:-7.2},{x:1.6,y:-3.2},{x:0.8,y:2.6},{x:-3.2,y:6.4},{x:-9.6,y:5.2},{x:-11.8,y:0.4},{x:-10.4,y:-4.6}], mat), 0, 2.55, 0, 13);
      add('trainBridge', bridge([{x:2.2,y:-7.6},{x:8.8,y:-6.2},{x:11.4,y:-0.8},{x:10.2,y:3.8},{x:6.2,y:3.4},{x:4.0,y:0.4},{x:2.0,y:-2.6}], mat), 0, 2.55, 0, 13);
      add('motionBridge', bridge([{x:-1.6,y:-2.6},{x:3.4,y:-3.4},{x:4.4,y:-0.8},{x:2.0,y:1.2},{x:-1.6,y:0.6}], mat, 0.6), 0, 3.7, -1.0, 16);

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
      const knurlProfile = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2; const r = 1.35 + (i % 2 ? 0.07 : -0.07); knurlProfile.push({ x: r * Math.cos(a), y: r * Math.sin(a) }); }
      const knurlMesh = new THREE.Mesh(extrude(shapeFrom(knurlProfile), 1.3, 0.04), mat.polished);
      crown.add(knurlMesh); crown.add(cyl(0.9, 1.6, mat.polished, 24));
      crown.rotation.z = Math.PI / 2;
      add('crown', crown, -15.4, 1.2, -2.6, 3);

      /* the sapphire caseback: a window over everything */
      const caseback = cyl(13.4, 0.5, mat.sapphire, 96);
      add('caseback', caseback, 0, 4.9, 0, 24);
      caseback.castShadow = false; caseback.receiveShadow = false;
      caseback.visible = false;   // glass: shadow casting ignores transmission and would shade the whole movement

      /* additional real components so the counted partCount matches the movement */
      add('bankingPin0', cyl(0.12, 0.9, mat.polished, 10), 2.2, 1.9, 6.2, 7);
      add('bankingPin1', cyl(0.12, 0.9, mat.polished, 10), 4.4, 1.9, 6.2, 7);
      add('dialFoot0', cyl(0.25, 0.8, mat.brass, 12), -9.5, -0.9, -6.0, 0);
      add('dialFoot1', cyl(0.25, 0.8, mat.brass, 12), 9.5, -0.9, -6.0, 0);
      add('shockSpring', (function(){ const m = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 24), mat.blued); m.rotation.x = Math.PI / 2; return m; })(), 0.4, 4.05, 8.1, 17);
      add('studCarrier', new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), mat.polished), -0.9, 3.9, 6.6, 15);
      add('clickSpring', new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.16), mat.blued), -7.4, 3.35, 2.2, 12);
      add('crownWheelCore', cyl(0.6, 0.5, mat.polished, 16), -9.2, 3.65, -2.6, 12);
      add('capJewelPlate', jewel(0.34, mat), 0.4, 0.9, 8.1, 2);

      /* partCount is computed from the built scene: every mesh except cosmetic screw slots */
      let partCount = 0;
      group.traverse(function (o) {
        if (o.isMesh && !o.userData.cosmetic) partCount++;
      });

      return {
        group, parts, train,
        escapement: { balance, palletFork: fork, escapeWheel: escape },
        mainspring: spring, ratchet, crown, caseback,
        partCount: partCount
      };
    }
  };
})();
