/**
 * Presentation strings for the home page.
 *
 * Rule: every factual noun here traces to `facts.ts`. Where a string embeds a
 * fact (email, country, product description, rule wording, demo count) it is
 * interpolated from `facts.ts` rather than retyped. Everything else is framing
 * and asserts no new fact — no numbers, no clients, no outcomes, no guarantees
 * beyond RULES and ENGAGEMENT.
 */
import { PRODUCTS, RULES, CONTACT, DEMOS, ENGAGEMENT, REWIRE, SKILL_PACK, BOOKS, STORE_URL, isLive, productHref, productLabel, isReleased, type Provenance } from './facts';

const rewire = PRODUCTS.find((p) => p.slug === 'rewire')!;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const asWord = (n: number): string => { const w = WORDS[n] ?? String(n); return w[0].toUpperCase() + w.slice(1); };

/** "A", "A and B", "A, B and C" — reads right at any length, unlike a plain join. */
const listJoin = (items: string[]): string =>
  items.length <= 1 ? (items[0] ?? '') :
  items.length === 2 ? `${items[0]} and ${items[1]}` :
  `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/**
 * The products that appear on /apps/. Rewire is a service with its own page,
 * so it is not an app. Declared here rather than beside APPS_PAGE because the
 * home page's service blurb counts them too.
 */
export const APPS = PRODUCTS.filter((p) => p.slug !== 'rewire');

export interface Service {
  /** Ordinal label, e.g. "Service 01". */
  n: string;
  title: string;
  /** Where the title links; undefined renders a plain heading. */
  href?: string;
  blurb: string;
  accent: 'volt' | 'cyan' | 'ember' | 'flare';
}

export const HOME = {
  meta: {
    title: 'NeuroTrocity — simple software for the jobs that waste your time',
    description:
      'Almost everything that wastes your time has a simple software solution. NeuroTrocity builds websites and apps for people and businesses, and its own product line. Australia.',
    // Presentation: the Organization description in the home page's JSON-LD. Asserts no new fact.
    jsonLdDescription: 'Software studio building websites and apps.',
  },

  nav: {
    links: [
      { label: 'Rewire', href: rewire.path },
      { label: 'Apps', href: '/apps/' },
      { label: 'Products', href: '/products/' },
    ],
    cta: { label: 'Start a project', href: '#contact' },
  },

  // The hero is the pitch: the custom-build offer is what the studio sells.
  hero: {
    kicker: `Software studio · ${CONTACT.madeIn}`,
    // <em> wraps the second phrase.
    headline: { lead: 'Almost everything that wastes your time has a ', em: 'simple software solution', tail: '.' },
    lede:
      'The job that takes an hour and should take five minutes. The spreadsheet three people keep in sync by hand. The form you retype into another system. Most of it is a small app or a website away from being over — and building that is faster and cheaper than it has ever been.',
    // Both bodies are ENGAGEMENT verbatim: promises about our conduct, stated
    // once in facts.ts. The titles are framing and assert nothing.
    steps: [
      { title: 'First, a conversation.', body: ENGAGEMENT.conversation },
      { title: 'Then, a number.', body: ENGAGEMENT.quote },
    ],
    primary: { label: 'Start a project', href: '#contact' },
  },

  build: {
    eyebrow: '01 — Who we are',
    heading: 'Wired differently, on purpose.',
    // Rob's framing: the studio as the founder's AuDHD, pointed at work.
    sub: {
      a: 'NeuroTrocity is a living embodiment of its founder’s AuDHD. ',
      strong: 'It goes after an idea with explosive speed',
      b: ' — like fireworks, or a live wire — and then builds it properly. Here is where that energy goes.',
    },
    services: [
      {
        n: 'Service 01',
        title: 'Rewire',
        href: rewire.path,
        blurb: 'We rewire underperforming or outdated websites with modern design and modern code, using efficient, cost-effective methods. Contact us for a free consultation.',
        accent: 'ember',
      },
      {
        n: 'Service 02',
        title: 'Apps',
        href: '/apps/',
        blurb: 'Bespoke apps for phones, tablets and computers, built to suit your personal or professional needs. We have shipped a number of our own apps as proof of our work.',
        accent: 'cyan',
      },
      {
        n: 'Service 03',
        title: 'Products',
        href: '/products/',
        blurb: 'Our own product line — inspired by ADHD, our lives and experience, and the things we simply enjoyed building.',
        accent: 'flare',
      },
    ] satisfies Service[],
  },

  contact: {
    eyebrow: '02 — Start a project',
    heading: 'Tell us what is wasting your time.',
    lede: 'One line is enough to start. Describe the job, the spreadsheet or the website that is slowing you down, and we will come back with how we would fix it.',
    email: CONTACT.general,
  },

  footer: {
    // Verbatim from the live site's footer.
    tagline: 'Building software that respects the people who use it.',
    ventures: [
      ...PRODUCTS.map((p) => ({ label: productLabel(p), href: productHref(p) })),
      { label: '/products', href: '/products/' },
    ],
    email: CONTACT.general,
    legal: `© ${new Date().getFullYear()} NeuroTrocity · Made in ${CONTACT.madeIn}`,
  },
} as const;

/** How a demo's provenance reads on a card. 'fictional' is the only legal value. */
export const provenanceLabel = (p: Provenance): string =>
  ({ fictional: 'Demo model · Fictional brand' } as const)[p];

/**
 * Presentation strings for /rewire/landing/. Same rule as HOME: every fact is
 * interpolated from `facts.ts` (REWIRE, DEMOS, CONTACT, PRODUCTS). The framing
 * was rewritten in Oct 2026 to match the home page's plain service wording; the
 * stance is Rob's own words, verbatim. Nothing here asserts a new fact.
 */
export const REWIRE_PAGE = {
  meta: {
    title: 'Rewire — modern rebuilds for underperforming business websites',
    description:
      'Rewire rebuilds underperforming or outdated business websites with modern design and modern code, using efficient, cost-effective methods. Free consultation. NeuroTrocity, Australia.',
    canonical: 'https://neurotrocity.com/rewire/landing/',
    image: `https://neurotrocity.com/rewire/sample/assets/${DEMOS[0].slug}-tile.jpg`,
  },

  nav: {
    // Live back-link, verbatim. The short CTA label is REWIRE.steps[0].title.
    back: { label: '← NeuroTrocity', href: '/' },
    cta: { label: REWIRE.steps[0].title, href: REWIRE.contact.form },
  },

  hero: {
    kicker: `Rewire · Website rebuilds · ${CONTACT.madeIn}`,
    headline: { lead: "Your website isn't broken. It's just ", em: 'wired wrong.' },
    lede:
      'We rewire underperforming or outdated websites with modern design and modern code, using efficient, cost-effective methods. Clearer message, faster on a phone, and an actual path to becoming a customer.',
    primary: { label: 'Book a free consultation', href: REWIRE.contact.form },
    ghost: { label: 'Try a demo model', href: '#demos' },
  },

  fits: {
    eyebrow: 'Who this is for',
    heading: 'You already have a website. It just isn’t doing its job.',
    sub: 'Rewire is for businesses with a site that has fallen behind — not for building a brand-new one from nothing.',
    items: REWIRE.fits,
  },

  how: {
    eyebrow: 'How it works',
    heading: 'Four steps. No jargon, no lock-in.',
    sub: 'You know what is wrong, and what it costs to fix, before you commit to anything.',
    // 01–04 is legitimate here: the steps are a sequence.
    steps: REWIRE.steps.map((s, i) => ({ n: String(i + 1).padStart(2, '0'), ...s })),
  },

  demos: {
    eyebrow: 'Demo models',                                                    // live, verbatim
    heading: 'Test drive a demo model.',
    // Rob's own words, verbatim; split only to colour the em span.
    stance: {
      lead: 'We choose not to use our clients and their websites to advertise ourselves. We believe the right approach is to showcase our capability through ',
      em: 'demo websites you can test-drive',
      tail: ", without leaning on our client's brands.",
    },
    note: 'Open one, click everything, try to break it.',
    deck: {
      ariaLabel: 'Demo models',
      hint: 'Tap or click to try it here',
      open: 'Open the demo',                                                   // live, verbatim ("Open the demo →")
      keys: 'Drag, scroll sideways, or use the arrow keys. Enter tries the demo here, Enter again opens it full-page.',
    },
    all: { label: 'See all demo models', href: '/rewire/sample/' },            // live, verbatim
  },

  review: {
    eyebrow: 'Get in touch',
    heading: 'Want to know what’s holding your site back?',
    sub: 'Start with a free consultation. No charge, no obligation.',
    cta: { label: 'Book a free consultation', href: REWIRE.contact.form },
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
 * Presentation strings for /apps/. Same rule as HOME and REWIRE_PAGE: every
 * fact — app names, paths, descriptions, platforms, the four rules, the email
 * — is interpolated from `facts.ts`. Nothing here asserts a new fact: no
 * download counts, no reviews, no roadmap. An unreleased app appears only as
 * a tile labelled "Coming soon", and is left out of "the apps we ship".
 */
export const APPS_PAGE = {
  meta: {
    title: 'Apps — NeuroTrocity',
    description: `App design and software engineering for smart devices and the web. The apps we ship: ${listJoin(APPS.filter(isReleased).map((a) => a.name))}.`,
    canonical: 'https://neurotrocity.com/apps/',
  },

  nav: {
    back: { label: '← NeuroTrocity', href: '/' },
    links: [
      { label: 'The apps', href: '#apps' },
    ],
    cta: { label: 'Start a project', href: '#contact' },
  },

  // A plain banner: what this page is, what we do, and how to start. The apps
  // themselves are the section below, so the banner does not list them.
  hero: {
    kicker: `Apps · ${CONTACT.madeIn}`,
    headline: { lead: 'Bespoke apps, built around ', em: 'how you work.' },
    sub: 'Apps for phones, tablets and computers, built to suit your personal or professional needs.',
    lede: {
      a: 'If something you do every day takes longer than it should, there is usually a simple app that fixes it. ',
      strong: 'We have shipped a number of our own',
      b: ' — they are below, as proof of the work.',
    },
    primary: { label: 'Start a project', href: '#contact' },
    ghost: { label: 'See what we ship', href: '#apps' },
  },

  apps: {
    eyebrow: '01 — The proof',
    // No sub-heading: the stance is the only thing between the label and the
    // tiles, because it is the point of the section.
    stance: {
      lead: 'These are the ones we can show you. ',
      em: 'They are not everything we have built.',
      note: 'Most of what we build belongs to the people who paid for it, and it stays theirs. These are ours, so we can hand them straight over.',
    },
    // PRODUCTS supplies every value on a tile; art is presentation, and each
    // piece is the app's own existing artwork rather than anything invented.
    items: APPS,
    art: {
      dosetrack: {
        src: '/assets/img/apps/dosetrack-milli.webp',
        alt: 'Milli, the DoseTrack character, in the app’s anime artwork',
        fit: 'cover',
      },
      dispoint: {
        src: '/assets/img/apps/dispoint-stack.webp',
        alt: 'The DisPoint board: a final-call alert and offers ordered by what expires first',
        fit: 'cover',
      },
      wallestate: {
        src: '/assets/img/apps/wallestate-sheets.webp',
        alt: 'A finished Wall Estate calendar — a listing photo, the agent’s details and a two-year month grid — with more sheets fanned behind it',
        fit: 'cover',
      },
      beeptest: {
        src: '/assets/img/apps/beeptest-skull.webp',
        alt: 'The Before the Beep skull, drawn in thick black ink: cracked, sweating, tongue out',
        fit: 'cover',
      },
    } as Record<string, { src: string; alt: string; fit: 'contain' | 'cover' }>,
    open: 'Open the page',
  },

  contact: {
    eyebrow: '02 — Start a project',
    heading: 'Have a job an app could fix?',
    sub: 'Tell us what it is in a line or two. The first conversation is free, and the quote is fixed before any work starts.',
    email: CONTACT.general,
  },

  footer: {
    tagline: 'Building software that respects the people who use it.',
    links: [
      ...APPS.map((a) => ({ label: a.name, href: productHref(a) })),
      { label: 'NeuroTrocity', href: '/' },
    ],
    email: CONTACT.general,
    legal: `© ${new Date().getFullYear()} NeuroTrocity · Made in ${CONTACT.madeIn}`,
  },
} as const;

/**
 * Presentation strings for /products/. Same rule as the rest of this file:
 * titles, hooks and links come from BOOKS in facts.ts. A coming-soon book is
 * never counted as available and never linked.
 */
export const PRODUCTS_PAGE = {
  meta: {
    title: 'Products — NeuroTrocity',
    description: `NeuroTrocity's own product line, inspired by ADHD, our lives and experience. First up, swear-word colouring books for adults: ${listJoin(BOOKS.filter(isLive).map((b) => b.title))}, on Amazon.`,
    canonical: 'https://neurotrocity.com/products/',
  },

  nav: {
    back: { label: '← NeuroTrocity', href: '/' },
    links: [{ label: 'Colouring books', href: '#books' }],
    cta: { label: 'Say hello', href: '#contact' },
  },

  hero: {
    kicker: `Products · ${CONTACT.madeIn}`,
    headline: { lead: 'The ', em: 'Products.' },
    sub: 'Our own product line.',
    lede: {
      a: 'Inspired by ADHD, our lives and experience, and the things we simply enjoyed building. ',
      strong: 'First up: swear-word colouring books',
      b: ', one profession at a time, on Amazon now.',
    },
    primary: { label: 'Shop on Amazon', href: STORE_URL },
    ghost: { label: 'See the books', href: '#books' },
  },

  books: {
    eyebrow: '01 — Colouring books',
    heading: 'One profession at a time.',
    note: 'Swear-word colouring books for adults. Printed single-sided, so your pens can’t bleed through.',
    items: BOOKS,
    buy: 'Buy on Amazon',
    soon: 'Coming soon',
  },

  contact: {
    eyebrow: '02 — Say hello',
    heading: 'Want one for your profession?',
    sub: 'Tell us your trade. The next book might be yours.',
    email: CONTACT.general,
  },

  footer: {
    tagline: 'Building software that respects the people who use it.',
    links: [
      { label: 'Books on Amazon', href: STORE_URL },
      { label: 'Apps', href: '/apps/' },
      { label: 'NeuroTrocity', href: '/' },
    ],
    email: CONTACT.general,
    legal: `© ${new Date().getFullYear()} NeuroTrocity · Made in ${CONTACT.madeIn}`,
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

  watch: {
    eyebrow: 'Watch it work',
    heading: 'The whole thing, start to finish.',
    sub: 'Install, a real site torn down and rebuilt, and the five points where it stops and asks you something. No face, no intro music \u2014 screen and voice, narrating the decisions rather than the keystrokes.',
    caption: 'If you would rather read than watch, everything it covers is written out below.',
  },

  free: {
    eyebrow: 'Start free',
    heading: 'Try the pipeline before you pay for the craft layer.',
    sub: 'The free edition installs the same way and runs the same trigger, on a cut-down pipeline that builds a single static page. It is genuinely useful on its own, and it is the honest way to find out whether this fits how you work.',
    points: [
      'One skill, three design skills, two reference repos.',
      'Same install: unzip, type install, type clone, restart.',
      'Builds a clean static page and deploys it to a live URL.',
    ],
    cta: { label: 'Get the free edition' },
    note: 'Email required, because that is how you get the updated versions. No payment details, and it stays free.',
    compare: 'What it will not do is the scroll-driven, 3D work in the demos \u2014 none of those skills contain a scroll-stage architecture or a motion vocabulary with numbers in it. That is the paid pack, and the difference is visible in about ten seconds.',
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
