import { describe, it, expect } from 'vitest';
import { LEVELS, CUE_FRACTIONS, SHUTTLE_METRES, pacingSchedule } from '../../src/content/beeptest-protocol';

describe('QPS protocol table', () => {
  it('has levels 1 to 21 in order, with none missing', () => {
    expect(LEVELS.map((l) => l.level)).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
  });

  it('matches the totals protocols.json declares: 247 shuttles, 4940 metres', () => {
    const shuttles = LEVELS.reduce((n, l) => n + l.shuttles, 0);
    expect(shuttles).toBe(247);
    expect(shuttles * SHUTTLE_METRES).toBe(4940);
  });

  it('derives every shuttle time from its speed, as protocols.json says it does', () => {
    // timingBasisNote: secondsPerShuttle = 20 m / (speedKph / 3.6)
    for (const l of LEVELS) {
      expect(l.secondsPerShuttle, `level ${l.level}`).toBeCloseTo(SHUTTLE_METRES / (l.speedKph / 3.6), 5);
    }
  });

  it('places the pacing cues at 70, 80 and 90 percent', () => {
    expect([...CUE_FRACTIONS]).toEqual([0.7, 0.8, 0.9]);
  });
});

describe('pacingSchedule', () => {
  it('times level 1 at 9 s a shuttle with cues at 6.3, 7.2 and 8.1 s', () => {
    const s = pacingSchedule(1);
    expect(s.durationSec).toBe(9);
    expect(s.speedKph).toBe(8);
    expect(s.cues.map((c) => c.atSec)).toEqual([
      expect.closeTo(6.3, 6), expect.closeTo(7.2, 6), expect.closeTo(8.1, 6),
    ]);
  });

  it('carries the fraction with each cue so a renderer never recomputes it', () => {
    expect(pacingSchedule(6).cues.map((c) => c.fraction)).toEqual([0.7, 0.8, 0.9]);
  });

  it('refuses a level the protocol does not have', () => {
    expect(() => pacingSchedule(0)).toThrow(RangeError);
    expect(() => pacingSchedule(22)).toThrow(RangeError);
  });
});
