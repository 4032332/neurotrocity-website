/**
 * Presentation strings for the home page.
 *
 * Rule: every factual noun here traces to `facts.ts`. Where a string embeds a
 * fact (email, country, product description, rule wording, demo count) it is
 * interpolated from `facts.ts` rather than retyped. Everything else is framing
 * and asserts no new fact — no numbers, no clients, no outcomes, no guarantees
 * beyond the four RULES.
 */
import { PRODUCTS, RULES, CONTACT, DEMOS, REWIRE, SKILL_PACK, type Provenance } from './facts';

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
      // Discovery path to the skill pack. The service page's body copy is under
      // an SEO-parity constraint, so the link lives in the footer only.
      { label: 'Skill pack', href: '/rewire/skill-pack/' },
      { label: 'Contact', href: REWIRE.contact.form },
      { label: 'NeuroTrocity', href: '/' },
    ],
    email: REWIRE.contact.email,
    legal: `© ${new Date().getFullYear()} NeuroTrocity · Rewire · Made in ${CONTACT.madeIn}`,
  },
} as const;

/**
 * The ReWire skill pack sales page (/rewire/skill-pack/).
 *
 * Same rule as the rest of this file: every factual noun traces to `facts.ts`.
 * This page additionally asserts NO outcome — no earnings, no "$5k clients", no
 * timeframes to a first sale. There are no buyers yet. The proof offered is the
 * demo builds, which anyone can open, and the craft details, which anyone can
 * check. That is a deliberate strategy, not a gap: the category is full of
 * income claims and the way to stand apart is to make none.
 */
