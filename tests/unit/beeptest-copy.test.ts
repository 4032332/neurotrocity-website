import { describe, it, expect } from 'vitest';
import { BEEPTEST } from '../../src/content/beeptest';
import { BANNED, REQUIRED_WARNING } from '../../src/content/beeptest-rules';
import { RULES } from '../../src/content/facts';

/** Every string reachable from a value, however deeply nested. */
function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings);
  return [];
}

// The pacing caption is a function; scan what it actually renders too.
const ALL = [
  ...strings(BEEPTEST),
  BEEPTEST.pacing.caption(6, 11, 6.545455),
];

describe('s5M(8) — NSW Civil Liability Act 1998', () => {
  for (const { re, why } of BANNED) {
    it(`no string matches ${re} (${why})`, () => {
      const hits = ALL.filter((s) => re.test(s));
      expect(hits, `banned: ${why}`).toEqual([]);
    });
  }

  it('states the required maximal-test sentence, verbatim', () => {
    expect(REQUIRED_WARNING).toBe(
      'The beep test is a maximal fitness test: it is designed to be run until you cannot keep up.',
    );
    expect(BEEPTEST.effort.warning).toBe(REQUIRED_WARNING);
  });

  it('carries the rest of the store warning complete, not trimmed', () => {
    expect(BEEPTEST.effort.detail).toContain('Consult a doctor before undertaking strenuous exercise');
    expect(BEEPTEST.effort.detail).toContain('stop immediately if you feel dizzy, faint, unwell or in pain');
    expect(BEEPTEST.effort.aid).toContain('it does not assess your fitness to take part');
    expect(BEEPTEST.effort.aid).toContain('not a substitute for the official assessment conducted by a recruiting agency');
  });
});

describe('the banned list itself', () => {
  // A regex that never matches protects nothing. Prove each one bites.
  const SHOULD_MATCH = [
    'Totally safe', 'risk-free', 'a gentle start', 'It is easy', 'for everyone',
    'all fitness levels', 'no experience needed', 'anyone can do it', 'beginner-friendly',
    'whatever your fitness', 'endorsed by the ADF', 'cheat the system',
    'synced privately through your own iCloud',
  ];
  it('catches every phrase it exists to catch', () => {
    for (const s of SHOULD_MATCH) {
      expect(BANNED.some(({ re }) => re.test(s)), s).toBe(true);
    }
  });

  it('does not catch a true backup disclosure that merely mentions iCloud (spec §2.4)', () => {
    const disclosure = 'If you back up your iPhone — to iCloud or to a computer — that backup is made by iOS.';
    expect(BANNED.some(({ re }) => re.test(disclosure))).toBe(false);
  });

  it('does not catch "cheat the beep", the approved headline', () => {
    expect(BANNED.some(({ re }) => re.test('cheat the beep.'))).toBe(false);
  });
});

describe('provenance traps', () => {
  it('never repeats the studio-wide iCloud rule, which is false for this app', () => {
    const icloudRule = RULES[2].body;
    expect(ALL.some((s) => s.includes('through your own iCloud'))).toBe(false);
    expect(icloudRule).toContain('iCloud'); // guards the guard: RULES[2] is the rule we think it is
  });

  it('links nowhere near the App Store', () => {
    expect(ALL.some((s) => /apps\.apple\.com|itunes\.apple\.com/i.test(s))).toBe(false);
  });

  it('uses the brand name the store title uses', () => {
    expect(BEEPTEST.name).toBe('Before the Beep');
  });
});
