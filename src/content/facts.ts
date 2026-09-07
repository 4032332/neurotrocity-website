/** Confirmed by Rob 2026-09-03: every Rewire demo brand is fictional. 'de-identified'
 *  is deliberately NOT a legal value — it would imply a real client behind the demo. */
export type Provenance = 'fictional';

export interface Product {
  slug: 'dosetrack' | 'dispoint' | 'rewire';
  name: string;          // display name, verbatim from the live site's footer / venture rows
  path: string;
  description: string;   // verbatim from the current live site
  platforms: string;
  accent: 'volt' | 'ember' | 'cyan';
}

export interface DemoModel {
  slug: string;
  name: string;
  description: string;
  provenance: Provenance;
  href: string;
}

export interface Rule { title: string; body: string; }

export const PRODUCTS: Product[] = [
  { slug: 'dosetrack', name: 'DoseTrack', path: '/dosetrack/landing/', accent: 'volt', platforms: 'iPhone · Watch',
    description: 'Medication reminders that actually stick — free for your first five meds, forever.' },
  { slug: 'dispoint', name: 'DisPoint', path: '/dispoint/landing/', accent: 'ember', platforms: 'iPhone · AU',
    description: "Deals and bonus-points offers, sorted by what's about to expire." },
  { slug: 'rewire', name: 'Rewire', path: '/rewire/landing/', accent: 'cyan', platforms: 'Web · AU',
    description: 'Underperforming business websites, rebuilt so they actually work.' },
];

export const DEMOS: DemoModel[] = [
  { slug: 'vernier',  name: 'Vernier',          provenance: 'fictional'    , href: '/rewire/sample/vernier/',
    description: 'A mechanical movement rendered live in your browser. Wind it, scroll it apart into a hundred and forty pieces, and watch the escapement run in real time.' },
  { slug: 'apex',     name: 'Apex Motor Club',  provenance: 'fictional'    , href: '/rewire/sample/apex/',
    description: 'Supercar driving tours on the Great Ocean Road. Scroll-driven route map, an eight-car fleet browser, and a booking builder that prices a trip live.' },
  { slug: 'northbay', name: 'Northbay Physio',  provenance: 'fictional'    , href: '/rewire/sample/northbay/',
    description: 'A single-practitioner clinic. Interactive body map, a scroll-through of the appointment hour, and a four-step booking flow.' },
  { slug: 'forge',    name: 'Forge Athletic',   provenance: 'fictional'    , href: '/rewire/sample/forge/',
    description: 'A coached strength gym. The timetable is the homepage, and a 3D barbell loads itself as you scroll.' },
  { slug: 'lumen',    name: 'Lumen & Larch',    provenance: 'fictional'    , href: '/rewire/sample/lumen/',
    description: 'Modular shelving. It draws itself, assembles itself as you scroll, then lets you configure and price your own in 3D.' },
  { slug: 'vale',     name: 'Vale & Vine',      provenance: 'fictional',     href: '/rewire/sample/vale/',
    description: 'A vineyard wedding venue. Scroll the whole year and the light, the season and the price move with it.' },
];

export const RULES: Rule[] = [
  { title: 'Sharp, not sprawling.', body: 'One thing, done properly. No feature bloat, no roadmap theatre, no app that grows until it’s miserable to use.' },
  { title: 'Honest by default.',    body: 'No manipulative nudges, no engineered regret. If a choice is good for us and bad for you, we don’t ship it.' },
  { title: 'Your data stays yours.', body: 'On your device wherever it can be, synced privately through your own iCloud. Never sold. Ever.' },
  { title: 'Answered by a person.', body: 'You email us, a person reads it and replies — no ticket queue, no bot, no runaround.' },
];

export const CONTACT = {
  general: 'hello@neurotrocity.com',
  rewire: 'rewire@neurotrocity.com',
  madeIn: 'Australia',
} as const;

/** The Rewire process claims, verbatim from the live /rewire/landing/ page
 *  ("Who this is for" and "How it works"). Presentation copy may frame these
 *  but must not add steps, promises or numbers beyond them. */
export interface Fit  { title: string; body: string; }
export interface Step { title: string; body: string; }

