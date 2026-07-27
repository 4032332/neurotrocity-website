/* ═══════════════════════════════════════════════════════
   NORTHBAY PHYSIOTHERAPY — interaction
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  // Anything typed by the visitor is escaped before it goes near innerHTML.
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  gsap.registerPlugin(ScrollTrigger);

  /* ── Smooth scroll ─────────────────────────────────── */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.0, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const goTo = sel => {
    const el = $(sel); if (!el) return;
    lenis ? lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView({ behavior: 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && $(id)) { e.preventDefault(); closeMenu(); goTo(id); }
  }));

  /* ── Rail: chapters light as you pass them ────────── */
  const rail = $('#rail'), burger = $('#burger');
  function closeMenu(){ rail.classList.remove('is-open'); burger.setAttribute('aria-expanded','false'); }
  burger.addEventListener('click', () => {
    const open = rail.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  const chapLinks = $$('#chap a');
  chapLinks.forEach(link => {
    const sec = $(link.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle(self){ link.parentElement.classList.toggle('is-on', self.isActive); },
      onEnter(){ link.parentElement.classList.add('is-done'); },
      onLeaveBack(){ link.parentElement.classList.remove('is-done'); }
    });
  });

  // The booking pill hides while the booking section is on screen.
  const pill = $('#pill');
  if (pill && $('#book')) {
    ScrollTrigger.create({ trigger: '#book', start: 'top 80%', end: 'bottom 20%',
      onToggle(self){ pill.classList.toggle('is-hidden', self.isActive); } });
    ScrollTrigger.create({ start: 260,
      onToggle(self){ pill.classList.toggle('is-in', self.isActive); } });
  }

  /* ── Intro curtain ─────────────────────────────────── */
  const intro = $('#intro');
  function playIntro(done) {
    if (reduced || !intro) { if (intro) intro.remove(); done(); return; }
    const n = { v: 0 };
    const tl = gsap.timeline({ onComplete: () => { intro.remove(); done(); } });
    tl.to(n, { v: 60, duration: .95, ease: 'power2.inOut',
               onUpdate(){ $('#introN').textContent = String(Math.round(n.v)).padStart(2,'0'); } })
      .to('.intro__inner', { y: -18, opacity: 0, duration: .5, ease: 'power2.in' }, '+=0.12')
      .to(intro, { yPercent: -100, duration: .85, ease: 'expo.inOut' }, '-=0.25');
  }

  /* ── Reveals: masked lines, then soft rises ────────── */
  function heroIn() {
    if (reduced) { gsap.set('.hero .l > span, .hero .rv-up', { y: 0, opacity: 1 });
                   gsap.set('.hero__frame img', { scale: 1 });
                   gsap.set('.hero__cap', { opacity: 1 }); return; }
    const tl = gsap.timeline();
    tl.to('.hero .l > span', { y: 0, duration: 1.15, ease: 'expo.out', stagger: .08 })
      .to('.hero__frame img', { scale: 1, duration: 2.2, ease: 'expo.out' }, 0)
      .to('.hero .rv-up', { opacity: 1, y: 0, duration: .95, ease: 'power3.out', stagger: .08 }, 0.45)
      .to('.hero__cap', { opacity: 1, duration: .7 }, 0.9)
      .fromTo('#avail', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, 0.7);
  }

  // Every other display heading reveals line by line; body copy rises softly.
  function bindScrollReveals() {
    if (reduced) {
      gsap.set('.l > span', { y: 0 }); gsap.set('.rv-up, .reveal', { opacity: 1, y: 0 }); return;
    }
    $$('.l > span').filter(el => !el.closest('.hero')).forEach(el => {
      gsap.to(el, { y: 0, duration: 1.15, ease: 'expo.out',
        scrollTrigger: { trigger: el.closest('.l'), start: 'top 92%' } });
    });
    $$('.reveal, .rv-up').filter(el => !el.closest('.hero')).forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.05, ease: 'power3.out',
        delay: parseFloat(el.dataset.d || 0) * 0.8,
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });
    // Staggered groups: table rows, FAQ items, promise points.
    [['.fees__table .fees__row:not(.fees__row--head)', .07],
     ['.acc__i', .05],
     ['.bk__prog li', .06]].forEach(([sel, st]) => {
      const els = $$(sel); if (!els.length) return;
      gsap.from(els, {
        opacity: 0, y: 18, duration: .9, ease: 'power3.out', stagger: st,
        scrollTrigger: { trigger: els[0].parentElement, start: 'top 86%' }
      });
    });

    // Band: the video drifts a little slower than the page, card wipes in.
    const bandV = $('.band__media');
    if (bandV) {
      gsap.fromTo(bandV, { yPercent: -9 }, { yPercent: 9, ease: 'none',
        scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: .8 } });
      gsap.from('.band__card', {
        clipPath: 'inset(0 0 100% 0)', y: 30, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: '.band', start: 'top 70%' }
      });
    }


    // Images settle out of a slight over-scale as they enter.
    $$('.who__img img').forEach(img => {
      gsap.to(img, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });
  }

  /* ── Hero parallax: the photograph lags the page ───── */
  if (!reduced && $('.hero__frame')) {
    gsap.to('.hero__frame', {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 }
    });
    gsap.to('.hero__inner', {
      yPercent: -14, opacity: .25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 }
    });
  }

  /* ── Scroll progress hairline ──────────────────────── */
  const progBar = $('#prog span');
  if (progBar) {
    ScrollTrigger.create({
      start: 0, end: 'max', onUpdate(self){ gsap.set(progBar, { width: (self.progress * 100) + '%' }); }
    });
  }

  /* ── Magnetic buttons ──────────────────────────────── */
  if (!reduced && window.matchMedia('(hover:hover)').matches) {
    $$('.mag').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width/2) * .22,
                      y: (e.clientY - r.top - r.height/2) * .3,
                      duration: .5, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () =>
        gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,0.4)' }));
    });
  }

  /* ── Availability strip ────────────────────────────── */
  // Generates plausible next-available slots from today, skipping weekends and
  // the practice's Friday close. Purely presentational — no real diary behind it.
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const OPEN = { 1:[7,18], 2:[7,18], 3:[7,18], 4:[7,18], 5:[7,14] };

  function workingDays(count, from) {
    const out = [], d = new Date(from || Date.now());
    d.setHours(0,0,0,0);
    while (out.length < count) {
      d.setDate(d.getDate() + 1);
      if (OPEN[d.getDay()]) out.push(new Date(d));
    }
    return out;
  }
  // A stable pseudo-random so the same day always shows the same slots.
  const seeded = (a, b) => { const x = Math.sin(a * 9301 + b * 49297) * 233280; return x - Math.floor(x); };

  function slotsFor(date, idx) {
    const [open, close] = OPEN[date.getDay()];
    const out = [];
    for (let h = open; h < close; h++) {
      const taken = seeded(date.getDate() + idx, h) > 0.42;   // most of the day is booked
      out.push({ h, label: String(h).padStart(2,'0') + ':00', free: !taken });
    }
    return out;
  }

  const days = workingDays(10);
  // One slot per day rather than three on the same morning — it tells the visitor
  // more, and "Tue, Tue, Tue" reads like a rendering bug.
  const nextThree = [];
  days.forEach((d, i) => {
    if (nextThree.length >= 3) return;
    const first = slotsFor(d, i).find(s => s.free);
    if (first) nextThree.push({ date: d, slot: first, label: DAY_NAMES[d.getDay()] + ' ' + first.label });
  });
  $('#availSlots').innerHTML = nextThree
    .map(s => `<a class="slot" href="#book">${s.label}</a>`).join('');
  if ($('#pillNext') && nextThree[0]) $('#pillNext').textContent = 'Next ' + nextThree[0].label;

  /* ── Body map ──────────────────────────────────────── */
  const REGIONS = {
    neck: {
      t:'Neck and headaches', sub:'Cervical spine, upper trapezius, referred head pain',
      common:['Wry neck / acute locking','Cervicogenic headache','Disc-related arm pain','Whiplash','Desk-posture neck ache'],
      does:['Joint mobilisation and manual traction','Soft tissue through the upper trapezius and suboccipitals','Dry needling where indicated','Two or three deep-neck-flexor exercises','A workstation fix that takes five minutes'],
      sessions:'3 – 4', first:'Often same day',
      flag:'See a doctor first if the neck pain followed a significant impact, or comes with dizziness, double vision, or pins and needles in both arms.'
    },
    shoulder: {
      t:'Shoulder', sub:'Rotator cuff, subacromial space, AC joint',
      common:['Rotator cuff tendinopathy','Subacromial pain','Frozen shoulder (adhesive capsulitis)','AC joint sprain','Post-operative rehabilitation'],
      does:['Testing to separate cuff, joint and neck as the source','Graded loading, which is the part that actually works','Joint mobilisation for stiffness','Scapular control retraining','An honest timeframe, because shoulders are slow'],
      sessions:'5 – 8', first:'Within 2 days',
      flag:'A shoulder that cannot be lifted at all after a fall needs imaging before physiotherapy. We will tell you and write to your GP the same day.'
    },
    upper: {
      t:'Upper back and ribs', sub:'Thoracic spine, rib joints, between the shoulder blades',
      common:['Thoracic joint stiffness','Rib joint sprain','Between-the-shoulder-blade ache','Postural pain in desk workers','Pain on deep breath'],
      does:['Thoracic and rib joint mobilisation, which usually gives quick relief','Soft tissue work through the mid-back','Breathing and rib-cage mechanics','Thoracic extension work you can do at a desk'],
      sessions:'2 – 4', first:'Often same day',
      flag:'Chest pain that is central, crushing, or comes with breathlessness is not a physiotherapy problem. Call 000.'
    },
    elbow: {
      t:'Elbow, wrist and hand', sub:'Tendon, nerve and joint problems of the arm',
      common:['Tennis and golfer\'s elbow','De Quervain\'s tenosynovitis','Carpal tunnel symptoms','Wrist sprain','Thumb base arthritis'],
      does:['Isometric then graded tendon loading','Nerve glides where symptoms are neural','Bracing and taping advice that is actually worn','Grip and forearm strength work','A look at the task that caused it'],
      sessions:'4 – 6', first:'Within 3 days',
      flag:'Numbness that wakes you at night, or weakness gripping, should be assessed sooner rather than later.'
    },
    lower: {
      t:'Lower back', sub:'Lumbar spine, sacroiliac joint, referred leg pain',
      common:['Acute lower back pain','Disc-related sciatica','Facet joint pain','Sacroiliac pain','Long-standing recurrent back pain'],
      does:['Working out which of the four or five likely sources it is','Manual therapy and mobilisation for pain relief','A graded return to loading rather than rest','Specific exercise, not generic core work','Advice on sitting, lifting and sleeping that fits your life'],
      sessions:'3 – 6', first:'Often same day',
      flag:'Loss of bladder or bowel control, or numbness around the saddle area, is a medical emergency. Go to an emergency department, not a physiotherapist.'
    },
    hip: {
      t:'Hip and groin', sub:'Gluteal tendons, hip joint, groin and pelvis',
      common:['Gluteal tendinopathy','Hip osteoarthritis','Hip impingement (FAI)','Groin strain','Pain lying on your side at night'],
      does:['Separating hip joint from gluteal tendon from referred back pain','Load management, because most hip tendons are irritated by compression','Progressive strengthening of the glutes','Gait and stair technique','Pre- and post-hip-replacement programmes'],
      sessions:'6 – 10', first:'Within 2 days',
      flag:'Hip pain in a child or teenager, or after a fall in someone over sixty-five, should be seen by a doctor first.'
    },
    knee: {
      t:'Knee', sub:'Patellofemoral, meniscus, ligament, osteoarthritis',
      common:['Patellofemoral (runner\'s) knee','Meniscal irritation','Osteoarthritis','ACL rehabilitation, before and after surgery','Post-operative knee replacement'],
      does:['Testing that separates the joint surface, the meniscus and the tendon','Quadriceps and hip strengthening, which is the bulk of the work','Load and running programme adjustment','Return-to-sport criteria you have to actually pass','Pre-habilitation before a knee replacement'],
      sessions:'6 – 12', first:'Within 2 days',
      flag:'A knee that locks, gives way completely, or swelled within an hour of an injury needs assessment quickly.'
    },
    ankle: {
      t:'Ankle and foot', sub:'Achilles, plantar fascia, ankle ligaments',
      common:['Ankle sprain, recent and long-standing','Achilles tendinopathy','Plantar heel pain','Shin splints','Return to running after injury'],
      does:['Graded calf and Achilles loading, the single most effective treatment','Balance and proprioception retraining','Joint mobilisation for stiff ankles','Footwear and orthotic advice, including when you do not need them','A structured return-to-running plan'],
      sessions:'4 – 8', first:'Within 3 days',
      flag:'If you could not weight-bear for four steps immediately after an ankle injury, an X-ray should come before physiotherapy.'
    }
  };
  const ORDER = ['neck','shoulder','upper','elbow','lower','hip','knee','ankle'];

  const chips = $('#regionChips');
  chips.innerHTML = ORDER
    .map(k => `<button class="chip" data-region="${k}">${REGIONS[k].t}</button>`).join('');

  // Every region is laid out in full and scrolls past the held figure; whichever is
  // centred in the viewport owns the mannequin. Clicking a chip or a hotspot scrolls to it.
  $('#regionRead').innerHTML = ORDER.map(key => {
    const r = REGIONS[key];
    return `<article class="rg" id="rg-${key}" data-region="${key}">
      <h3 class="rg__t">${r.t}</h3>
      <p class="rg__sub">${r.sub}</p>
      <div class="rg__meta">
        <div><span class="mono dim">Typical course</span><span class="v">${r.sessions} sessions</span></div>
        <div><span class="mono dim">Next appointment</span><span class="v">${r.first}</span></div>
      </div>
      <div class="rg__cols">
        <div><h4>What we see most</h4><ul>${r.common.map(c => `<li>${c}</li>`).join('')}</ul></div>
        <div><h4>What the hour involves</h4><ul>${r.does.map(c => `<li>${c}</li>`).join('')}</ul></div>
      </div>
      <p class="rg__flag"><strong>When it isn't us.</strong> ${r.flag}</p>
      <a class="btn btn--fill" href="#book" data-book-region="${key}">Book for ${r.t.toLowerCase()}</a>
    </article>`;
  }).join('');

  let activeRegion = null;
  function markRegion(key) {
    if (key === activeRegion) return;
    activeRegion = key;
    $$('.hs').forEach(h => h.classList.toggle('is-on', h.dataset.region === key));
    $$('.chip').forEach(c => c.classList.toggle('is-on', c.dataset.region === key));
  }
  const goRegion = key => {
    const el = $('#rg-' + key); if (!el) return;
    lenis ? lenis.scrollTo(el, { offset: -140 }) : el.scrollIntoView({ behavior: 'smooth' });
  };

  ORDER.forEach(key => {
    ScrollTrigger.create({
      trigger: '#rg-' + key, start: 'top 62%', end: 'bottom 62%',
      onToggle(self){ if (self.isActive) markRegion(key); }
    });
  });

  $('#hotspots').addEventListener('click', e => {
    const g = e.target.closest('.hs'); if (g) { markRegion(g.dataset.region); goRegion(g.dataset.region); }
  });
  chips.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (c) { markRegion(c.dataset.region); goRegion(c.dataset.region); }
  });
  $('#regionRead').addEventListener('click', e => {
    const b2 = e.target.closest('[data-book-region]');
    if (b2) { e.preventDefault(); setReason(b2.dataset.bookRegion); goTo('#book'); }
  });
  // The mobile chip bar only appears while the section is on screen.
  ScrollTrigger.create({
    trigger: '#where', start: 'top 20%', end: 'bottom 60%',
    onToggle(self){ chips.classList.toggle('is-stuck', self.isActive); }
  });

  markRegion(ORDER[0]);

  /* ── The hour: pinned segmented dial ───────────────── */
  const dialSvg = $('.dial svg');
  if (dialSvg) {
    const CX = 200, CY = 200, R = 158;
    const PH = $$('.ph').map(el => ({ el, from: +el.dataset.from, to: +el.dataset.to }));
    const GAP = 1.6;                                  // degrees of breathing room between phases
    const pol = (r, deg) => {
      const a = (deg - 90) * Math.PI / 180;
      return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
    };
    const arcPath = (r, d0, d1) => {
      const [x0, y0] = pol(r, d0), [x1, y1] = pol(r, d1);
      return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    };

    // minute ticks
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const major = i % 5 === 0;
      const [x1, y1] = pol(major ? 176 : 180, i * 6);
      const [x2, y2] = pol(190, i * 6);
      ticks += `<line class="${major ? 'major' : ''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }
    $('#dialTicks').innerHTML = ticks;

    // one background + one fill arc per phase
    let segs = '';
    PH.forEach((p, i) => {
      const d0 = p.from * 6 + GAP, d1 = p.to * 6 - GAP;
      segs += `<path class="seg__bg" d="${arcPath(R, d0, d1)}"/>`;
      segs += `<path class="seg__fg" data-i="${i}" d="${arcPath(R, d0, d1)}"/>`;
    });
    const segG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    segG.setAttribute('class', 'dial__segs');
    segG.innerHTML = segs;
    dialSvg.insertBefore(segG, $('#dialHead'));
    $('#dialArc').remove(); $('.dial__track').remove();

    const fills = $$('.seg__fg');
    fills.forEach(f => {
      const L = f.getTotalLength();
      f.style.strokeDasharray = L;
      f.style.strokeDashoffset = L;
    });

    const head = $('#dialHead'), nEl = $('#dialN'), tickEls = $$('#dialTicks line');
    let lastPhase = -1;

    const setMinute = m => {
      PH.forEach((p, i) => {
        const t = Math.max(0, Math.min(1, (m - p.from) / (p.to - p.from)));
        const f = fills[i], L = f.getTotalLength();
        f.style.strokeDashoffset = L * (1 - t);
        f.classList.toggle('is-live', t > 0 && t < 1);
      });
      const [hx, hy] = pol(R, m * 6);
      head.setAttribute('cx', hx); head.setAttribute('cy', hy);
      head.style.opacity = m > 0.25 ? 1 : 0;
      nEl.textContent = String(Math.floor(m)).padStart(2, '0');
      tickEls.forEach((el, i) => el.classList.toggle('is-on', i * 6 <= m * 6));

      let idx = 0;
      PH.forEach((p, i) => { if (m >= p.from) idx = i; });
      if (idx !== lastPhase) {
        lastPhase = idx;
        PH.forEach((p, i) => p.el.classList.toggle('is-on', i === idx));
        $('#dialCount').textContent = (idx + 1) + ' of ' + PH.length;
        $$('#hourIdx li').forEach((li, i) => {
          li.classList.toggle('is-on', i === idx);
          li.classList.toggle('is-done', i < idx);
        });
      }
    };

    ScrollTrigger.create({
      trigger: '.hour', start: 'top top', end: 'bottom bottom', scrub: 0.55,
      onUpdate(self){ setMinute(Math.min(60, self.progress * 60)); }
    });
    setMinute(0);
  }

  /* ── Booking flow ──────────────────────────────────── */
  const REASONS = ORDER.map(k => ({ id:k, t:REGIONS[k].t }))
    .concat([{ id:'other', t:'Something else' }]);

  const TYPES = [
    { id:'initial',  t:'Initial consultation', s:'60 min · $145 · first visit',        fee:145 },
    { id:'followup', t:'Follow-up',            s:'60 min · $125 · existing patient',   fee:125 },
    { id:'extended', t:'Extended assessment',  s:'90 min · $185 · complex or long-standing', fee:185 },
    { id:'cdm',      t:'Medicare CDM plan',    s:'60 min · $66.70 gap · GP referral needed', fee:66.7 }
  ];

  const bk = {
    step: 0,
    reason: null, type: null, day: null, time: null,
    name:'', phone:'', email:''
  };

  const paneEls = $$('.bk__pane'), progEls = $$('#bkProg li');
  const nextBtn = $('#bkNext'), backBtn = $('#bkBack'), sumEl = $('#bkSum');

  $('#bkReason').innerHTML = REASONS
    .map(r => `<button class="opt" data-id="${r.id}"><span class="opt__t">${r.t}</span></button>`).join('');
  $('#bkType').innerHTML = TYPES
    .map(t => `<button class="opt" data-id="${t.id}"><span class="opt__t">${t.t}</span><span class="opt__s mono">${t.s}</span></button>`).join('');

  $('#bkDays').innerHTML = days.map((d, i) => {
    const free = slotsFor(d, i).some(s => s.free);
    return `<button class="day ${free ? '' : 'is-off'}" data-i="${i}" ${free ? '' : 'disabled'}>
      <span class="d">${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}</span>
      <span class="n">${free ? slotsFor(d, i).filter(s => s.free).length : '—'}</span>
    </button>`;
  }).join('');

  function renderTimes() {
    const box = $('#bkTimes');
    if (bk.day === null) { box.innerHTML = '<p class="mono dim">Choose a day above.</p>'; return; }
    box.innerHTML = slotsFor(days[bk.day], bk.day).map(s =>
      `<button class="time ${s.free ? '' : 'is-off'} ${bk.time === s.label ? 'is-on' : ''}"
        data-t="${s.label}" ${s.free ? '' : 'disabled'}>${s.label}</button>`).join('');
  }
  renderTimes();

  function setReason(id) {
    bk.reason = id;
    $$('#bkReason .opt').forEach(o => o.classList.toggle('is-on', o.dataset.id === id));
    refresh();
  }

  function canAdvance() {
    if (bk.step === 0) return !!bk.reason;
    if (bk.step === 1) return !!bk.type;
    if (bk.step === 2) return bk.day !== null && !!bk.time;
    return $('#bkName').value.trim().length > 1 && $('#bkEmail').value.includes('@');
  }

  function summary() {
    const bits = [];
    if (bk.reason) bits.push(REASONS.find(r => r.id === bk.reason).t);
    if (bk.type)   bits.push(TYPES.find(t => t.id === bk.type).t);
    if (bk.day !== null && bk.time) {
      const d = days[bk.day];
      bits.push(`${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}, ${bk.time}`);
    }
    return bits.join('  ·  ');
  }

  function refresh() {
    paneEls.forEach(p => p.classList.toggle('is-on', +p.dataset.step === bk.step));
    progEls.forEach((li, i) => {
      li.classList.toggle('is-on', i === bk.step);
      li.classList.toggle('is-done', i < bk.step);
    });
    backBtn.hidden = bk.step === 0;
    nextBtn.textContent = bk.step === 3 ? 'Confirm booking' : 'Continue';
    nextBtn.disabled = !canAdvance();
    sumEl.textContent = summary();
  }

  $('#bkReason').addEventListener('click', e => {
    const o = e.target.closest('.opt'); if (o) setReason(o.dataset.id);
  });
  $('#bkType').addEventListener('click', e => {
    const o = e.target.closest('.opt'); if (!o) return;
    bk.type = o.dataset.id;
    $$('#bkType .opt').forEach(x => x.classList.toggle('is-on', x === o));
    refresh();
  });
  $('#bkDays').addEventListener('click', e => {
    const d = e.target.closest('.day'); if (!d || d.disabled) return;
    bk.day = +d.dataset.i; bk.time = null;
    $$('#bkDays .day').forEach(x => x.classList.toggle('is-on', x === d));
    renderTimes(); refresh();
  });
  $('#bkTimes').addEventListener('click', e => {
    const t = e.target.closest('.time'); if (!t || t.disabled) return;
    bk.time = t.dataset.t;
    $$('#bkTimes .time').forEach(x => x.classList.toggle('is-on', x === t));
    refresh();
  });
  ['#bkName','#bkPhone','#bkEmail'].forEach(s => $(s).addEventListener('input', refresh));

  backBtn.addEventListener('click', () => { bk.step = Math.max(0, bk.step - 1); refresh(); });
  nextBtn.addEventListener('click', () => {
    if (!canAdvance()) return;
    if (bk.step < 3) { bk.step++; refresh(); return; }
    confirmBooking();
  });

  /* ── Confirmation ──────────────────────────────────── */
  const conf = $('#conf');
  function confirmBooking() {
    const d = days[bk.day];
    const type = TYPES.find(t => t.id === bk.type);
    const reason = REASONS.find(r => r.id === bk.reason);
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    $('#confList').innerHTML = `
      <div><dt>Who</dt><dd>${esc($('#bkName').value) || '—'}</dd></div>
      <div><dt>With</dt><dd>Daniel Mercer</dd></div>
      <div><dt>When</dt><dd>${dayName} ${d.getDate()} ${months[d.getMonth()]}<br>${bk.time}</dd></div>
      <div><dt>Appointment</dt><dd>${type.t}</dd></div>
      <div><dt>Reason</dt><dd>${reason.t}</dd></div>
      <div><dt>Fee</dt><dd>$${type.fee.toFixed(2).replace(/\.00$/,'')}</dd></div>
      <div><dt>Where</dt><dd>4/62 Burnett Street<br>Buderim QLD 4556</dd></div>`;
    conf.classList.add('is-on');
    conf.setAttribute('aria-hidden','false');
    if (lenis) lenis.stop();
    $('.conf__close').focus();
  }
  function closeConf(){
    conf.classList.remove('is-on');
    conf.setAttribute('aria-hidden','true');
    if (lenis) lenis.start();
  }
  $$('[data-cclose]').forEach(b => b.addEventListener('click', closeConf));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeConf(); closeMenu(); }
  });

  refresh();

  /* ── Accordion ─────────────────────────────────────── */
  $$('.acc__i').forEach(item => {
    const q = $('.acc__q', item), a = $('.acc__a', item);
    q.setAttribute('aria-expanded','false');
    q.addEventListener('click', () => {
      const open = item.classList.contains('is-on');
      $$('.acc__i').forEach(o => {
        if (o === item) return;
        o.classList.remove('is-on');
        $('.acc__q', o).setAttribute('aria-expanded','false');
        gsap.to($('.acc__a', o), { height: 0, duration: .45, ease: 'power3.inOut' });
      });
      item.classList.toggle('is-on', !open);
      q.setAttribute('aria-expanded', String(!open));
      gsap.to(a, { height: open ? 0 : 'auto', duration: .5, ease: 'power3.inOut',
        onComplete: () => ScrollTrigger.refresh() });
    });
  });

  /* ── Band video fallback ───────────────────────────── */
  const bv = $('#bandVideo');
  if (bv && reduced) { bv.pause(); bv.removeAttribute('autoplay'); }

  /* ── Boot ──────────────────────────────────────────── */
  bindScrollReveals();
  ScrollTrigger.refresh();
  if (lenis) lenis.stop();
  playIntro(() => { if (lenis) lenis.start(); heroIn(); ScrollTrigger.refresh(); });
})();
