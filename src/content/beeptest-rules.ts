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
