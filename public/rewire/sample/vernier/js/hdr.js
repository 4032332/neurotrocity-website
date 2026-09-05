/* VERNIER — Radiance .hdr (RGBE) loader. The bundled three.min.js (r128) has no
   RGBELoader, so this decodes the file into a float equirectangular
   DataTexture that PMREMGenerator can turn into a real environment. A studio
   HDRI is what makes brushed and polished metal read as metal: every
   reflection is a real light with real falloff, not a flat panel. */
(function () {
  'use strict';
  const V = window.Vernier = window.Vernier || {};

  function parse(buffer) {
    const bytes = new Uint8Array(buffer);
    let pos = 0;
    function line() { let s = ''; while (pos < bytes.length) { const c = bytes[pos++]; if (c === 10) break; s += String.fromCharCode(c); } return s; }
    if (line().indexOf('#?') !== 0) throw new Error('not a Radiance HDR');
    let w = 0, h = 0, flipX = false, flipY = false;
    for (;;) {
      const l = line();
      if (l === '') continue;
      const m = /^([-+])Y (\d+) ([-+])X (\d+)$/.exec(l);
      if (m) { h = +m[2]; w = +m[4]; flipY = m[1] === '+'; flipX = m[3] === '-'; break; }
      if (pos >= bytes.length) throw new Error('bad HDR header');
    }
    const out = new Float32Array(w * h * 3);
    const scan = new Uint8Array(w * 4);
    for (let y = 0; y < h; y++) {
      const b0 = bytes[pos], b1 = bytes[pos + 1], b2 = bytes[pos + 2], b3 = bytes[pos + 3];
      const rle = b0 === 2 && b1 === 2 && ((b2 << 8) | b3) === w && w >= 8 && w < 32768;
      if (rle) {
        pos += 4;
        for (let c = 0; c < 4; c++) {
          let x = 0;
          while (x < w) {
            let n = bytes[pos++];
            if (n > 128) { n -= 128; const v = bytes[pos++]; for (let i = 0; i < n; i++) scan[(x++) * 4 + c] = v; }
            else { for (let i = 0; i < n; i++) scan[(x++) * 4 + c] = bytes[pos++]; }
          }
        }
      } else {
        for (let x = 0; x < w * 4; x++) scan[x] = bytes[pos++];
      }
      const row = flipY ? h - 1 - y : y;
      for (let x = 0; x < w; x++) {
        const e = scan[x * 4 + 3], xx = flipX ? w - 1 - x : x;
        const f = e ? Math.pow(2, e - 136) : 0;   // 2^(e-128) / 256
        const o = (row * w + xx) * 3;
        out[o] = scan[x * 4] * f; out[o + 1] = scan[x * 4 + 1] * f; out[o + 2] = scan[x * 4 + 2] * f;
      }
    }
    return { width: w, height: h, data: out };
  }

  /* Resolves to a PMREM environment texture, or rejects (caller keeps its fallback). */
  function loadEnvironment(url, renderer) {
    return fetch(url).then(r => { if (!r.ok) throw new Error('HDR ' + r.status); return r.arrayBuffer(); }).then(buf => {
      const img = parse(buf);
      const tex = new THREE.DataTexture(img.data, img.width, img.height, THREE.RGBFormat, THREE.FloatType);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.encoding = THREE.LinearEncoding;
      tex.flipY = true;
      tex.needsUpdate = true;
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const env = pmrem.fromEquirectangular(tex).texture;
      tex.dispose(); pmrem.dispose();
      return env;
    });
  }

  V.hdr = { parse: parse, loadEnvironment: loadEnvironment };
})();
