# Before the Beep Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `https://neurotrocity.com/beeptest/landing/`, a black, ink-and-flame landing page for the Before the Beep app with a launch-list signup, plus pending privacy/EULA/support routes and a "Coming soon" tile on `/apps/`.

**Architecture:** Astro pages under `src/pages/beeptest/`, wrapped in a `BeeptestLayout` that uses the site's `Base` with the studio field and spine off and a `--bt-*` identity stylesheet on top. Every string lives in `src/content/beeptest.ts` and is scanned by a unit test for the s5M(8) banned list; the pacing bar is pure CSS driven by the real protocol table; the skull art is Higgsfield output reference-locked to the app icon.

**Tech Stack:** Astro 5 (static, GitHub Pages), TypeScript, Vitest (`tests/unit/`), Playwright (`tests/e2e/`), sharp + satori + @resvg/resvg-js for one-shot asset export, Higgsfield MCP for image generation, Buttondown for the mailing list.

**Spec:** `docs/superpowers/specs/2026-09-23-beeptest-landing-design.md`. Decision IDs (B1–B19) below refer to it.

**Branch:** `feat/beeptest-landing` in `/Users/robbrown/CodingProjects/Apps/neurotrocity-website`.

## Global Constraints

- **s5M(8):** no string on any `/beeptest/*` page, and no string in the Before the Beep `PRODUCTS` entry, may contain: "safe", "safely", "risk-free", "gentle", "easy", "for everyone", "all fitness levels", "all abilities", "no experience needed", "anyone can", "beginner-friendly", "whatever your fitness", "approved/endorsed/accredited/recognised by", "cheat the system", or any claim that the app syncs through iCloud. The single source for this list is `src/content/beeptest-rules.ts` (Task 2).
- **Required sentence, verbatim, visible on the landing page:** `The beep test is a maximal fitness test: it is designed to be run until you cannot keep up.`
- **No sentence may say who the app is for.** (Every phrasing of it is a suitability claim.)
- **No agency standard, logo, crest or name** on the page, and nothing implying agency endorsement.
- **Provenance:** every string traces to a source recorded in `docs/provenance.md` (Task 11). Store-description text is quoted verbatim from `beep-test/docs/app-store-listing.md`; the only permitted change is `" - "` set as `" — "`.
- **Never copy `RULES[2]` from `src/content/facts.ts`** ("synced privately through your own iCloud"). It is false for this app.
- **Australian English:** metres, practise (verb), organisation, licence (noun).
- **Brand:** the app is called **Before the Beep**. The URL is `/beeptest/`.
- **No App Store link anywhere** until a listing exists (B16).
- **Buttondown:** a native HTML form POST to `https://buttondown.com/api/emails/embed-subscribe/<username>`. **Never `fetch`** (B19, Buttondown's own docs).
- **Colours:** `--bt-void #000`, `--bt-bone #F2EDE4`, `--bt-sweat #4DD9F0`, `--bt-tongue #F08C9E`, `--bt-flare #FF3B2F`, `--bt-ember #FF8A1E`, `--bt-gold #FFC43D`. Studio accent `--flare: #FF3B2F`.
- **Fonts:** only the ones `Base` already loads — `var(--display)` (Bricolage Grotesque, used at 900), `var(--body)` (Manrope), `var(--mono)` (IBM Plex Mono). No new font files.
- **Motion:** every animation stops under `prefers-reduced-motion: reduce`.
- **Commits:** end every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## File map

| File | Status | Responsibility |
|---|---|---|
| `src/content/beeptest-protocol.ts` | create | The QPS level table and `pacingSchedule()` |
| `src/content/beeptest-rules.ts` | create | `REQUIRED_WARNING` and the `BANNED` list — one source for both test suites |
| `src/content/beeptest.ts` | create | Every string on `/beeptest/*` |
| `src/content/beeptest-signup.ts` | create | `buttondownAction()` |
| `scripts/beeptest-assets.mjs` | create | One-shot export: sources → web images and OG card |
| `src/content/facts.ts` | modify | Register the product; `status`, `isReleased` |
| `src/content/copy.ts` | modify | `/apps/` art; released-only counts |
| `src/pages/index.astro` | modify | Released-only `makesOffer` |
| `src/pages/apps.astro` | modify | "Coming soon" on the tile |
| `src/styles/tokens.css` | modify | `--flare` |
| `src/styles/beeptest.css` | create | `--bt-*` identity and all section styles |
| `src/components/beeptest/BeeptestLayout.astro` | create | Base + identity + nav + footer |
| `src/components/beeptest/Hero.astro` | create | §5.1 |
| `src/components/beeptest/PacingBar.astro` | create | §5.2 |
| `src/components/beeptest/ScreenFrames.astro` | create | §5.3 |
| `src/components/beeptest/Watch.astro` | create | §5.4 |
| `src/components/beeptest/Effort.astro` | create | §5.5 |
| `src/components/beeptest/FreeFirst.astro` | create | §5.6 |
| `src/components/beeptest/LaunchList.astro` | create | §5.7 |
| `src/pages/beeptest/landing.astro` | create | Assembles the landing page |
| `src/pages/beeptest/[doc].astro` | create | `/beeptest/privacy/`, `/eula/`, `/support/` |
| `tests/unit/beeptest-*.test.ts` | create | Protocol, copy, signup |
| `tests/unit/facts.test.ts` | modify | Five products; release status |
| `tests/e2e/beeptest.spec.ts` | create | Rendered-page behaviour |
| `tests/e2e/{routes,seo,honesty}.spec.ts` | modify | Add the new routes |
| `docs/provenance.md` | modify | Source for every new string and asset |
| `.gitignore` | modify | Keep the 2048px sources out of git |

---

### Task 1: Protocol table and pacing schedule

**Files:**
- Create: `src/content/beeptest-protocol.ts`
- Test: `tests/unit/beeptest-protocol.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface Level { level: number; speedKph: number; shuttles: number; secondsPerShuttle: number }`
  - `const SHUTTLE_METRES = 20`
  - `const CUE_FRACTIONS: readonly [0.7, 0.8, 0.9]`
  - `const LEVELS: readonly Level[]` (21 entries)
  - `interface PacingSchedule { level: number; speedKph: number; durationSec: number; cues: { fraction: number; atSec: number }[] }`
  - `function pacingSchedule(level: number): PacingSchedule` — throws `RangeError` outside 1–21.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/beeptest-protocol.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/beeptest-protocol.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/content/beeptest-protocol"`.

- [ ] **Step 3: Write the implementation**

Create `src/content/beeptest-protocol.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/beeptest-protocol.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/content/beeptest-protocol.ts tests/unit/beeptest-protocol.test.ts
git commit -m "feat(beeptest): add the QPS protocol table and pacing schedule

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The copy module and the s5M(8) guard

**Files:**
- Create: `src/content/beeptest-rules.ts`
- Create: `src/content/beeptest.ts`
- Test: `tests/unit/beeptest-copy.test.ts`

**Interfaces:**
- Consumes: `CONTACT` from `src/content/facts.ts` (`CONTACT.general === 'hello@neurotrocity.com'`, `CONTACT.madeIn === 'Australia'`).
- Produces:
  - `REQUIRED_WARNING: string` and `BANNED: readonly { re: RegExp; why: string }[]` from `beeptest-rules.ts`.
  - `BEEPTEST` from `beeptest.ts`, with exactly these keys, which every later task uses:
    `name`, `meta.{title,description,path}`, `nav.cta.{label,href}`,
    `hero.{lines[3],payoff,lede,primary,secondary,skullAlt}`,
    `pacing.{id,eyebrow,heading,body,demoLevel,beepLabel,caption(level,speedKph,seconds)}`,
    `frames.{eyebrow,heading,pending,items[{screen,caption}]}`,
    `watch.{eyebrow,heading,body}`,
    `effort.{eyebrow,heading,warning,detail,aid,skullAlt}`,
    `free.{heading,body,skullAlt}`,
    `launch.{id,eyebrow,heading,body,label,placeholder,button,consent,privacyLink,opened,closed,buttondownUsername}`,
    `footer.{tagline,links[{label,href}],email}`,
    `docs.{pending,contact,pages.{privacy,eula,support}.{title,heading,description}}`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/beeptest-copy.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/beeptest-copy.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/content/beeptest"`.

- [ ] **Step 3: Write the rules module**

Create `src/content/beeptest-rules.ts`:

```ts
/**
 * NSW Civil Liability Act 1998 s5M(8): a risk warning is void to the extent
 * that any other representation about the risk contradicts it — and "any
 * other" includes this website. The full list and its reasoning live in
 * beep-test/docs/app-store-listing.md; this file is their enforceable form.
 *
 * One source for both suites: tests/unit/beeptest-copy.test.ts scans the copy
 * module, tests/e2e/beeptest.spec.ts scans the rendered pages.
 */

/** Required at least once, verbatim. Do not edit for rhythm or length. */
export const REQUIRED_WARNING =
  'The beep test is a maximal fitness test: it is designed to be run until you cannot keep up.';

const SYNC = '(?:sync|syncs|synced|syncing)';

export const BANNED: readonly { re: RegExp; why: string }[] = [
  { re: /\bsafe(?:ly)?\b/i, why: 's5M(8): safety claim' },
  { re: /\brisk[- ]free\b/i, why: 's5M(8): safety claim' },
  { re: /\bgentle\b/i, why: 's5M(8): softens the risk' },
  { re: /\beas(?:y|ier|iest|ily)\b/i, why: 's5M(8): softens the risk' },
  { re: /\bfor everyone\b/i, why: 's5M(8): suitability claim' },
  { re: /\ball (?:fitness levels|abilities)\b/i, why: 's5M(8): suitability claim' },
  { re: /\bno experience (?:needed|required|necessary)\b/i, why: 's5M(8): suitability claim' },
  { re: /\banyone can\b/i, why: 's5M(8): suitability claim' },
  { re: /\bbeginner[- ]friendly\b/i, why: 's5M(8): suitability claim' },
  { re: /\bwhatever your fitness\b/i, why: 's5M(8): suitability claim, named in the listing doc' },
  { re: /\b(?:approved|endorsed|accredited|recognised) by\b/i, why: 'implies agency endorsement' },
  { re: /\bcheat the system\b/i, why: 'reads as beating the official assessment dishonestly (spec §5.1)' },
  {
    // Bans the claim, not the word: a true backup disclosure may mention iCloud (spec §2.4).
    re: new RegExp(`\\b${SYNC}\\b[^.]*\\biCloud\\b|\\biCloud\\b[^.]*\\b${SYNC}\\b`, 'i'),
    why: 'false: the app has no iCloud sync (spec §2.4)',
  },
];
```

- [ ] **Step 4: Write the copy module**

Create `src/content/beeptest.ts`:

```ts
/**
 * Every string on /beeptest/*. Two rules govern this file, and
 * tests/unit/beeptest-copy.test.ts enforces both:
 *
 *  1. s5M(8) — see beeptest-rules.ts. No suitability or safety claim, and no
 *     sentence that says who the app is for.
 *  2. Provenance — docs/provenance.md. Text marked "verbatim" is quoted from
 *     beep-test/docs/app-store-listing.md. The only change made to any of it
 *     is " - " (a plain-text store field) set as " — ".
 *
 * Spec: docs/superpowers/specs/2026-09-23-beeptest-landing-design.md
 */
import { CONTACT } from './facts';
import { REQUIRED_WARNING } from './beeptest-rules';

export const BEEPTEST = {
  name: 'Before the Beep',

  meta: {
    title: 'Before the Beep — beep test training for iPhone and Apple Watch',
    // First sentence: the store promotional text, verbatim. Second: status.
    description:
      'Pacing cues at 70, 80 and 90 percent of every shuttle, so you learn the pace instead of guessing it. Coming to iPhone and Apple Watch.',
    path: '/beeptest/landing/',
  },

  nav: { cta: { label: 'Get notified', href: '/beeptest/landing/#launch' } },

  hero: {
    // Rob's words, 23 Sep 2026, set as a three-size sequence. "cheat the beep",
    // not "cheat the system": spec §5.1 records why, and the copy test fails
    // if it drifts back.
    lines: [
      'The beep test sucks.',
      'It has demonic powers stronger than Final Destination.',
      'There’s only one way to beat it before it beats you…',
    ],
    payoff: 'cheat the beep.',
    // Store description, opening two sentences, verbatim.
    lede: 'Most beep test apps play you a beep and leave you to guess the rest. This one tells you where you should be.',
    primary: { label: 'Get told when it’s out', href: '#launch' },
    secondary: { label: 'How it works', href: '#pacing' },
    skullAlt: 'The Before the Beep skull, drawn in thick black ink: cracked, dripping sweat, tongue hanging out',
  },

  pacing: {
    id: 'pacing',
    eyebrow: 'Pacing cues',
    // Screenshot caption 1, verbatim.
    heading: 'Hear where you should be, three times a shuttle',
    // Store description, PACING CUES block, verbatim.
    body: 'Three short cues sound at 70%, 80% and 90% of every shuttle, so you can hear whether you are ahead or behind before the beep arrives — not after. It is the difference between learning the pace and chasing it.',
    // Arbitrary: a mid-table level, so the loop is neither slow nor frantic.
    // It is not any agency's standard and must never be described as one.
    demoLevel: 6,
    beepLabel: 'Beep',
    caption: (level: number, speedKph: number, seconds: number): string =>
      `Level ${level} · ${speedKph.toFixed(1)} km/h · ${seconds.toFixed(2)} s a shuttle, shown at real speed`,
  },

  frames: {
    eyebrow: 'The app',
    heading: 'What you’ll be looking at',
    pending: 'Screenshot pending',
    // app-store-listing.md "Screenshots": screen and caption, in its order, verbatim.
    items: [
      { screen: 'Run screen mid-test', caption: 'Hear where you should be, three times a shuttle' },
      { screen: 'Goal picker with live estimate', caption: 'See what your target actually means before you start' },
      { screen: 'Progress chart with personal best', caption: 'Every test, against the goal you set' },
      { screen: 'Pacer gauge', caption: 'Hold a set pace between tests' },
      { screen: 'Course guide / camera measure', caption: 'A 20 metre course that is really 20 metres' },
    ],
  },

  watch: {
    eyebrow: 'Apple Watch',
    heading: 'Run from your wrist.',
    // Store description, APPLE WATCH block, verbatim.
    body: 'Run from your wrist with haptics for every cue and beep. Leave the phone on the sideline.',
  },

  effort: {
    eyebrow: 'Before you start',
    heading: 'It is designed to beat you.',
    // Store description, BEFORE YOU START block, verbatim and complete.
    // Spec B9: never trimmed for length or rhythm.
    warning: REQUIRED_WARNING,
    detail:
      'It is demanding. Consult a doctor before undertaking strenuous exercise, particularly if you have a heart or respiratory condition, an injury or have not exercised recently. Warm up first, run on a flat non-slip surface, and stop immediately if you feel dizzy, faint, unwell or in pain.',
    aid: 'This app is a training aid. It is not medical advice, it does not assess your fitness to take part, and it is not a substitute for the official assessment conducted by a recruiting agency.',
    skullAlt: 'The same skull engulfed in cartoon flames, its cracks split open and glowing orange',
  },

  free: {
    // Store description, closing line, verbatim. D20: the first test is free.
    heading: 'Your first test is free.',
    body: 'No account, no sign-up — nothing leaves your phone.',
    skullAlt: 'The skull knocked flat and cracked through, with cartoon stars circling it',
  },

  launch: {
    id: 'launch',
    eyebrow: 'Coming soon',
    heading: 'Not out yet.',
    body: 'Leave your email and we’ll tell you when Before the Beep is on the App Store.',
    label: 'Email address',
    placeholder: 'you@example.com',
    button: 'Notify me',
    // Spam Act 2003 (Cth): who is sending, what it is about, and that
    // unsubscribing is always possible.
    consent:
      'Sent by NeuroTrocity, through Buttondown, about the release of Before the Beep. Every email has an unsubscribe link.',
    privacyLink: 'Privacy policy',
    opened: 'Nearly there — finish up in the tab that just opened.',
    closed: 'The launch list opens soon.',
    /**
     * The Buttondown username: the part after /embed-subscribe/ in the form
     * code Buttondown gives you. Stays null until BOTH the Buttondown account
     * exists AND the privacy policy describes the list (spec §5.7). While null
     * the form renders disabled instead of posting anywhere.
     */
    buttondownUsername: null as string | null,
  },

  footer: {
    tagline: `A NeuroTrocity app. Made in ${CONTACT.madeIn}.`,
    links: [
      { label: 'Privacy', href: '/beeptest/privacy/' },
      { label: 'Licence', href: '/beeptest/eula/' },
      { label: 'Support', href: '/beeptest/support/' },
      { label: 'NeuroTrocity', href: '/' },
    ],
    // beeptest@neurotrocity.com does not exist yet (spec §11); hello@ does.
    email: CONTACT.general,
  },

  docs: {
    pending: 'This page is being written, and will be published before Before the Beep is released.',
    contact: 'Until then, questions go to',
    pages: {
      privacy: {
        title: 'Privacy policy — Before the Beep',
        heading: 'Privacy policy',
        description: 'How Before the Beep handles your information.',
      },
      eula: {
        title: 'Licence agreement — Before the Beep',
        heading: 'End user licence agreement',
        description: 'The licence terms for Before the Beep.',
      },
      support: {
        title: 'Support — Before the Beep',
        heading: 'Support',
        description: 'Help with Before the Beep.',
      },
    },
  },
} as const;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/unit/beeptest-copy.test.ts`
Expected: PASS — 13 banned-pattern tests plus 8 others, 21 in total.

If a banned-pattern test fails, **change the copy, never the pattern**. The only acceptable reason to change a pattern is a proven false positive on a true, necessary sentence, and it needs a matching case under "the banned list itself".

- [ ] **Step 6: Commit**

```bash
git add src/content/beeptest-rules.ts src/content/beeptest.ts tests/unit/beeptest-copy.test.ts
git commit -m "feat(beeptest): add the page copy and the s5M(8) guard

Every string on /beeptest/* lives in one module, and a test fails the
build on any banned term, on the required maximal-test sentence going
missing, or on the studio's false-for-this-app iCloud rule being copied
in. Each banned pattern is also proven to match what it exists to catch.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The Buttondown form action

**Files:**
- Create: `src/content/beeptest-signup.ts`
- Test: `tests/unit/beeptest-signup.test.ts`

**Interfaces:**
- Consumes: `BEEPTEST.launch.buttondownUsername: string | null` (Task 2).
- Produces: `function buttondownAction(username: string | null): string | null` — `null` for `null`; the endpoint URL for a bare username; throws `Error` (message containing `bare username`) for anything else.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/beeptest-signup.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buttondownAction } from '../../src/content/beeptest-signup';
import { BEEPTEST } from '../../src/content/beeptest';

describe('buttondownAction', () => {
  it('is null while there is no Buttondown account, so the form cannot post anywhere', () => {
    expect(buttondownAction(null)).toBeNull();
  });

  it('builds the embed-subscribe endpoint from a bare username', () => {
    expect(buttondownAction('neurotrocity')).toBe(
      'https://buttondown.com/api/emails/embed-subscribe/neurotrocity',
    );
  });

  it('refuses a pasted URL rather than building a broken endpoint', () => {
    expect(() => buttondownAction('https://buttondown.com/api/emails/embed-subscribe/neurotrocity'))
      .toThrow(/bare username/);
  });

  it('refuses an empty string', () => {
    expect(() => buttondownAction('')).toThrow(/bare username/);
  });
});

describe('launch-list configuration', () => {
  it('is null or a bare username, and never a guess', () => {
    const u = BEEPTEST.launch.buttondownUsername;
    expect(u === null || /^[A-Za-z0-9_-]+$/.test(u)).toBe(true);
    if (u !== null) expect(u).not.toMatch(/example|placeholder|todo|xxx/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/beeptest-signup.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/content/beeptest-signup"`.

- [ ] **Step 3: Write the implementation**

Create `src/content/beeptest-signup.ts`:

```ts
/**
 * The launch list's form action.
 *
 * Buttondown's docs: the embed-subscribe endpoint "must be the action of a
 * standard HTML <form>. Do not send requests to it with JavaScript's fetch
 * API: subscribers sometimes need to follow Buttondown's response to complete
 * CAPTCHA verification or correct a validation error."
 * https://docs.buttondown.com/building-your-subscriber-base
 *
 * So this returns a URL for a plain <form action>, and nothing on the page
 * ever fetches it.
 */
export function buttondownAction(username: string | null): string | null {
  if (username === null) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(username)) {
    throw new Error(
      `Buttondown username "${username}" is not a bare username. ` +
        'Paste only the part after /embed-subscribe/, not the whole URL.',
    );
  }
  return `https://buttondown.com/api/emails/embed-subscribe/${username}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/beeptest-signup.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/content/beeptest-signup.ts tests/unit/beeptest-signup.test.ts
git commit -m "feat(beeptest): add the Buttondown form action

A plain form action, never fetch, per Buttondown's docs. Null until the
account exists, so an unconfigured list renders closed rather than
posting to a guessed endpoint.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The skull art and the OG card

Generated art is reference-locked to the shipped app icon (B5) through Higgsfield Reference Element `a44f8f52-6b91-4a36-991b-02d0df8ed1b0`, which already exists. Pose direction does not survive the reference; treatment does (B7). So every prompt changes the **treatment** and keeps the character.

**Files:**
- Create: `assets-src/beeptest/hero.png`, `flame.png`, `closing.png` (not committed)
- Create: `scripts/beeptest-assets.mjs`
- Create (generated): `public/beeptest/assets/img/skull-hero.webp`, `skull-flame.webp`, `skull-closing.webp`, `og-beeptest.png`, `public/assets/img/apps/beeptest-skull.webp`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: the five image paths above, used by Tasks 5–8. Sizes: hero 1200×1200, flame and closing 1000×1000, tile 1040×780, OG 1200×630 PNG.

- [ ] **Step 1: Download the hero source (already generated and approved)**

The hero is draw A from the 23 Sep consistency test (job `af0e3436-42a0-45d0-acf4-14d6d7d23ee3`).

```bash
mkdir -p assets-src/beeptest
curl -sfo assets-src/beeptest/hero.png "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjChrM5eucuMqnSfvohGrkLLw/hf_20260923_103852_af0e3436-42a0-45d0-acf4-14d6d7d23ee3.png"
file assets-src/beeptest/hero.png
```

Expected: `PNG image data, 2048 x 2048`.

- [ ] **Step 2: Generate the flame beat**

The 23 Sep test draw lost the white highlight dots in the eye sockets, so it is regenerated with that called out. Call `mcp__e48d5fc7-a163-4e37-af37-22d97633b367__generate_image` with:

```json
{
  "model": "nano_banana_pro",
  "aspect_ratio": "1:1",
  "count": 2,
  "prompt": "<<<a44f8f52-6b91-4a36-991b-02d0df8ed1b0>>> engulfed in roaring flames. Big stylised cel-shaded fire rising from the bottom of the frame behind and around the skull, drawn in flat layered tones of red, orange and yellow with heavy black ink outlines. The skull's cracks are splitting wider and glowing hot orange along their edges. Same character throughout: bone-white skull, large black eye sockets EACH WITH ITS TWO SMALL WHITE HIGHLIGHT DOTS, pink tongue lolling out, cyan sweat. Completely flat cel-shaded colour fills, absolutely no gradients, no soft shading, no photorealistic fire, no glow blur. Pure solid black background behind the flames. Vintage tattoo-flash and skate-sticker illustration style.",
  "medias": [{ "value": "fbb60af6-f9f3-4440-916e-c19cd17ae0cd", "role": "reference_image" }]
}
```

Poll with `jobs_wait` until both are `completed`. Download both, look at both, and keep the one where **both eye sockets have their highlight dots** and the character matches `hero.png`. Save it as `assets-src/beeptest/flame.png`. Record its job ID for Task 11.

If neither draw has the dots, run the call once more. If the third draw still lacks them, stop and report to Rob with the images rather than shipping a drifted character.

- [ ] **Step 3: Generate the closing beat**

Same tool:

```json
{
  "model": "nano_banana_pro",
  "aspect_ratio": "1:1",
  "count": 2,
  "prompt": "<<<a44f8f52-6b91-4a36-991b-02d0df8ed1b0>>> knocked out and beaten: the skull lies tipped over on its side, a single deep crack running clean through it, cartoon dizzy stars and little spirals circling above it, sweat droplets flung everywhere, tongue flopped out. It has lost. Same character throughout: bone-white skull, large black eye sockets each with two small white highlight dots, pink tongue, cyan sweat. Heavy black ink outlines, completely flat cel-shaded colour fills, absolutely no gradients, no soft shading, no texture. Pure solid black background. Vintage tattoo-flash and skate-sticker illustration style. Whole skull visible with margin around it.",
  "medias": [{ "value": "fbb60af6-f9f3-4440-916e-c19cd17ae0cd", "role": "reference_image" }]
}
```

Download both, keep the one that most clearly reads as **defeated** while staying the same character, save as `assets-src/beeptest/closing.png`, and record its job ID.

- [ ] **Step 4: Keep the sources out of git**

Append to `.gitignore`:

```
# 2048px Higgsfield sources for /beeptest/ — ~3 MB each. The web exports in
# public/beeptest/ are committed; job IDs in docs/provenance.md re-fetch these.
assets-src/
```

- [ ] **Step 5: Write the export script**

Create `scripts/beeptest-assets.mjs`:

```js
// One-shot export for /beeptest/: 2048px Higgsfield sources -> web images.
// Run from the repo root:  node scripts/beeptest-assets.mjs
// Sources live in assets-src/beeptest/ (git-ignored); outputs are committed.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const SRC = 'assets-src/beeptest';
const OUT = 'public/beeptest/assets/img';
fs.mkdirSync(OUT, { recursive: true });

const src = (f) => path.join(SRC, f);

async function webp(file, width, out) {
  await sharp(src(file)).resize({ width }).webp({ quality: 82 }).toFile(path.join(OUT, out));
}

await webp('hero.png', 1200, 'skull-hero.webp');
await webp('flame.png', 1000, 'skull-flame.webp');
await webp('closing.png', 1000, 'skull-closing.webp');

// /apps/ tile: 4:3 like every other tile (1040x780), skull centred on black.
await sharp(src('hero.png'))
  .resize({ width: 1040, height: 780, fit: 'contain', background: '#000000' })
  .webp({ quality: 82 })
  .toFile('public/assets/img/apps/beeptest-skull.webp');

// OG card, 1200x630 PNG (tests/e2e/seo.spec.ts checks both).
// Text duplicates beeptest.ts hero.lines[0] and the status by hand: this is
// a .mjs script and cannot import the TS module. Recorded in provenance.
const skull = (await sharp(src('hero.png')).resize({ width: 560 }).png().toBuffer()).toString('base64');
const manrope = fs.readFileSync('public/assets/fonts/Manrope-ExtraBold.ttf');

const svg = await satori(
  {
    type: 'div',
    props: {
      style: { width: 1200, height: 630, display: 'flex', alignItems: 'center', background: '#000000', padding: '0 64px 0 36px' },
      children: [
        { type: 'img', props: { src: `data:image/png;base64,${skull}`, width: 560, height: 560 } },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', marginLeft: 28, color: '#F2EDE4' },
            children: [
              { type: 'div', props: { style: { fontSize: 88, lineHeight: 0.92, letterSpacing: -3 }, children: 'THE BEEP TEST SUCKS.' } },
              { type: 'div', props: { style: { fontSize: 34, marginTop: 30, color: '#FF3B2F' }, children: 'Before the Beep · coming soon' } },
            ],
          },
        },
      ],
    },
  },
  { width: 1200, height: 630, fonts: [{ name: 'Manrope', data: manrope, weight: 800, style: 'normal' }] },
);
fs.writeFileSync(path.join(OUT, 'og-beeptest.png'), new Resvg(svg).render().asPng());

console.log('beeptest assets written');
```

- [ ] **Step 6: Run it and check every output**

```bash
node scripts/beeptest-assets.mjs
for f in public/beeptest/assets/img/* public/assets/img/apps/beeptest-skull.webp; do
  printf '%-52s %8s  ' "$f" "$(wc -c < "$f")"; file -b "$f" | cut -c1-60
done
```

Expected: `beeptest assets written`, then five files:
- `skull-hero.webp` 1200x1200, `skull-flame.webp` and `skull-closing.webp` 1000x1000, `beeptest-skull.webp` 1040x780
- `og-beeptest.png` — `PNG image data, 1200 x 630`
- every `.webp` **under 300,000 bytes**. If one is over, re-run that line at `quality: 72`.

Then open `og-beeptest.png` and `beeptest-skull.webp` and look at them: text not clipped, skull not cropped.

- [ ] **Step 7: Commit**

```bash
git add .gitignore scripts/beeptest-assets.mjs public/beeptest/assets/img public/assets/img/apps/beeptest-skull.webp
git commit -m "feat(beeptest): add the skull art and OG card

Three beats of the same character, reference-locked to the shipped app
icon: the hero, the flame beat for the maximal-effort panel, and the
knocked-out closing beat. Treatment carries the arc because the
reference overrides pose direction (spec B7). 2048px sources stay out
of git; their job IDs are recorded in provenance.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Register the app on `/apps/` as coming soon

Adding a product to `PRODUCTS` gives it an `/apps/` tile and a sitemap row. It would **also** make two existing sentences false: the home page says our apps *"are ours, and you can open and use them right now"* (`copy.ts:93`, counted from `APPS.length`), and `/apps/` meta says *"The apps we ship: …"*. An app with no listing is neither. This task adds a release status and keeps both sentences true.

**Files:**
- Modify: `src/content/facts.ts`
- Modify: `src/styles/tokens.css`
- Modify: `src/content/copy.ts`
- Modify: `src/pages/index.astro:3,16-19`
- Modify: `src/pages/apps.astro:264`
- Test: `tests/unit/facts.test.ts`

**Interfaces:**
- Consumes: `public/assets/img/apps/beeptest-skull.webp` (Task 4).
- Produces: `Product.status?: 'coming-soon'`; `isReleased(p: Product): boolean` exported from `facts.ts`; slug `'beeptest'`; accent `'flare'`; CSS custom property `--flare`.

- [ ] **Step 1: Update the tests first**

In `tests/unit/facts.test.ts`, change the import on line 2 to:

```ts
import { PRODUCTS, DEMOS, RULES, CONTACT, ENGAGEMENT, REWIRE, SKILL_PACK, isReleased } from '../../src/content/facts';
import { APPS, APPS_PAGE, HOME } from '../../src/content/copy';
```

and delete the old line 3 (`import { APPS } from '../../src/content/copy';`).

Replace the first two tests:

```ts
  it('has exactly the four real products', () => {
    expect(PRODUCTS.map(p => p.slug).sort()).toEqual(['dispoint', 'dosetrack', 'rewire', 'wallestate']);
  });

  it('names every product with its live-site display name', () => {
    expect(PRODUCTS.map(p => [p.slug, p.name])).toEqual([
      ['dosetrack', 'DoseTrack'], ['dispoint', 'DisPoint'], ['rewire', 'Rewire'], ['wallestate', 'Wall Estate'],
    ]);
  });
```

with:

```ts
  it('has exactly the five real products', () => {
    expect(PRODUCTS.map(p => p.slug).sort()).toEqual(['beeptest', 'dispoint', 'dosetrack', 'rewire', 'wallestate']);
  });

  it('names every product with its live-site display name', () => {
    expect(PRODUCTS.map(p => [p.slug, p.name])).toEqual([
      ['dosetrack', 'DoseTrack'], ['dispoint', 'DisPoint'], ['rewire', 'Rewire'], ['wallestate', 'Wall Estate'],
      ['beeptest', 'Before the Beep'],
    ]);
  });

  it('marks only Before the Beep as not yet released', () => {
    expect(PRODUCTS.filter(p => !isReleased(p)).map(p => p.slug)).toEqual(['beeptest']);
  });

  it('never tells a visitor they can use an app today that has no listing', () => {
    // Home: "… of them are ours, and you can open and use them right now."
    expect(JSON.stringify(HOME)).toContain('Three of them are ours');
    // /apps/: "The apps we ship: …"
    expect(APPS_PAGE.meta.description).not.toContain('Before the Beep');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/facts.test.ts`
Expected: FAIL — `isReleased` is not exported, and `has exactly the five real products` fails.

- [ ] **Step 3: Extend the product type and register the app**

In `src/content/facts.ts`, replace:

```ts
interface ProductBase {
  slug: 'dosetrack' | 'dispoint' | 'rewire' | 'wallestate';
```

with:

```ts
interface ProductBase {
  slug: 'dosetrack' | 'dispoint' | 'rewire' | 'wallestate' | 'beeptest';
```

Replace:

```ts
  accent: 'volt' | 'ember' | 'cyan' | 'jade';
  /** Only for the things on /apps/. Rewire is a service and omits it. */
  appCategory?: 'MobileApplication' | 'WebApplication';
}
```

with:

```ts
  accent: 'volt' | 'ember' | 'cyan' | 'jade' | 'flare';
  /** Only for the things on /apps/. Rewire is a service and omits it. */
  appCategory?: 'MobileApplication' | 'WebApplication';
  /** Set while an app has no App Store listing. /apps/ labels its tile, and
   *  every sentence claiming you can use our apps right now leaves it out. */
  status?: 'coming-soon';
}
```

Replace:

```ts
export const productLabel = (p: Product): string =>
  p.url ? new URL(p.url).host : `/${p.slug}`;
```

with:

```ts
export const productLabel = (p: Product): string =>
  p.url ? new URL(p.url).host : `/${p.slug}`;

/** Something a visitor can actually get today. */
export const isReleased = (p: Product): boolean => p.status !== 'coming-soon';
```

In `PRODUCTS`, after the `wallestate` entry and before the closing `];`, add:

```ts
  { slug: 'beeptest', name: 'Before the Beep', path: '/beeptest/landing/', accent: 'flare',
    platforms: 'iPhone · Watch', appCategory: 'MobileApplication', status: 'coming-soon',
    // Store promotional text, first sentence, verbatim (beep-test/docs/app-store-listing.md).
    description: 'Pacing cues at 70, 80 and 90 percent of every shuttle, so you learn the pace instead of guessing it.' },
```

- [ ] **Step 4: Add the accent token**

In `src/styles/tokens.css`, replace:

```css
  --violet:#B45CFF;
```

with:

```css
  --violet:#B45CFF; --flare:#FF3B2F;
```

- [ ] **Step 5: Keep the two claims true, and add the tile art**

In `src/content/copy.ts`, change line 10's import to add `isReleased`:

```ts
import { PRODUCTS, RULES, CONTACT, DEMOS, ENGAGEMENT, REWIRE, SKILL_PACK, productHref, productLabel, isReleased, type Provenance } from './facts';
```

Replace:

```ts
        // Count derives from APPS — three now that Wall Estate has landed.
        // Never type the numeral; it would be false the moment APPS changes.
        blurb: `Shipped on iPhone, Apple Watch and the web. ${asWord(APPS.length)} of them are ours, and you can open and use them right now.`,
```

with:

```ts
        // Count derives from the released APPS. Never type the numeral, and
        // never count an app with no listing: "use them right now" would be false.
        blurb: `Shipped on iPhone, Apple Watch and the web. ${asWord(APPS.filter(isReleased).length)} of them are ours, and you can open and use them right now.`,
```

Replace:

```ts
    description: `App design and software engineering for smart devices and the web. The apps we ship: ${listJoin(APPS.map((a) => a.name))}.`,
```

with:

```ts
    description: `App design and software engineering for smart devices and the web. The apps we ship: ${listJoin(APPS.filter(isReleased).map((a) => a.name))}.`,
```

In the `APPS_PAGE` doc comment, replace:

```ts
 * download counts, no reviews, no roadmap, no unreleased apps.
```

with:

```ts
 * download counts, no reviews, no roadmap. An unreleased app appears only as
 * a tile labelled "Coming soon", and is left out of "the apps we ship".
```

In `APPS_PAGE.apps.art`, after the `wallestate` entry, add:

```ts
      beeptest: {
        src: '/assets/img/apps/beeptest-skull.webp',
        alt: 'The Before the Beep skull, drawn in thick black ink: cracked, sweating, tongue out',
        fit: 'cover',
      },
```

- [ ] **Step 6: Keep the studio's structured data honest**

In `src/pages/index.astro`, replace line 3:

```ts
import { PRODUCTS, CONTACT, productUrl } from '../content/facts';
```

with:

```ts
import { PRODUCTS, CONTACT, productUrl, isReleased } from '../content/facts';
```

and replace:

```ts
  makesOffer: PRODUCTS.map((p) => ({
```

with:

```ts
  // An app with no listing is not yet on offer.
  makesOffer: PRODUCTS.filter(isReleased).map((p) => ({
```

- [ ] **Step 7: Label the tile**

In `src/pages/apps.astro`, replace line 264:

```astro
                <span class="mt">{a.platforms}</span>
```

with:

```astro
                <span class="mt">{a.platforms}{a.status === 'coming-soon' && ' · Coming soon'}</span>
```

- [ ] **Step 8: Run the unit tests and the type check**

Run: `npm test`
Expected: `astro check` reports 0 errors; Vitest passes every file, including the four new or changed tests in `facts.test.ts`.

- [ ] **Step 9: Commit**

```bash
git add src/content/facts.ts src/styles/tokens.css src/content/copy.ts src/pages/index.astro src/pages/apps.astro tests/unit/facts.test.ts
git commit -m "feat(apps): list Before the Beep as coming soon

Adding a product would have made two live sentences false: the home
page tells visitors our apps can be used right now, and /apps/ lists
'the apps we ship'. A release status keeps an unlisted app out of both
and out of the studio's makesOffer data, while the tile still appears,
labelled Coming soon.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Layout, identity and the hero

**Files:**
- Create: `src/styles/beeptest.css`
- Create: `src/components/beeptest/BeeptestLayout.astro`
- Create: `src/components/beeptest/Hero.astro`
- Create: `src/pages/beeptest/landing.astro`
- Test: `tests/e2e/beeptest.spec.ts`
- Modify: `tests/e2e/seo.spec.ts:5-9`
- Modify: `tests/e2e/routes.spec.ts:3-10`
- Modify: `tests/e2e/a11y-base.spec.ts:12-37`

**Interfaces:**
- Consumes: `BEEPTEST` (Task 2); `skull-hero.webp`, `og-beeptest.png` (Task 4).
- Produces:
  - `<BeeptestLayout title description path jsonLd? noindex?>` with a default slot.
  - CSS classes later tasks use: `.bt-wrap`, `.bt-mono`, `.bt-sec`, `.bt-eyebrow`, `.bt-h2`, `.bt-body`, `.bt-btn` (and `.bt-btn.ghost`), `.bt-split`, `.bt-beat`.

- [ ] **Step 1: Write the failing e2e tests**

Create `tests/e2e/beeptest.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { BEEPTEST } from '../../src/content/beeptest';

const LANDING = '/beeptest/landing/';

test('the landing page has exactly one h1, and it is the headline', async ({ page }) => {
  await page.goto(LANDING);
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toContainText(BEEPTEST.hero.lines[0]);
  await expect(h1).toContainText(BEEPTEST.hero.payoff);
});

test('the page is on black, not the studio ground', async ({ page }) => {
  await page.goto(LANDING);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(0, 0, 0)');
});

test('the studio cortex field and spine are off', async ({ page }) => {
  await page.goto(LANDING);
  await expect(page.locator('body.layered')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('no link points at the App Store yet', async ({ page }) => {
  await page.goto(LANDING);
  await expect(page.locator('a[href*="apps.apple.com"]')).toHaveCount(0);
});

test('the hero skull loads', async ({ page }) => {
  await page.goto(LANDING);
  const img = page.locator('.bt-hero img');
  await expect(img).toHaveAttribute('alt', BEEPTEST.hero.skullAlt);
  expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
});

```

In `tests/e2e/a11y-base.spec.ts`, run the focus-ring and 360px checks over the new page too,
rather than copying them. Replace the whole `every interactive element has a visible focus ring`
test **and** the `no horizontal overflow at 360px` test (lines 12–37, including the comment
block above the focus-ring test) with:

```ts
// Reaching each element via a real keyboard Tab keeps focus "keyboard-initiated",
// so :focus-visible reliably matches (Chromium does not always apply it to
// programmatic element.focus() on non-text elements).
for (const path of ['/', '/beeptest/landing/']) {
  test(`${path} every interactive element has a visible focus ring`, async ({ page }) => {
    await page.goto(path);
    // Only what Tab can reach. Disabled controls and hidden inputs are skipped
    // by Tab, so counting them would tab past the last element and fail.
    const els = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), [tabindex="0"]',
    );
    const count = await els.count();
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      const outline = await page.evaluate(() => {
        const cs = getComputedStyle(document.activeElement as Element);
        return cs.outlineStyle + ' ' + cs.outlineWidth;
      });
      expect(outline).not.toMatch(/none|0px/);
    }
  });

  test(`${path} has no horizontal overflow at 360px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
```

In `tests/e2e/seo.spec.ts`, add a row to `PAGES`:

```ts
const PAGES = [
  { path: '/',                 canonical: 'https://neurotrocity.com/' },
  { path: '/rewire/landing/',  canonical: 'https://neurotrocity.com/rewire/landing/' },
  { path: '/apps/',            canonical: 'https://neurotrocity.com/apps/' },
  { path: '/beeptest/landing/', canonical: 'https://neurotrocity.com/beeptest/landing/' },
];
```

In `tests/e2e/routes.spec.ts`, add `'/beeptest/landing/'` to `MUST_RESOLVE`, after `'/dispoint/', '/dosetrack/',`:

```ts
  '/dispoint/', '/dosetrack/',
  '/beeptest/landing/',
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts tests/e2e/routes.spec.ts tests/e2e/seo.spec.ts tests/e2e/a11y-base.spec.ts`
Expected: the `/beeptest/landing/` tests FAIL with 404s; every existing test still passes.

- [ ] **Step 3: Write the identity stylesheet**

Create `src/styles/beeptest.css`:

```css
/* Before the Beep — venture identity. Imported only by BeeptestLayout, so it
   ships only on /beeptest/* and its global rules never reach the studio site.
   Spec: docs/superpowers/specs/2026-09-23-beeptest-landing-design.md §6.
   Palette is sampled from the app icon; flame tones from the flame beat. */
:root{
  --bt-void:#000; --bt-bone:#F2EDE4; --bt-ink:#000;
  --bt-sweat:#4DD9F0; --bt-tongue:#F08C9E;
  --bt-flare:#FF3B2F; --bt-ember:#FF8A1E; --bt-gold:#FFC43D;
  --bt-dim:#8C877E; --bt-line:#26231F; --bt-panel:#0B0A09;
  --bt-maxw:1180px; --bt-pad:clamp(16px,4vw,56px);
}
body{ background:var(--bt-void); color:var(--bt-bone); font-family:var(--body) }
.bt-wrap{ max-width:var(--bt-maxw); margin:0 auto; padding-inline:var(--bt-pad) }
.bt-mono{ font-family:var(--mono); font-size:12px; letter-spacing:.16em; text-transform:uppercase; font-variant-numeric:tabular-nums }

/* ── focus: one ring, everywhere ───────────────────────────────────────── */
.bt-btn:focus-visible, .bt-navcta:focus-visible, .bt-mark:focus-visible,
.bt-foot a:focus-visible, .bt-sec a:focus-visible, .bt-doc a:focus-visible,
.bt-form input:focus-visible{ outline:3px solid var(--bt-flare); outline-offset:3px }

/* ── nav ───────────────────────────────────────────────────────────────── */
.bt-bar{ display:flex; align-items:center; justify-content:space-between; gap:16px; height:64px;
  max-width:var(--bt-maxw); margin:0 auto; padding-inline:var(--bt-pad) }
.bt-mark{ font-family:var(--display); font-weight:900; font-size:18px; letter-spacing:-.02em;
  text-transform:uppercase; color:var(--bt-bone); text-decoration:none }
.bt-navcta{ font-weight:800; font-size:14px; color:var(--bt-bone); text-decoration:none; padding:9px 16px;
  border:2px solid var(--bt-bone); border-radius:999px; white-space:nowrap; transition:background .15s, color .15s }
.bt-navcta:hover{ background:var(--bt-bone); color:var(--bt-void) }

/* ── buttons: flat sticker, hard offset shadow ─────────────────────────── */
.bt-btn{ display:inline-flex; align-items:center; gap:10px; font-family:var(--display); font-weight:900;
  font-size:17px; text-transform:uppercase; letter-spacing:.01em; text-decoration:none; cursor:pointer;
  padding:15px 24px; border:3px solid var(--bt-ink); border-radius:6px;
  background:var(--bt-flare); color:var(--bt-void); box-shadow:5px 5px 0 var(--bt-bone);
  transition:transform .12s, box-shadow .12s }
.bt-btn:hover{ transform:translate(-2px,-2px); box-shadow:7px 7px 0 var(--bt-bone) }
.bt-btn:active{ transform:translate(3px,3px); box-shadow:2px 2px 0 var(--bt-bone) }
.bt-btn.ghost{ background:transparent; color:var(--bt-bone); border-color:var(--bt-bone); box-shadow:none }
.bt-btn.ghost:hover{ background:var(--bt-bone); color:var(--bt-void) }

/* ── hero ──────────────────────────────────────────────────────────────── */
.bt-hero{ position:relative; overflow:hidden; isolation:isolate; min-height:min(92vh,860px);
  display:flex; align-items:center; padding-block:40px 72px }
.bt-rays{ position:absolute; inset:-10%; width:120%; height:120%; z-index:-1; fill:var(--bt-bone);
  opacity:.16; animation:bt-rays 700ms cubic-bezier(.2,.9,.2,1) both }
@keyframes bt-rays{ from{ opacity:0; transform:scale(1.35) } 30%{ opacity:.55 } to{ opacity:.16; transform:none } }
/* The impact frame (celebration spec §5.2): one white flash, once, on load. */
.bt-impact{ position:absolute; inset:0; z-index:3; pointer-events:none; background:var(--bt-bone);
  opacity:0; animation:bt-impact 220ms steps(2,end) 1 }
@keyframes bt-impact{ from{ opacity:1 } to{ opacity:0 } }
.bt-hero-grid{ width:100%; display:grid; grid-template-columns:1.1fr .9fr; align-items:center; gap:clamp(24px,4vw,56px) }
.bt-skull{ width:100%; height:auto; display:block; filter:drop-shadow(10px 10px 0 var(--bt-flare));
  animation:bt-slam 520ms cubic-bezier(.2,1.6,.4,1) 120ms both }
@keyframes bt-slam{ from{ opacity:0; transform:scale(1.25) rotate(-6deg) } to{ opacity:1; transform:none } }
.bt-h1{ margin:0; font-family:var(--display); font-weight:900; line-height:.9; letter-spacing:-.04em }
.bt-h1 span{ display:block }
.bt-h1 .l1{ font-size:clamp(52px,9.5vw,132px); text-transform:uppercase; text-wrap:balance }
.bt-h1 .l2, .bt-h1 .l3{ font-size:clamp(22px,2.6vw,34px); line-height:1.12; letter-spacing:-.02em; font-weight:800; max-width:26ch }
.bt-h1 .l2{ margin-top:22px }
.bt-h1 .l3{ margin-top:14px; color:var(--bt-dim) }
.bt-h1 .l3 em{ display:inline-block; font-style:normal; font-weight:900; text-transform:uppercase;
  color:var(--bt-flare); transform:rotate(-2deg) }
.bt-lede{ margin:24px 0 0; max-width:46ch; font-size:17px; line-height:1.55 }
.bt-cta{ margin-top:30px; display:flex; flex-wrap:wrap; gap:16px }
@media (max-width:820px){
  .bt-hero-grid{ grid-template-columns:1fr }
  .bt-skull-wrap{ order:-1; width:min(100%,420px); margin-inline:auto }
}

/* ── sections ──────────────────────────────────────────────────────────── */
.bt-sec{ padding-block:clamp(72px,10vw,128px); border-top:3px solid var(--bt-line) }
.bt-eyebrow{ margin:0 0 14px; color:var(--bt-flare) }
.bt-h2{ margin:0; font-family:var(--display); font-weight:900; font-size:clamp(34px,5.4vw,68px);
  line-height:.95; letter-spacing:-.035em; text-transform:uppercase; max-width:18ch; text-wrap:balance }
.bt-body{ margin:20px 0 0; max-width:58ch; font-size:17px; line-height:1.6 }
.bt-split{ display:grid; grid-template-columns:1.1fr .9fr; gap:clamp(24px,4vw,56px); align-items:center }
.bt-beat{ width:100%; max-width:520px; height:auto; display:block; margin-inline:auto }
@media (max-width:820px){ .bt-split{ grid-template-columns:1fr } }

/* ── pending policy pages ──────────────────────────────────────────────── */
.bt-doc{ padding-block:clamp(56px,8vw,104px) }
.bt-doc .bt-body{ color:var(--bt-dim) }
.bt-doc a{ color:var(--bt-bone) }

/* ── footer ────────────────────────────────────────────────────────────── */
.bt-foot{ border-top:3px solid var(--bt-line); padding-block:40px 56px; font-size:14px; color:var(--bt-dim) }
.bt-foot .bt-wrap{ display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:16px 40px }
.bt-foot p{ margin:0 }
.bt-foot nav{ display:flex; flex-wrap:wrap; gap:10px 24px; font-family:var(--mono); font-size:12.5px }
.bt-foot a{ color:var(--bt-dim); text-decoration:none; overflow-wrap:anywhere }
.bt-foot a:hover{ color:var(--bt-flare) }

@media (prefers-reduced-motion:reduce){
  .bt-rays, .bt-skull{ animation:none }
  .bt-impact{ display:none }
  .bt-btn{ transition:none }
}
```

- [ ] **Step 4: Write the layout**

Create `src/components/beeptest/BeeptestLayout.astro`:

```astro
---
// The shell for every /beeptest/* page: the site's Base (SEO, fonts, skip
// link) with the studio's cortex field and spine left off, and the app's own
// identity on top. Spec B2, B3.
import Base from '../../layouts/Base.astro';
import '../../styles/beeptest.css';
import { BEEPTEST } from '../../content/beeptest';

interface Props {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown>;
  /** Pages whose content is not written yet stay out of search results. */
  noindex?: boolean;
}

const { title, description, path, jsonLd, noindex = false } = Astro.props;
const { name, nav, footer } = BEEPTEST;
---
<Base title={title} description={description} path={path} ogImage="/beeptest/assets/img/og-beeptest.png" jsonLd={jsonLd}>
  <Fragment slot="head">
    <meta name="theme-color" content="#000000" />
    {noindex && <meta name="robots" content="noindex" />}
  </Fragment>

  <Fragment slot="nav">
    <div class="bt-bar">
      <a class="bt-mark" href="/beeptest/landing/">{name}</a>
      <a class="bt-navcta" href={nav.cta.href}>{nav.cta.label}</a>
    </div>
  </Fragment>

  <slot />

  <Fragment slot="footer">
    <footer class="bt-foot">
      <div class="bt-wrap">
        <p>{footer.tagline}</p>
        <nav aria-label={name}>
          {footer.links.map((l) => <a href={l.href}>{l.label}</a>)}
          <a href={`mailto:${footer.email}`}>{footer.email}</a>
        </nav>
      </div>
    </footer>
  </Fragment>
</Base>
```

- [ ] **Step 5: Write the hero**

Create `src/components/beeptest/Hero.astro`:

```astro
---
import { BEEPTEST } from '../../content/beeptest';

const { hero } = BEEPTEST;

// Manga speed lines: thin wedges converging on the centre. Computed at build
// time and deterministic, so the SVG is identical on every build.
const C = 500;
const at = (angle: number, r: number) =>
  `${(C + Math.cos(angle) * r).toFixed(1)},${(C + Math.sin(angle) * r).toFixed(1)}`;
const RAYS = Array.from({ length: 64 }, (_, i) => {
  const a = (i / 64) * Math.PI * 2;
  const spread = i % 3 === 0 ? 0.034 : 0.016;
  const inner = 250 + ((i * 37) % 110);
  return `${at(a - spread, 900)} ${at(a + spread, 900)} ${at(a, inner)}`;
});
---
<section class="bt-hero" aria-labelledby="bt-hero-h">
  <svg class="bt-rays" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    {RAYS.map((points) => <polygon points={points} />)}
  </svg>
  <div class="bt-impact" aria-hidden="true"></div>

  <div class="bt-wrap bt-hero-grid">
    <div>
      <h1 class="bt-h1" id="bt-hero-h">
        <span class="l1">{hero.lines[0]}</span>
        <span class="l2">{hero.lines[1]}</span>
        <span class="l3">{hero.lines[2]} <em>{hero.payoff}</em></span>
      </h1>
      <p class="bt-lede">{hero.lede}</p>
      <div class="bt-cta">
        <a class="bt-btn" href={hero.primary.href}>{hero.primary.label}</a>
        <a class="bt-btn ghost" href={hero.secondary.href}>{hero.secondary.label}</a>
      </div>
    </div>
    <div class="bt-skull-wrap">
      <img class="bt-skull" src="/beeptest/assets/img/skull-hero.webp" alt={hero.skullAlt}
           width="1200" height="1200" fetchpriority="high" decoding="async" />
    </div>
  </div>
</section>
```

- [ ] **Step 6: Write the page**

Create `src/pages/beeptest/landing.astro`:

```astro
---
import BeeptestLayout from '../../components/beeptest/BeeptestLayout.astro';
import Hero from '../../components/beeptest/Hero.astro';
import { BEEPTEST } from '../../content/beeptest';

const { name, meta } = BEEPTEST;

// No offers, ratings or download URL: there is nothing to download yet (B16).
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name,
  operatingSystem: 'iOS, watchOS',
  applicationCategory: 'HealthApplication',
  description: meta.description,
  url: `https://neurotrocity.com${meta.path}`,
  inLanguage: 'en-AU',
  author: { '@type': 'Organization', name: 'NeuroTrocity', url: 'https://neurotrocity.com' },
};
---
<BeeptestLayout title={meta.title} description={meta.description} path={meta.path} jsonLd={jsonLd}>
  <Hero />
</BeeptestLayout>
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts tests/e2e/routes.spec.ts tests/e2e/seo.spec.ts tests/e2e/a11y-base.spec.ts`
Expected: PASS, all of them. The `/beeptest/landing/` rows in `seo.spec.ts` confirm the canonical, a complete OG card, a 1200×630 PNG `og:image` and valid JSON-LD.

- [ ] **Step 8: Look at it**

Run `npm run preview`, open `http://localhost:4321/beeptest/landing/` in the browser pane at desktop width and again at 375 wide. Check: the flash fires once; the rays strike in and settle; the skull slams and does not overlap the headline; "THE BEEP TEST SUCKS." does not break mid-word at 375; the flare offset shadow is visible behind the skull.

- [ ] **Step 9: Commit**

```bash
git add src/styles/beeptest.css src/components/beeptest/BeeptestLayout.astro src/components/beeptest/Hero.astro src/pages/beeptest/landing.astro tests/e2e/beeptest.spec.ts tests/e2e/seo.spec.ts tests/e2e/routes.spec.ts tests/e2e/a11y-base.spec.ts
git commit -m "feat(beeptest): add the layout, identity and hero

The page wears app clothes: Base with the studio field and spine off,
a --bt-* palette sampled from the icon, and the celebration vocabulary
on the web: speed lines, one impact flash, the skull slamming in.
Everything stops under reduced motion.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The pacing bar

The section that has to be excellent (spec §5.2). A dot runs one shuttle at the real speed of level 6. Ticks flash at 70%, 80% and 90%, and the beep lands on 100%. Pure CSS: one custom property carries the real shuttle time, and each tick's `animation-delay` is that time multiplied by its fraction. An infinite animation's delay applies only before the first cycle, so every later flash stays locked to the runner.

**Files:**
- Create: `src/components/beeptest/PacingBar.astro`
- Modify: `src/pages/beeptest/landing.astro`
- Modify: `src/styles/beeptest.css` (append)
- Test: `tests/e2e/beeptest.spec.ts` (append)

**Interfaces:**
- Consumes: `pacingSchedule()` (Task 1); `BEEPTEST.pacing` (Task 2); `.bt-sec`, `.bt-wrap`, `.bt-mono`, `.bt-eyebrow`, `.bt-h2`, `.bt-body` (Task 6).
- Produces: `#pacing`, the target of the hero's secondary CTA.

- [ ] **Step 1: Write the failing tests**

At the top of `tests/e2e/beeptest.spec.ts`, add this import:

```ts
import { pacingSchedule } from '../../src/content/beeptest-protocol';
```

Append:

```ts
test('the pacing bar shows its three cue marks and the beep, even with motion reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(LANDING);
  const pace = page.locator('#pacing .bt-pace');
  for (const label of ['70%', '80%', '90%', BEEPTEST.pacing.beepLabel]) {
    await expect(pace.getByText(label, { exact: true })).toBeVisible();
  }
  const name = await page.locator('.bt-runner').evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe('none');
});

test('the pacing bar runs at the demo level’s real shuttle time', async ({ page }) => {
  await page.goto(LANDING);
  const expected = pacingSchedule(BEEPTEST.pacing.demoLevel).durationSec;
  const dur = await page.locator('.bt-runner').evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(dur)).toBeCloseTo(expected, 3);
});

test('each cue flashes at its fraction of the shuttle', async ({ page }) => {
  await page.goto(LANDING);
  const s = pacingSchedule(BEEPTEST.pacing.demoLevel);
  const delays = await page.locator('.bt-tick:not(.beep)').evaluateAll((els) =>
    els.map((el) => parseFloat(getComputedStyle(el, '::before').animationDelay)),
  );
  expect(delays).toHaveLength(3);
  delays.forEach((d, i) => expect(d).toBeCloseTo(s.cues[i].atSec, 3));
});

test('the hero’s second button reaches the pacing bar', async ({ page }) => {
  await page.goto(LANDING);
  await page.getByRole('link', { name: BEEPTEST.hero.secondary.label }).click();
  await expect(page).toHaveURL(/#pacing$/);
  await expect(page.locator('#pacing')).toBeInViewport();
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts`
Expected: the four new tests FAIL (`#pacing` not found); the Task 6 tests still pass.

- [ ] **Step 3: Write the component**

Create `src/components/beeptest/PacingBar.astro`:

```astro
---
import { BEEPTEST } from '../../content/beeptest';
import { pacingSchedule } from '../../content/beeptest-protocol';

const { pacing } = BEEPTEST;
// Real cadence from the protocol table (B8), not an invented rhythm.
const s = pacingSchedule(pacing.demoLevel);
---
<section class="bt-sec" id={pacing.id} aria-labelledby="bt-pacing-h">
  <div class="bt-wrap">
    <p class="bt-mono bt-eyebrow">{pacing.eyebrow}</p>
    <h2 class="bt-h2" id="bt-pacing-h">{pacing.heading}</h2>
    <p class="bt-body">{pacing.body}</p>

    <figure class="bt-pace" style={`--dur:${s.durationSec}s`}>
      <div class="bt-track" aria-hidden="true">
        <div class="bt-rail"></div>
        {s.cues.map((c) => (
          <div class="bt-tick" style={`--f:${c.fraction}`}><b>{Math.round(c.fraction * 100)}%</b></div>
        ))}
        <div class="bt-tick beep" style="--f:1"><b>{pacing.beepLabel}</b></div>
        <div class="bt-runner"></div>
      </div>
      <figcaption class="bt-mono bt-pace-meta">{pacing.caption(s.level, s.speedKph, s.durationSec)}</figcaption>
    </figure>
  </div>
</section>
```

- [ ] **Step 4: Append the styles**

Append to `src/styles/beeptest.css`:

```css
/* ── pacing bar (spec §5.2) ──────────────────────────────────────────────
   --dur is one real shuttle. Every tick flashes on the same period, offset by
   its own fraction of it, so the flashes stay locked to the runner forever. */
.bt-pace{ margin:48px 0 0; padding:clamp(20px,3vw,36px); border:3px solid var(--bt-bone); border-radius:10px;
  background:var(--bt-panel); animation:bt-beep-edge var(--dur) linear infinite; animation-delay:var(--dur) }
@keyframes bt-beep-edge{ 0%{ border-color:var(--bt-flare); box-shadow:0 0 0 4px var(--bt-flare) }
  8%,100%{ border-color:var(--bt-bone); box-shadow:none } }
.bt-track{ position:relative; height:96px; margin-inline:18px }
.bt-rail{ position:absolute; left:0; right:0; top:50%; height:6px; margin-top:-3px; border-radius:3px; background:var(--bt-line) }
.bt-runner{ position:absolute; top:50%; left:0; width:26px; height:26px; margin:-13px 0 0 -13px; border-radius:50%;
  background:var(--bt-bone); border:3px solid var(--bt-ink); box-shadow:0 0 0 3px var(--bt-bone);
  animation:bt-run var(--dur) linear infinite }
@keyframes bt-run{ from{ left:0 } to{ left:100% } }
.bt-tick{ position:absolute; top:0; bottom:0; width:0; left:calc(var(--f) * 100%) }
.bt-tick::before{ content:''; position:absolute; top:24px; bottom:24px; left:-2px; width:4px; border-radius:2px;
  background:var(--bt-sweat); animation:bt-flash var(--dur) linear infinite;
  animation-delay:calc(var(--dur) * var(--f)) }
.bt-tick b{ position:absolute; bottom:0; left:0; transform:translateX(-50%);
  font-family:var(--mono); font-size:12px; font-weight:500; color:var(--bt-sweat); white-space:nowrap }
.bt-tick.beep::before{ top:8px; bottom:8px; left:-4px; width:8px; background:var(--bt-flare) }
.bt-tick.beep b{ color:var(--bt-flare); text-transform:uppercase; font-weight:500 }
@keyframes bt-flash{ 0%{ transform:scaleY(1.9); filter:brightness(1.8) } 10%,100%{ transform:none; filter:none } }
.bt-pace-meta{ margin-top:22px; color:var(--bt-dim); letter-spacing:.1em }

@media (prefers-reduced-motion:reduce){
  /* A static diagram: runner parked at the last cue, every mark labelled. */
  .bt-pace, .bt-runner, .bt-tick::before{ animation:none }
  .bt-runner{ left:90% }
}
```

- [ ] **Step 5: Put it on the page**

In `src/pages/beeptest/landing.astro`, add after the `Hero` import:

```ts
import PacingBar from '../../components/beeptest/PacingBar.astro';
```

and replace:

```astro
  <Hero />
```

with:

```astro
  <Hero />
  <PacingBar />
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts`
Expected: PASS, every test in the file.

- [ ] **Step 7: Watch it for one full loop**

In the browser pane at `http://localhost:4321/beeptest/landing/#pacing`, watch a whole cycle. The three cyan ticks must flash as the runner **passes** them, not before or after, and the red beep and panel edge must fire as the runner hits the right end. Then check at 375 wide that the `Beep` label does not overflow the panel.

- [ ] **Step 8: Commit**

```bash
git add src/components/beeptest/PacingBar.astro src/pages/beeptest/landing.astro src/styles/beeptest.css tests/e2e/beeptest.spec.ts
git commit -m "feat(beeptest): add the pacing bar

One shuttle of level 6 at its real speed from the protocol table, with
the cues flashing at 70, 80 and 90 percent and the beep landing on 100.
Pure CSS: each tick's delay is the shuttle time times its fraction, so
the flashes never drift from the runner. Reduced motion gets a labelled
static diagram.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Screen frames, Watch, the maximal-effort panel, and the free first test

**Files:**
- Create: `src/components/beeptest/ScreenFrames.astro`
- Create: `src/components/beeptest/Watch.astro`
- Create: `src/components/beeptest/Effort.astro`
- Create: `src/components/beeptest/FreeFirst.astro`
- Modify: `src/pages/beeptest/landing.astro`
- Modify: `src/styles/beeptest.css` (append)
- Test: `tests/e2e/beeptest.spec.ts` (append)

**Interfaces:**
- Consumes: `BEEPTEST.frames|watch|effort|free` (Task 2); `REQUIRED_WARNING` (Task 2); `skull-flame.webp`, `skull-closing.webp` (Task 4); the Task 6 classes, including `.bt-split` and `.bt-beat`.
- Produces: `#before-you-start`.

- [ ] **Step 1: Write the failing tests**

At the top of `tests/e2e/beeptest.spec.ts`, add:

```ts
import { REQUIRED_WARNING } from '../../src/content/beeptest-rules';
```

Append:

```ts
test('five screen frames, each honestly marked as pending, with their store captions', async ({ page }) => {
  await page.goto(LANDING);
  const frames = page.locator('.bt-frame');
  await expect(frames).toHaveCount(5);
  for (const [i, item] of BEEPTEST.frames.items.entries()) {
    await expect(frames.nth(i)).toContainText(BEEPTEST.frames.pending);
    await expect(frames.nth(i).locator('figcaption')).toContainText(item.caption);
  }
});

test('the required maximal-test sentence is on the page, visible', async ({ page }) => {
  await page.goto(LANDING);
  await expect(page.getByText(REQUIRED_WARNING, { exact: true })).toBeVisible();
});

test('the whole store warning is present, including the training-aid paragraph', async ({ page }) => {
  await page.goto(LANDING);
  const panel = page.locator('#before-you-start .bt-effort-panel');
  await expect(panel).toContainText(BEEPTEST.effort.detail);
  await expect(panel).toContainText(BEEPTEST.effort.aid);
});

test('the flame and closing skulls are lazy-loaded and described', async ({ page }) => {
  await page.goto(LANDING);
  for (const alt of [BEEPTEST.effort.skullAlt, BEEPTEST.free.skullAlt]) {
    await expect(page.getByAltText(alt)).toHaveAttribute('loading', 'lazy');
  }
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts`
Expected: the four new tests FAIL; earlier tests pass.

- [ ] **Step 3: Write the four components**

Create `src/components/beeptest/ScreenFrames.astro`:

```astro
---
import { BEEPTEST } from '../../content/beeptest';

const { frames } = BEEPTEST;
// Marked placeholders, not drawn mock-ups (B13): real screenshots are not
// producible yet. Swap each .bt-phone for an <img> when they are.
---
<section class="bt-sec" aria-labelledby="bt-frames-h">
  <div class="bt-wrap">
    <p class="bt-mono bt-eyebrow">{frames.eyebrow}</p>
    <h2 class="bt-h2" id="bt-frames-h">{frames.heading}</h2>
    <div class="bt-frames">
      {frames.items.map((item) => (
        <figure class="bt-frame">
          <div class="bt-phone">
            <span class="bt-mono">{frames.pending}</span>
            <span class="bt-screen">{item.screen}</span>
          </div>
          <figcaption>{item.caption}</figcaption>
        </figure>
      ))}
    </div>
  </div>
</section>
```

Create `src/components/beeptest/Watch.astro`:

```astro
---
import { BEEPTEST } from '../../content/beeptest';

const { watch } = BEEPTEST;
---
<section class="bt-sec" aria-labelledby="bt-watch-h">
  <div class="bt-wrap">
    <p class="bt-mono bt-eyebrow">{watch.eyebrow}</p>
    <h2 class="bt-h2" id="bt-watch-h">{watch.heading}</h2>
    <p class="bt-body">{watch.body}</p>
  </div>
</section>
```

Create `src/components/beeptest/Effort.astro`:

```astro
---
import { BEEPTEST } from '../../content/beeptest';

const { effort } = BEEPTEST;
// B9: prominent, never footer small print, and never trimmed.
---
<section class="bt-sec" id="before-you-start" aria-labelledby="bt-effort-h">
  <div class="bt-wrap bt-effort">
    <img class="bt-beat" src="/beeptest/assets/img/skull-flame.webp" alt={effort.skullAlt}
         width="1000" height="1000" loading="lazy" decoding="async" />
    <div>
      <p class="bt-mono bt-eyebrow">{effort.eyebrow}</p>
      <h2 class="bt-h2" id="bt-effort-h">{effort.heading}</h2>
      <div class="bt-effort-panel">
        <p class="lead">{effort.warning}</p>
        <p>{effort.detail}</p>
        <p class="aid">{effort.aid}</p>
      </div>
    </div>
  </div>
</section>
```

Create `src/components/beeptest/FreeFirst.astro`:

```astro
---
import { BEEPTEST } from '../../content/beeptest';

const { free } = BEEPTEST;
---
<section class="bt-sec" aria-labelledby="bt-free-h">
  <div class="bt-wrap bt-split">
    <div>
      <h2 class="bt-h2" id="bt-free-h">{free.heading}</h2>
      <p class="bt-body">{free.body}</p>
    </div>
    <img class="bt-beat" src="/beeptest/assets/img/skull-closing.webp" alt={free.skullAlt}
         width="1000" height="1000" loading="lazy" decoding="async" />
  </div>
</section>
```

- [ ] **Step 4: Append the styles**

Append to `src/styles/beeptest.css`:

```css
/* ── screen frames: honest placeholders (B13) ──────────────────────────── */
.bt-frames{ margin-top:48px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:22px }
.bt-frame{ margin:0 }
.bt-phone{ aspect-ratio:9/19.5; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:10px; padding:18px; text-align:center; color:var(--bt-dim); border:3px solid var(--bt-bone); border-radius:30px;
  background:repeating-linear-gradient(-45deg, var(--bt-panel) 0 14px, #13110F 14px 28px) }
.bt-screen{ font-size:14px; line-height:1.35; color:var(--bt-bone) }
.bt-frame figcaption{ margin-top:14px; font-weight:800; font-size:16px; line-height:1.3 }

/* ── the maximal-effort panel (B9) ─────────────────────────────────────── */
.bt-effort{ display:grid; grid-template-columns:.9fr 1.1fr; gap:clamp(24px,4vw,56px); align-items:center }
.bt-effort-panel{ margin-top:28px; padding:clamp(22px,3vw,40px); border:4px solid var(--bt-flare); border-radius:10px;
  background:var(--bt-panel); box-shadow:10px 10px 0 var(--bt-flare) }
.bt-effort-panel p{ margin:0; font-size:17px; line-height:1.6 }
.bt-effort-panel p + p{ margin-top:16px }
.bt-effort-panel .lead{ font-family:var(--display); font-weight:900; font-size:clamp(22px,2.6vw,30px);
  line-height:1.15; letter-spacing:-.02em }
.bt-effort-panel .aid{ color:var(--bt-dim) }
@media (max-width:820px){ .bt-effort{ grid-template-columns:1fr } }
```

- [ ] **Step 5: Put them on the page**

In `src/pages/beeptest/landing.astro`, add after the `PacingBar` import:

```ts
import ScreenFrames from '../../components/beeptest/ScreenFrames.astro';
import Watch from '../../components/beeptest/Watch.astro';
import Effort from '../../components/beeptest/Effort.astro';
import FreeFirst from '../../components/beeptest/FreeFirst.astro';
```

and replace:

```astro
  <Hero />
  <PacingBar />
```

with:

```astro
  <Hero />
  <PacingBar />
  <ScreenFrames />
  <Watch />
  <Effort />
  <FreeFirst />
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts`
Expected: PASS, every test in the file.

- [ ] **Step 7: Commit**

```bash
git add src/components/beeptest/ScreenFrames.astro src/components/beeptest/Watch.astro src/components/beeptest/Effort.astro src/components/beeptest/FreeFirst.astro src/pages/beeptest/landing.astro src/styles/beeptest.css tests/e2e/beeptest.spec.ts
git commit -m "feat(beeptest): add the frames, Watch, warning and free-test sections

The store's risk warning gets a hard inked panel and the flame skull
rather than small print, verbatim and complete. The five screenshot
slots say plainly that they are pending.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: The launch list

**Files:**
- Create: `src/components/beeptest/LaunchList.astro`
- Modify: `src/pages/beeptest/landing.astro`
- Modify: `src/styles/beeptest.css` (append)
- Test: `tests/e2e/beeptest.spec.ts` (append)

**Interfaces:**
- Consumes: `buttondownAction()` (Task 3); `BEEPTEST.launch` (Task 2); `.bt-btn` (Task 6).
- Produces: `#launch`, the target of the hero's primary CTA and of the nav CTA.

- [ ] **Step 1: Write the failing tests**

At the top of `tests/e2e/beeptest.spec.ts`, add:

```ts
import { buttondownAction } from '../../src/content/beeptest-signup';
```

Append:

```ts
test('the launch list is a plain labelled email field', async ({ page }) => {
  await page.goto(LANDING);
  const email = page.getByLabel(BEEPTEST.launch.label);
  await expect(email).toHaveAttribute('type', 'email');
  await expect(email).toHaveAttribute('name', 'email');
  await expect(email).toHaveAttribute('autocomplete', 'email');
  await expect(page.locator('#launch')).toContainText(BEEPTEST.launch.consent);
  await expect(page.locator('#launch a[href="/beeptest/privacy/"]')).toHaveCount(1);
});

test('the launch list posts natively to Buttondown when configured, and is visibly closed when not', async ({ page }) => {
  await page.goto(LANDING);
  const form = page.locator('form[data-bt-signup]');
  const action = buttondownAction(BEEPTEST.launch.buttondownUsername);
  if (action === null) {
    expect(await form.getAttribute('action')).toBeNull();
    await expect(page.getByLabel(BEEPTEST.launch.label)).toBeDisabled();
    await expect(page.locator('[data-bt-status]')).toHaveText(BEEPTEST.launch.closed);
  } else {
    await expect(form).toHaveAttribute('action', action);
    await expect(form).toHaveAttribute('method', 'post');
    await expect(form).toHaveAttribute('target', '_blank');
    await expect(form.locator('input[name="embed"]')).toHaveValue('1');
  }
});

test('the hero’s first button reaches the launch list', async ({ page }) => {
  await page.goto(LANDING);
  await page.getByRole('link', { name: BEEPTEST.hero.primary.label }).click();
  await expect(page).toHaveURL(/#launch$/);
  await expect(page.locator('#launch')).toBeInViewport();
});

test('nothing on the page fetches Buttondown', async ({ page }) => {
  // B19: Buttondown's docs forbid fetch; CAPTCHA and errors need a real page.
  const calls: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('buttondown') && ['fetch', 'xhr'].includes(r.resourceType())) calls.push(r.url());
  });
  await page.goto(LANDING);
  await page.waitForLoadState('networkidle');
  expect(calls).toEqual([]);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts`
Expected: the first three new tests FAIL; the fetch test passes already. That is correct: it guards against a future change.

- [ ] **Step 3: Write the component**

Create `src/components/beeptest/LaunchList.astro`:

```astro
---
import { BEEPTEST } from '../../content/beeptest';
import { buttondownAction } from '../../content/beeptest-signup';

const { launch } = BEEPTEST;
// A native POST into a new tab, never fetch (spec §5.7, B19). Buttondown shows
// CAPTCHA, validation errors and confirmation in that tab, while this page,
// and what was typed, stay exactly as they were. While the username is null
// the form renders disabled and says the list opens soon.
const action = buttondownAction(launch.buttondownUsername);
---
<section class="bt-sec" id={launch.id} aria-labelledby="bt-launch-h">
  <div class="bt-wrap">
    <p class="bt-mono bt-eyebrow">{launch.eyebrow}</p>
    <h2 class="bt-h2" id="bt-launch-h">{launch.heading}</h2>
    <p class="bt-body">{launch.body}</p>

    <form class="bt-form" data-bt-signup method="post" action={action ?? undefined}
          target="_blank" data-opened={launch.opened}>
      <label for="bt-email">{launch.label}</label>
      <input id="bt-email" type="email" name="email" autocomplete="email" required
             placeholder={launch.placeholder} disabled={!action} />
      <input type="hidden" name="embed" value="1" />
      <button class="bt-btn" type="submit" disabled={!action}>{launch.button}</button>
    </form>
    <p class="bt-status" data-bt-status role="status">{action ? '' : launch.closed}</p>
    <p class="bt-consent">{launch.consent} <a href="/beeptest/privacy/">{launch.privacyLink}</a>.</p>
  </div>
</section>

<script>
  // Progressive enhancement only: the POST itself is the browser's. The
  // submit event fires only after native email validation has passed.
  const form = document.querySelector<HTMLFormElement>('form[data-bt-signup]');
  const status = document.querySelector<HTMLElement>('[data-bt-status]');
  if (form && status && form.hasAttribute('action')) {
    form.addEventListener('submit', () => {
      status.textContent = form.dataset.opened ?? '';
    });
  }
</script>
```

- [ ] **Step 4: Append the styles**

Append to `src/styles/beeptest.css`:

```css
/* ── launch list (spec §5.7) ───────────────────────────────────────────── */
.bt-form{ margin-top:28px; max-width:560px; display:flex; flex-wrap:wrap; gap:12px }
.bt-form label{ flex-basis:100%; font-weight:800 }
.bt-form input[type="email"]{ flex:1 1 240px; min-width:0; font:inherit; font-size:17px; padding:14px 16px;
  color:var(--bt-bone); background:var(--bt-void); border:3px solid var(--bt-bone); border-radius:6px }
.bt-form input::placeholder{ color:var(--bt-dim) }
.bt-form :disabled{ opacity:.5; cursor:not-allowed }
.bt-form button:disabled{ transform:none; box-shadow:none }
.bt-status{ margin:14px 0 0; min-height:1.5em; font-weight:800; color:var(--bt-sweat) }
.bt-consent{ margin:10px 0 0; max-width:60ch; font-size:14px; line-height:1.55; color:var(--bt-dim) }
.bt-consent a{ color:var(--bt-bone) }
```

- [ ] **Step 5: Put it on the page**

In `src/pages/beeptest/landing.astro`, add after the `FreeFirst` import:

```ts
import LaunchList from '../../components/beeptest/LaunchList.astro';
```

and replace:

```astro
  <FreeFirst />
```

with:

```astro
  <FreeFirst />
  <LaunchList />
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts`
Expected: PASS, every test in the file.

- [ ] **Step 7: Commit**

```bash
git add src/components/beeptest/LaunchList.astro src/pages/beeptest/landing.astro src/styles/beeptest.css tests/e2e/beeptest.spec.ts
git commit -m "feat(beeptest): add the launch-list signup

A native POST to Buttondown in a new tab, as its docs require, so
CAPTCHA and validation errors reach the subscriber and this page keeps
what was typed. Disabled, and saying so, until a Buttondown username is
configured. The consent line names the sender, the subject and the
unsubscribe, per the Spam Act 2003.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: The pending privacy, licence and support pages

Real pages at the URLs the app and App Store Connect will use, styled and linked, **with their body marked as pending** (spec §7). They are `noindex` and stay out of the sitemap until the reviewed text lands. The drafts in `docs/legal-drafts/` are **not** ported here: they await Rob's and a lawyer's review.

**Files:**
- Create: `src/pages/beeptest/[doc].astro`
- Test: `tests/e2e/beeptest.spec.ts` (append)
- Modify: `tests/e2e/routes.spec.ts`

**Interfaces:**
- Consumes: `BeeptestLayout` with `noindex` (Task 6); `BEEPTEST.docs`, `BEEPTEST.footer.email` (Task 2).
- Produces: `/beeptest/privacy/`, `/beeptest/eula/`, `/beeptest/support/`.

- [ ] **Step 1: Write the failing tests**

In `tests/e2e/routes.spec.ts`, extend the row added in Task 6:

```ts
  '/beeptest/landing/', '/beeptest/privacy/', '/beeptest/eula/', '/beeptest/support/',
```

Append to `tests/e2e/beeptest.spec.ts`:

```ts
for (const doc of ['privacy', 'eula', 'support'] as const) {
  const path = `/beeptest/${doc}/`;
  const meta = BEEPTEST.docs.pages[doc];

  test(`${path} is a real page, honestly pending, and kept out of search`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveText(meta.heading);
    await expect(page.locator('main')).toContainText(BEEPTEST.docs.pending);
    await expect(page.locator(`main a[href="mailto:${BEEPTEST.footer.email}"]`)).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page).toHaveTitle(meta.title);
  });
}

test('pending policy pages are not in the sitemap yet', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const doc of ['privacy', 'eula', 'support']) {
    expect(xml).not.toContain(`/beeptest/${doc}/`);
  }
  expect(xml).toContain('/beeptest/landing/');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts tests/e2e/routes.spec.ts`
Expected: the three doc-page tests and the three new route rows FAIL with 404s. The sitemap test passes already, because the landing page is in the sitemap through `PRODUCTS` (Task 5).

- [ ] **Step 3: Write the page**

Create `src/pages/beeptest/[doc].astro`:

```astro
---
// /beeptest/privacy/, /beeptest/eula/ and /beeptest/support/.
// Pending by design (spec §7): the routes exist now so nothing 404s and the
// app can hard-code the URLs. The reviewed text replaces docs.pending; when a
// page gets its real text, drop `noindex` and add it to sitemap.xml.ts
// STATIC_URLS in the same commit.
import BeeptestLayout from '../../components/beeptest/BeeptestLayout.astro';
import { BEEPTEST } from '../../content/beeptest';

type Doc = keyof typeof BEEPTEST.docs.pages;

export function getStaticPaths() {
  return (Object.keys(BEEPTEST.docs.pages) as Doc[]).map((doc) => ({ params: { doc } }));
}

const doc = Astro.params.doc as Doc;
const meta = BEEPTEST.docs.pages[doc];
const { docs, footer } = BEEPTEST;
---
<BeeptestLayout title={meta.title} description={meta.description} path={`/beeptest/${doc}/`} noindex>
  <section class="bt-doc">
    <div class="bt-wrap">
      <h1 class="bt-h2">{meta.heading}</h1>
      <p class="bt-body">{docs.pending}</p>
      <p class="bt-body">{docs.contact} <a href={`mailto:${footer.email}`}>{footer.email}</a>.</p>
    </div>
  </section>
</BeeptestLayout>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts tests/e2e/routes.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/beeptest/\[doc\].astro tests/e2e/beeptest.spec.ts tests/e2e/routes.spec.ts
git commit -m "feat(beeptest): add the pending privacy, licence and support pages

Real routes, so nothing 404s and the app can hard-code the URLs, with
their body plainly marked as pending. Noindexed and out of the sitemap
until the reviewed text replaces it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Scan the rendered pages, record provenance, and verify everything

**Files:**
- Test: `tests/e2e/beeptest.spec.ts` (append)
- Modify: `tests/e2e/honesty.spec.ts:10`
- Modify: `docs/provenance.md` (append a section)

**Interfaces:**
- Consumes: `BANNED`, `REQUIRED_WARNING` (Task 2); every page from Tasks 6–10; the job IDs recorded in Task 4.
- Produces: nothing new. This is the gate.

- [ ] **Step 1: Scan the rendered text, not just the source**

The unit test scans `beeptest.ts`. This catches a string typed straight into a component.

At the top of `tests/e2e/beeptest.spec.ts`, change the `beeptest-rules` import to:

```ts
import { BANNED, REQUIRED_WARNING } from '../../src/content/beeptest-rules';
```

Append:

```ts
for (const path of ['/beeptest/landing/', '/beeptest/privacy/', '/beeptest/eula/', '/beeptest/support/']) {
  test(`${path} renders no s5M(8)-banned phrase`, async ({ page }) => {
    await page.goto(path);
    const text = await page.locator('body').innerText();
    const alts = await page.locator('img').evaluateAll((els) => els.map((e) => e.getAttribute('alt') ?? ''));
    for (const { re, why } of BANNED) {
      expect(`${text}\n${alts.join('\n')}`, `${path}: ${why}`).not.toMatch(re);
    }
  });
}

test('/apps/ shows Before the Beep as coming soon, linking to its page', async ({ page }) => {
  await page.goto('/apps/');
  const tile = page.locator('#apps a.app', { hasText: BEEPTEST.name });
  await expect(tile).toHaveAttribute('href', '/beeptest/landing/');
  await expect(tile).toContainText('Coming soon');
});
```

In `tests/e2e/honesty.spec.ts`, replace:

```ts
for (const path of ['/', '/rewire/landing/', '/apps/']) {
```

with:

```ts
for (const path of ['/', '/rewire/landing/', '/apps/', '/beeptest/landing/']) {
```

- [ ] **Step 2: Run the new checks**

Run: `npm run build && npx playwright test tests/e2e/beeptest.spec.ts tests/e2e/honesty.spec.ts`
Expected: PASS. If a scan fails, fix the component copy by moving the string into `beeptest.ts` and rewording it. Never loosen `BANNED`.

- [ ] **Step 3: Record provenance**

Append to `docs/provenance.md`, filling the two job IDs recorded in Task 4 Steps 2 and 3:

```markdown
---

## `/beeptest/*` — Before the Beep (added 2026-09-23)

Spec: `docs/superpowers/specs/2026-09-23-beeptest-landing-design.md`. Every string below lives
in `src/content/beeptest.ts` unless noted. "Store" means `beep-test/docs/app-store-listing.md`,
whose copy is already checked line by line against NSW Civil Liability Act s5M(8). The only
change made to quoted store text is `" - "` set as `" — "`.

| Surface | Item | Kind | Source | Notes |
|---|---|---|---|---|
| facts.ts | `PRODUCTS[beeptest].name` "Before the Beep" | fact | Rob 2026-09-23 | Store title decision; the "Beep Test: Shuttle Run Trainer" recommendation was declined |
| facts.ts | `PRODUCTS[beeptest].description` | verbatim store copy | Store, "Promotional text", first sentence | |
| facts.ts | `PRODUCTS[beeptest].platforms` "iPhone · Watch" | fact | `beep-test-app-spec.md` §2: v1 ships iPhone and Apple Watch together | |
| facts.ts | `PRODUCTS[beeptest].status` "coming-soon" | fact | No App Store listing exists (Rob 2026-09-23, spec B16) | Excluded from "use them right now", "the apps we ship" and `makesOffer` |
| beeptest.ts | `hero.lines`, `hero.payoff` | presentation copy | Rob 2026-09-23 | "cheat the system" changed to "cheat the beep"; spec §5.1 records why |
| beeptest.ts | `hero.lede` | verbatim store copy | Store, description, opening two sentences | |
| beeptest.ts | `pacing.heading`, `frames.items[0].caption` | verbatim store copy | Store, Screenshots table, caption 1 | |
| beeptest.ts | `pacing.body` | verbatim store copy | Store, description, PACING CUES | |
| PacingBar | Timing: level 6, 11.0 km/h, 6.545455 s; cues at 0.7/0.8/0.9 | fact | `beep-test/protocols.json`, QPS level 6 and `audioDesign.pacingCues.fractionsOfShuttle` | Copied into `beeptest-protocol.ts`; a unit test checks it against the file's own formula and totals. Level 6 is arbitrary and is not presented as any standard |
| beeptest.ts | `frames.items` (screen and caption) | verbatim store copy | Store, Screenshots table | Frames are marked "Screenshot pending" (B13) |
| beeptest.ts | `watch.body` | verbatim store copy | Store, description, APPLE WATCH | ⚠️ Watch device items 3a–3h are unrun (`beep-test/docs/device-test-results.md`). Re-verify before release |
| beeptest.ts | `effort.warning`, `.detail`, `.aid` | verbatim store copy | Store, description, BEFORE YOU START, complete | `effort.warning` is the s5M(8) required sentence (B9) |
| beeptest.ts | `effort.heading` "It is designed to beat you." | presentation copy | Paraphrases the required sentence; reinforces the risk rather than softening it | |
| beeptest.ts | `free.heading`, `free.body` | verbatim store copy | Store, description, closing line | True per D20 (`navigation-and-shell-design.md`) and the 2026-09-23 source audit: no network code in the app |
| beeptest.ts | `launch.*` | presentation copy | Spec §5.7, B16, B17 | Consent line satisfies Spam Act 2003 sender, subject and unsubscribe |
| beeptest.ts | `footer.email` | fact | `facts.ts` `CONTACT.general` | `beeptest@` does not exist yet |
| beeptest.ts | `docs.*` | presentation copy | Spec §7 | Pending text; drafts in `docs/legal-drafts/` await review |
| Art | `skull-hero.webp`, `/assets/img/apps/beeptest-skull.webp`, OG card | own-asset | Higgsfield job `af0e3436-42a0-45d0-acf4-14d6d7d23ee3`, reference-locked to `beep-test` `AppIcon-1024.png` (Reference Element `a44f8f52-6b91-4a36-991b-02d0df8ed1b0`) | OG text duplicates `hero.lines[0]` by hand (`scripts/beeptest-assets.mjs`) |
| Art | `skull-flame.webp` | own-asset | Higgsfield job `<ID FROM TASK 4 STEP 2>`, same reference | |
| Art | `skull-closing.webp` | own-asset | Higgsfield job `<ID FROM TASK 4 STEP 3>`, same reference | |
```

Replace both `<ID FROM TASK 4 …>` markers with the real job IDs before saving. Confirm none remain:

Run: `grep -n "ID FROM TASK" docs/provenance.md`
Expected: no output.

- [ ] **Step 4: Run the whole suite**

```bash
npm test
npm run build
npx playwright test
```

Expected: `astro check` 0 errors; every Vitest file passes; the build completes; **every** Playwright test passes, the pre-existing ones included. A failure in an existing spec means Task 5 changed something it should not have. Fix it; do not skip the test.

- [ ] **Step 5: Check page weight**

With `npm run preview` running:

```bash
npx lighthouse http://localhost:4321/beeptest/landing/ --preset=desktop --only-categories=performance,accessibility --quiet --chrome-flags='--headless' --output=json --output-path=./.superpowers/sdd/lh-beeptest-desktop.json
node -e "const r=require('./.superpowers/sdd/lh-beeptest-desktop.json');for(const k of ['performance','accessibility'])console.log(k,Math.round(r.categories[k].score*100))"
```

Expected: performance ≥ 90 and accessibility ≥ 95. If performance is below 90, check the hero `webp` size first (Task 4 Step 6 limit).

- [ ] **Step 6: Final look, desktop and phone**

In the browser pane, at desktop width and at 375 wide, scroll the whole of `/beeptest/landing/` once with motion on and once with the pane emulating reduced motion. Then open `/apps/` and each of the three pending pages. Take a desktop and a mobile screenshot of the landing page and send both to Rob.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/beeptest.spec.ts tests/e2e/honesty.spec.ts docs/provenance.md
git commit -m "test(beeptest): scan the rendered pages and record provenance

The s5M(8) list is now checked against what the pages actually render,
alt text included, as well as against the copy module. Every new string
and asset traces to a source in provenance.md.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Before this page takes signups — not in this plan

These gate **launch**, not this build. Every one is Rob's to do or decide:

1. **Privacy policy §9** describes the Buttondown list. Only then set `BEEPTEST.launch.buttondownUsername`. Copy the username from Buttondown's embed code, and check that its form has the same `action`, `email` field and `embed` field as `LaunchList.astro`.
2. **Legal pages:** Rob's review and a lawyer's (the app spec lists this as blocking, §17 item 11), then port `docs/legal-drafts/` into `[doc].astro`, drop `noindex`, add the URLs to `sitemap.xml.ts`.
3. **Create `beeptest@neurotrocity.com`**, or keep `hello@`.
4. **In the `beep-test` repo:** set `Constants.landingPageURL` to `https://neurotrocity.com/beeptest/landing/`; fix the HealthKit purpose string; record the store-title decision in `app-store-listing.md`.
5. **Re-verify the Apple Watch claim** once the device checklist's watch items have been run.
