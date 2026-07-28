/* ═══════════════════════════════════════════════════════
   LUMEN & LARCH — page logic
   The pinned section drives the assembly; when it releases, the same canvas
   is moved into the configurator and handed to the visitor.
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = n => Math.round(n).toLocaleString('en-AU');
  const LL = window.LL || {};

  /* ── nav ───────────────────────────────────────────── */
  const nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));

  if (!LL.build) return;                       // no WebGL, page still reads fine

  /* ── the assembly story ────────────────────────────── */
  const STORY = [
    { n:'Part one',   t:'The upright',
      p:'A single length of hardwood with a routed channel every 40 millimetres. Everything else in the system hangs off it, and it is the only part that touches your wall.' },
    { n:'Part two',   t:'The shelf',
      p:'Drops into the channel and locks with a quarter turn. 18mm solid, which is why it holds a metre of books across a 760 bay without a sag.' },
    { n:'Part three', t:'The modules',
      p:'Nine of them, all on the same footprint as a shelf. Cabinet doors, glass doors, drawers in two or three, cubbies, record dividers, a bottle rack and a fold-out desk.' },
    { n:'Part four',  t:'The frame options',
      p:'Back panels, a plinth to lift it off the floor, and cross-bracing for anything over five rows. None of them are compulsory and all of them can be added later.' },
    { n:'Together',   t:'A 610',
      p:'Three bays, four rows, oak. That is the version most people start with, and the one nobody has ever asked us to take back.' }
  ];

  const stepN = $('#stepN'), stepT = $('#stepT'), stepP = $('#stepP');
  let storyAt = -1;
  function setStory(i) {
    if (i === storyAt) return;
    const up = i > storyAt; storyAt = i;
    const s = STORY[i];
    if (reduced) { stepN.textContent = s.n; stepT.textContent = s.t; stepP.textContent = s.p; return; }
    gsap.to([stepN, stepT, stepP], {
      opacity: 0, y: up ? -10 : 10, duration: .22, ease: 'power2.in',
      onComplete() {
        stepN.textContent = s.n; stepT.textContent = s.t; stepP.textContent = s.p;
        gsap.fromTo([stepN, stepT, stepP], { opacity: 0, y: up ? 12 : -12 },
          { opacity: 1, y: 0, duration: .5, ease: 'power3.out', stagger: .05 });
      }
    });
  }

  /* ── tally of parts currently on screen ────────────── */
  const tallyEl = $('#tally');
  // Counts what is actually on screen, which is what the label promises.
  function renderTally() {
    const c = LL.visibleCounts();
    const rows = [
      ['Uprights', c.post], ['Shelves', c.shelf], ['Modules', c.module],
      ['Back panels', c.back], ['Plinth', c.plinth], ['Bracing', c.brace]
    ];
    tallyEl.innerHTML = rows.map(([l, v]) =>
      `<li class="${v > 0 ? 'is-on' : ''}"><span>${l}</span><b>${v}</b></li>`).join('');
  }

  /* ── the configurator demo config for the assembly ─── */
  LL.cfg.bays = 3; LL.cfg.rows = 4; LL.cfg.timber = 'oak'; LL.cfg.back = false;
  LL.cfg.cells = { '1:0':'cabinet', '2:0':'drawer2', '0:2':'cubby', '2:2':'divider', '1:3':'glass' };
  let totals = LL.build();
  renderTally();

  gsap.registerPlugin(ScrollTrigger);

  if (reduced) {
    LL.setAssembly(1); LL.setInteractive(true);
  } else {
    LL.setAssembly(0);
    const hero = $('#sysHero'), ui = $('.sys__ui'), plan = $('#sysPlan');
    // beside the type where there is room, behind it where there isn't
    const stageOffset = () => innerWidth < 900 ? 0 : 0.95;
    const ghostFor = () => innerWidth < 900 ? .10 : .5;
    LL.setStageX(stageOffset()); LL.setGhost(ghostFor());
    addEventListener('resize', () => LL.setGhost(ghostFor()), { passive: true });
    const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
    ScrollTrigger.create({
      trigger: '.sys', start: 'top top', end: 'bottom bottom-=18%', scrub: .5,
      onUpdate(self) {
        const p = self.progress;

        // The opening holds over an empty stage, then lifts away while the
        // first uprights land — the two moves overlap so it reads as a handover,
        // not as one section ending and another starting.
        // Both blocks sit in the same left column, so they must never be
        // on screen together — the hero is fully gone before the story arrives.
        const out = clamp01((p - .02) / .09);            // hero leaves  → done at .11
        const inn = clamp01((p - .14) / .08);            // story arrives → from .14
        hero.style.opacity = 1 - out;
        hero.style.transform = 'translate3d(0,' + (out * -90).toFixed(1) + 'px,0)';
        hero.style.visibility = out >= 1 ? 'hidden' : 'visible';
        ui.style.opacity = inn;
        plan.style.opacity = 1 - clamp01((p - .02) / .16);
        // the stage sits off to the right under the opening, then settles centre
        LL.setStageX(stageOffset() * (1 - clamp01(p / .22)));

        const build = clamp01((p - .09) / .78);
        LL.setAssembly(build);
        renderTally();
        LL.setSpin(-0.62 + build * 0.5);
        setStory(Math.min(STORY.length - 1, Math.floor(build * STORY.length * .999)));
        $('#sysHint').style.opacity = p > .05 ? 0 : 1;
      }
    });
  }

  /* ── hand the canvas over to the configurator ──────── */
  // Same WebGL context, same object — moving the node is cheaper than building
  // a second scene, and it makes the continuity obvious.
  const canvas = $('#shelfCanvas');
  const viewport = $('#cfgViewport');
  const sysStick = $('.sys__stick');
  let handedOver = false;

  function handOver(toConfig) {
    if (toConfig === handedOver) return;
    handedOver = toConfig;
    if (toConfig) {
      viewport.appendChild(canvas);
      canvas.classList.remove('sys__c');
      LL.setAssembly(1); LL.setInteractive(true);
    } else {
      sysStick.insertBefore(canvas, sysStick.firstChild);
      canvas.classList.add('sys__c');
      LL.setInteractive(false);
    }
    requestAnimationFrame(LL.frame);
  }

  ScrollTrigger.create({
    trigger: '#build', start: 'top 78%', end: 'bottom top',
    onToggle(self) { handOver(self.isActive); }
  });

  /* ── controls ──────────────────────────────────────── */
  const LIMIT = { bays: [2, 5], rows: [3, 6] };
  const BAY_MM = 760, ROW_MM = 360;

  function refresh() {
    totals = LL.build();
    renderTally();

    $('#vBays').textContent = LL.cfg.bays + ' bays';
    $('#vRows').textContent = LL.cfg.rows + ' rows';
    $('#dBays').textContent = (LL.cfg.bays * BAY_MM).toLocaleString('en-AU') + ' mm';
    $('#dRows').textContent = (LL.cfg.rows * ROW_MM).toLocaleString('en-AU') + ' mm';
    $('#vTimber').textContent = totals.timber.n;
    $('#timberNote').textContent = totals.timber.note;

    const rows = [['Uprights', totals.posts], ['Shelves', totals.shelves]]
      .concat(LL.MODULES.filter(m => m.id !== 'open' && totals.mods[m.id] > 0)
        .map(m => [m.n, totals.mods[m.id]]))
      .concat([['Back panels', totals.backs], ['Cross-bracing', totals.braces],
               ['Plinth base', totals.plinth ? 1 : 0]])
      .filter(r => r[1] > 0);
    $('#lines').innerHTML = rows.map(([l, v]) => `<li><span>${l}</span><span>${v}</span></li>`).join('');
    $('#price').textContent = money(totals.price);
    $('#weight').textContent = Math.round(totals.weight) + ' kg';

    $$('[data-step]').forEach(b => {
      const [k, d] = b.dataset.step.split(':');
      const next = LL.cfg[k] + (+d);
      b.disabled = next < LIMIT[k][0] || next > LIMIT[k][1];
    });
    $$('.sw').forEach(s => s.classList.toggle('is-on', s.dataset.t === LL.cfg.timber));
    renderPicker();
  }

  $$('[data-step]').forEach(b => b.addEventListener('click', () => {
    const [k, d] = b.dataset.step.split(':');
    const next = LL.cfg[k] + (+d);
    if (next < LIMIT[k][0] || next > LIMIT[k][1]) return;
    LL.cfg[k] = next;
    // drop any cell config that now sits outside the unit
    Object.keys(LL.cfg.cells).forEach(key => {
      const [bb, rr] = key.split(':').map(Number);
      if (bb >= LL.cfg.bays || rr >= LL.cfg.rows) delete LL.cfg.cells[key];
    });
    const sel = LL.selected;
    if (sel && (sel.b >= LL.cfg.bays || sel.r >= LL.cfg.rows)) LL.selectCell(null, null);
    refresh();
  }));

  $('#swatches').innerHTML = Object.keys(LL.TIMBER).map(k => {
    const c = '#' + LL.TIMBER[k].c.toString(16).padStart(6, '0');
    return `<button class="sw" data-t="${k}" style="background:${c}" aria-label="${LL.TIMBER[k].n}"></button>`;
  }).join('');
  $('#swatches').addEventListener('click', e => {
    const b = e.target.closest('.sw'); if (!b) return;
    LL.cfg.timber = b.dataset.t; refresh();
  });

  [['#backToggle','back'], ['#plinthToggle','plinth'], ['#braceToggle','brace']]
    .forEach(([sel, k]) => $(sel).addEventListener('click', e => {
      LL.cfg[k] = !LL.cfg[k];
      e.currentTarget.setAttribute('aria-pressed', String(LL.cfg[k]));
      refresh();
    }));

  /* ── module picker ─────────────────────────────────── */
  const modsEl = $('#mods');
  modsEl.innerHTML = LL.MODULES.map(m =>
    `<button class="mod" data-m="${m.id}">${m.n}</button>`).join('');

  function renderPicker() {
    const s = LL.selected;
    modsEl.classList.toggle('is-idle', !s);
    $('#vSel').textContent = s
      ? 'Bay ' + (s.b + 1) + ', row ' + (s.r + 1)
      : 'No opening selected';
    const cur = s ? LL.cellType(s.b, s.r) : null;
    $$('.mod').forEach(b => {
      b.disabled = !s;
      b.classList.toggle('is-on', !!s && b.dataset.m === cur);
    });
    const m = cur ? LL.MOD[cur] : null;
    $('#modNote').textContent = s
      ? (m && m.price ? m.n + ' · +$' + m.price + ' each' : 'An open bay costs nothing extra')
      : 'Click an opening in the model to change it.';
  }

  modsEl.addEventListener('click', e => {
    const b = e.target.closest('.mod'); if (!b || b.disabled) return;
    const t = LL.setModule(b.dataset.m);
    if (t) { totals = t; refresh(); }
  });

  LL.onSelect = () => renderPicker();
  LL.onChange = t => { totals = t; refresh(); };

  /* ── timber section ────────────────────────────────── */
  $('#timGrid').innerHTML = Object.keys(LL.TIMBER).map(k => {
    const t = LL.TIMBER[k];
    const c = '#' + t.c.toString(16).padStart(6, '0');
    const delta = Math.round((t.price - 1) * 100);
    return `<div class="tim__i rv">
      <div class="tim__sw" style="background:${c}"></div>
      <p class="tim__n">${t.n}</p>
      <p class="tim__p">${t.note}.</p>
      <p class="tim__x mono dim">${delta === 0 ? 'Baseline price' : (delta > 0 ? '+' : '') + delta + '% on the base'}</p>
    </div>`;
  }).join('');

  refresh();

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
        gsap.to($('.acc__a', o), { height: 0, duration: .4, ease: 'power3.inOut' });
      });
      item.classList.toggle('is-on', !open);
      q.setAttribute('aria-expanded', String(!open));
      gsap.to(a, { height: open ? 0 : 'auto', duration: .45, ease: 'power3.inOut',
        onComplete: () => ScrollTrigger.refresh() });
    });
  });

  /* ── reveals ───────────────────────────────────────── */
  if (reduced) gsap.set('.rv', { opacity: 1, y: 0 });
  else {
    // the opening lives inside the pin now, so it gets its own on-load reveal
    // the headline arrives line by line out of its mask; everything else follows
    gsap.from('#sysHero .sys__ht .ln > i',
      { yPercent: 108, duration: 1.05, ease: 'expo.out', stagger: .09, delay: .15 });
    gsap.from('#sysHero > :not(.sys__ht)',
      { opacity: 0, y: 24, duration: .9, ease: 'power3.out', stagger: .1, delay: .5 });
    gsap.from('#sysPlan', { opacity: 0, duration: 1.6, ease: 'power2.out', delay: .1 });
    $$('.rv').forEach(x => gsap.to(x, {
      opacity: 1, y: 0, duration: .9, ease: 'power3.out',
      delay: parseFloat(x.dataset.d || 0) * .8,
      scrollTrigger: { trigger: x, start: 'top 92%' }
    }));
  }
})();
