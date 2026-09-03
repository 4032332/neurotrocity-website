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
