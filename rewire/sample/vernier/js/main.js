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
  const tickFn = () => M.tick(performance.now()); gsap.ticker.add(tickFn);
  canvas.addEventListener('webglcontextlost', e => {          // backgrounded mobile tabs lose the context routinely
    e.preventDefault(); gsap.ticker.remove(tickFn);
    document.body.classList.add('no-webgl'); $('#fallback').hidden = false;
  });

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
    const prev = order[i - 1];
    ScrollTrigger.create({ trigger: trig[name], start: 'top 90%',
      onEnter: () => focusFor(name), onLeaveBack: () => focusFor(prev) });
    if (reduced) {
      ScrollTrigger.create({ trigger: trig[name], start: 'top 60%',
        onEnter: () => { M.setView(name); }, onLeaveBack: () => { M.setView(prev); } });
    }
  });

  /* ── exploded view ─────────────────────────────────── */
  if (reduced) {
    ScrollTrigger.create({ trigger: '#exploded', start: 'top 50%', onEnter: () => M.explode(1), onLeaveBack: () => M.explode(0) });
    ScrollTrigger.create({ trigger: '#escapement', start: 'top 50%', onEnter: () => M.explode(0), onLeaveBack: () => M.explode(1) });
  }

  ScrollTrigger.create({ trigger: '#wind', start: 'top 85%',
    onEnter: () => { M.state.autoRotate = false;             // settle on a whole turn so every later view is framed as authored
      if (!reduced) gsap.to(M.state, { spin: Math.round(M.state.spin / (Math.PI * 2)) * Math.PI * 2, duration: 0.8, ease: 'power2.out' }); else M.state.spin = 0; },
    onLeaveBack: () => { M.state.autoRotate = !reduced; } });

  /* One master timeline. Camera and explode are pure functions of scroll
     position, so a reload or resize mid-page always lands on the right frame —
     independent per-section tweens on a shared object did not survive
     ScrollTrigger.refresh(). Positions are fractions of the total scroll. */
  let master = null;
  function topOf(sel) { return $(sel).getBoundingClientRect().top + window.scrollY; }
  function buildMaster() {
    if (master) { if (master.scrollTrigger) master.scrollTrigger.kill(); master.kill(); }
    const VH = innerHeight, total = Math.max(1, document.documentElement.scrollHeight - VH);
    const f = y => Math.max(0, Math.min(1, y / total));
    master = gsap.timeline({ defaults: { ease: 'none' },
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
    master.to({}, { duration: 1 }, 0);                      // span the whole range so positions are fractions of 1
    order.forEach((name, i) => {                            // camera: each view begins when its section top hits 90%, ends at 30%
      if (i === 0) return;
      const v = V.movement.VIEWS[name], top = topOf(trig[name]);
      const a = f(top - 0.9 * VH), b = f(top - 0.3 * VH);
      master.to(M.cam, { px: v.p[0], py: v.p[1], pz: v.p[2], tx: v.t[0], ty: v.t[1], tz: v.t[2], duration: Math.max(0.0005, b - a) }, a);
    });
    const exTop = topOf('#exploded'), esTop = topOf('#escapement');
    // explode over the first part of #exploded, hold for the rest of it, reassemble as the escapement camera dives in
    master.to(M.state, { explode: 1, duration: Math.max(0.0005, f(exTop + 0.2 * VH) - f(exTop - 0.4 * VH)) }, f(exTop - 0.4 * VH));
    master.to(M.state, { explode: 0, duration: Math.max(0.0005, f(esTop - 0.4 * VH) - f(esTop - 1.0 * VH)) }, f(esTop - 1.0 * VH));
    ScrollTrigger.refresh();
  }
  if (!reduced) {
    buildMaster();
    let rt = null;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(buildMaster, 250); });
  }

  /* ── crown: drag or arrow keys ─────────────────────── */
  const crown = $('#crown'), grip = $('.crown__grip'), reserveH = $('#reserveH'), tensionPct = $('#tensionPct');
  let windV = 0, dragX = null;
  function setWind(v) {
    windV = Math.max(0, Math.min(1, v)); M.wind(windV);
    grip.style.transform = 'translateX(' + (windV * (crown.clientWidth - grip.clientWidth - 12)) + 'px)';
    crown.setAttribute('aria-valuenow', Math.round(windV * 100));
    crown.setAttribute('aria-valuetext', Math.round(windV * 100) + ' percent wound, ' + Math.round(52 * windV) + ' hours reserve');
    reserveH.textContent = Math.round(52 * windV); tensionPct.textContent = Math.round(100 * windV);
  }
  crown.addEventListener('pointerdown', e => { dragX = e.clientX; crown.setPointerCapture(e.pointerId); });
  crown.addEventListener('pointermove', e => { if (dragX === null) return; setWind(windV + (e.clientX - dragX) / 520); dragX = e.clientX; });
  crown.addEventListener('pointerup', () => { dragX = null; });
  crown.addEventListener('pointercancel', () => { dragX = null; });
  crown.addEventListener('lostpointercapture', () => { dragX = null; });
  crown.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setWind(windV + 0.04); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setWind(windV - 0.04); e.preventDefault(); }
    if (e.key === 'Home') { setWind(0); e.preventDefault(); }
    if (e.key === 'End') { setWind(1); e.preventDefault(); }
    if (e.key === 'PageUp') { setWind(windV + 0.2); e.preventDefault(); }
    if (e.key === 'PageDown') { setWind(windV - 0.2); e.preventDefault(); }
  });
  setWind(0);

  /* ── readouts ──────────────────────────────────────── */
  const beats = $('#beats');
  if (!reduced) setInterval(() => { beats.textContent = M.beats.toLocaleString(); }, 250);
  const partsEl = $('[data-count="140"]'); if (partsEl) partsEl.dataset.count = String(M.movement.partCount);
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
