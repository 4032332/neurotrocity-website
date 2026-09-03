/**
 * Presentation strings for the home page.
 *
 * Rule: every factual noun here traces to `facts.ts`. Where a string embeds a
 * fact (email, country, product description, rule wording, demo count) it is
 * interpolated from `facts.ts` rather than retyped. Everything else is framing
 * and asserts no new fact — no numbers, no clients, no outcomes, no guarantees
 * beyond the four RULES.
 */
import { PRODUCTS, RULES, CONTACT, DEMOS, REWIRE, type Provenance } from './facts';

const rewire = PRODUCTS.find((p) => p.slug === 'rewire')!;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const asWord = (n: number): string => { const w = WORDS[n] ?? String(n); return w[0].toUpperCase() + w.slice(1); };
const dataRule = RULES[2];     // "Your data stays yours."
const personRule = RULES[3];   // "Answered by a person."

export interface Service {
  /** Ordinal label, e.g. "Service 01". */
  n: string;
  title: string;
  /** Where the title links; undefined renders a plain heading. */
  href?: string;
  blurb: string;
  accent: 'volt' | 'cyan' | 'ember';
}

export const HOME = {
  meta: {
    // Unchanged from the current live page — SEO parity constraint.
    title: 'NeuroTrocity — focused, honest software',
    description:
      'NeuroTrocity is what happens when a brain fires every idea at once. The few that survive get built properly, and become ventures.',
    // Presentation: the Organization description in the home page's JSON-LD. Asserts no new fact.
    jsonLdDescription: 'Software studio building websites and iOS apps.',
  },

  nav: {
    links: [
      { label: 'What we build', href: '#build' },
      { label: 'Proof', href: '#proof' },
      { label: 'How we work', href: '#rules' },
    ],
    cta: { label: 'Start a project', href: '#contact' },
  },

  hero: {
    kicker: `Software studio · ${CONTACT.madeIn}`,
    // Live-site headline, verbatim. <em> wraps the second phrase.
    headline: { lead: 'A brain that wires up ', em: 'honest software', tail: '.' },
    lede: {
      a: 'Every idea fires at once — thousands of them, all shouting, each certain it’s the billion-dollar one. ',
      strong: 'Most are noise.',
      b: ' The few that survive get built properly. We do that for ourselves, and we do it for you.',
    },
    primary: { label: 'Start a project', href: '#contact' },
    ghost: { label: 'See the proof', href: '#proof' },
  },

  build: {
    eyebrow: '01 — What we build',
    heading: 'Three things, done properly.',
    sub: {
      a: 'No discovery theatre, no deck of someone else’s screenshots. A scope you can read in one sitting, and ',
      strong: 'a person who answers the email',
      b: '.',
    },
    services: [
      {
        n: 'Service 01',
        title: 'Websites that move',
        blurb:
          'Scroll-driven, 3D where it earns its place, fast on a phone. Built the way this page is built — the field behind these words is the demo.',
        accent: 'volt',
      },
      {
        n: 'Service 02',
        title: 'iOS & web apps',
        // Platforms derive from PRODUCTS[].platforms (iPhone · Watch · Web).
        blurb: `Shipped on iPhone, Apple Watch and the web, and held to the same four rules as our own ventures — ${dataRule.title.replace(/\.$/, '').toLowerCase()}, ${personRule.title.replace(/\.$/, '').toLowerCase()}.`,
        accent: 'cyan',
      },
      {
        n: 'Service 03',
        title: 'Rewire',
        href: rewire.path,
        // First sentence is PRODUCTS.rewire.description verbatim; demo count and
        // provenance derive from DEMOS.
        blurb: `${rewire.description} ${asWord(DEMOS.length)} working demo models you can open and try — the brands are fictional, the engineering is what we ship.`,
        accent: 'ember',
      },
    ] satisfies Service[],
  },

  proof: {
    eyebrow: '02 — Proof',
    heading: 'We don’t show you pictures. We hand you the working thing.',
    sub: {
      a: 'Everything below is real and running. Open it, click everything, ',
      strong: 'try to break it',
      b: ' — that is a better test than a gallery of logos.',
    },
    stance: {
      // Must contain "clients" (tested). A stance, not a client claim.
      lead: 'We don’t use our clients’ brands to advertise ourselves. ',
      em: 'We’d rather hand you something you can break.',
      note:
        'Their traffic, their numbers and the fact they needed a rebuild at all is their business, not marketing for ours. So we build fictional demo models instead — the brand names and copy are invented, the engineering is identical to what we ship.',
    },
  },

  rules: {
    eyebrow: '03 — How we work',
    // Live-site heading, verbatim. RULES.length is asserted to be 4 in tests/unit/facts.test.ts.
    heading: 'Four rules. No exceptions.',
  },

  contact: {
    eyebrow: '04 — Say hello',
    heading: 'Got a project, a question, or a site that isn’t working?',
    // Live-site line, verbatim; restates RULES[3].
    sub: 'A person reads every message and replies. No ticket queue, no bot.',
    email: CONTACT.general,
  },

  footer: {
    // Verbatim from the live site's footer.
    tagline: 'Building software that respects the people who use it.',
    ventures: PRODUCTS.map((p) => ({ label: p.slug, href: p.path })),
    email: CONTACT.general,
    legal: `© ${new Date().getFullYear()} NeuroTrocity · Made in ${CONTACT.madeIn}`,
  },
} as const;

