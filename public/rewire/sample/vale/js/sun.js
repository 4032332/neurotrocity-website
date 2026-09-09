/* VALE & VINE — solar position. NOAA algorithm, no dependencies.
   Everything the stage renders derives from these two numbers, so the sky is
   the real sky for the date you are looking at, not a colour ramp. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.VV = root.VV || {}).sun = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;

  function dayOfYear(date) {
    const start = Date.UTC(date.getUTCFullYear(), 0, 0);
    return Math.floor((date.getTime() - start) / 86400000);
  }

  /** Fractional-year terms shared by position and rise/set. */
  function solarTerms(date, tzHours) {
    const localMs = date.getTime() + tzHours * 3600000;
    const l = new Date(localMs);
    const doy = dayOfYear(l);
    const hour = l.getUTCHours() + l.getUTCMinutes() / 60 + l.getUTCSeconds() / 3600;
    const g = (2 * Math.PI / 365) * (doy - 1 + (hour - 12) / 24);
    const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
      - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
      - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
      - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    return { doy, hour, eqtime, decl, minutes: hour * 60 };
  }

  function sunPosition(date, lat, lon, tzHours) {
    const t = solarTerms(date, tzHours);
    const timeOffset = t.eqtime + 4 * lon - 60 * tzHours;
    const tst = t.minutes + timeOffset;
    const ha = (tst / 4 - 180) * RAD;
    const la = lat * RAD;
    const cosZen = Math.sin(la) * Math.sin(t.decl) + Math.cos(la) * Math.cos(t.decl) * Math.cos(ha);
    const zen = Math.acos(Math.max(-1, Math.min(1, cosZen)));
    let az = Math.acos(Math.max(-1, Math.min(1,
      (Math.sin(la) * Math.cos(zen) - Math.sin(t.decl)) / (Math.cos(la) * Math.sin(zen)))));
    az = ha > 0 ? (az * DEG + 180) % 360 : (540 - az * DEG) % 360;
    return { elevation: 90 - zen * DEG, azimuth: az };
  }

  /** Local minutes from midnight for the geometric horizon (−0.833° refraction). */
  function sunTimes(date, lat, lon, tzHours) {
    const t = solarTerms(date, tzHours);
    const la = lat * RAD, z = 90.833 * RAD;
    const cosH = (Math.cos(z) - Math.sin(la) * Math.sin(t.decl)) / (Math.cos(la) * Math.cos(t.decl));
    if (cosH > 1) return { sunriseMin: NaN, sunsetMin: NaN };      // polar night
    if (cosH < -1) return { sunriseMin: 0, sunsetMin: 1440 };      // midnight sun
    const ha = Math.acos(cosH) * DEG;
    const noon = 720 - 4 * (lon - 0) - t.eqtime + 60 * tzHours;
    return { sunriseMin: noon - 4 * ha, sunsetMin: noon + 4 * ha };
  }

  return { sunPosition, sunTimes, dayOfYear };
});
