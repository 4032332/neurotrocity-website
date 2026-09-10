/* Route study — the Great Ocean Road as an interface.
 *
 * Everything spatial here is measured: 700 road points from OpenStreetMap,
 * height from the ASTER global elevation model. The contour bands either side
 * are DERIVED from the road rather than surveyed, and are stated as such in the
 * colophon — they are a reading of the road, deliberately diagrammatic, so the
 * piece never invites comparison with a photograph of the coast.
 */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 720px)').matches;

  var VE = 6.0;            // vertical exaggeration: 451 m over 179 km is invisible at 1:1
    var CAM_BACK = 1900;      // metres behind the current point
  var CAM_UP = 1150;         // metres above the road surface
  var CAM_AHEAD = 950;    // metres down the road the camera aims at
  var SCROLL_PX = small ? 7200 : 11000;

  var COL = {
    road: [0.78, 1.0, 0.18],   // volt
    sea: [0.21, 0.88, 1.0],    // cyan
    land: [1.0, 0.48, 0.24]    // ember
  };

  var PROBE = /(^|[?&])probe(=|&|$)/.test(location.search);

  var st = {
    dist: 0, target: 0, i: 0, roll: 0, dragging: false, ready: false
  };
  var D = null;

  Promise.all([
    fetch('data/gor.json').then(function (r) { return r.json(); }),
    fetch('data/coast.json').then(function (r) { return r.json(); })
  ]).then(function (res) { start(res[0], res[1]); })
    .catch(function (e) { console.error('route data failed', e); });

  /* ------------------------------------------------------------------ maths */

  // Cheap deterministic value noise so the contour bands ripple like country
  // instead of fanning out as a clean wedge. Same input, same result, always.
  function hash(a, b) {
    var n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function noise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi), b = hash(xi + 1, yi);
    var c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return (a + (b - a) * u) + ((c - a) + (d - c) * u - (b - a) * u) * v;
  }

  function fbm(x, y) {
    return noise(x, y) * 0.56 + noise(x * 2.03, y * 2.03) * 0.29
         + noise(x * 4.11, y * 4.11) * 0.15;
  }

  function smooth(arr, w) {
    var out = new Float32Array(arr.length);
    for (var i = 0; i < arr.length; i++) {
      var s = 0, n = 0;
      for (var k = -w; k <= w; k++) {
        var j = i + k;
        if (j < 0 || j >= arr.length) continue;
        s += arr[j]; n++;
      }
      out[i] = s / n;
    }
    return out;
  }

  /* ------------------------------------------------------------------ scene */

  function start(data, coast) {
    D = data;

    var N = D.xyz.length;
    var elev = new Float32Array(N);
    for (var i = 0; i < N; i++) elev[i] = D.xyz[i][2];
    var se = smooth(elev, 2);

    var SUB = 5;                         // OSM gives a point every 266 m; at that
    var SRC = N;                         // spacing the corners render as polygons
    var sx = new Float32Array(N), sz = new Float32Array(N);
    for (i = 0; i < N; i++) { sx[i] = D.xyz[i][0]; sz[i] = -D.xyz[i][1]; }

    N = (SRC - 1) * SUB + 1;
    var X = new Float32Array(N), Z = new Float32Array(N), EL = new Float32Array(N);

    function cr(a, b, c, d, t) {         // Catmull-Rom through b and c
      var t2 = t * t, t3 = t2 * t;
      return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 +
                    (-a + 3 * b - 3 * c + d) * t3);
    }
    function at(arr, k) { return arr[Math.max(0, Math.min(SRC - 1, k))]; }

    for (var m = 0; m < N; m++) {
      var seg = Math.min(SRC - 2, Math.floor(m / SUB));
      var t = (m - seg * SUB) / SUB;
      X[m] = cr(at(sx, seg - 1), sx[seg], sx[seg + 1], at(sx, seg + 2), t);
      Z[m] = cr(at(sz, seg - 1), sz[seg], sz[seg + 1], at(sz, seg + 2), t);
      EL[m] = cr(at(se, seg - 1), se[seg], se[seg + 1], at(se, seg + 2), t);
    }
    se = EL;

    var CUM = new Float32Array(N);
    for (m = 1; m < N; m++) {
      CUM[m] = CUM[m - 1] + Math.hypot(X[m] - X[m - 1], Z[m] - Z[m - 1]);
    }

    // unit normal pointing right of travel. Heading west, that is inland.
    var nx = new Float32Array(N), nz = new Float32Array(N);
    for (i = 0; i < N; i++) {
      var ia = Math.max(0, i - 2), ib = Math.min(N - 1, i + 2);
      var dx = X[ib] - X[ia], dz = Z[ib] - Z[ia];
      var len = Math.hypot(dx, dz) || 1;
      nx[i] = -dz / len; nz[i] = dx / len;
    }

    var canvas = $('#stage');
    var gl;
    try {
      gl = new THREE.WebGLRenderer({
        canvas: canvas, antialias: !small, alpha: false,
        preserveDrawingBuffer: PROBE
      });
    } catch (e) {
      document.body.classList.add('nogl');
      return;
    }
    gl.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 2 : 1.75));
    gl.setClearColor(0x05070f, 1);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070f, 0.00007);

    var cam = new THREE.PerspectiveCamera(58, 1, 20, 42000);
    scene.add(cam);

    var sky = new THREE.Mesh(
      new THREE.SphereGeometry(26000, 24, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        vertexShader: 'varying float vY; void main() { vY = normalize(position).y;' +
          ' gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'precision mediump float; varying float vY;' +
          ' void main() {' +
          '  float t = clamp(vY, -1.0, 1.0);' +
          '  vec3 low = vec3(0.055, 0.086, 0.145);' +
          '  vec3 mid = vec3(0.020, 0.027, 0.059);' +
          '  vec3 top = vec3(0.008, 0.011, 0.027);' +
          '  vec3 c = mix(low, mid, smoothstep(-0.02, 0.16, t));' +
          '  c = mix(c, top, smoothstep(0.16, 0.62, t));' +
          '  c += vec3(0.10, 0.14, 0.04) * pow(max(0.0, 1.0 - abs(t) * 9.0), 3.0) * 0.5;' +
          '  gl_FragColor = vec4(c, 1.0); }'
      })
    );
    sky.frustumCulled = false;
    scene.add(sky);

    /* --- Nothing here is invented country. The piece draws only what was
     * measured: the road in space, its plan shadow on a datum below, the
     * vertical distance between the two, and the gradient at every point. It
     * is a drawing of a road, not a picture of a coast. --- */

    var COAST_HATCH = 260;
    var DATUM = -520;        // world units below the origin; the road floats above it

    /* --- the datum: a measured 1 km grid --- */

    var grid = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: {
          uEye: { value: new THREE.Vector3() },
          uCyan: { value: new THREE.Color(0x35e0ff) },
          uReach: { value: 15000 }
        },
        vertexShader: [
          'varying vec3 vW;',
          'void main() {',
          '  vec4 wp = modelMatrix * vec4(position, 1.0);',
          '  vW = wp.xyz;',
          '  gl_Position = projectionMatrix * viewMatrix * wp;',
          '}'
        ].join('\n'),
        fragmentShader: [
          'precision highp float;',
          'uniform vec3 uEye, uCyan;',
          'uniform float uReach;',
          'varying vec3 vW;',
          'float rule(float v, float step_, float w) {',
          '  float g = abs(fract(v / step_ - 0.5) - 0.5) / max(fwidth(v / step_), 1e-5);',
          '  return 1.0 - clamp(g - w, 0.0, 1.0);',
          '}',
          'void main() {',
          '  float fine = max(rule(vW.x, 1000.0, 0.4), rule(vW.z, 1000.0, 0.4));',
          '  float coarse = max(rule(vW.x, 5000.0, 0.9), rule(vW.z, 5000.0, 0.9));',
          '  float d = distance(vW.xz, uEye.xz);',
          '  float fall = 1.0 - smoothstep(uReach * 0.25, uReach, d);',
          '  float a = (fine * 0.085 + coarse * 0.20) * fall;',
          '  if (a < 0.004) discard;',
          '  gl_FragColor = vec4(uCyan, a);',
          '}'
        ].join('\n')
      })
    );
    grid.rotation.x = -Math.PI / 2;
    grid.scale.set(60000, 60000, 1);
    grid.position.y = DATUM;
    grid.frustumCulled = false;
    scene.add(grid);

    /* --- the coastline, measured, drawn on the datum with the hatch that
     *     shorelines carry on a chart --- */

    (function shore() {
      if (!coast || !coast.strands) return;
      var pos = [], col = [];
      var C = [0.21, 0.88, 1.0], y = DATUM + 2;
      coast.strands.forEach(function (pts) {
        for (var k = 0; k < pts.length - 1; k++) {
          pos.push(pts[k][0], y, pts[k][1]);
          pos.push(pts[k + 1][0], y, pts[k + 1][1]);
          col.push(C[0] * 0.62, C[1] * 0.62, C[2] * 0.62);
          col.push(C[0] * 0.62, C[1] * 0.62, C[2] * 0.62);
          if (k % 4) continue;
          var dx = pts[k + 1][0] - pts[k][0], dz = pts[k + 1][1] - pts[k][1];
          var L = Math.hypot(dx, dz) || 1;
          // OSM draws coastline with the land on its left, so the sea lies to
          // the right of travel; the hatch goes out over the water
          var hx = -dz / L * COAST_HATCH, hz = dx / L * COAST_HATCH;
          pos.push(pts[k][0], y, pts[k][1]);
          pos.push(pts[k][0] + hx, y, pts[k][1] + hz);
          col.push(C[0] * 0.34, C[1] * 0.34, C[2] * 0.34);
          col.push(0, 0, 0);
        }
      });
      addLines(pos, col, 0.9);
    })();

    /* --- gradient, from the real elevation profile --- */

    var grade = new Float32Array(N);     // metres risen per metre travelled
    for (i = 0; i < N; i++) {
      var ga = Math.max(0, i - 5), gb = Math.min(N - 1, i + 5);
      var run = Math.max(1, CUM[gb] - CUM[ga]);
      grade[i] = (se[gb] - se[ga]) / run;
    }

    function addLines(pos, col, opacity) {
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      var m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: opacity,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.frustumCulled = false;
      scene.add(m);
      return m;
    }

    function roadY(i) { return se[i] * VE; }

    /* --- the gradient comb: a tick at every point, its length the grade,
     *     ember where the road climbs and cyan where it falls --- */

    (function comb() {
      var pos = [], col = [];
      for (var i = 0; i < N; i += 2) {
        var g = grade[i];
        var mag = Math.min(1, Math.abs(g) / 0.055);
        var len = 70 + mag * 430;
        var up = g >= 0;
        var c = up ? COL.land : COL.sea;
        var a = 0.30 + mag * 0.70;
        var y = roadY(i);
        var s = up ? 1 : -1;                 // climbs point inland, falls seaward
        for (var o = -1; o <= 1; o += 2) {
          var ox = -nz[i] * 9 * o, oz = nx[i] * 9 * o;
          pos.push(X[i] + nx[i] * 38 * s + ox, y, Z[i] + nz[i] * 38 * s + oz);
          pos.push(X[i] + nx[i] * len * s + ox, y, Z[i] + nz[i] * len * s + oz);
          col.push(c[0] * a, c[1] * a, c[2] * a);
          col.push(c[0] * a * 0.06, c[1] * a * 0.06, c[2] * a * 0.06);
        }
      }
      addLines(pos, col, 0.95);
    })();

    /* --- droplines: the gap between road and datum is the elevation --- */

    (function drops() {
      var pos = [], col = [];
      for (var i = 0; i < N; i += 14) {
        var t = Math.min(1, se[i] / 460);
        var a = 0.10 + t * 0.45;
        pos.push(X[i], DATUM, Z[i]);
        pos.push(X[i], roadY(i), Z[i]);
        col.push(COL.sea[0] * 0.02, COL.sea[1] * 0.02, COL.sea[2] * 0.02);
        col.push(COL.road[0] * a, COL.road[1] * a, COL.road[2] * a);
      }
      addLines(pos, col, 0.9);
    })();

    /* --- the plan shadow on the datum: the route as it reads on a map --- */

    (function plan() {
      var p = [];
      for (var i = 0; i < N; i++) p.push(X[i], DATUM + 1, Z[i]);
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      var m = new THREE.Line(g, new THREE.LineBasicMaterial({
        color: 0x8aa02a, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      m.frustumCulled = false;
      scene.add(m);
    })();

    /* --- the road: a ribbon, banked into its own corners --- */

    var W = 34;
    var rp = [], rc = [], ri = [];
    for (i = 0; i < N; i++) {
      var y = roadY(i);
      var gm = Math.max(-1, Math.min(1, grade[i] / 0.05));
      var tgt = gm >= 0 ? COL.land : COL.sea;
      var w = Math.abs(gm) * 0.85;
      var lit = 0.24 + Math.abs(gm) * 0.26;
      var cr0 = (COL.road[0] * (1 - w) + tgt[0] * w) * lit;
      var cr1 = (COL.road[1] * (1 - w) + tgt[1] * w) * lit;
      var cr2 = (COL.road[2] * (1 - w) + tgt[2] * w) * lit;
      rp.push(X[i] - nx[i] * W, y, Z[i] - nz[i] * W);
      rp.push(X[i] + nx[i] * W, y, Z[i] + nz[i] * W);
      rc.push(cr0, cr1, cr2);
      rc.push(cr0, cr1, cr2);
      if (i < N - 1) {
        var k = i * 2;
        ri.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    var rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
    rg.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3));
    rg.setIndex(ri);
    var ribbon = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.95, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    ribbon.frustumCulled = false;
    scene.add(ribbon);

    (function edges() {
      var pos = [], col = [];
      for (var i = 0; i < N - 1; i++) {
        for (var s = -1; s <= 1; s += 2) {
          pos.push(X[i] + nx[i] * W * s, roadY(i), Z[i] + nz[i] * W * s);
          pos.push(X[i + 1] + nx[i + 1] * W * s, roadY(i + 1), Z[i + 1] + nz[i + 1] * W * s);
          var e0 = Math.max(-1, Math.min(1, grade[i] / 0.05));
          var et = e0 >= 0 ? COL.land : COL.sea, ew = Math.abs(e0) * 0.8;
          col.push(COL.road[0] * (1 - ew) + et[0] * ew,
                   COL.road[1] * (1 - ew) + et[1] * ew,
                   COL.road[2] * (1 - ew) + et[2] * ew);
          col.push(COL.road[0] * (1 - ew) + et[0] * ew,
                   COL.road[1] * (1 - ew) + et[1] * ew,
                   COL.road[2] * (1 - ew) + et[2] * ew);
        }
      }
      addLines(pos, col, 0.95);
    })();

    /* --- a mast at each real place, datum to sky --- */

    (function masts() {
      var pos = [], col = [];
      D.towns.forEach(function (t) {
        var x = X[t.i * SUB], z = Z[t.i * SUB], y = roadY(t.i * SUB);
        pos.push(x, DATUM, z); pos.push(x, y + 520, z);
        col.push(0.02, 0.03, 0.01);
        col.push(COL.road[0] * 0.55, COL.road[1] * 0.55, COL.road[2] * 0.55);
        // a crossbar at road height, so the mast reads as a marker not a beam
        pos.push(x - nx[t.i * SUB] * 150, y, z - nz[t.i * SUB] * 150);
        pos.push(x + nx[t.i * SUB] * 150, y, z + nz[t.i * SUB] * 150);
        col.push(COL.road[0] * 0.7, COL.road[1] * 0.7, COL.road[2] * 0.7);
        col.push(COL.road[0] * 0.7, COL.road[1] * 0.7, COL.road[2] * 0.7);
      });
      addLines(pos, col, 0.9);
    })();

    /* --- signals running ahead down the road --- */

    var SIG = small ? 12 : 22;
    var sigOff = new Float32Array(SIG);
    for (i = 0; i < SIG; i++) sigOff[i] = i / SIG;
    var sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(SIG * 3), 3));
    var signals = new THREE.Points(sg, new THREE.PointsMaterial({
      color: 0xffffff, size: 5, sizeAttenuation: false, transparent: true,
      opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    signals.frustumCulled = false;
    scene.add(signals);

    /* -------------------------------------------------------------- scroll */

    var spacer = document.createElement('div');
    spacer.style.height = SCROLL_PX + 'px';
    spacer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spacer);

    var total = CUM[N - 1];

    function maxScroll() {
      return Math.max(1, document.documentElement.scrollHeight - innerHeight);
    }

    function fromScroll() {
      if (st.dragging) return;
      st.target = (scrollY / maxScroll()) * total;
    }
    addEventListener('scroll', fromScroll, { passive: true });

    var scrub = $('#scrub');
    scrub.addEventListener('input', function () {
      st.dragging = true;
      st.target = (scrub.value / 1000) * total;
      scrollTo({ top: (scrub.value / 1000) * maxScroll(), behavior: 'auto' });
    });
    ['change', 'pointerup', 'blur'].forEach(function (ev) {
      scrub.addEventListener(ev, function () { st.dragging = false; });
    });

    /* ---------------------------------------------------------------- hud */

    buildProfile(elev, D.cum[SRC - 1]);

    var eKm = $('#rKm'), eEl = $('#rEl'), eBg = $('#rBg');
    var ePl = $('#rPlace'), eDs = $('#rDist'), eHead = $('#head');
    var tickEls = Array.prototype.slice.call(document.querySelectorAll('.tick'));
    var lastI = -1;

    var COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    function updateHud(i, frac) {
      if (i === lastI) return;
      lastI = i;
      var src = Math.min(SRC - 1, Math.round(i / SUB));
      eKm.textContent = (CUM[i] / 1000).toFixed(1);
      eEl.textContent = Math.round(D.xyz[src][2]);
      eBg.textContent = COMPASS[Math.round(D.head[src] / 45) % 8];

      var next = null;
      for (var t = 0; t < D.towns.length; t++) {
        if (D.towns[t].i >= src) { next = D.towns[t]; break; }
      }
      if (!next) next = D.towns[D.towns.length - 1];
      ePl.textContent = next.name;
      eDs.textContent = Math.max(0, (CUM[next.i * SUB] - CUM[i]) / 1000).toFixed(1);

      tickEls.forEach(function (el) {
        el.classList.toggle('on', el.dataset.name === next.name);
      });

      var p = CUM[i] / total;
      // the playhead tracks the profile, which is inset from the strip
      // SVG elements have no offsetLeft, so measure the ticks rail instead
      var rail = document.getElementById('ticks');
      eHead.style.transform =
        'translateX(' + (rail.offsetLeft + p * rail.clientWidth) + 'px)';
      if (!st.dragging) scrub.value = String(Math.round(p * 1000));
    }

    /* --------------------------------------------------------------- loop */

    function indexAt(d) {
      var lo = 0, hi = N - 1;
      while (lo < hi) {
        var mid = (lo + hi) >> 1;
        if (CUM[mid] < d) lo = mid + 1; else hi = mid;
      }
      return lo;
    }

    var tmp = new THREE.Vector3(), fwd = new THREE.Vector3(), up = new THREE.Vector3();

    function resize() {
      var w = innerWidth, h = innerHeight;
      gl.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    addEventListener('resize', resize);
    resize();

    function step() {
      st.dist += (st.target - st.dist) * (reduced ? 1 : 0.085);
      var i = indexAt(st.dist);
      st.i = i;

      var ahead = indexAt(Math.min(total, st.dist + CAM_AHEAD));
      var back = indexAt(Math.max(0, st.dist - CAM_BACK));

      // sit just above and behind, so the road runs out from under you
      // stand a little seaward of the road, so the coast stays in frame
      cam.position.set(X[back] - nx[back] * 420, se[back] * VE + CAM_UP,
                       Z[back] - nz[back] * 420);

      // bank into the corner, from the road's real curvature
      var c = Math.max(-70, Math.min(70, D.curv[Math.min(SRC - 1, Math.round(i / SUB))]));
      st.roll += (c * 0.0042 - st.roll) * (reduced ? 1 : 0.06);

      // aim at the centroid of the road over the next few kilometres, so the
      // route sits in the frame instead of sliding to one edge
      var far = indexAt(Math.min(total, st.dist + 6000));
      var mx = 0, mz = 0, cnt = 0;
      for (var q = i; q <= far; q += 4) { mx += X[q]; mz += Z[q]; cnt++; }
      if (!cnt) { mx = X[ahead]; mz = Z[ahead]; cnt = 1; }
      tmp.set((mx / cnt) * 0.55 + X[ahead] * 0.45, se[ahead] * VE + 26,
              (mz / cnt) * 0.55 + Z[ahead] * 0.45);
      fwd.copy(tmp).sub(cam.position).normalize();
      up.set(0, 1, 0).applyAxisAngle(fwd, st.roll);
      cam.up.copy(up);
      cam.lookAt(tmp);

      // signals slide forward down the road ahead of the camera
      var sp = sg.attributes.position.array;
      for (var k = 0; k < SIG; k++) {
        if (!reduced) sigOff[k] = (sigOff[k] + 0.0022) % 1;
        var si = Math.min(N - 1, i + Math.floor(sigOff[k] * 260));
        sp[k * 3] = X[si];
        sp[k * 3 + 1] = se[si] * VE + 14;
        sp[k * 3 + 2] = Z[si];
      }
      sg.attributes.position.needsUpdate = true;

      sky.position.copy(cam.position);
      grid.material.uniforms.uEye.value.copy(cam.position);
      grid.position.x = cam.position.x;
      grid.position.z = cam.position.z;
      updateHud(i);
      showPanelFor(st.dist / 1000);
      gl.render(scene, cam);
    }

    function frame() {
      requestAnimationFrame(frame);
      step();
    }

    if (PROBE) {
      // rAF is throttled to nothing when the page is backgrounded, so expose a
      // way to place the camera and render one deterministic frame.
      window.__route = {
        at: function (km, w, h) {
          if (w) { gl.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
          st.target = st.dist = km * 1000;
          st.roll = Math.max(-70, Math.min(70, D.curv[Math.round(indexAt(st.dist) / SUB)])) * 0.0042;
          lastI = -1;
          step();
          return canvas.toDataURL('image/png');
        },
        total: total
      };
    }

    $('#hud').hidden = false;
    $('#strip').hidden = false;
    st.ready = true;
    fromScroll();
    st.dist = st.target;
    requestAnimationFrame(frame);

    panels = Array.prototype.map.call(document.querySelectorAll('.panel'),
      function (el) { return { el: el, km: Number(el.dataset.at) || 0 }; });
  }

  /* ------------------------------------------------------- profile + panels */

  function buildProfile(se, total) {
    var N = se.length;
    var hi = 0;
    for (var i = 0; i < N; i++) if (se[i] > hi) hi = se[i];
    hi = Math.max(hi, 1);

    var line = '', fill = 'M0,90 ';
    for (i = 0; i < N; i++) {
      var x = (D.cum[i] / total) * 1000;
      var y = 90 - (se[i] / hi) * 78;
      line += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
      fill += 'L' + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    document.getElementById('pLine').setAttribute('d', line);
    document.getElementById('pFill').setAttribute('d', fill + 'L1000,90 Z');

    var ticks = document.getElementById('ticks');
    var lastPct = -99;
    D.towns.forEach(function (t) {
      var pct = (D.cum[t.i] / total) * 100;
      var el = document.createElement('span');
      el.className = 'tick';
      el.dataset.name = t.name;
      el.style.left = pct.toFixed(2) + '%';
      // labels closer than this overprint each other; keep the mark, drop the name
      if (pct - lastPct < (small ? 30 : 5.5)) {
        el.classList.add('bare');
        el.textContent = '\u00b7';
      } else {
        el.textContent = t.name;
        lastPct = pct;
      }
      // the end labels would otherwise be cut off by the edge of the rail
      if (pct < 3) el.classList.add('at-start');
      if (pct > 97) el.classList.add('at-end');
      ticks.appendChild(el);
    });
  }

  var panels = [];

  function showPanelFor(km) {
    for (var i = 0; i < panels.length; i++) {
      panels[i].el.classList.toggle('in', Math.abs(km - panels[i].km) < 9);
    }
  }
})();