/** How a demo's provenance reads on a card. 'fictional' is the only legal value. */
export const provenanceLabel = (p: Provenance): string =>
  ({ fictional: 'Demo model · Fictional brand' } as const)[p];

/**
 * Presentation strings for /rewire/landing/. Same rule as HOME: every fact is
 * interpolated from `facts.ts` (REWIRE, DEMOS, CONTACT, PRODUCTS); headings,
 * kickers, ledes and CTAs marked "live" are verbatim from the current page;
 * the stance is Rob's own words, verbatim. Nothing here asserts a new fact.
 */
export const REWIRE_PAGE = {
  meta: {
    // Unchanged from the current live page — SEO parity constraint.
    title: 'Rewire — website design for businesses that deserve better traffic',
    description:
      'Rewire takes underperforming small and medium business websites and rebuilds them to actually work — clearer message, faster load, more customers.',
    canonical: 'https://neurotrocity.com/rewire/landing/',
    image: `https://neurotrocity.com/rewire/sample/assets/${DEMOS[0].slug}-tile.jpg`,
  },

  nav: {
    // Live back-link, verbatim. The short CTA label is REWIRE.steps[0].title.
    back: { label: '← NeuroTrocity', href: '/' },
    cta: { label: REWIRE.steps[0].title, href: REWIRE.contact.form },
  },

  hero: {
    kicker: 'Rewire · Website design for real businesses',                    // live, verbatim
    headline: { lead: "Your website isn't broken. It's just ", em: 'wired wrong.' }, // live, verbatim
    lede:
      'We take small and medium business websites that used to work — or never quite did — and rebuild them properly: clearer message, faster load, an actual path to becoming a customer.', // live, verbatim
    primary: { label: 'Get a free site review', href: REWIRE.contact.form },  // live, verbatim
    ghost: { label: 'Try a demo model', href: '#demos' },
  },

  fits: {
    eyebrow: 'Who this is for',                                                // live, verbatim
    heading: "You already have a website. It's just not doing its job.",       // live, verbatim
    sub: "Rewire isn't for brand-new startups building a site from scratch — it's for businesses that already have one, and know something's off.", // live, verbatim
    items: REWIRE.fits,
  },

  how: {
    eyebrow: 'How it works',                                                   // live, verbatim
    heading: 'Four steps. No jargon, no lock-in contracts.',                    // live, verbatim (count asserted in facts.test.ts)
    sub: "We tell you exactly what's underperforming before you commit to anything.", // live, verbatim
    // 01–04 is legitimate here: the steps are a sequence.
    steps: REWIRE.steps.map((s, i) => ({ n: String(i + 1).padStart(2, '0'), ...s })),
  },

  demos: {
    eyebrow: 'Demo models',                                                    // live, verbatim
    heading: 'Test drive a demo model.',                                       // live, verbatim
    // Rob's own words, verbatim; split only to colour the em span.
    stance: {
      lead: 'We choose not to use our clients and their websites to advertise ourselves. We believe the right approach is to showcase our capability through ',
      em: 'demo websites you can test-drive',
      tail: ", without leaning on our client's brands.",
    },
    note: 'Open one, click everything, try to break it.',                     // live, verbatim
    deck: {
      ariaLabel: 'Demo models',
      hint: 'Tap or click to try it here',
      open: 'Open the demo',                                                   // live, verbatim ("Open the demo →")
      keys: 'Drag, scroll sideways, or use the arrow keys. Enter tries the demo here, Enter again opens it full-page.',
    },
    all: { label: 'See all demo models', href: '/rewire/sample/' },            // live, verbatim
  },

  review: {
    eyebrow: 'Get in touch',                                                   // live, verbatim
    heading: "Want to know what's actually wrong with your site?",             // live, verbatim
    sub: 'Free review, no obligation, a person replies.',                      // live, verbatim
    cta: { label: 'Start your free review', href: REWIRE.contact.form },       // live, verbatim
  },

  footer: {
    tagline: rewire.description,                                               // PRODUCTS.rewire, verbatim
    links: [
      { label: 'Demo models', href: '/rewire/sample/' },
      { label: 'Contact', href: REWIRE.contact.form },
      { label: 'NeuroTrocity', href: '/' },
    ],
    email: REWIRE.contact.email,
    legal: `© ${new Date().getFullYear()} NeuroTrocity · Rewire · Made in ${CONTACT.madeIn}`,
  },
} as const;
