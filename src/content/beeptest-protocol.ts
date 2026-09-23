/**
 * The QPS 20 m multistage shuttle run, copied from beep-test/protocols.json
 * (schemaVersion 1, generated 2026-09-16, protocol id "qps").
 *
 * Copied rather than imported: this site builds on its own, without the app's
 * repo. tests/unit/beeptest-protocol.test.ts checks the copy against the
 * formula and totals protocols.json itself declares, so a mistyped row fails.
 *
 * This is NOT the Leger 1988 protocol (8.5 km/h start, 23 levels). Levels are
 * not interchangeable between the two.
 */
export interface Level {
  level: number;
  speedKph: number;
  shuttles: number;
  secondsPerShuttle: number;
}

export const SHUTTLE_METRES = 20;

/** audioDesign.pacingCues.fractionsOfShuttle */
export const CUE_FRACTIONS = [0.7, 0.8, 0.9] as const;

export const LEVELS: readonly Level[] = [
  { level: 1, speedKph: 8.0, shuttles: 7, secondsPerShuttle: 9.0 },
  { level: 2, speedKph: 9.0, shuttles: 8, secondsPerShuttle: 8.0 },
  { level: 3, speedKph: 9.5, shuttles: 8, secondsPerShuttle: 7.578947 },
  { level: 4, speedKph: 10.0, shuttles: 9, secondsPerShuttle: 7.2 },
  { level: 5, speedKph: 10.5, shuttles: 9, secondsPerShuttle: 6.857143 },
  { level: 6, speedKph: 11.0, shuttles: 10, secondsPerShuttle: 6.545455 },
  { level: 7, speedKph: 11.5, shuttles: 10, secondsPerShuttle: 6.26087 },
  { level: 8, speedKph: 12.0, shuttles: 11, secondsPerShuttle: 6.0 },
  { level: 9, speedKph: 12.5, shuttles: 11, secondsPerShuttle: 5.76 },
  { level: 10, speedKph: 13.0, shuttles: 11, secondsPerShuttle: 5.538462 },
  { level: 11, speedKph: 13.5, shuttles: 12, secondsPerShuttle: 5.333333 },
  { level: 12, speedKph: 14.0, shuttles: 12, secondsPerShuttle: 5.142857 },
  { level: 13, speedKph: 14.5, shuttles: 13, secondsPerShuttle: 4.965517 },
  { level: 14, speedKph: 15.0, shuttles: 13, secondsPerShuttle: 4.8 },
  { level: 15, speedKph: 15.5, shuttles: 13, secondsPerShuttle: 4.645161 },
  { level: 16, speedKph: 16.0, shuttles: 14, secondsPerShuttle: 4.5 },
  { level: 17, speedKph: 16.5, shuttles: 14, secondsPerShuttle: 4.363636 },
  { level: 18, speedKph: 17.0, shuttles: 15, secondsPerShuttle: 4.235294 },
  { level: 19, speedKph: 17.5, shuttles: 15, secondsPerShuttle: 4.114286 },
  { level: 20, speedKph: 18.0, shuttles: 16, secondsPerShuttle: 4.0 },
  { level: 21, speedKph: 18.5, shuttles: 16, secondsPerShuttle: 3.891892 },
];

export interface PacingSchedule {
  level: number;
  speedKph: number;
  /** One shuttle, which is one loop of the pacing bar. */
  durationSec: number;
  cues: { fraction: number; atSec: number }[];
}

export function pacingSchedule(level: number): PacingSchedule {
  const l = LEVELS.find((x) => x.level === level);
  if (!l) throw new RangeError(`No level ${level}: the QPS protocol has levels 1–${LEVELS.length}`);
  return {
    level: l.level,
    speedKph: l.speedKph,
    durationSec: l.secondsPerShuttle,
    cues: CUE_FRACTIONS.map((fraction) => ({ fraction, atSec: fraction * l.secondsPerShuttle })),
  };
}