export const REWIRE = {
  fits: [
    { title: 'It looks dated',
      body: 'Built years ago, never touched since. Customers notice before they even read a word.' },
    { title: "It's slow or broken on mobile",
      body: "Most of your visitors are on a phone. If it's clunky there, they leave before they see what you offer." },
    { title: 'People land on it and leave',
      body: "Traffic shows up, nobody calls, books, or buys. The message isn't landing." },
    { title: "You don't know what to fix",
      body: "You know something's wrong. You just don't know what — that's what the free review is for." },
  ] as Fit[],
  steps: [
    { title: 'Free review',
      body: "We look at your current site and tell you, in plain language, what's actually costing you customers." },
    { title: 'A plan, priced upfront',
      body: 'You get a clear scope and a fixed quote before any work starts — no surprises, no hourly guessing games.' },
    { title: 'Rebuild',
      body: 'We design and build the new site — faster, clearer, and built around what your customers actually need to see.' },
    { title: 'Handover, not lock-in',
      body: "The site is yours. You're never stuck paying us just to keep it online." },
  ] as Step[],
  contact: { form: '/rewire/contact/', email: CONTACT.rewire },
} as const;

/* ── ReWire skill pack ────────────────────────────────────────────────────
 * The paid digital product sold through Gumroad, distinct from the Rewire
 * done-for-you service above.
 *
 * Everything here is a checkable fact about what ships. No outcome claims, no
 * earnings figures, no testimonials — there are no buyers yet, and inventing
 * proof would contradict RULES[1] ("Honest by default"). The craft details are
 * quoted from the pack's own `taste` skill and are verifiable in the sample
 * builds under /rewire/sample/.
 */
export interface PackItem { title: string; body: string; }

export const SKILL_PACK = {
  name: 'ReWire',
  /** One-off, AUD, inclusive of tax — Gumroad is merchant of record and
   *  handles GST/VAT. Single price, no anchor and no countdown: an inflated
   *  "was" price is exactly the engineered regret RULES[1] rules out. */
  price: { amount: 129, currency: 'AUD', note: 'one-off · includes every future update' },
  checkout: 'https://neurotrocity.gumroad.com/l/rewire',

  /** Stated plainly and early. Filtering unqualified buyers is deliberate:
   *  a refund from someone who could never have run it costs more than the sale. */
  prerequisites: [
    'A Claude Code subscription',
    "A terminal you're comfortable in",
    'Enough HTML and CSS to read an error message',
  ],
  notFor: [
    { title: "You want a website, not a workflow",
      body: 'If you need a site built rather than the means to build one, the done-for-you service is the better buy — and cheaper than learning this to do it once.' },
    { title: 'You have never opened a terminal',
      body: "This is not a no-code product and it does not pretend to be. You'll be running commands and reading errors on day one." },
    { title: 'You want it to work without you',
      body: 'The pack raises the ceiling on what you can build. It does not remove the judgement — deciding what looks right is still your job.' },
  ] as PackItem[],

  /** What is in the zip. Each maps to a real file or folder in the payload. */
  contents: [
    { title: 'The taste layer',
      body: 'The craft skill — the actual numbers behind the sample builds. Type roles, the easing vocabulary, scroll-stage architecture, adaptive 3D quality tiering and the mobile WebGL policy, each with the reasoning and the evidence attached.' },
    { title: 'hydra — adversarial review',
      body: 'Fans out independent reviewers in fresh contexts, then merges what they find. Runs automatically before the flagship gate. Works on any Claude Code project, not just websites.' },
    { title: 'The eight-phase pipeline',
      body: 'harvest · analyse · angles · brief · build, plus the rewire orchestrator that runs them and stops at five gates for your input. Every phase is usable on its own.' },
    { title: 'A working starter',
      body: 'A scroll stage you can serve and scroll immediately: CSS-pinned rather than GSAP-pinned, scrub-driven, with frame-time tiering and a static fallback. The shortest path from the pack to something that looks like the samples.' },
    { title: 'Vendored runtimes',
      body: 'GSAP, ScrollTrigger, Three.js and Lenis as minified files, with licences. No build step and no framework — this is genuinely all the sample builds use.' },
    { title: 'Spec template and prompt library',
      body: 'The build spec with its acceptance checklist, and a copy-paste prompt library grouped by what you are trying to fix.' },
  ] as PackItem[],

  /** Why this is not a video course. The central positioning decision. */
  form: 'A versioned zip, not a video course. Updates ship through Gumroad and past buyers re-download.',
} as const;
