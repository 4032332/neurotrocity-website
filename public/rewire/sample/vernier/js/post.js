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
    '#include <packing>',
    'uniform sampler2D tScene, tBloom, tDof, tDepth;',
    'uniform float uBloomOn, uBloom, uVignetteOn, uVignette, uDofOn, uNear, uFar, uFocus, uRange;',
    'varying vec2 vUv;',
    'float lin(float d){ float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }',
    'void main(){',
    '  vec4 c = texture2D(tScene, vUv);',
    '  if (uDofOn > 0.5){ float z = lin(unpackRGBAToDepth(texture2D(tDepth, vUv))); float coc = clamp(abs(z - uFocus) / uRange, 0.0, 1.0);',
    '    c = mix(c, texture2D(tDof, vUv), coc * 0.85); }',
    '  if (uBloomOn > 0.5){ c.rgb += texture2D(tBloom, vUv).rgb * uBloom; }',
    '  if (uVignetteOn > 0.5){ float v = smoothstep(1.3, 0.5, distance(vUv, vec2(0.5))); c.rgb = mix(c.rgb, c.rgb * v, uVignette); }',
    '  gl_FragColor = c; }'].join('\n');

  function create(renderer, scene, camera, opts) {
    opts = opts || {};
    const isGL2 = renderer.capabilities.isWebGL2;
    /* Multisampled render targets flicker on mobile GPUs (the per-frame resolve
       through an sRGB target is the usual culprit); the caller decides. */
    const msaa = opts.msaa !== false;
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    const quadScene = new THREE.Scene(); quadScene.add(quad);
    function mat(frag, uniforms) {
      return new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms: uniforms, depthTest: false, depthWrite: false, toneMapped: false });
    }
    const mCopy = mat(COPY, { tex: { value: null } });
    const mBright = mat(BRIGHT, { tex: { value: null }, thr: { value: 0.97 } });
    const mBlur = mat(BLUR, { tex: { value: null }, dir: { value: new THREE.Vector2() } });
    const mComp = mat(COMP, {
      tScene: { value: null }, tBloom: { value: null }, tDof: { value: null }, tDepth: { value: null },
      uBloomOn: { value: 0 }, uBloom: { value: 0.18 }, uVignetteOn: { value: 0 }, uVignette: { value: 0.22 },
      uDofOn: { value: 0 }, uNear: { value: camera.near }, uFar: { value: camera.far }, uFocus: { value: 24 }, uRange: { value: 14 }
    });
    const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    let rtScene, rtHalf, rtA, rtB, rtD, rtD2, rtDepth;
    let curW = 0, curH = 0;
    const flags = { bloom: false, vignette: false, dof: false };
    const api = { enabled: false, flags: flags, resize: resize, render: render, setEnabled: setEnabled, setFocus: setFocus };

    function make(w, h, ms) {
      const o = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, stencilBuffer: false };
      if (ms && isGL2 && msaa) { const t = new THREE.WebGLMultisampleRenderTarget(Math.max(2, w), Math.max(2, h), o); t.samples = 4; return t; }
      return new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), o);
    }
    function resize(W, H) {
      const w = W | 0, h = H | 0; if (w === curW && h === curH) return; curW = w; curH = h;
      [rtScene, rtHalf, rtA, rtB, rtD, rtD2, rtDepth].forEach(function (r) { if (r) r.dispose(); });
      rtScene = make(w, h, true); rtScene.texture.encoding = THREE.sRGBEncoding;
      rtDepth = make(w >> 1, h >> 1, false);
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
      if (flags.dof) {
        scene.overrideMaterial = depthMat;
        renderer.setRenderTarget(rtDepth); renderer.render(scene, cam);
        scene.overrideMaterial = null;
      }
      let bloomTex = null, dofTex = null;
      if (flags.bloom) { mBright.uniforms.tex.value = rtScene.texture; pass(mBright, rtA); bloomTex = blur(rtA, rtB, rtA, 1.6).texture; }
      if (flags.dof) { mCopy.uniforms.tex.value = rtScene.texture; pass(mCopy, rtHalf); dofTex = blur(rtHalf, rtD, rtD2, 1.4).texture; }
      const u = mComp.uniforms;
      u.tScene.value = rtScene.texture; u.tBloom.value = bloomTex; u.tDof.value = dofTex; u.tDepth.value = flags.dof ? rtDepth.texture : null;
      u.uBloomOn.value = flags.bloom ? 1 : 0; u.uVignetteOn.value = flags.vignette ? 1 : 0; u.uDofOn.value = (flags.dof && dofTex) ? 1 : 0;
      u.uNear.value = cam.near; u.uFar.value = cam.far;
      pass(mComp, null);
    }
    resize(renderer.domElement.width, renderer.domElement.height);
    return api;
  }

  V.post = { create: create };
})();
