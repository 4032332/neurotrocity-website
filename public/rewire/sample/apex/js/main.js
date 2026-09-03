/* ═══════════════════════════════════════════════════════
   APEX MOTOR CLUB — interaction
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const money = n => n.toLocaleString('en-AU');

  gsap.registerPlugin(ScrollTrigger);

  /* ── Smooth scroll ─────────────────────────────────── */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = sel => {
    const el = $(sel); if (!el) return;
    lenis ? lenis.scrollTo(el, { offset: -10 }) : el.scrollIntoView({ behavior: 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && $(id)) { e.preventDefault(); closeMenu(); scrollTo(id); }
  }));

  /* ── Data ──────────────────────────────────────────── */
  const CARS = [
    { id:'sto',  marque:'Lamborghini', name:'Huracán STO', img:'assets/img/car-sto.jpg',
      engine:'5.2 V10', kw:470, nm:565, zero:3.0, kg:1339, drive:'RWD', rate:2450,
      why:'The most single-minded car we run, and the one the Kennett River section was made for. Naturally aspirated, so the noise arrives with the revs rather than before them. It rides firmly. Nobody has ever cared.' },
    { id:'675', marque:'McLaren', name:'675LT Spider', img:'assets/img/car-mclaren.jpg',
      engine:'3.8 V8 twin-turbo', kw:496, nm:700, zero:2.9, kg:1370, drive:'RWD', rate:2300,
      why:'The lightest car here and the one that flatters a good driver most. Roof stows in seventeen seconds, which matters on a road where the weather changes four times before lunch. The suspension reads broken tarmac past Apollo Bay better than anything else we run.' },
    { id:'f12',  marque:'Ferrari', name:'F12', img:'assets/img/car-ferrari.jpg',
      engine:'6.3 V12', kw:545, nm:690, zero:3.1, kg:1525, drive:'RWD', rate:2400,
      why:'The only twelve-cylinder in the fleet, and the reason a good number of people book at all. Long-geared and deceptively civil at touring pace, then genuinely serious above four thousand, which is roughly where the Otways start to make sense.' },
    { id:'gt3', marque:'Porsche', name:'911 GT3', img:'assets/img/car-gt3.jpg',
      engine:'4.0 flat-six', kw:368, nm:460, zero:3.4, kg:1430, drive:'RWD', rate:1750,
      why:'The one the lead drivers fight over. Slowest car here on paper and quickest almost everywhere that matters, because it is the only one you can use all of without frightening yourself. Naturally aspirated to nine thousand.' },
    { id:'van', marque:'Aston Martin', name:'Vantage', img:'assets/img/car-vantage.jpg',
      engine:'4.0 V8 twin-turbo', kw:375, nm:685, zero:3.6, kg:1630, drive:'RWD', rate:1600,
      why:'The grand tourer of the group, and the one to book if the drive matters less than the four days around it. Softer, quieter, and far better at the long inland run home than anything else we keep.' },
    { id:'r8',  marque:'Audi', name:'R8 V10', img:'assets/img/car-r8.jpg',
      engine:'5.2 V10', kw:456, nm:580, zero:3.1, kg:1595, drive:'AWD', rate:1700,
      why:'Four-wheel drive and a naturally aspirated ten, which is a combination nobody sells any more. Unflappable in the wet, undramatic at the limit, and quick enough that the drama is optional rather than compulsory.' },
    { id:'mc20', marque:'Maserati', name:'MC20', img:'assets/img/car-mc20.jpg',
      engine:'3.0 V6 twin-turbo', kw:463, nm:730, zero:2.9, kg:1500, drive:'RWD', rate:1850,
      why:'The quiet one. Less shouty than the Lamborghinis and far rarer on this road, which some people care about more than lap times. Long-legged, beautifully damped, and the easiest car here to drive slowly.' },
    { id:'evo',  marque:'Lamborghini', name:'Huracán EVO', img:'assets/img/car-huracan.jpg',
      engine:'5.2 V10', kw:449, nm:600, zero:2.9, kg:1422, drive:'AWD', rate:1950,
      why:'All-wheel drive, which matters more than pride does when the Otways are wet and they usually are. The car we put first-timers in, and the one most of them ask for again.' }
  ];

  const DEPARTURES = [
    { id:'d1', dates:'12 – 15 Sep 2026', label:'Full Traverse', days:4, seats:2 },
    { id:'d2', dates:'24 – 26 Oct 2026', label:'Otway Loop',    days:3, seats:0 },
    { id:'d3', dates:'14 – 17 Nov 2026', label:'Full Traverse', days:4, seats:4 },
    { id:'d4', dates:'5 – 7 Dec 2026',   label:'Coast Run',     days:3, seats:6 },
    { id:'d5', dates:'27 Feb – 2 Mar 2027', label:'Full Traverse', days:4, seats:8 },
    { id:'d6', dates:'20 – 22 Mar 2027', label:'Otway Loop',    days:3, seats:3 }
  ];

  const LENGTHS = [
    { id:'l2', days:2, t:'Two days', s:'Torquay to Apollo Bay and back' },
    { id:'l3', days:3, t:'Three days', s:'Adds the Otway ranges' },
    { id:'l4', days:4, t:'Four days', s:'Full traverse to Port Campbell' }
  ];

  const ROOMS = [
    { id:'r1', t:'Coastal',          s:'Included in the rate',      p:0 },
    { id:'r2', t:'Cliffside',        s:'Ocean-facing, larger',      p:420 },
    { id:'r3', t:'Lighthouse Suite', s:'One per property',          p:980 }
  ];

  const EXTRAS = [
    { id:'e1', t:'Chase-car photography', s:'Stills and video, edited', p:1200 },
    { id:'e2', t:'Phillip Island session', s:'Half day, circuit access', p:2400 },
    { id:'e3', t:'Second registered driver', s:'Swap seats through the trip', p:650 },
    { id:'e4', t:'Helicopter transfer',   s:'Melbourne CBD to Torquay', p:1900 }
  ];

  /* ── Nav ───────────────────────────────────────────── */
  const nav = $('#nav');
  let lastY = 0;
  ScrollTrigger.create({
    start: 'top -60',
    onUpdate: self => {
      const y = self.scroller.scrollY !== undefined ? self.scroller.scrollY : window.scrollY;
      nav.classList.toggle('is-stuck', y > 60);
      nav.classList.toggle('is-up', y > 460 && y > lastY && !nav.classList.contains('is-open'));
      lastY = y;
    }
  });
  const burger = $('#burger');
  function closeMenu(){ nav.classList.remove('is-open'); }
  burger.addEventListener('click', () => nav.classList.toggle('is-open'));

  /* ── Hero + reveals ────────────────────────────────── */
  if (!reduced) {
    gsap.to('.hero__title .line > span', {
      y: 0, duration: 1.25, ease: 'power3.out', stagger: 0.085, delay: 0.25
    });
    gsap.set('.hero .reveal', { opacity: 0, y: 26 });
    gsap.to('.hero .reveal', {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.4,
      stagger: 0.09
    });
    $$('.reveal').filter(el => !el.closest('.hero')).forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.05, ease: 'power3.out',
        delay: parseFloat(el.dataset.d || 0) * 0.55,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
  } else {
    gsap.set('.reveal', { opacity: 1, y: 0 });
    gsap.set('.hero__title .line > span', { y: 0 });
  }

  /* ── Showcase band parallax ────────────────────────── */
  if (!reduced && $('#bandImg')) {
    gsap.fromTo('#bandImg', { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: 0.6 }
    });
  }

  /* ── Counters ──────────────────────────────────────── */
  $$('[data-count]').forEach(el => {
    const to = parseFloat(el.dataset.count);
    const o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 1.9, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate(){ el.textContent = Math.round(o.v); }
    });
  });

  /* ── Route: scrubbed line draw + waypoints ─────────── */
  const line  = $('#routeLine');
  const pins  = $$('#routePins .pin');
  const wps   = $$('.route__read .wp');
  const plates= $$('.route__img');
  const kmEl  = $('#routeKm');
  const KM    = [0, 7, 45, 66, 90, 243];

  if (line) {
    const len = line.getTotalLength();
    line.style.strokeDasharray  = len;
    line.style.strokeDashoffset = len;

    let current = -1;
    const setStep = i => {
      if (i === current) return;
      current = i;
      pins.forEach((p, n)   => p.classList.toggle('is-on', n <= i));
      wps.forEach((w, n)    => w.classList.toggle('is-on', n === i));
      plates.forEach((p, n) => p.classList.toggle('is-on', n === i));
    };

    ScrollTrigger.create({
      trigger: '.route',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.7,
      onUpdate(self) {
        const p = self.progress;
        line.style.strokeDashoffset = len * (1 - p);
        const i = Math.min(wps.length - 1, Math.floor(p * wps.length + 0.0001));
        setStep(i);
        // interpolate the km readout between waypoints
        const seg = p * (KM.length - 1);
        const a = Math.min(KM.length - 2, Math.floor(seg));
        const f = seg - a;
        kmEl.textContent = Math.round(KM[a] + (KM[a + 1] - KM[a]) * f);
      }
    });
    setStep(0);
  }

  /* ── Fleet carousel ────────────────────────────────── */
  const track = $('#fleetTrack');
  const rail  = $('#fleetRail');

  track.innerHTML = CARS.map((c, i) => `
    <article class="fcard" data-car="${c.id}" tabindex="0" role="button"
             aria-label="${c.marque} ${c.name}, view specification">
      <div class="fcard__img">
        <img src="${c.img}" alt="${c.marque} ${c.name}" loading="lazy" draggable="false">
        <span class="fcard__idx mono">${String(i + 1).padStart(2, '0')}</span>
        <span class="fcard__view mono">Specification</span>
      </div>
      <div class="fcard__meta">
        <div>
          <span class="fcard__marque mono">${c.marque}</span>
          <h3 class="fcard__name">${c.name}</h3>
        </div>
        <span class="fcard__pw mono">${c.kw} kW</span>
      </div>
    </article>`).join('');

  let x = 0, dragging = false, startX = 0, startPos = 0, moved = 0;
  const overflow = () => track.scrollWidth - rail.clientWidth;
  const maxX = () => Math.min(0, -overflow());
  // When the fleet is narrower than the rail there is nothing to drag, so centre it
  // rather than leaving it hard against the left edge on wide screens.
  const centred = () => (overflow() <= 0 ? -overflow() / 2 : null);
  const setX = v => {
    const c = centred();
    x = c !== null ? c : Math.max(maxX(), Math.min(0, v));
    gsap.to(track, { x, duration: dragging ? 0 : .8, ease: 'power3.out' });
  };

  rail.addEventListener('pointerdown', e => {
    dragging = true; moved = 0; startX = e.clientX; startPos = x;
    rail.classList.add('is-drag'); rail.setPointerCapture(e.pointerId);
  });
  rail.addEventListener('pointermove', e => {
    if (!dragging) return;
    const d = e.clientX - startX; moved = Math.abs(d);
    setX(startPos + d);
  });
  const endDrag = () => { dragging = false; rail.classList.remove('is-drag'); };
  rail.addEventListener('pointerup', endDrag);
  rail.addEventListener('pointercancel', endDrag);

  const step = () => (track.firstElementChild ? track.firstElementChild.offsetWidth + 20 : 300);
  rail.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setX(x - step()); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setX(x + step()); }
  });
  rail.tabIndex = 0;
  window.addEventListener('resize', () => setX(x));
  setX(0);                                   // centre on load if the rail has room
  rail.classList.toggle('is-static', overflow() <= 0);

  /* ── Spec panel ────────────────────────────────────── */
  const panel = $('#panel');
  const maxOf = k => Math.max.apply(null, CARS.map(c => c[k]));

  function openPanel(id) {
    const c = CARS.find(v => v.id === id); if (!c) return;
    $('#panelImg').src = c.img;
    $('#panelImg').alt = c.marque + ' ' + c.name;
    $('#panelMarque').textContent = c.marque;
    $('#panelName').textContent = c.name;
    $('#panelWhy').textContent = c.why;
    $('#panelSpecs').innerHTML = `
      <div><dt class="mono">ENGINE</dt><dd>${c.engine}</dd></div>
      <div><dt class="mono">POWER</dt><dd>${c.kw} kW</dd></div>
      <div><dt class="mono">TORQUE</dt><dd>${c.nm} Nm</dd></div>
      <div><dt class="mono">0–100 KM/H</dt><dd>${c.zero.toFixed(1)} s</dd></div>
      <div><dt class="mono">KERB WEIGHT</dt><dd>${money(c.kg)} kg</dd></div>
      <div><dt class="mono">DRIVEN WHEELS</dt><dd>${c.drive}</dd></div>`;

    const bars = [
      { l:'Power',        v:c.kw / maxOf('kw'),            r:c.kw + ' kW' },
      { l:'Torque',       v:c.nm / maxOf('nm'),            r:c.nm + ' Nm' },
      { l:'Acceleration', v:(3.85 - c.zero) / (3.85 - 2.8),  r:c.zero.toFixed(1) + ' s' },
      { l:'Lightness',    v:(1700 - c.kg)  / (1700 - 1330),  r:money(c.kg) + ' kg' }
    ];
    $('#panelBars').innerHTML = bars.map(b => `
      <div class="bar">
        <div class="bar__top"><span class="mono dim">${b.l}</span><span class="mono">${b.r}</span></div>
        <div class="bar__t"><i class="bar__f"></i></div>
      </div>`).join('');

    panel.classList.add('is-on');
    panel.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    requestAnimationFrame(() => {
      $$('#panelBars .bar__f').forEach((f, i) => {
        f.style.transform = 'scaleX(' + Math.max(0.06, Math.min(1, bars[i].v)).toFixed(3) + ')';
      });
    });
    $('.panel__close').focus();
  }
  function closePanel() {
    panel.classList.remove('is-on');
    panel.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  }
  track.addEventListener('click', e => {
    if (moved > 6) return;                    // a drag, not a click
    const card = e.target.closest('.fcard');
    if (card) openPanel(card.dataset.car);
  });
  track.addEventListener('keydown', e => {
    const card = e.target.closest('.fcard');
    if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPanel(card.dataset.car); }
  });
  $$('[data-close]').forEach(b => b.addEventListener('click', closePanel));

  /* ── Configurator ──────────────────────────────────── */
  const state = { dep: DEPARTURES[0], car: CARS[0], len: LENGTHS[2], room: ROOMS[0], extras: [] };

  const optBtn = (on, id, inner, off) =>
    `<button class="opt ${on ? 'is-on' : ''} ${off ? 'is-off' : ''}" data-id="${id}" ${off ? 'disabled' : ''}>${inner}</button>`;

  function renderOptions() {
    $('#optDates').innerHTML = DEPARTURES.map(d => optBtn(
      state.dep.id === d.id, d.id,
      `<span class="opt__t">${d.dates}</span>
       <span class="opt__s mono">${d.label} · ${d.seats ? d.seats + ' seats left' : 'Sold out'}</span>`,
      d.seats === 0)).join('');

    $('#optCars').innerHTML = CARS.map(c => optBtn(
      state.car.id === c.id, c.id,
      `<img src="${c.img}" alt="" loading="lazy">
       <span><span class="opt__t">${c.name}</span>
       <span class="opt__s mono">${c.marque} · $${money(c.rate)}/day</span></span>`)).join('');

    $('#optLength').innerHTML = LENGTHS.map(l => optBtn(
      state.len.id === l.id, l.id,
      `<span class="opt__t">${l.t}</span><span class="opt__s mono">${l.s}</span>`)).join('');

    $('#optRooms').innerHTML = ROOMS.map(r => optBtn(
      state.room.id === r.id, r.id,
      `<span class="opt__t">${r.t}</span><span class="opt__s mono">${r.s}</span>
       <span class="opt__p">${r.p ? '+$' + money(r.p) + '/nt' : 'incl.'}</span>`)).join('');

    $('#optExtras').innerHTML = EXTRAS.map(x2 => optBtn(
      state.extras.indexOf(x2.id) > -1, x2.id,
      `<span class="opt__t">${x2.t}</span><span class="opt__s mono">${x2.s}</span>
       <span class="opt__p">+$${money(x2.p)}</span>`)).join('');
  }

  function price() {
    const days = state.len.days, nights = Math.max(1, days - 1);
    const lines = [];
    const carCost = state.car.rate * days;
    lines.push([`${state.car.name}, ${days} days`, carCost]);
    if (state.room.p) lines.push([`${state.room.t}, ${nights} nights`, state.room.p * nights]);
    state.extras.forEach(id => {
      const x2 = EXTRAS.find(v => v.id === id);
      if (x2) lines.push([x2.t, x2.p]);
    });
    const total = lines.reduce((s, l) => s + l[1], 0);
    return { lines, total, days, nights };
  }

  function renderSummary() {
    const p = price();
    $('#sumCar').textContent   = state.car.marque + ' ' + state.car.name;
    $('#sumDates').textContent = state.dep.dates + ' · ' + state.dep.label;
    $('#sumLines').innerHTML   = p.lines
      .map(l => `<li><span>${l[0]}</span><span>$${money(l[1])}</span></li>`).join('');

    const cur = parseInt(($('#sumTotal').textContent || '0').replace(/,/g, ''), 10) || 0;
    const o = { v: cur };
    gsap.to(o, {
      v: p.total, duration: reduced ? 0 : 0.6, ease: 'power2.out',
      onUpdate(){ $('#sumTotal').textContent = money(Math.round(o.v)); }
    });
    $('#sumDep').textContent = '$' + money(Math.round(p.total * 0.3));
  }

  function pick(container, list, key) {
    $(container).addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b || b.disabled) return;
      const item = list.find(v => v.id === b.dataset.id); if (!item) return;
      state[key] = item;
      if (key === 'dep') {
        const match = LENGTHS.find(l => l.days === item.days);
        if (match) state.len = match;
      }
      renderOptions(); renderSummary();
    });
  }
  pick('#optDates', DEPARTURES, 'dep');
  pick('#optCars', CARS, 'car');
  pick('#optLength', LENGTHS, 'len');
  pick('#optRooms', ROOMS, 'room');

  $('#optExtras').addEventListener('click', e => {
    const b = e.target.closest('.opt'); if (!b) return;
    const i = state.extras.indexOf(b.dataset.id);
    i > -1 ? state.extras.splice(i, 1) : state.extras.push(b.dataset.id);
    renderOptions(); renderSummary();
  });

  renderOptions(); renderSummary();

  /* ── Reservation confirmation ──────────────────────── */
  const conf = $('#conf');
  $('#reserveBtn').addEventListener('click', () => {
    const p = price();
    $('#confRef').textContent = String(1000 + Math.floor(Math.random() * 8999));
    $('#confList').innerHTML = `
      <div><dt>Departure</dt><dd>${state.dep.dates}</dd></div>
      <div><dt>Route</dt><dd>${state.dep.label}</dd></div>
      <div><dt>Car</dt><dd>${state.car.marque} ${state.car.name}</dd></div>
      <div><dt>Length</dt><dd>${p.days} days, ${p.nights} nights</dd></div>
      <div><dt>Accommodation</dt><dd>${state.room.t}</dd></div>
      <div><dt>Additions</dt><dd>${state.extras.length
        ? state.extras.map(id => (EXTRAS.find(v => v.id === id) || {}).t).join('<br>')
        : 'None'}</dd></div>
      <div><dt>Total</dt><dd>$${money(p.total)}</dd></div>`;
    $('#confDep').textContent = '$' + money(Math.round(p.total * 0.3));
    conf.classList.add('is-on');
    conf.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    $('.conf__close').focus();
  });
  function closeConf(){
    conf.classList.remove('is-on');
    conf.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  }
  $$('[data-cclose]').forEach(b => b.addEventListener('click', closeConf));

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (panel.classList.contains('is-on')) closePanel();
    if (conf.classList.contains('is-on')) closeConf();
    closeMenu();
  });

  /* ── Accordion ─────────────────────────────────────── */
  $$('.acc__i').forEach(item => {
    const q = $('.acc__q', item), a = $('.acc__a', item);
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', () => {
      const open = item.classList.contains('is-on');
      $$('.acc__i').forEach(o => {
        if (o === item) return;
        o.classList.remove('is-on');
        $('.acc__q', o).setAttribute('aria-expanded', 'false');
        gsap.to($('.acc__a', o), { height: 0, duration: .5, ease: 'power3.inOut' });
      });
      item.classList.toggle('is-on', !open);
      q.setAttribute('aria-expanded', String(!open));
      gsap.to(a, {
        height: open ? 0 : 'auto', duration: .55, ease: 'power3.inOut',
        onComplete: () => ScrollTrigger.refresh()
      });
    });
  });

  /* ── Hero video fallback ───────────────────────────── */
  const hv = $('#heroVideo');
  if (hv) {
    if (reduced) { hv.pause(); hv.removeAttribute('autoplay'); }
    hv.addEventListener('error', () => { hv.style.display = 'none'; }, true);
  }

  ScrollTrigger.refresh();
})();
