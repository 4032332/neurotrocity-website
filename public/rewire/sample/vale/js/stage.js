/* ═══════════════════════════════════════════════════════════════
   VALE & VINE — the stage.

   One WebGL surface behind the whole document. It draws two things:

     1. The sky (js/sky.glsl.js) on a fullscreen quad. A quad rather than a
        dome: the shader is analytic, so a dome would only add tessellation,
        a second matrix and a source of banding along its seams, and buy
        nothing — every pixel already gets an exact world-space ray built
        from the inverse projection.
     2. The vine rows. Each row is a single vertical quad running away from
        the camera; the trellis, the trunks and the canopy are drawn inside
        it by the fragment shader. A quad is planar, so perspective-correct
        interpolation makes the receding repeat exact — one instanced draw
        call covers the whole vineyard, and there is no per-plant geometry
        to pay for. Backlit, they resolve to silhouette, which is what a
        vineyard at four in the afternoon actually looks like.

   Row state is continuous in day-of-year: bare canes → budburst → closed
   canopy → gold → leaf fall, with no season buckets anywhere. The sun
   vector comes from the NOAA model in js/sun.js, evaluated at the ceremony
   hour of whichever season the day falls in.

   Southern hemisphere. Compass azimuth 0 = north, clockwise. World axes:
   +X east, −Z north, +Y up. The camera looks due west, because that is the
   quarter every Rosa Brook sunset happens in, all year.
   ═══════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else (root.VV = root.VV || {}).stage = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  const LAT = -33.95, LON = 115.07, TZ = 8;
  const RAD = Math.PI / 180;
  const YEAR = 2027;                  // any non-leap year; only the shape matters
  const BEARING = 270;                // the camera looks west
  /* The camera looks ACROSS the rows, not down a lane. Down a lane you see two
     featureless walls compressed to nothing and no season at all; across them,
     from a little above the fruiting wire, every row in the block is legible
     and the year is written on all of them at once. 35° keeps the rows moving
     diagonally out of frame rather than stacking into stripes. */
  /* 35° across the rows, from standing height at the canopy line. A row is
     modelled as one vertical plane, and that stand-in is only honest when it
     is seen roughly side-on — from above it degenerates into a smear. So the
     camera stays at eye level: the near rows read fully, trunk to crown, and
     everything past fifteen metres closes into one dark band along the
     horizon. Backlit at the ceremony hour, that band is the picture. */
  const ROW_DIR = 0.61;
  const CAM_H = 6.30;                  // the head of the slope, over the canopy
  const CAM_PITCH = 0.046;            // 2.6° up: horizon at 55%, block below it
  const ROW_LEN = 240, ROW_H = 2.4, ROW_GAP = 3.3, VINE_GAP = 1.9;
  const ROW_NEAR = 5;                 // metres to the first row
  const MAX_RECTS = 8;

  /* ── tiering ──────────────────────────────────────────────────
     Same shape as vernier/js/tier.js: one table, chosen once, never
     re-sampled upward. The march step counts are compile-time defines, so
     they cannot change after the material is built — only the pixel ratio
     adapts at runtime, and only downward. */
  const TIERS = {
    high:   { dpr: 2.0, rows: 34, primary: 16, light: 5 },
    medium: { dpr: 1.5, rows: 22, primary: 12, light: 4 },
    low:    { dpr: 1.0, rows: 14, primary: 8,  light: 3 }
  };

  function detectTier() {
    const nav = typeof navigator === 'undefined' ? {} : navigator;
    const mobile = /Android|iPhone|iPad|iPod/i.test(nav.userAgent || '');
    const cores = nav.hardwareConcurrency || 4;
    const mem = nav.deviceMemory || 4;
    if (mobile) return cores >= 6 && mem >= 4 ? 'medium' : 'low';
    if (cores >= 8 && mem >= 8) return 'high';
    if (cores >= 4) return 'medium';
    return 'low';
  }

  function hasWebGL2() {
    try {
      const c = document.createElement('canvas');
      return !!c.getContext('webgl2');
    } catch (e) { return false; }
  }

  /* ── the vineyard year ────────────────────────────────────────
     Everything below is a smooth function of day-of-year on a September→
     August vine year, so scrubbing never crosses a boundary. The dates are
     Margaret River's: budburst first week of September, canopy closed by
     late October, harvest through March, the cabernet turning through late
     April, leaves down by the start of June, bare through pruning. */
  const smooth = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  function vineState(doy) {
    const p = ((doy - 244) % 365 + 365) % 365;          // 0 = 1 September
    const growth = smooth(0, 56, p) * (1 - smooth(225, 288, p));
    const gold   = smooth(196, 240, p) * (1 - smooth(248, 282, p));
    const dry    = smooth(85, 150, p) * (1 - smooth(250, 296, p));
    return {
      growth,
      gold,
      season: Math.max(gold, dry * 0.6),
      turbidity: 1.15 + 0.85 * dry
    };
  }

  /** The Date at the ceremony hour of the season this day belongs to. */
  function ceremonyDate(doy) {
    const d = new Date(Date.UTC(YEAR, 0, Math.max(1, Math.min(365, Math.round(doy)))));
    const month = d.getUTCMonth();
    const seasons = (root.VV && root.VV.SEASONS) || {};
    const id = (root.VV && root.VV.forMonth) ? root.VV.forMonth(month) : 'vin';
    const label = (seasons[id] && seasons[id].time) || '4:00 pm';
    const m = /(\d+)(?::(\d+))?\s*(am|pm)/i.exec(label);
    let hh = m ? +m[1] : 16, mm = m && m[2] ? +m[2] : 0;
    if (m && /pm/i.test(m[3]) && hh < 12) hh += 12;
    if (m && /am/i.test(m[3]) && hh === 12) hh = 0;
    return new Date(Date.UTC(YEAR, month, d.getUTCDate(), hh - TZ, mm));
  }

  /** Compass azimuth/elevation in degrees → world direction. */
  function sunVector(elevation, azimuth) {
    const e = elevation * RAD, a = azimuth * RAD, c = Math.cos(e);
    return { x: c * Math.sin(a), y: Math.sin(e), z: -c * Math.cos(a) };
  }

  /* ── vine-row material ────────────────────────────────────────
     One quad per row; the trellis, the trunks and the canopy are drawn into
     it by the fragment shader. Bars are antialiased with a softness that
     grows with distance, so a 240 m repeat dissolves into a mass instead of
     shimmering at the vanishing point.

     The quad is an axis billboard: it stays pinned to the row's own line on
     the ground and rotates about it to face the camera. A fixed vertical
     plane is an honest stand-in for a row only when it is seen side-on; from
     a rise above the canopy it degenerates into a smear, because a real row
     has a top and a plane does not. Rolling it toward the eye gives the row
     that top back for the cost of six lines of vertex shader, and it is the
     one thing that makes a block of thirty-four rows read as vines rather
     than as corrugated iron. */
  const ROW_VERT = [
    'precision highp float;',
    'attribute float aSeed;',
    'uniform vec3  uRowU;',
    'uniform float uRowLen;',
    'uniform float uRowH;',
    'varying vec2 vUv;',
    'varying float vDist;',
    'varying float vSeed;',
    'void main(){',
    '  vUv = uv;',
    '  vSeed = aSeed;',
    '  vec3 org = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);',
    '  vec3 toCam = cameraPosition - org;',
    '  vec3 n = toCam - uRowU * dot(toCam, uRowU);',
    '  float nl = length(n);',
    '  n = nl > 1e-4 ? n / nl : vec3(0.0, 1.0, 0.0);',
    '  vec3 up = normalize(cross(n, uRowU));',
    '  up *= sign(up.y + 1e-6);',
    '  vec3 wp = org + uRowU * (position.x * uRowLen) + up * ((position.y + 0.5) * uRowH);',
    '  vec4 mv = viewMatrix * vec4(wp, 1.0);',
    '  vDist = -mv.z;',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  const ROW_FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'varying float vDist;',
    'varying float vSeed;',
    'uniform float uGrowth;',
    'uniform float uGold;',
    'uniform float uUnits;',
    'uniform float uFace;',
    'float h11(float x){ return fract(sin(x * 127.1) * 43758.5453); }',
    'float n11(float x){',
    '  float i = floor(x), f = fract(x);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  return mix(h11(i), h11(i + 1.0), f);',
    '}',
    'float bar(float v, float c, float hw, float s){',
    '  return 1.0 - smoothstep(hw, hw + s, abs(v - c));',
    '}',
    'void main(){',
    // Softness grows with distance, so a bar that is sub-pixel far away
    // widens into partial coverage instead of sparkling. It is the cheapest
    // honest antialiasing for a procedural repeat, and it is why a hundred
    // metres of trellis dissolves into a mass rather than a moiré.
    '  float soft = 0.005 + vDist * 0.0011;',
    '  float vsoft = min(0.05, soft * 0.8);',
    '  float U = vUv.x * uUnits;',
    '  float ui = floor(U), uf = fract(U);',
    '  float r = h11(ui + vSeed * 37.0);',
    '  float y = vUv.y;',
    '  float cord = 0.34;',
    '',
    // trunk, tapering as a forty-year-old cabernet trunk does
    '  float tw = mix(0.036, 0.020, clamp(y / cord, 0.0, 1.0)) * (0.85 + 0.30 * r);',
    '  float m = bar(uf, 0.5 + (r - 0.5) * 0.05, tw, soft) *',
    '            (1.0 - smoothstep(cord, cord + 0.04, y));',
    '',
    // cordon arm, fruiting wire, top wire — the frame that survives pruning
    '  m = max(m, bar(y, cord, 0.014, vsoft));',
    '  m = max(m, bar(y, 0.62, 0.007, vsoft) * 0.85);',
    '  m = max(m, bar(y, 0.86, 0.007, vsoft) * 0.85);',
    '',
    // a strainer post every seventh plant, taller than the top wire
    '  float isPost = 1.0 - step(0.5, mod(ui, 7.0));',
    '  m = max(m, isPost * bar(uf, 0.5, 0.040, soft) * (1.0 - smoothstep(0.90, 0.94, y)));',
    '',
    // spur canes: the stubs pruning leaves behind. Present all year, only
    // legible when the canopy is off them.
    '  float sp = max(bar(uf, 0.34 + r * 0.05, 0.014, soft),',
    '                 bar(uf, 0.66 - r * 0.05, 0.014, soft));',
    '  m = max(m, sp * (1.0 - smoothstep(cord + 0.02, cord + 0.15, y)) * step(cord - 0.01, y));',
    '',
    // canopy. Young vines are separate rounded bushes; as growth closes in the
    // lobes merge into one hedge. The top edge is ragged, never a ruled line.
    '  float lobe = 1.0 - pow(clamp(abs(uf - 0.5) * 2.0, 0.0, 1.0), 2.6);',
    '  float rag = (n11(U * 0.62 + vSeed * 13.0) - 0.5) * 0.11;',
    '  float top = cord + (0.09 + 0.44 * uGrowth) * (0.78 + 0.44 * r) *',
    '              mix(lobe, 1.0, smoothstep(0.35, 0.95, uGrowth)) + rag * uGrowth * 0.55;',
    '  float ce = clamp(soft * 1.5, 0.004, 0.035);',
    '  float canopy = smoothstep(0.02, 0.28, uGrowth) *',
    '                 (1.0 - smoothstep(top - ce, top + ce, y)) * step(cord - 0.02, y);',
    '  m = max(m, canopy);',
    '',
    // The understorey. Deep shade under the fruiting wire, and the row\'s own
    // shadow lying along its foot — without it the rows float above the ground
    // instead of standing in it.
    '  m = max(m, (1.0 - smoothstep(0.0, 0.13, y)) * (0.14 + 0.26 * uGrowth));',
    '',
    // and the whole row dissolves into the horizon haze with depth
    // the block has to end somewhere; fade the last six metres of the row so
    // its leading edge is a headland and not a cut slab
    // the block has to end somewhere; fade the last fifteen metres of the row
    // so its leading edge is a headland and not a cut slab
    '  float a = m * exp(-vDist * 0.0075) * smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);',
    '',
    '#ifdef DEPTH_PASS',
    // Depth-only pass. Rows are drawn as a multiply, and a multiply compounds:
    // twenty-six overlapping rows would grind the middle of the frame to black.
    // Laying down depth for the solid part of each canopy first means a row
    // hidden behind the one in front of it is rejected instead of doubling up.
    '  if(a < 0.55) discard;',
    '  gl_FragColor = vec4(1.0);',
    '#else',
    '  if(a < 0.004) discard;',
    '',
    // The rows are drawn as a MULTIPLY over whatever is already in the frame.
    // A silhouette is not a colour, it is a fraction of the light behind it —
    // so this stays correct at every hour without ever being told the sky's
    // exposure, and the vines can never come out brighter than the sky.
    '  vec3 wood = vec3(0.140, 0.114, 0.092);',
    '  vec3 leaf = vec3(0.082, 0.108, 0.070);',
    '  vec3 shade = mix(wood, leaf, uGrowth);',
    // Every row shares one normal, so the side of a row facing the sun and the
    // side facing away are exactly gl_FrontFacing and its negation. Lighting
    // the two differently is the cue that turns corduroy back into plants.
    '  float lit = uFace;',
    '  shade *= mix(0.42, 1.05, clamp(lit * 0.5 + 0.5, 0.0, 1.0));',
    // The crown: the top hand-width of the canopy, which is the only part of a
    // row the sky can see. Lighting it and leaving the body dark is what makes
    // a hundred rows read as rows and not as corrugated iron.
    '  float crown = canopy * smoothstep(top - 0.030, top - 0.004, y);',
    '  shade += crown * (0.15 + 0.50 * clamp(lit, 0.0, 1.0)) *',
    '           mix(vec3(0.88, 0.94, 1.0), vec3(1.30, 0.86, 0.42), uGold);',
    // autumn: a thin leaf at the top of the canopy transmits red and gold
    // rather than blocking, so the darkening lifts in exactly those channels
    '  float edge = canopy * smoothstep(top - 0.24, top, y);',
    '  shade += uGold * canopy * vec3(0.12, 0.062, 0.010);',
    '  shade += uGold * edge * vec3(0.34, 0.185, 0.028);',
    '  gl_FragColor = vec4(mix(vec3(1.0), min(shade, vec3(1.0)), clamp(a, 0.0, 1.0)), 1.0);',
    '#endif',
    '}'
  ].join('\n');

  /* ── mount ────────────────────────────────────────────────── */
  function mount(canvas, opts) {
    opts = opts || {};
    const THREE = root.THREE;
    const sun = root.VV && root.VV.sun;
    const sky = root.VV && root.VV.sky;
    if (!THREE || !sun || !sky) throw new Error('VV.stage: three, VV.sun and VV.sky must load first');

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const webgl2 = hasWebGL2();
    const still = reduced || !webgl2;
    const tierName = opts.tier || (still ? 'medium' : detectTier());
    const tier = TIERS[tierName] || TIERS.medium;

    let renderer, scene, camera, skyMesh, rows, rowsDepth, rowGeo, rowMat, rowDepthMat, skyMat, skyGeo;
    let raf = 0, frame = 0, draws = 0, dead = false, lost = false;
    let dpr = Math.min(window.devicePixelRatio || 1, tier.dpr);

    const quiet = [];
    for (let i = 0; i < MAX_RECTS; i++) quiet.push(new THREE.Vector4(0, 0, 0, 0));
    let quietEls = [];

    // sun direction and vine state are lerped, so scrubbing the year is a
    // continuous move of the light rather than a series of jumps
    const sunTarget = new THREE.Vector3(0, -0.4, -1);
    const sunNow = sunTarget.clone();
    let stTarget = vineState(1), stNow = { growth: 0, gold: 0, season: 0, turbidity: 1.3 };
    let day = 1, scrollT = 0, first = true;

    function build() {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: false, antialias: false, stencil: false,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(dpr);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.setClearColor(0x05070c, 1);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
      camera.position.set(0, 1.7, 0);

      skyGeo = new THREE.PlaneGeometry(2, 2);
      skyMat = new THREE.ShaderMaterial({
        vertexShader: sky.VERT,
        fragmentShader: sky.FRAG,
        defines: { PRIMARY_STEPS: tier.primary, LIGHT_STEPS: tier.light },
        depthTest: false, depthWrite: false,
        uniforms: {
          uSunDir: { value: sunNow },
          uTurbidity: { value: 1.3 },
          uExposure: { value: 1.0 },
          uQuiet: { value: quiet },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uSeason: { value: 0 },
          uTime: { value: 0 },
          uInvProj: { value: new THREE.Matrix4() },
          uCamWorld: { value: new THREE.Matrix4() }
        }
      });
      skyMesh = new THREE.Mesh(skyGeo, skyMat);
      skyMesh.frustumCulled = false;
      skyMesh.renderOrder = -10;
      scene.add(skyMesh);

      buildRows();
      resize();
    }

    function buildRows() {
      const n = tier.rows;
      rowGeo = new THREE.PlaneGeometry(1, 1);
      const seeds = new Float32Array(n);
      const rowUniforms = {
        uGrowth: { value: 0 },
        uGold: { value: 0 },
        uUnits: { value: Math.round(ROW_LEN / VINE_GAP) },
        uFace: { value: 0 },
        uRowU: { value: new THREE.Vector3(-Math.cos(ROW_DIR), 0, Math.sin(ROW_DIR)) },
        uRowLen: { value: ROW_LEN },
        uRowH: { value: ROW_H }
      };
      rowMat = new THREE.ShaderMaterial({
        vertexShader: ROW_VERT,
        fragmentShader: ROW_FRAG,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: true, depthWrite: false,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.DstColorFactor,
        blendDst: THREE.ZeroFactor,
        uniforms: rowUniforms
      });
      rowDepthMat = new THREE.ShaderMaterial({
        vertexShader: ROW_VERT,
        fragmentShader: ROW_FRAG,
        defines: { DEPTH_PASS: 1 },
        side: THREE.DoubleSide,
        colorWrite: false,
        depthTest: true, depthWrite: true,
        uniforms: rowUniforms
      });
      rows = new THREE.InstancedMesh(rowGeo, rowMat, n);
      rows.frustumCulled = false;

      // Rows run due west, straight away from the camera, and the camera
      // stands in a lane between two of them: that is the vineyard photograph
      // everyone has seen, and it is the arrangement in which a flat quad
      // reads as a wall of fruit rather than a card. Laid out far-to-near so
      // the unsorted instanced draw still composites back to front.
      // u runs along a row, p steps from one row to the next and away from the
      // camera. Furthest first, so the unsorted instanced draw still composites
      // back to front where the depth pass lets both through.
      const u = new THREE.Vector3(-Math.cos(ROW_DIR), 0, Math.sin(ROW_DIR));
      const p = new THREE.Vector3(Math.sin(ROW_DIR), 0, Math.cos(ROW_DIR));
      const m = new THREE.Matrix4(), pos = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const k = n - 1 - i;                            // furthest row drawn first
        const d = ROW_NEAR + k * ROW_GAP;
        pos.copy(p).multiplyScalar(-d).addScaledVector(u, -ROW_LEN * 0.12);
        pos.y = 0;                                      // the row stands on the ground
        m.makeTranslation(pos.x, pos.y, pos.z);
        rows.setMatrixAt(i, m);
        seeds[i] = ((k * 7919) % 101) / 101;
      }
      rows.instanceMatrix.needsUpdate = true;
      rowGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
      rowsDepth = new THREE.InstancedMesh(rowGeo, rowDepthMat, n);
      rowsDepth.instanceMatrix = rows.instanceMatrix;   // one buffer, two passes
      rowsDepth.frustumCulled = false;
      rowsDepth.renderOrder = -1;
      scene.add(rowsDepth);
      scene.add(rows);
    }

    function teardown() {
      if (rowsDepth) { scene.remove(rowsDepth); rowsDepth.dispose(); }
      if (rows) { scene.remove(rows); rows.dispose(); }
      if (skyMesh) scene.remove(skyMesh);
      [rowGeo, skyGeo].forEach(g => g && g.dispose());
      [rowMat, rowDepthMat, skyMat].forEach(mt => mt && mt.dispose());
      if (renderer) { renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); }
      renderer = scene = camera = skyMesh = rows = rowsDepth = rowGeo = rowMat = rowDepthMat = skyMat = skyGeo = null;
    }

    /* ── the day ─────────────────────────────────────────────── */
    function setDay(doy) {
      day = doy;
      const date = ceremonyDate(doy);
      const p = sun.sunPosition(date, LAT, LON, TZ);
      const v = sunVector(p.elevation, p.azimuth);
      sunTarget.set(v.x, v.y, v.z).normalize();
      stTarget = vineState(doy);
      if (first) {
        first = false;
        sunNow.copy(sunTarget);
        stNow = { growth: stTarget.growth, gold: stTarget.gold, season: stTarget.season, turbidity: stTarget.turbidity };
      }
      if (still) draw(0);
    }

    /* ── quiet rects ─────────────────────────────────────────── */
    function setQuietRects(els) {
      quietEls = Array.prototype.slice.call(els || []);
      collect();
    }

    function collect() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const scored = quietEls
        .map(el => el.getBoundingClientRect())
        .filter(r => r.bottom > 0 && r.top < vh && r.width > 0 && r.height > 0)
        .map(r => ({ r, d: Math.abs(r.top + r.height / 2 - vh / 2) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, MAX_RECTS);
      for (let i = 0; i < MAX_RECTS; i++) {
        const s = scored[i];
        if (!s) { quiet[i].set(0, 0, 0, 0); continue; }
        const r = s.r;
        quiet[i].set(
          ((r.left + r.width / 2) / vw) * 2 - 1,
          1 - ((r.top + r.height / 2) / vh) * 2,
          r.width / vw,
          r.height / vh
        );
      }
    }

    /* ── frame ───────────────────────────────────────────────── */
    function resize() {
      if (!renderer) return;
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // the horizon sits about a third up the frame, so the ground is the
      // bottom third and the sky owns the rest
      camera.updateProjectionMatrix();
      skyMat.uniforms.uResolution.value.set(w * dpr, h * dpr);
    }

    function draw(t) {
      if (!renderer) return;
      draws++;
      const k = still ? 1 : 0.085;
      sunNow.lerp(sunTarget, k).normalize();
      stNow.growth += (stTarget.growth - stNow.growth) * k;
      stNow.gold += (stTarget.gold - stNow.gold) * k;
      stNow.season += (stTarget.season - stNow.season) * k;
      stNow.turbidity += (stTarget.turbidity - stNow.turbidity) * k;

      // parallax: a couple of metres across the rows and a hand's width of
      // height over the whole document. Any more and the horizon swims.
      const par = still ? 0 : scrollT;
      const cy = CAM_H + par * 0.55, cz = -1.0 + par * 3.2;
      camera.position.set(0, cy, cz);
      // due west, pitched up 4°: the horizon lands at 58% and the block fills
      // the bottom of the frame. Scroll walks the viewer sideways along the
      // headland, which is enough parallax to feel and not enough to swim.
      camera.lookAt(-60, cy + 60 * Math.tan(CAM_PITCH), cz);
      camera.updateMatrixWorld();

      const su = skyMat.uniforms;
      su.uSeason.value = stNow.season;
      su.uTurbidity.value = stNow.turbidity;
      // the eye opens as the light goes. Blended on the sun's own height, so
      // it is one continuous adaptation and not a night mode.
      const ad = Math.max(0, Math.min(1, (sunNow.y + 0.25) / 0.31));
      su.uExposure.value = 18.0 + (0.72 - 18.0) * (ad * ad * (3 - 2 * ad));
      su.uTime.value = t * 0.001;
      su.uInvProj.value.copy(camera.projectionMatrix).invert();
      su.uCamWorld.value.copy(camera.matrixWorld);

      const ru = rowMat.uniforms;
      ru.uGrowth.value = stNow.growth;
      ru.uGold.value = stNow.gold;
      // the row plane's own normal against the sun — see uFace in ROW_FRAG
      ru.uFace.value = -Math.sin(ROW_DIR) * sunNow.x - Math.cos(ROW_DIR) * sunNow.z;
      renderer.render(scene, camera);
    }

    let last = 0, slow = 0;
    function loop(t) {
      raf = requestAnimationFrame(loop);
      if (dead || lost) return;
      if (++frame % 3 === 0) collect();
      draw(t);
      // one downward step only, on a sustained miss — never back up
      if (last) {
        const dt = t - last;
        if (dt > 34) { if (++slow > 40 && dpr > 1) { dpr = 1; resize(); slow = -1e9; } }
        else if (slow > 0) slow--;
      }
      last = t;
    }

    /* ── listeners ───────────────────────────────────────────── */
    const onResize = () => { resize(); collect(); if (still) draw(0); };
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollT = Math.max(0, Math.min(1, window.scrollY / max));
    };
    const onLost = e => { e.preventDefault(); lost = true; cancelAnimationFrame(raf); raf = 0; };
    const onRestored = () => {
      lost = false;
      teardown();
      build();
      first = true;
      setDay(day);
      collect();
      if (!still && !raf) raf = requestAnimationFrame(loop);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    canvas.addEventListener('webglcontextlost', onLost, false);
    canvas.addEventListener('webglcontextrestored', onRestored, false);

    build();
    onScroll();
    setDay(opts.day || 1);
    collect();
    if (still) draw(0);
    else raf = requestAnimationFrame(loop);

    return {
      tier: tierName,
      still: still,
      webgl2: webgl2,
      setDay: setDay,
      setQuietRects: setQuietRects,
      renderOnce: () => draw(performance.now()),
      draws: () => draws,
      /* Verification hook: drive the sun straight from an elevation/azimuth so
         a filmstrip can sweep an hour without the ceremony-hour pin. */
      setSunOverride: function (elevation, azimuth) {
        const v = sunVector(elevation, azimuth);
        sunTarget.set(v.x, v.y, v.z).normalize();
        sunNow.copy(sunTarget);
        if (still) draw(0);
      },
      destroy: function () {
        dead = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        window.removeEventListener('resize', onResize);
        window.removeEventListener('scroll', onScroll);
        canvas.removeEventListener('webglcontextlost', onLost, false);
        canvas.removeEventListener('webglcontextrestored', onRestored, false);
        teardown();
      }
    };
  }

  return { mount, vineState, ceremonyDate, sunVector, TIERS };
});
