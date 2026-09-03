/* ═══════════════════════════════════════════════════════════════
   VALE & VINE — the season model
   One object per season. Everything on the page that changes when you
   switch reads from here, so there is exactly one place to edit a fact.
   Sunset times are real Margaret River (-33.95, 115.07) mid-season figures.
   ═══════════════════════════════════════════════════════════════ */
window.VV = (function () {
  'use strict';

  const SEASONS = {
    bud: {
      id:'bud', name:'Budburst', months:'Sep – Nov', m:[8,9,10],
      word:'Spring',
      vines:'Waking up',   time:'4:30 pm', sun:'6:52 pm', temp:'19°',
      flower:'Wattle', rate:'Shoulder', mult:0.88,
      stage:'assets/img/stage-bud.jpg',
      supA:'assets/img/sup-bud.jpg',   capA:'New growth, October',
      supB:'assets/img/detail-table.jpg', capB:'Long table, set for 90',
      lede:'The vines break bud in the first week of September and the whole '
         + 'place goes from bare sticks to green in about a fortnight. Cool '
         + 'mornings, warm afternoons, and the cheapest Saturdays of the year.',
      day:'A 4:30 ceremony gives you an hour of photographs before the light goes. '
        + 'Spring evenings turn cold quickly, so the fire in the pavilion gets lit '
        + 'around eight and nobody moves after that.'
    },
    rip: {
      id:'rip', name:'Ripening', months:'Dec – Feb', m:[11,0,1],
      word:'Summer',
      vines:'Heavy with fruit', time:'5:00 pm', sun:'7:28 pm', temp:'29°',
      flower:'Marri', rate:'Peak', mult:1.15,
      stage:'assets/img/stage-rip.jpg',
      supA:'assets/img/sup-rip.jpg',   capA:'Under the trees, January',
      supB:'assets/img/detail-candles.jpg', capB:'Candles, once the heat drops',
      lede:'Hot, dry and very long days. Nothing happens outdoors before five, and '
         + 'then the whole evening opens up in front of you. This is the season '
         + 'everyone asks for, which is why it costs what it costs.',
      day:'Ceremony at five, when the paddock finally goes into shade. Drinks on the '
        + 'lawn until the light drops behind the ridge around eight, then dinner under '
        + 'the iron with every side open.'
    },
    vin: {
      id:'vin', name:'Vintage', months:'Mar – May', m:[2,3,4],
      word:'Autumn',
      vines:'Turning gold',  time:'4:00 pm', sun:'6:14 pm', temp:'24°',
      flower:'Banksia', rate:'Peak', mult:1.10,
      stage:'assets/img/stage-vin.jpg',
      supA:'assets/img/sup-vin.jpg',   capA:'Cabernet leaf, late April',
      supB:'assets/img/detail-candles.jpg', capB:'Candlelight, once the sun is off the lawn',
      lede:'Harvest runs through March and the vineyard smells like fermenting fruit '
         + 'for a fortnight. By late April the cabernet turns and the whole valley goes '
         + 'gold. If you have seen one photograph of this place, it was taken now.',
      day:'A four o\'clock ceremony puts the sun directly behind the arbour, which is '
        + 'either the best or worst thing that can happen to your photographer, depending '
        + 'entirely on your photographer.'
    },
    pru: {
      id:'pru', name:'Pruning', months:'Jun – Aug', m:[5,6,7],
      word:'Winter',
      vines:'Cut back, bare', time:'3:00 pm', sun:'5:22 pm', temp:'16°',
      flower:'Hakea', rate:'Quiet', mult:0.72,
      stage:'assets/img/stage-pru.jpg', video:'assets/video/venue-pru.mp4',
      supA:'assets/img/sup-pru.jpg',   capA:'Fog on the rows, July',
      supB:'assets/img/sup-pru2.jpg',  capB:'Forty year old cabernet, pruned back',
      lede:'Fog until ten, bare rows, and the shortest days of the year. It is also '
         + 'the only season you will have the whole valley to yourself, and the only '
         + 'one where the fire matters more than the view.',
      day:'Everything happens indoors and early. Ceremony at three inside the pavilion '
        + 'with the ends closed in, drinks by the fire, and dinner starting while it is '
        + 'still not quite dark.'
    }
  };

  const ORDER = ['bud','rip','vin','pru'];

  // Which season a given month belongs to
  const forMonth = m => ORDER.find(k => SEASONS[k].m.indexOf(m) >= 0);

  /* ── pricing ────────────────────────────────────────────────
     A flat site fee that moves with the season, plus per-head for
     the things that genuinely scale. Deliberately legible: a couple
     should be able to check the arithmetic in their head.          */
  const BASE = 9800, PER_HEAD = 42, MIN_GUESTS = 40, MAX_GUESTS = 140;

  /* The booking is the whole weekend either way — one wedding a week — so the
     day you actually marry on is a choice inside it, not a separate product.
     Friday and Sunday cost less because they are harder to fill, which is the
     honest reason and the one worth showing a couple. */
  const DAYS = [
    { id:'fri', n:'Friday',   off:-1, mult:0.85, note:'Guests take the Monday off, or leave Sunday.' },
    { id:'sat', n:'Saturday', off: 0, mult:1.00, note:'The one everyone asks for.' },
    { id:'sun', n:'Sunday',   off: 1, mult:0.80, note:'Cheapest by a distance. Long weekends book out first.' }
  ];
  const DAY = id => DAYS.find(d => d.id === id) || DAYS[1];

  function quote(seasonId, guests, dayId) {
    const s = SEASONS[seasonId], d = DAY(dayId);
    const site = Math.round(BASE * s.mult * d.mult / 50) * 50;
    const head = guests * PER_HEAD;
    const bump = guests > 96 ? 1450 : 0;      // marquee extension past one long table
    const lines = [
      ['Exclusive use, Fri noon – Sun noon · ' + d.n + ' rate', site],
      ['Chairs, tables, glassware · ' + guests, head]
    ];
    if (bump) lines.push(['Second table run, over 96 guests', bump]);
    return { lines, total: site + head + bump, day: d,
             saving: d.mult < 1
               ? Math.round(BASE * s.mult * (1 - d.mult) / 50) * 50 : 0 };
  }

  /* ── availability ───────────────────────────────────────────
     Seeded so the calendar is identical on every visit and on every
     machine — a demo that reshuffles itself looks broken, not alive. */
  function taken(y, m, d) {
    const n = Math.sin(y * 12.9898 + m * 78.233 + d * 37.719) * 43758.5453;
    const f = n - Math.floor(n);
    // peak seasons book out harder than quiet ones
    const s = SEASONS[forMonth(m)];
    return f < (s.mult > 1 ? 0.62 : s.mult < 0.8 ? 0.18 : 0.38);
  }

  // Weekends are keyed by their Saturday — one wedding a week means the
  // Saturday date names the whole Fri-noon-to-Sun-noon block.
  function saturdays(y, m) {
    const out = [];
    const dim = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) if (new Date(y, m, d).getDay() === 6) out.push(d);
    return out;
  }

  // The actual date you marry on, given the weekend's Saturday and a day choice
  function dateFor(y, m, d, dayId) {
    const t = new Date(y, m, d + DAY(dayId).off);
    return { y:t.getFullYear(), m:t.getMonth(), d:t.getDate(), name:DAY(dayId).n };
  }

  /* ── the vineyard year ──────────────────────────────────────
     Ordered September → August, because that is the growing year and it
     runs budburst → ripening → vintage → pruning in sequence.
     Sunset is minutes after noon; temp is the mean daily maximum.
     Both are real Margaret River figures, which is the whole point —
     "how long will the light last" is a genuine wedding-planning
     question and nobody's venue site answers it.                      */
  const YEAR = [
    { m:8,  n:'September', s:'bud', sunset:367, temp:18 },
    { m:9,  n:'October',   s:'bud', sunset:393, temp:20 },
    { m:10, n:'November',  s:'bud', sunset:423, temp:23 },
    { m:11, n:'December',  s:'rip', sunset:444, temp:26 },
    { m:0,  n:'January',   s:'rip', sunset:452, temp:29 },
    { m:1,  n:'February',  s:'rip', sunset:430, temp:29 },
    { m:2,  n:'March',     s:'vin', sunset:393, temp:27 },
    { m:3,  n:'April',     s:'vin', sunset:352, temp:23 },
    { m:4,  n:'May',       s:'vin', sunset:324, temp:20 },
    { m:5,  n:'June',      s:'pru', sunset:316, temp:17 },
    { m:6,  n:'July',      s:'pru', sunset:326, temp:16 },
    { m:7,  n:'August',    s:'pru', sunset:347, temp:16 }
  ];

  const clock = mins => {
    // interpolated positions arrive fractional; a clock has whole minutes
    const t = 12 * 60 + Math.round(mins), h = Math.floor(t / 60), mm = t % 60;
    return ((h - 1) % 12 + 1) + ':' + String(mm).padStart(2, '0') + ' pm';
  };

  // Read the year at any fractional point, so scroll can move through it
  // continuously rather than snapping between four states.
  function atYear(f) {
    const x = Math.max(0, Math.min(11.999, f * 11));
    const i = Math.floor(x), k = x - i;
    const a = YEAR[i], b = YEAR[Math.min(11, i + 1)];
    return {
      i, k, month: k < .5 ? a.n : b.n,
      season: k < .5 ? a.s : b.s,
      sunset: a.sunset + (b.sunset - a.sunset) * k,
      temp:   a.temp   + (b.temp   - a.temp)   * k
    };
  }

  // Where a season sits along the year, 0–1, for the jump control
  const seasonAt = id => (ORDER.indexOf(id) * 3 + 1) / 11;

  return { SEASONS, ORDER, forMonth, quote, taken, saturdays, DAYS, DAY, dateFor,
           YEAR, atYear, clock, seasonAt, MIN_GUESTS, MAX_GUESTS };
})();