export const SKILL_PACK_PAGE = {
  meta: {
    title: 'ReWire skill pack — the craft layer for cinematic websites in Claude Code',
    description:
      'A versioned Claude Code skill pack for building cinematic, scroll-driven, 3D websites. The actual numbers — easing curves, scroll-stage architecture, adaptive 3D tiering — extracted from shipped builds. Not a video course.',
    canonical: 'https://neurotrocity.com/rewire/skill-pack/',
  },

  nav: {
    back: { label: '\u2190 Rewire', href: '/rewire/landing/' },
    cta: { label: 'Get the pack', href: SKILL_PACK.checkout },
  },

  hero: {
    kicker: 'ReWire skill pack \u00b7 for Claude Code',
    headline: { lead: 'Your AI-built site looks ', em: 'AI-built.' },
    lede:
      "Everyone can prompt. The gap between a page Claude generated and a page that looks considered is a few dozen specific decisions \u2014 which easing curve, how a pinned section is actually structured, where the 3D sits so it doesn't wreck load time. This pack is those decisions, written down and installed as skills.",
    primary: { label: 'Get the pack', href: SKILL_PACK.checkout },
    ghost: { label: 'Open a demo first', href: '/rewire/sample/' },
    note: 'Built with it, in a day each. Open any of them and try to break it.',
  },

  /* The central argument. Deliberately not a claim about money. */
  argument: {
    eyebrow: 'The argument',
    heading: 'Same tool. Same day. The difference is what it was told.',
    body: [
      "Point Claude Code at a brief with no craft constraints and you get the house style of the whole internet: a centred hero, a purple-to-blue gradient, three feature cards, and motion that eases when it should be linear. It is competent and it is instantly recognisable as generated.",
      "Nothing about that is a limitation of the model. It is a missing specification. Given the actual numbers \u2014 the type roles, the one accent, the easing vocabulary, the scroll-stage architecture \u2014 the same tool in the same afternoon produces something you would put in front of a client.",
      "That specification is the product. Not the videos, not the prompts. The numbers.",
    ],
  },

  /* Category reframe: the single most important positioning decision. */
  form: {
    eyebrow: 'What it is',
    heading: 'A toolkit, not a course.',
    sub: 'A video course about AI tooling starts depreciating the day it is recorded. This is a versioned zip of skills that Claude Code loads and applies while it builds.',
    points: [
      { title: 'It runs, you do not watch it',
        body: 'The skills install into your workspace. `rewire <url>` runs an eight-phase pipeline and stops at five gates for your input. There is nothing to sit through.' },
      { title: 'Updates ship, not re-films',
        body: SKILL_PACK.form },
      { title: 'Every rule carries its evidence',
        body: 'The craft layer names the build each number came from, and says plainly where the builds disagree with each other or fall short of the rule.' },
    ],
  },

  contents: {
    eyebrow: "What's in it",
    heading: 'Eight skills, a working starter, and the craft layer.',
    items: SKILL_PACK.contents,
  },

  /* Specificity is the differentiator. Show the real numbers on the page. */
  craft: {
    eyebrow: 'The craft layer',
    heading: 'This is the level of detail. On the page, before you buy.',
    sub: 'Four rules lifted straight out of the taste skill. Every one of them is checkable against the demo builds \u2014 open the source and look.',
    rules: [
      { rule: "A scrubbed tween carries ease: 'none'",
        body: "The scroll is already the timing function. An ease on a scrubbed tween accelerates away from the user's hand and then waits for it, which reads as lag. This is the single most common defect in unprompted AI-written GSAP \u2014 it will reach for power2.out every time unless told not to." },
        { rule: 'Never GSAP pin. Sticky stage plus a spacer.',
        body: "pin injects a wrapper, takes over the section's layout, and is a reliable source of layout shift and mobile breakage. Pin in CSS with position:sticky over a tall spacer, and use ScrollTrigger only as a progress source. The spacer height is then your timing control." },
      { rule: 'Scrub is a number, chosen from the moment',
        body: 'Not true, which feels glued. A staged sequence wants 0.45\u20130.55 so it answers your hand; a parallax band wants 0.6\u20131.0, because the longer lag is what reads as distance. A hero exit is tightest of all \u2014 the user is trying to leave.' },
      { rule: 'Measure frame times, take the median, only step down',
        body: 'The mean lets one garbage-collection spike permanently demote a fast machine. Start at medium until there are ten samples \u2014 never start high and drop, because the drop is visible. Quality is a table of settings, not a boolean.' },
    ],
    proof: 'The two modules behind that last rule ship in the pack with their unit tests. Twelve tests, no browser, no canvas, no install step \u2014 run them yourself in one command.',
  },

  hydra: {
    eyebrow: 'hydra',
    heading: 'A reviewer that has not read your code yet.',
    body: "The reason a long build drifts is that the thing reviewing it is the thing that wrote it, carrying every assumption it already made. hydra fans out independent reviewers in fresh contexts, has them work adversarially, verifies the findings and merges what survives. It runs before the flagship gate. It is not a web-design tool \u2014 point it at any Claude Code project.",
  },

  /* Filtering unqualified buyers protects the refund rate. Stated early and plainly. */
  gate: {
    eyebrow: 'Before you buy',
    heading: 'What you need, and who this is wrong for.',
    sub: 'Stated up front on purpose. A refund from someone who could never have run it is worse for both of us than a sale that never happened.',
    prerequisites: SKILL_PACK.prerequisites,
    prereqNote: 'You do not need to know GSAP or Three.js. That is what the pack is for.',
    notFor: SKILL_PACK.notFor,
  },

  price: {
    eyebrow: 'Price',
    heading: 'One payment. Every future update.',
    amount: SKILL_PACK.price,
    includes: [
      'The full pack \u2014 eight skills, references, starter, vendored runtimes',
      'The taste craft layer, with its evidence and its known gaps',
      'hydra, usable on any Claude Code project',
      'Every future version, re-downloadable',
    ],
    guarantee: {
      title: 'If it does not install, I will fix it or refund you.',
      body: "Run the install, and if it does not work in your workspace, reply to your receipt and tell me what happened \u2014 I will either fix it or refund you. What I will not do is promise the pack will make you money, because I have no way to know that and neither does anyone else selling you something similar.",
    },
    honest:
      'The zip is markdown and JavaScript. Nothing stops you sharing it, and I have priced it knowing that. What you cannot copy from a leaked folder is the updates, or being able to ask me why a rule is the way it is.',
  },

  faq: {
    eyebrow: 'Questions',
    heading: 'The things worth asking.',
    items: [
      { q: 'Do I need to know GSAP, Three.js or WebGL?',
        a: 'No. You need a terminal, a Claude Code subscription, and enough HTML and CSS to read an error message. The pack supplies the technique; you supply the judgement about whether the result looks right.' },
      { q: 'Is this a course? Are there videos?',
        a: 'It is a toolkit. The skills do the work inside Claude Code. Where videos exist they are documentation for the tooling, not the product \u2014 the product is the zip, and it is versioned.' },
      { q: 'What actually makes the sites look different?',
        a: 'A closed set of type roles with a monospace label voice; one accent hue and nothing else saturated; one easing curve declared as a token; scroll stages pinned in CSS rather than by GSAP; and real content instead of placeholder. The craft layer is the specifics of each.' },
      { q: 'Does it work on mobile?',
        a: 'Honestly: partly, and the pack says so in writing. iOS composites a fixed WebGL canvas with a visible blink, which is a compositing bug rather than a performance one, so a frame-rate probe cannot see it. The starter refuses to create a context on a coarse pointer; the flagship build ships one and recovers from context loss. Neither fully solves it, and the craft layer names that as an open gap rather than hiding it.' },
      { q: 'Will this get me clients?',
        a: 'I have no idea, and anyone who tells you otherwise is guessing. What it does is raise the ceiling on what you can build and how fast. What you do with that is not something a zip file can promise.' },
      { q: 'Can I use it on client work?',
        a: 'Yes. Unlimited projects, commercial included, charge whatever you like, no attribution required. You just cannot redistribute the pack itself.' },
      { q: 'What if I would rather it was just built for me?',
        a: 'That is the other half of what we do, and for a one-off site it is usually the better buy. Start with a free review instead.' },
    ],
  },

  dfy: {
    eyebrow: 'Or don\u2019t build it yourself',
    heading: 'Want the site, not the workflow?',
    sub: 'If you need one site rather than the means to build many, buying the skill pack is the expensive way round. We build these for businesses \u2014 start with a free review.',
    cta: { label: 'Get a free site review', href: REWIRE.contact.form },
  },

  footer: {
    tagline: SKILL_PACK.form,
    links: [
      { label: 'Demo models', href: '/rewire/sample/' },
      { label: 'Rewire', href: '/rewire/landing/' },
      { label: 'NeuroTrocity', href: '/' },
    ],
    email: CONTACT.rewire,
    legal: `\u00a9 ${new Date().getFullYear()} NeuroTrocity \u00b7 ReWire \u00b7 Made in ${CONTACT.madeIn}`,
  },
} as const;
