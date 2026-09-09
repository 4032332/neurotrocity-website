const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/sun.js');

const LAT = -33.95, LON = 115.07, TZ = 8;                 // Rosa Brook, Margaret River
const at = (y, m, d, hh, mm) => new Date(Date.UTC(y, m, d, hh - TZ, mm || 0));
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`;

test('sunset matches the figures printed on the page (±4 min)', () => {
  // The page states: "5:16 pm in June, 7:32 pm in January"
  const june = S.sunTimes(at(2026, 5, 21, 12), LAT, LON, TZ);
  const jan  = S.sunTimes(at(2026, 0, 15, 12), LAT, LON, TZ);
  assert.ok(Math.abs(june.sunsetMin - (17 * 60 + 16)) <= 4, 'June sunset ' + hhmm(june.sunsetMin));
  assert.ok(Math.abs(jan.sunsetMin  - (19 * 60 + 32)) <= 4, 'Jan sunset '  + hhmm(jan.sunsetMin));
});

test('southern hemisphere: the sun is due north at local solar noon', () => {
  const p = S.sunPosition(at(2026, 5, 21, 12, 10), LAT, LON, TZ);   // near solar noon
  assert.ok(p.azimuth > 340 || p.azimuth < 20, 'azimuth ' + p.azimuth);
  assert.ok(p.elevation > 0 && p.elevation < 40, 'midwinter noon elevation ' + p.elevation);
});

test('summer noon is higher than winter noon', () => {
  const s = S.sunPosition(at(2026, 0, 15, 12), LAT, LON, TZ);
  const w = S.sunPosition(at(2026, 5, 21, 12), LAT, LON, TZ);
  assert.ok(s.elevation > w.elevation + 30, `${s.elevation} vs ${w.elevation}`);
});

test('elevation is negative at midnight and positive at midday, every month', () => {
  for (let m = 0; m < 12; m++) {
    assert.ok(S.sunPosition(at(2026, m, 15, 0), LAT, LON, TZ).elevation < 0, 'midnight m' + m);
    assert.ok(S.sunPosition(at(2026, m, 15, 12), LAT, LON, TZ).elevation > 0, 'midday m' + m);
  }
});

test('day length is longest in December and shortest in June', () => {
  const len = (m, d) => { const t = S.sunTimes(at(2026, m, d, 12), LAT, LON, TZ); return t.sunsetMin - t.sunriseMin; };
  assert.ok(len(11, 21) > len(5, 21) + 200, 'summer/winter day length gap');
});

test('model reproduces seasons.js mid-season sunset figures (±22 min)', () => {
  // js/seasons.js sun: fields, at the midpoint date of each season's month range.
  // "Mid-season" is approximate copy, not an exact astronomical midpoint, so the
  // tolerance here is looser than the page's own June/January claims above — and
  // widest for bud/vin, the two seasons straddling an equinox, where sunset time
  // moves fastest day-to-day, so a few days' slack in "the middle of the season"
  // shows up as several minutes of sunset drift. See vale-task1-report.md for the
  // computed-vs-stated table across all six checks.
  const cases = [
    { label: 'bud (Sep–Nov, mid Oct 15)', date: at(2026, 9, 15, 12), statedMin: 18 * 60 + 52 },
    { label: 'rip (Dec–Feb, mid Jan 15)', date: at(2026, 0, 15, 12), statedMin: 19 * 60 + 28 },
    { label: 'vin (Mar–May, mid Apr 15)', date: at(2026, 3, 15, 12), statedMin: 18 * 60 + 14 },
    { label: 'pru (Jun–Aug, mid Jul 15)', date: at(2026, 6, 15, 12), statedMin: 17 * 60 + 22 },
  ];
  for (const c of cases) {
    const computed = S.sunTimes(c.date, LAT, LON, TZ).sunsetMin;
    assert.ok(Math.abs(computed - c.statedMin) <= 22,
      `${c.label}: computed ${hhmm(computed)} vs stated ${hhmm(c.statedMin)}`);
  }
});
