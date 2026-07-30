/* ═══════════════════════════════════════════════════════
   FORGE ATHLETIC — Islington, Newcastle
   The timetable is the site. Everything else hangs off which sessions
   somebody picks. Capacity is generated from a seeded PRNG so a given
   session always shows the same number of spots.
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  const rnd = (a, b = 0) => {
    const x = Math.sin(a * 91.7 + b * 47.3) * 43758.5453;
    return x - Math.floor(x);
  };

  /* ── the timetable ─────────────────────────────────── */
  const CAP = 8;
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat'];
  // time, name, type, coach — the Saturday column runs a shorter morning.
  const TEMPLATE = {
    weekday: [
      ['05:30','Strength','Strength','Mara'],
      ['06:15','Strength','Strength','Tom'],
      ['07:00','Conditioning','Conditioning','Jack'],
      ['09:30','Beginners','Beginners','Mara'],
      ['12:00','Conditioning','Conditioning','Jack'],
      ['16:30','Technique','Technique','Priya'],
      ['17:15','Strength','Strength','Tom'],
      ['18:00','Strength','Strength','Mara'],
      ['18:45','Conditioning','Conditioning','Jack']
    ],
    sat: [
      ['07:00','Strength','Strength','Tom'],
      ['08:00','Technique','Technique','Priya'],
      ['09:00','Beginners','Beginners','Mara'],
      ['10:00','Open Gym','Open','Priya']
    ]
  };

  const SESSIONS = [];
  DAYS.forEach((d, di) => {
    const list = di === 5 ? TEMPLATE.sat : TEMPLATE.weekday;
    list.forEach((s, si) => {
      // Early and evening slots run fuller than the middle of the day.
      const hour = parseInt(s[0], 10);
      const demand = (hour <= 7 || hour >= 17) ? .82 : .5;
      const booked = Math.min(CAP, Math.round(demand * CAP + (rnd(di + 1, si + 1) - .45) * 3.4));
      SESSIONS.push({
        id: d + '-' + s[0], day: d, dayI: di, time: s[0],
        name: s[1], type: s[2], coach: s[3],
        booked: Math.max(0, booked), left: Math.max(0, CAP - Math.max(0, booked))
      });
    });
  });

  const TIERS = [
    { id:'t2', n:'Twice a week', p:44, max:2,
      f:['Two coached sessions a week','Program written for you','Re-test every eight weeks'] },
    { id:'t3', n:'Three a week', p:56, max:3, pick:true,
      f:['Three coached sessions','Program written for you','Re-test every eight weeks','Bring a guest once a month'] },
    { id:'tu', n:'Unlimited', p:69, max:99,
      f:['Every coached session','Open Gym access','Standing weekly bookings','Program written for you','Re-test every eight weeks'] }
  ];

  /* ── render the week ───────────────────────────────── */
  const picked = new Set();
  let filter = 'all';

  /* On a phone all six days stacked is roughly six screens of table, so only
     one day is shown at a time and the tab bar does the choosing. The markup
     is identical either way — the tabs and the hiding are mobile-only. */
  const narrow = () => matchMedia('(max-width:760px)').matches;
  let dayView = DAYS[0];

  function renderTabs() {
    $('#dayTabs').innerHTML = DAYS.map(d => {
      const open = SESSIONS.filter(s => s.day === d).reduce((a, s) => a + s.left, 0);
      return `<button role="tab" data-day="${d}" aria-selected="${d === dayView}"
        class="${d === dayView ? 'is-on' : ''}">${d}<small>${open} free</small></button>`;
    }).join('');
  }
  function applyDayView() {
    const one = narrow();
    $$('#days .day').forEach(el => { el.hidden = one && el.dataset.day !== dayView; });
    $$('#dayTabs button').forEach(b => {
      const on = b.dataset.day === dayView;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
    });
  }
  $('#dayTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-day]');
    if (!b) return;
    dayView = b.dataset.day;
    applyDayView();
  });
  addEventListener('resize', applyDayView, { passive: true });

  function renderWeek() {
    $('#days').innerHTML = DAYS.map((d, di) => {
      const rows = SESSIONS.filter(s => s.day === d && (filter === 'all' || s.type === filter));
      const open = SESSIONS.filter(s => s.day === d).reduce((a, s) => a + s.left, 0);
      return `<div class="day" data-day="${d}">
        <div class="day__h"><span class="day__n">${d}</span><span class="day__c mono">${open} free</span></div>
        <div class="day__list">
          ${rows.length ? rows.map(s => {
            const tight = s.left > 0 && s.left <= 2;
            return `<button class="sess ${picked.has(s.id) ? 'is-on' : ''} ${s.left === 0 ? 'is-full' : ''} ${tight ? 'sess--tight' : ''}"
              data-id="${s.id}" ${s.left === 0 ? 'disabled aria-disabled="true"' : ''}>
              <span class="sess__t">${s.time}</span>
              <span class="sess__n">${esc(s.name)}</span>
              <span class="sess__m"><span>${esc(s.coach)}</span><span>${s.left === 0 ? 'Full' : s.left + ' left'}</span></span>
              <span class="sess__cap"><i style="transform:scaleX(${(s.booked / CAP).toFixed(3)})"></i></span>
            </button>`;
          }).join('') : '<div style="padding:14px 10px" class="mono dim">Nothing this day</div>'}
        </div>
      </div>`;
    }).join('');
    renderTabs();
    applyDayView();
  }

  function tierFor(n) {
    if (n === 0) return null;
    return TIERS.find(t => n <= t.max) || TIERS[TIERS.length - 1];
  }

  function renderYours() {
    const n = picked.size;
    const list = SESSIONS.filter(s => picked.has(s.id))
      .sort((a, b) => a.dayI - b.dayI || a.time.localeCompare(b.time));

    $('#yoursN').textContent = n === 0 ? 'Nothing yet' : n + (n === 1 ? ' session' : ' sessions');
    $('#yoursSub').textContent = n === 0 ? 'Tap a session to start' : 'a week';
    $('#yoursList').innerHTML = n === 0
      ? '<li class="yours__empty mono dim">No sessions picked</li>'
      : list.map(s => `<li>
          <span><span class="mono dim">${s.day} ${s.time}</span><br>${esc(s.name)}</span>
          <button class="x" data-drop="${s.id}" aria-label="Remove ${s.day} ${s.time}">✕</button>
        </li>`).join('');

    const t = tierFor(n);
    $('#planN').textContent = t ? t.n : '—';
    $('#planP').textContent = t ? '$' + t.p : '—';
    $('#planNote').textContent = t
      ? (n > 3 ? 'per week · Unlimited is cheaper than ' + n + ' casual visits' : 'per week, no lock-in')
      : 'per week, no lock-in';

    $$('.tier').forEach(el => el.classList.toggle('is-pick', !!t && el.dataset.tier === t.id));
  }

  $('#tiers').innerHTML = TIERS.map(t => `
    <div class="tier ${t.pick ? 'is-pick' : ''}" data-tier="${t.id}">
      <p class="tier__n">${t.n}</p>
      <p class="tier__p">$${t.p}</p>
      <p class="mono dim">per week, paid fortnightly</p>
      <ul>${t.f.map(f => `<li>${f}</li>`).join('')}</ul>
    </div>`).join('');

  renderWeek(); renderYours();

  /* ── events ────────────────────────────────────────── */
  let toastT;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('is-on'), 2000);
  }

  $('#days').addEventListener('click', e => {
    const b = e.target.closest('.sess'); if (!b || b.disabled) return;
    const id = b.dataset.id;
    if (picked.has(id)) { picked.delete(id); }
    else {
      picked.add(id);
      const t = tierFor(picked.size);
      if (t) toast(picked.size + ' a week · ' + t.n + ' · $' + t.p);
    }
    b.classList.toggle('is-on', picked.has(id));
    renderYours();
  });

  $('#yoursList').addEventListener('click', e => {
    const b = e.target.closest('[data-drop]'); if (!b) return;
    picked.delete(b.dataset.drop);
    renderWeek(); renderYours();
  });

  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('.filt'); if (!b) return;
    filter = b.dataset.f;
    $$('#filters .filt').forEach(x => x.classList.toggle('is-on', x === b));
    renderWeek();
  });

  const nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));

  /* ── accordion ─────────────────────────────────────── */
  $$('.acc__i').forEach(item => {
    const q = $('.acc__q', item), a = $('.acc__a', item);
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', () => {
      const open = item.classList.contains('is-on');
      $$('.acc__i').forEach(o => {
        if (o === item) return;
        o.classList.remove('is-on');
        $('.acc__q', o).setAttribute('aria-expanded', 'false');
        if (window.gsap) gsap.to($('.acc__a', o), { height: 0, duration: .4, ease: 'power3.inOut' });
        else $('.acc__a', o).style.height = '0px';
      });
      item.classList.toggle('is-on', !open);
      q.setAttribute('aria-expanded', String(!open));
      if (window.gsap) gsap.to(a, { height: open ? 0 : 'auto', duration: .45, ease: 'power3.inOut',
        onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh() });
      else a.style.height = open ? '0px' : 'auto';
    });
  });

  /* ── motion ────────────────────────────────────────── */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Split the hero lines into characters so the headline builds rather than fades.
    const heroT = $('#heroT');
    if (heroT) {
      $$('.ln', heroT).forEach(ln => {
        ln.innerHTML = ln.textContent.split('').map(c =>
          `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
      });
    }

    if (reduced) {
      gsap.set('.rv', { opacity: 1, y: 0 });
      gsap.set('.ch', { y: 0 });
    } else {
      const intro = gsap.timeline();
      intro.to('.ch', { y: 0, duration: 1.05, ease: 'expo.out', stagger: { each: .016, from: 'start' } })
           .to('.hero .rv', { opacity: 1, y: 0, duration: .85, ease: 'power3.out', stagger: .07 }, .35)
           .fromTo('.hero__bg img', { scale: 1.14 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0);

      $$('.rv').filter(x => !x.closest('.hero')).forEach(x => gsap.to(x, {
        opacity: 1, y: 0, duration: .9, ease: 'power3.out',
        delay: parseFloat(x.dataset.d || 0) * .8,
        scrollTrigger: { trigger: x, start: 'top 92%' }
      }));

      // hero parallax + fade as it leaves
      gsap.to('.hero__bg', { yPercent: 16, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 } });
      gsap.to('.hero__in', { yPercent: -10, opacity: .25, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 } });

      // The marquee runs on its own and gains speed from scroll velocity, so the
      // page feels like it has momentum rather than just moving.
      const marq = $('#marq');
      if (marq) {
        const half = marq.scrollWidth / 2;
        const drift = gsap.to(marq, { x: -half, duration: 22, ease: 'none', repeat: -1,
          modifiers: { x: v => (parseFloat(v) % half) + 'px' } });
        ScrollTrigger.create({
          onUpdate(self) {
            const v = Math.min(4, 1 + Math.abs(self.getVelocity()) / 900);
            gsap.to(drift, { timeScale: v, duration: .3, overwrite: true });
            gsap.to(drift, { timeScale: 1, duration: 1.1, delay: .25, overwrite: false });
          }
        });
      }

      // Scroll velocity skews the room photographs — cheap, and it makes the
      // section feel physical when you fling past it.
      const room = $$('.roomgrid figure');
      if (room.length) {
        ScrollTrigger.create({
          trigger: '#room', start: 'top bottom', end: 'bottom top',
          onUpdate(self) {
            const sk = gsap.utils.clamp(-7, 7, self.getVelocity() / 260);
            gsap.to(room, { skewY: sk, duration: .5, ease: 'power3.out', overwrite: 'auto' });
            gsap.to(room, { skewY: 0, duration: .9, delay: .12, overwrite: false });
          }
        });
        gsap.fromTo(room, { yPercent: 7 }, { yPercent: -7, ease: 'none', stagger: .04,
          scrollTrigger: { trigger: '#room', start: 'top bottom', end: 'bottom top', scrub: .8 } });
      }

      // hero stat counters
      $$('.hero__facts .v').forEach(el => {
        const raw = el.textContent.trim();
        const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
        if (!num || /:/.test(raw)) return;
        const suffix = raw.replace(/[0-9.]/g, '');
        const o = { v: 0 };
        gsap.to(o, { v: num, duration: 1.4, ease: 'power2.out', delay: .5,
          onUpdate(){ el.textContent = Math.round(o.v) + suffix; } });
      });
    }
  } else {
    $$('.rv').forEach(x => { x.style.opacity = 1; x.style.transform = 'none'; });
    $$('.ch').forEach(x => { x.style.transform = 'none'; });
  }
})();
