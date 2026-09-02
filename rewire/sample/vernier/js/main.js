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
  gsap.ticker.add(() => M.tick(performance.now()));

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
    const v = V.movement.VIEWS[name], prev = order[i - 1];
    if (reduced) {
      ScrollTrigger.create({ trigger: trig[name], start: 'top 60%',
        onEnter: () => { M.setView(name); focusFor(name); }, onLeaveBack: () => { M.setView(prev); focusFor(prev); } });
      return;
    }
    const pv = V.movement.VIEWS[prev];
    gsap.fromTo(M.cam,
      { px: pv.p[0], py: pv.p[1], pz: pv.p[2], tx: pv.t[0], ty: pv.t[1], tz: pv.t[2] },
      { px: v.p[0],  py: v.p[1],  pz: v.p[2],  tx: v.t[0],  ty: v.t[1],  tz: v.t[2], ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: trig[name], start: 'top 90%', end: 'top 30%', scrub: 0.6,
          onEnter: () => focusFor(name), onLeaveBack: () => focusFor(prev) } });
  });
  ScrollTrigger.create({ trigger: '#wind', start: 'top 85%',
    onEnter: () => { M.state.autoRotate = false; }, onLeaveBack: () => { M.state.autoRotate = !reduced; } });

  /* ── exploded view ─────────────────────────────────── */
  if (reduced) {
    ScrollTrigger.create({ trigger: '#exploded', start: 'top 50%', end: 'bottom 60%',
      onEnter: () => M.explode(1), onEnterBack: () => M.explode(1), onLeave: () => M.explode(0), onLeaveBack: () => M.explode(0) });
  } else {
    gsap.timeline({ scrollTrigger: { trigger: '#exploded', start: 'top 40%', end: 'bottom 100%', scrub: 0.8 } })
      .to(M.state, { explode: 1, ease: 'none', duration: 1.2 })
      .to(M.state, { explode: 1, ease: 'none', duration: 0.5 })     // hold fully exploded
      .to(M.state, { explode: 0, ease: 'none', duration: 1.0 });
  }

  /* ── crown: drag or arrow keys ─────────────────────── */
  const crown = $('#crown'), grip = $('.crown__grip'), reserveH = $('#reserveH'), tensionPct = $('#tensionPct');
  let windV = 0, dragX = null;
  function setWind(v) {
    windV = Math.max(0, Math.min(1, v)); M.wind(windV);
    grip.style.transform = 'translateX(' + (windV * (crown.clientWidth - grip.clientWidth - 12)) + 'px)';
    crown.setAttribute('aria-valuenow', Math.round(windV * 100));
    reserveH.textContent = Math.round(52 * windV); tensionPct.textContent = Math.round(100 * windV);
  }
  crown.addEventListener('pointerdown', e => { dragX = e.clientX; crown.setPointerCapture(e.pointerId); });
  crown.addEventListener('pointermove', e => { if (dragX === null) return; setWind(windV + (e.clientX - dragX) / 520); dragX = e.clientX; });
  crown.addEventListener('pointerup', () => { dragX = null; });
  crown.addEventListener('pointercancel', () => { dragX = null; });
  crown.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setWind(windV + 0.04); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setWind(windV - 0.04); e.preventDefault(); }
  });
  setWind(0);

  /* ── readouts ──────────────────────────────────────── */
  const beats = $('#beats');
  setInterval(() => { beats.textContent = M.beats.toLocaleString(); }, 250);
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
