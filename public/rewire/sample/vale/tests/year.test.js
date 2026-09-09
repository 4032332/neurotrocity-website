/* The scroll → year map. The page's whole claim is that the light you are
   looking at belongs to the date you have scrolled to, so the two things
   worth pinning down are that the year only ever moves forwards, and that
   each section arrives inside the season it is describing. */
const test = require('node:test');
const assert = require('node:assert/strict');

// seasons.js is the page's fact model and assigns to `window`.
global.window = global;
require('../js/seasons.js');
const VV = global.VV;
const Y = require('../js/year.js');

const SAMPLES = 1000;
const at = i => i / (SAMPLES - 1);

test('the vineyard year never runs backwards across [0,1]', () => {
  let prev = -Infinity;
  for (let i = 0; i < SAMPLES; i++) {
    const v = Y.vineDayAt(at(i));
    assert.ok(v >= prev - 1e-9, `vineDay went backwards at f=${at(i)}: ${v} < ${prev}`);
    prev = v;
  }
});

test('dayAt is always a whole calendar day in 1..365', () => {
  for (let i = 0; i < SAMPLES; i++) {
    const d = Y.dayAt(at(i));
    assert.ok(Number.isInteger(d), `dayAt(${at(i)}) = ${d} is not an integer`);
    assert.ok(d >= 1 && d <= 365, `dayAt(${at(i)}) = ${d} out of range`);
  }
  // out-of-range scroll fractions clamp rather than escape the year
  for (const f of [-5, -0.001, 1.001, 12, NaN]) {
    const d = Y.dayAt(f);
    assert.ok(d >= 1 && d <= 365, `dayAt(${f}) = ${d} out of range`);
  }
});

test('dayAt turns the calendar over exactly once, at New Year', () => {
  // The walk is monotonic in vineyard days; expressed as a calendar
  // day-of-year it must therefore step back exactly once — 31 Dec → 1 Jan.
  const drops = [];
  let prev = Y.dayAt(0);
  for (let i = 1; i < SAMPLES; i++) {
    const d = Y.dayAt(at(i));
    if (d < prev) drops.push({ f: at(i), from: prev, to: d });
    prev = d;
  }
  assert.equal(drops.length, 1, 'calendar wraps: ' + JSON.stringify(drops));
  assert.ok(drops[0].from > 360 && drops[0].to < 5,
    'the only wrap is New Year: ' + JSON.stringify(drops[0]));
});

test('every anchor lands inside its own season’s months', () => {
  const list = Y.anchors();
  assert.ok(list.length >= 4, 'expected one anchor per season');
  for (const a of list) {
    const s = VV.SEASONS[a.season];
    assert.ok(s, 'unknown season ' + a.season);
    const month = Y.monthOfDay(a.day);
    assert.ok(s.m.indexOf(month) >= 0,
      `${a.selector} → ${a.season} day ${a.day} is in month ${month}, not one of ${s.m}`);
  }
});

test('the anchors run in page order, year order and VV.ORDER together', () => {
  const list = Y.anchors();
  assert.deepEqual(list.map(a => a.season), VV.ORDER);
  for (let i = 1; i < list.length; i++) {
    assert.ok(list[i].fraction > list[i - 1].fraction, 'anchor fractions ascend');
    assert.ok(list[i].vineDay > list[i - 1].vineDay, 'anchor days ascend through the year');
  }
});

test('scrolling to an anchor puts you in that anchor’s season', () => {
  for (const a of Y.anchors()) {
    assert.equal(Y.seasonAt(a.fraction), a.season, a.selector + ' ' + a.season);
    assert.equal(Y.dayAt(a.fraction), a.day, a.selector + ' day');
    // and the jump control lands on the same day
    assert.equal(Y.dayAt(Y.fractionFor(a.season)), a.day, a.season + ' jump');
  }
});

test('the flagship year section carries most of the year', () => {
  // The section's whole claim is that scrolling it walks the vineyard year.
  // If the walk spent most of its days elsewhere, the chart and the month
  // read-out inside it would barely move.
  Y.setAnchorFractions({ '.hero': 0, '#year': 0.098, '#dates': 0.647 });
  const span = Y.vineDayAt(0.647) - Y.vineDayAt(0.098);
  assert.ok(span > 250, 'year section covers only ' + Math.round(span) + ' days');
  // and both interior season midpoints land inside it
  for (const s of ['rip', 'vin']) {
    const f = Y.fractionFor(s);
    assert.ok(f > 0.098 && f < 0.647, s + ' midpoint at f=' + f + ' is outside #year');
  }
});

test('measured anchor fractions keep the walk monotonic', () => {
  // What main.js does once the document has laid out.
  Y.setAnchorFractions({ '.hero': 0, '#year': 0.09, '#dates': 0.55 });
  let prev = -Infinity;
  for (let i = 0; i < SAMPLES; i++) {
    const v = Y.vineDayAt(at(i));
    assert.ok(v >= prev - 1e-9, 'monotonic after remeasure');
    prev = v;
  }

  // Nonsense from a mid-layout measurement must not reorder the year.
  const before = Y.anchors().map(a => a.fraction);
  Y.setAnchorFractions({ '#year': 0.9, '#dates': 0.1 });
  assert.deepEqual(Y.anchors().map(a => a.fraction), before, 'bad proposal rejected whole');
});

test('the year ends in August and begins in spring', () => {
  assert.equal(Y.seasonAt(0), 'bud');
  assert.equal(Y.seasonAt(1), 'pru');
  assert.equal(Y.toCalendarDay(1), 244);    // 1 September
  assert.equal(Y.toCalendarDay(365), 243);  // 31 August
  assert.equal(Y.dayAt(1), 243);
});
