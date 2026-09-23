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
      "There's only one way to beat it before it beats you…",
    ],
    payoff: 'cheat the beep.',
    // Store description, opening two sentences, verbatim.
    lede: 'Most beep test apps play you a beep and leave you to guess the rest. This one tells you where you should be.',
    primary: { label: "Get told when it's out", href: '#launch' },
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
    heading: "What you'll be looking at",
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
    body: "Leave your email and we'll tell you when Before the Beep is on the App Store.",
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
