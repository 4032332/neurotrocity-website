/* ═══════════════════════════════════════════════════════════════
   VALE & VINE — page logic
   The photograph is fixed behind everything and swaps as you scroll;
   the season switch changes which photographs, which facts, and what
   the calendar costs. One state object drives all of it.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = n => Math.round(n).toLocaleString('en-AU');
  const VV = window.VV;

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const MON3 = MONTHS.map(m => m.slice(0, 3));

  const state = { season:'vin', year:2027, guests:90, pick:null, day:'sat' };

  /* ── nav ───────────────────────────────────────────────────── */
  const nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a[href^="#"]').forEach(a =>
    a.addEventListener('click', () => nav.classList.remove('is-open')));

  /* ── the stage ─────────────────────────────────────────────────
     Three layers: the season hero, the ceremony lawn and the evening
     interior. Scroll decides which is on; the season decides what the
     hero layer is showing. Crossfade only — no transforms on a
     background-size:cover layer, it shimmers.                       */
  const seasonLayers = VV.ORDER.map(id => {
    const el = $('[data-s-layer="' + id + '"]');
    el.style.backgroundImage = 'url(' + VV.SEASONS[id].stage + ')';
    return el;
  });
  const layers = {
    ceremony: $('[data-stage="ceremony"]'),
    evening:  $('[data-stage="evening"]')
  };
  layers.ceremony.style.backgroundImage = 'url(assets/img/ceremony.jpg)';
  layers.evening.style.backgroundImage  = 'url(assets/img/interior.jpg)';
  Object.values(layers).forEach(l => {
    l.style.transition = reduced ? 'none' : 'opacity .9s cubic-bezier(.4,0,.2,1)';
  });

  /* Blend the four season layers by a continuous position 0–3. They are
     stacked in year order, so each later layer simply paints over the one
     before it as its opacity comes up — no muddy triple-exposure. */
  seasonLayers.forEach(el => {
    el.style.transition = reduced ? 'none' : 'opacity .5s cubic-bezier(.4,0,.2,1)';
  });
  let blend = 0;
  function setBlend(t) {
    blend = t;
    seasonLayers.forEach((el, i) => {
      el.style.opacity = i === 0 ? 1 : Math.max(0, Math.min(1, t - (i - 1)));
    });
    syncSeasonVideo();
  }
  function syncSeasonVideo() {
    if (shown !== 'hero') return;
    const i = VV.ORDER.indexOf('pru');
    vidSync('pru', Math.max(0, Math.min(1, blend - (i - 1))));
  }

  /* ── moving plates ─────────────────────────────────────────────
     Two of the stage layers have a video twin. It mirrors the opacity of
     the still underneath it and only plays while it is actually visible —
     a paused, never-fetched video costs nothing, and a decoding one that
     nobody can see costs a lot. Under reduced motion they never load. */
  const vids = {};
  $$('.stage__v').forEach(v => {
    vids[v.dataset.vFor] = v;
    v.style.transition = reduced ? 'none' : 'opacity .5s cubic-bezier(.4,0,.2,1)';
  });
  const VIDEO_SRC = { pru: (VV.SEASONS.pru.video || ''), evening: 'assets/video/interior.mp4' };

  function vidSync(key, on) {
    const v = vids[key];
    if (!v || reduced) return;
    if (on > .02 && !v.getAttribute('src')) v.setAttribute('src', VIDEO_SRC[key]);
    v.style.opacity = on;
    if (on > .05) { if (v.paused) { const p = v.play(); if (p) p.catch(() => {}); } }
    else if (!v.paused) v.pause();
  }

  let shown = 'hero';
  function show(which) {
    if (which === shown) return;
    shown = which;
    Object.keys(layers).forEach(k => layers[k].classList.toggle('is-on', k === which));
    vidSync('evening', which === 'evening' ? 1 : 0);
    // the season plates are covered while a set piece is up, so stop paying for them
    if (which !== 'hero') vidSync('pru', 0); else syncSeasonVideo();
  }

  /* ── season ────────────────────────────────────────────────── */

  function paintSeason(id, animate) {
    const s = VV.SEASONS[id];
    state.season = id;
    document.documentElement.dataset.season = id;

    setBlend(VV.ORDER.indexOf(id));

    const set = () => {
      $('#heroWord').textContent = s.word;
      $('#dayP').textContent     = s.day;
    };

    if (!animate || reduced) set();
    else {
      const targets = [$('#dayP'), $('#heroWord')];
      gsap.to(targets, {
        opacity: 0, duration: .22, ease: 'power2.in',
        onComplete() {
          set();
          gsap.to(targets, { opacity: 1, duration: .5, ease: 'power2.out', stagger: .04 });
        }
      });
    }

    $$('.season').forEach(b => b.classList.toggle('is-on', b.dataset.s === id));
    drawCalendar();
    // a date in another season is no longer meaningful
    if (state.pick && VV.forMonth(state.pick.m) !== id) { state.pick = null; }
    quote();
  }

  $$('.season').forEach(b =>
    b.addEventListener('click', () => paintSeason(b.dataset.s, true)));

  /* ── calendar ──────────────────────────────────────────────── */
  const grid = $('#calGrid');

  function drawCalendar() {
    const y = state.year;
    grid.innerHTML = MONTHS.map((name, m) => {
      const inSeason = VV.forMonth(m) === state.season;
      const days = VV.saturdays(y, m).map(d => {
        const gone = VV.taken(y, m, d);
        const sel = state.pick && state.pick.y === y && state.pick.m === m && state.pick.d === d;
        return '<button class="d ' + (gone ? '' : 'free ') + (sel ? 'is-sel' : '') + '"'
             + (gone ? ' disabled aria-label="' + d + ' ' + name + ', taken"'
                     : ' data-d="' + d + '" data-m="' + m + '"')
             + '>' + d + '</button>';
      }).join('');
      return '<div class="mo ' + (inSeason ? '' : 'off') + '">'
           + '<div class="mo__n"><span class="mono">' + MON3[m] + '</span>'
           + '<span class="mono dim">' + VV.saturdays(y, m).filter(d => !VV.taken(y, m, d)).length
           + ' free</span></div>'
           + '<div class="mo__d">' + days + '</div></div>';
    }).join('');
  }

  grid.addEventListener('click', e => {
    const b = e.target.closest('.d.free');
    if (!b) return;
    state.pick = { y: state.year, m: +b.dataset.m, d: +b.dataset.d };
    const sid = VV.forMonth(state.pick.m);
    if (sid !== state.season) paintSeason(sid, true);   // follow the date into its season
    else { drawCalendar(); quote(); }
  });

  $('#yPrev').addEventListener('click', () => { if (state.year > 2027) { state.year--; step(); } });
  $('#yNext').addEventListener('click', () => { if (state.year < 2029) { state.year++; step(); } });
  function step() {
    $('#yNow').textContent = state.year;
    $('#yPrev').disabled = state.year <= 2027;
    $('#yNext').disabled = state.year >= 2029;
    state.pick = null;
    drawCalendar(); quote();
  }

  /* ── guests & quote ────────────────────────────────────────── */
  $('#gUp').addEventListener('click',   () => nudge(+10));
  $('#gDown').addEventListener('click', () => nudge(-10));
  function nudge(n) {
    state.guests = Math.min(VV.MAX_GUESTS, Math.max(VV.MIN_GUESTS, state.guests + n));
    $('#gNow').textContent = state.guests;
    $('#gUp').disabled   = state.guests >= VV.MAX_GUESTS;
    $('#gDown').disabled = state.guests <= VV.MIN_GUESTS;
    quote();
  }

  /* ── which day of the weekend ─────────────────────────────────
     One wedding a week means the weekend is the unit that is free or taken;
     the day inside it is the couple's choice, and Friday and Sunday are
     genuinely cheaper. Hiding that would contradict the whole section. */
  $('#days').innerHTML = VV.DAYS.map(d =>
    '<button data-day="' + d.id + '"' + (d.id === state.day ? ' class="is-on"' : '') + '>'
    + d.n + '<span>' + (d.mult < 1 ? 'less' : 'standard') + '</span></button>').join('');
  $('#days').addEventListener('click', e => {
    const b = e.target.closest('[data-day]');
    if (!b) return;
    state.day = b.dataset.day;
    $$('#days button').forEach(x => x.classList.toggle('is-on', x.dataset.day === state.day));
    quote();
  });

  function quote() {
    const q = VV.quote(state.season, state.guests, state.day);
    $('#lines').innerHTML = q.lines.map(([l, v]) =>
      '<div class="cal__row"><span>' + l + '</span><span>$' + money(v) + '</span></div>').join('');
    $('#total').textContent = money(q.total);
    $('#dayNote').textContent = q.saving
      ? q.day.note + ' Saves $' + money(q.saving) + ' on the site fee.'
      : q.day.note;

    const p = state.pick;
    if (p) {
      const d = VV.dateFor(p.y, p.m, p.d, state.day);
      $('#pickT').textContent = [d.name, d.d, MONTHS[d.m], d.y].join(' ');
    } else {
      $('#pickT').textContent = 'Pick a weekend';
    }
  }

  /* ── the year, drawn ───────────────────────────────────────────
     One path for the sunset curve, one faint path for the grid, a dot that
     rides the line, and a twelve-month ruler. Built from VV.YEAR so the
     chart and the read-out can never disagree.                          */
  const svg = $('#yrSvg'), line = $('#yrLine'), dot = $('#yrDot');
  const W = 1200, H = 190, PADX = 8, LO = 306, HI = 462;
  const px = i => PADX + (i / 11) * (W - PADX * 2);
  const py = v => H - 14 - ((v - LO) / (HI - LO)) * (H - 34);

  // Catmull-Rom through the twelve points, as cubic béziers — a polyline
  // would make a smooth astronomical curve look like a sales chart.
  (function drawCurve() {
    const P = VV.YEAR.map((d, i) => [px(i), py(d.sunset)]);
    let d = 'M' + P[0][0] + ',' + P[0][1];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6) + ',' + (p1[1] + (p2[1] - p0[1]) / 6)
         + ' ' + (p2[0] - (p3[0] - p1[0]) / 6) + ',' + (p2[1] - (p3[1] - p1[1]) / 6)
         + ' ' + p2[0] + ',' + p2[1];
    }
    line.setAttribute('d', d);
    $('#yrGrid').setAttribute('d',
      VV.YEAR.map((_, i) => 'M' + px(i) + ',' + (H - 8) + 'V' + (H - 16)).join(' '));
    $('#yrRuler').innerHTML = VV.YEAR.map(m =>
      '<span>' + m.n.slice(0, 3) + '</span>').join('');
    $('#yrBands').innerHTML = VV.ORDER.map(id =>
      '<i title="' + VV.SEASONS[id].name + '"></i>').join('');
  })();

  /* The chart is stretched horizontally (preserveAspectRatio="none"), so a
     stroke-dash draw and getPointAtLength disagree — dash length is measured
     in user units along the path, which no longer maps to what you see. Clip
     to an x-position instead: exact, and it lines up with the month ruler. */
  const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  (function () {
    const NS = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(NS, 'defs');
    const cp = document.createElementNS(NS, 'clipPath');
    cp.setAttribute('id', 'yrClip'); cp.setAttribute('clipPathUnits', 'userSpaceOnUse');
    clipRect.setAttribute('x', 0); clipRect.setAttribute('y', -20);
    clipRect.setAttribute('height', H + 40); clipRect.setAttribute('width', 0);
    cp.appendChild(clipRect); defs.appendChild(cp); svg.insertBefore(defs, svg.firstChild);
    line.setAttribute('clip-path', 'url(#yrClip)');
  })();

  const len = line.getTotalLength();
  // y for a given x, by bisection on the path — the curve is monotonic in x
  function yAt(x) {
    let lo = 0, hi = len;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (line.getPointAtLength(mid).x < x) lo = mid; else hi = mid;
    }
    return line.getPointAtLength((lo + hi) / 2).y;
  }
  const rulerTicks = $$('#yrRuler span');
  const bandEls = $$('#yrBands i');
  const drop = $('#yrDrop');

  // cross-fade a single element's text, so a season change reads as a change
  function swap(el, text) {
    if (el.textContent === text) return;
    if (reduced) { el.textContent = text; return; }
    gsap.to(el, { opacity: 0, duration: .2, ease: 'power2.in', onComplete() {
      el.textContent = text;
      gsap.to(el, { opacity: 1, duration: .45, ease: 'power2.out' });
    } });
  }

  function paintYear(f) {
    const y = VV.atYear(f);
    const x = px(f * 11);
    clipRect.setAttribute('width', x);
    dot.setAttribute('cx', x); dot.setAttribute('cy', yAt(x));

    const s = VV.SEASONS[y.season];
    if ($('#yrMonth').textContent !== y.month) $('#yrMonth').textContent = y.month;
    $('#yrSeason').textContent = s.name + ' · ' + s.rate.toLowerCase() + ' rate';
    $('#yrSun').textContent  = VV.clock(y.sunset);
    $('#yrTemp').textContent = Math.round(y.temp) + '°';
    $('#yrPrice').textContent = '$' + money(VV.quote(y.season, state.guests, 'sat').total);

    drop.setAttribute('x1', x); drop.setAttribute('x2', x);
    drop.setAttribute('y1', yAt(x));
    rulerTicks.forEach((t, i) => t.classList.toggle('is-on', i === Math.round(f * 11)));
    bandEls.forEach((b, i) => b.classList.toggle('is-on', VV.ORDER[i] === y.season));

    if (y.season !== state.season) {
      state.season = y.season;
      document.documentElement.dataset.season = y.season;
      $$('.season').forEach(b => b.classList.toggle('is-on', b.dataset.s === y.season));
      $('#heroWord').textContent = s.word;
      $('#dayP').textContent = s.day;
      // the writing is the point of the section; bring it with the season
      swap($('#yearP'), s.lede);
      swap($('#yrVines'), s.vines);
      swap($('#yrFlower'), s.flower);
      swap($('#yrTime'), s.time);
      drawCalendar(); quote();
    }
    // the photograph moves with the year, not with the season boundary
    setBlend(f * 11 / 3);
  }

  /* ── scroll ────────────────────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);

  if (reduced) {
    $$('.rv').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    setBlend(VV.ORDER.indexOf('vin'));
    paintYear(VV.seasonAt('vin'));
    // no scroll triggers run, so hold the photograph back far enough to read over
    $('#scrim').style.opacity = .84;
  } else {
    gsap.to('.hero .rv', { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                           stagger: .1, delay: .2 });
    $$('.rv').filter(el => !el.closest('.hero')).forEach(el =>
      gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 90%' } }));

    /* ── what is behind you ──────────────────────────────────────
       Derived from scroll position each frame rather than from per-trigger
       enter/leave callbacks. An instant jump toggles several sections in one
       tick and the order is not guaranteed, which left the scrim opaque over
       the hero one way and transparent over the data the other. Asking which
       section owns the middle of the screen right now cannot race. */
    const scrim = $('#scrim');
    const veilSecs = $$('[data-veil]');
    const cueSecs  = $$('[data-stage-cue]');
    let ticking = false;

    function syncStage() {
      ticking = false;
      const mid = innerHeight * .5;
      let v = 0, cue = 'hero';
      for (const sec of veilSecs) {
        const r = sec.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { v = sec.dataset.veil; break; }
      }
      for (const sec of cueSecs) {
        const r = sec.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { cue = sec.dataset.stageCue; break; }
      }
      scrim.style.opacity = v;
      show(cue);
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(syncStage); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    syncStage();

    // the year itself
    const yrST = ScrollTrigger.create({
      trigger: '#year', start: 'top top', end: 'bottom bottom', scrub: .45,
      // Only paint while the section actually holds the screen. Otherwise the
      // initial refresh fires at progress 0 and drags the hero back to
      // September, losing the frame the page should open on.
      onUpdate(self) { if (self.isActive) paintYear(self.progress); },
      onLeaveBack()  { paintSeason('vin', false); }
    });

    // the rail becomes a jump control while the year is on screen
    $$('.season').forEach(b => b.addEventListener('click', e => {
      const r = document.querySelector('#year').getBoundingClientRect();
      const inYear = r.top <= 0 && r.bottom >= innerHeight;
      if (!inYear) return;
      e.stopImmediatePropagation();
      scrollTo({ top: yrST.start + (yrST.end - yrST.start) * VV.seasonAt(b.dataset.s),
                 behavior: 'smooth' });
    }, true));
  }

  /* ── go ────────────────────────────────────────────────────── */
  paintSeason('vin', false);   // the page opens on the frame that sells it
  step();
  $('#gNow').textContent = state.guests;
})();
