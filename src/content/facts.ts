/** Confirmed by Rob 2026-09-03: every Rewire demo brand is fictional. 'de-identified'
 *  is deliberately NOT a legal value — it would imply a real client behind the demo. */
export type Provenance = 'fictional';

export interface Product {
  slug: 'dosetrack' | 'dispoint' | 'rewire';
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
  { slug: 'dosetrack', path: '/dosetrack/landing/', accent: 'volt', platforms: 'iPhone · Watch',
    description: 'Medication reminders that actually stick — free for your first five meds, forever.' },
  { slug: 'dispoint', path: '/dispoint/landing/', accent: 'ember', platforms: 'iPhone · AU',
    description: "Deals and bonus-points offers, sorted by what's about to expire." },
  { slug: 'rewire', path: '/rewire/landing/', accent: 'cyan', platforms: 'Web · AU',
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
