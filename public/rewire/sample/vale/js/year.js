/* ═══════════════════════════════════════════════════════════════
   VALE & VINE — scroll ↔ the vineyard year

   The document is one pass through the growing year, September to
   August, in the order the page already believes in (VV.ORDER:
   budburst → ripening → vintage → pruning). Four section anchors pin
   the walk to the midpoint of their own season, so the sky arriving
   with a section is the light that section is actually describing;
   between anchors the day interpolates linearly, and it never runs
   backwards.

   Two coordinate systems, and it matters which is which:
     · a VINEYARD DAY, 1 = 1 September … 365 = 31 August. Monotonic
       along the page, which is what "the year advances" means here.
     · a CALENDAR day-of-year, 1 = 1 January, which is what the solar
       model and the stage consume. It wraps once, at New Year, part
       way down the page — that wrap is the year turning over, not a
       discontinuity in the walk.
   ═══════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.VV = root.VV || {}).year = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const G = (typeof globalThis !== 'undefined') ? globalThis : {};
  const seasons = () => (G.VV && G.VV.SEASONS) || {};
  const order   = () => (G.VV && G.VV.ORDER) || ['bud', 'rip', 'vin', 'pru'];

  // Non-leap year. A demo that shifts its own facts every fourth year is a
  // demo nobody can check, and the seasonal figures the page prints are
  // mid-season means anyway.
  const MLEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const DAYS = 365;
  // The growing year in month order: September first.
  const VMONTHS = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7];

  // vineyard day of the 1st of each month, keyed by calendar month index
  const VSTART = (function () {
    const out = new Array(12);
    let acc = 1;
    for (let i = 0; i < 12; i++) { out[VMONTHS[i]] = acc; acc += MLEN[VMONTHS[i]]; }
    return out;
  })();

  // calendar day-of-year of the 1st of each month
  const CSTART = (function () {
    const out = new Array(12);
    let acc = 1;
    for (let m = 0; m < 12; m++) { out[m] = acc; acc += MLEN[m]; }
    return out;
  })();

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /** Vineyard day (1 = 1 Sep) → calendar day-of-year (1 = 1 Jan). */
  function toCalendarDay(vday) {
    const v = clamp(Math.round(vday), 1, DAYS);
    for (let i = 11; i >= 0; i--) {
      const m = VMONTHS[i];
      if (v >= VSTART[m]) return CSTART[m] + (v - VSTART[m]);
    }
    return 1;
  }

  /** Calendar day-of-year → the month it falls in. */
  function monthOfDay(doy) {
    const d = clamp(Math.round(doy), 1, DAYS);
    for (let m = 11; m >= 0; m--) if (d >= CSTART[m]) return m;
    return 0;
  }

  /** The vineyard-day span a season covers, from its own month list. */
  function seasonSpan(id) {
    const s = seasons()[id];
    const months = (s && s.m) || [];
    let lo = Infinity, hi = -Infinity;
    for (const m of months) {
      lo = Math.min(lo, VSTART[m]);
      hi = Math.max(hi, VSTART[m] + MLEN[m] - 1);
    }
    return { lo, hi };
  }

  /** Vineyard day at the middle of a season. */
  function seasonVineDay(id) {
    const sp = seasonSpan(id);
    return Math.round((sp.lo + sp.hi) / 2);
  }

  /** Calendar day-of-year at the middle of a season — what the stage wants. */
  function seasonDay(id) { return toCalendarDay(seasonVineDay(id)); }

  /* ── the shape of the walk ────────────────────────────────────
     Three measured section tops shape it, and the flagship carries the
     year:

       .hero   the page opens at the budburst midpoint and holds it while
               the hero is on screen — the sky over the first screen is
               the one the first screen is talking about.
       #year   the pinned section is the walk itself: from the budburst
               midpoint to the pruning midpoint, in one continuous ramp.
               Because the ramp is linear in days, the ripening and
               vintage midpoints land inside it at exactly the right
               proportions — nothing has to place them by hand.
       #dates  the year section has ended on pruning; the remaining
               sections carry it out to 31 August.

     The fractions here are nominal. main.js measures the real ones after
     layout and calls setAnchorFractions; the pinned section changes
     height with the viewport, so it re-measures on resize too. */
  const SHAPE = { '.hero': 0.00, '#year': 0.10, '#dates': 0.65 };
  const SHAPE_KEYS = ['.hero', '#year', '#dates'];

  /** The knot list the walk interpolates through, in vineyard days.
      A terminal knot at f = 1 carries pruning out to 31 August, so the
      year finishes at the footer rather than stopping in mid-July. */
  function knots() {
    const first = order()[0], last = order()[order().length - 1];
    return [
      { f: SHAPE['.hero'],  v: seasonVineDay(first) },
      { f: SHAPE['#year'],  v: seasonVineDay(first) },
      { f: SHAPE['#dates'], v: seasonVineDay(last) },
      { f: 1,               v: DAYS }
    ];
  }

  /** [{selector, season, fraction, day, vineDay}] — one per season, in
      VV.ORDER, naming the section that is on screen when it arrives.
      `day` is a calendar day-of-year, which is what the stage consumes. */
  function anchors() {
    const ids = order();
    return ids.map((id, i) => ({
      selector: i === 0 ? '.hero' : i === ids.length - 1 ? '#dates' : '#year',
      season: id,
      fraction: i === 0 ? SHAPE['.hero'] : fractionFor(id),
      vineDay: seasonVineDay(id),
      day: seasonDay(id)
    }));
  }

  /** Replace the nominal fractions with measured ones. The proposal is
      accepted only as a whole and only if it still ascends: a measurement
      taken mid-layout is worse than the nominal table, and half-applying
      one would make the walk run backwards. */
  function setAnchorFractions(map) {
    const next = SHAPE_KEYS.map(k => {
      const v = map && map[k];
      return (typeof v === 'number' && isFinite(v)) ? clamp(v, 0, 1) : SHAPE[k];
    });
    for (let i = 1; i < next.length; i++) if (next[i] <= next[i - 1]) return anchors();
    if (next[next.length - 1] >= 1) return anchors();
    SHAPE_KEYS.forEach((k, i) => { SHAPE[k] = next[i]; });
    return anchors();
  }

  /** Vineyard day (1 = 1 Sep) at a scroll fraction. Continuous, and
      non-decreasing by construction: the knots are sorted in both f and v. */
  function vineDayAt(fraction) {
    const f = clamp(Number(fraction) || 0, 0, 1);
    const k = knots();
    if (f <= k[0].f) return k[0].v;
    for (let i = 0; i < k.length - 1; i++) {
      const a = k[i], b = k[i + 1];
      if (f <= b.f) {
        const span = b.f - a.f;
        const t = span <= 0 ? 1 : (f - a.f) / span;
        return a.v + (b.v - a.v) * t;
      }
    }
    return k[k.length - 1].v;
  }

  /** Calendar day-of-year at a scroll fraction — the stage's input. */
  function dayAt(fraction) { return toCalendarDay(vineDayAt(fraction)); }

  /** Where in the walk a season sits, 0–1, for the jump control.
      Scanned from the end, so a day the walk holds still on for a while —
      budburst, which the hero sits on — jumps to the last place it is
      shown rather than the first. That is the top of the year section:
      the chip takes you into the flagship, not back to the hero. */
  function fractionFor(season) {
    const target = seasonVineDay(season);
    const k = knots();
    for (let i = k.length - 2; i >= 0; i--) {
      const a = k[i], b = k[i + 1];
      if (target >= a.v && target <= b.v) {
        const span = b.v - a.v;
        return span <= 0 ? b.f : a.f + (b.f - a.f) * ((target - a.v) / span);
      }
    }
    return target < k[0].v ? k[0].f : 1;
  }

  /** 0–1 through the growing year — what VV.atYear and the chart read. */
  function yearFractionAt(fraction) {
    return clamp((vineDayAt(fraction) - 1) / (DAYS - 1), 0, 1);
  }

  /** Which season a scroll fraction is standing in. */
  function seasonAt(fraction) {
    const v = vineDayAt(fraction);
    const ids = order();
    for (const id of ids) { const sp = seasonSpan(id); if (v <= sp.hi) return id; }
    return ids[ids.length - 1];
  }

  return {
    dayAt, vineDayAt, yearFractionAt, anchors, setAnchorFractions,
    seasonDay, seasonVineDay, seasonAt, fractionFor,
    toCalendarDay, monthOfDay, DAYS
  };
});
