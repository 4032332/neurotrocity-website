# Provenance map — the reimagined home and Rewire pages

Every string, asset, and structured-data claim on `/` and `/rewire/landing/`, traced to its
source. This is the audit trail for Principle #1 of this engagement: **nothing on the site may
present an invented fact about the business.**

Zero rows below read "invented fact." If a string could not be sourced, it is listed here first.

## ⚠️ Unsourced

None. Every string in `src/content/copy.ts` traces to `src/content/facts.ts`, a verbatim
carry-over from the pre-rebuild live pages (commit `1b6fbb6`, paths `index.html` and
`rewire/landing/index.html`), or Rob's direct 2026-09-03 confirmation. Every visual is either an
abstract, non-representational WebGL/OG generation or a screenshot of NeuroTrocity's own
fictional-brand demo model.

## How to read this table

- **Kind** — `fact` (a factual claim, sourced to `facts.ts`), `verbatim live copy` (unchanged
  wording carried over from the pre-rebuild site), `presentation copy` (new framing/wording that
  asserts no new fact), `abstract brand visual` (generated, non-representational graphic — no
  claim of any kind), `own-asset` (a font, icon, or screenshot of NeuroTrocity's own work).
- **Source** — the exact `facts.ts` export/field, the live-site file and location it was copied
  from, `Rob 2026-09-03` for facts confirmed directly by the business owner, or
  `generated — abstract` for WebGL/OG visuals.

---

## `src/content/facts.ts` — the sole legal fact source

| Surface | Item | Kind | Source | Notes |
|---|---|---|---|---|
| facts.ts | `Provenance` type (`'fictional'` only) | fact | Rob 2026-09-03 | Deliberately excludes `'de-identified'` — the live site's use of that label for five demos was a defect this plan corrects (see Assertions below). |
| facts.ts | `PRODUCTS[dosetrack].description` — "Medication reminders that actually stick — free for your first five meds, forever." | fact | Rob 2026-09-03 (confirmed accurate); wording carried from live `/dosetrack/landing/` | "First five meds forever" claim explicitly confirmed true by Rob before reuse. |
| facts.ts | `PRODUCTS[dosetrack].path`, `.platforms` ("iPhone · Watch"), `.accent` | fact | Live site routing / App Store listing | Paths match existing static pages under `public/dosetrack/`. |
| facts.ts | `PRODUCTS[dispoint].description` — "Deals and bonus-points offers, sorted by what's about to expire." | fact | Live `/dispoint/landing/`, verbatim | |
| facts.ts | `PRODUCTS[dispoint].path`, `.platforms` ("iPhone · AU"), `.accent` | fact | Live site routing | |
| facts.ts | `PRODUCTS[rewire].description` — "Underperforming business websites, rebuilt so they actually work." | fact | Live `/rewire/landing/`, verbatim | |
| facts.ts | `PRODUCTS[rewire].path`, `.platforms` ("Web · AU"), `.accent` | fact | Live site routing | |
| facts.ts | `DEMOS[0]` Vernier — name, description | fact | Rob 2026-09-03 | Fictional brand; description is a factual account of what the demo model actually does (mechanical movement, 140-piece explode, live escapement). |
| facts.ts | `DEMOS[1]` Apex Motor Club — name, description | fact | Rob 2026-09-03 | Fictional brand; description matches the demo's actual features (route map, 8-car fleet browser, live-pricing booking builder). |
| facts.ts | `DEMOS[2]` Northbay Physio — name, description | fact | Rob 2026-09-03 | Fictional brand; description matches the demo's actual features (body map, appointment scroll-through, 4-step booking). |
| facts.ts | `DEMOS[3]` Forge Athletic — name, description | fact | Rob 2026-09-03 | Fictional brand; description matches the demo's actual features (timetable homepage, scroll-loaded 3D barbell). |
| facts.ts | `DEMOS[4]` Lumen & Larch — name, description | fact | Rob 2026-09-03 | Fictional brand; description matches the demo's actual features (self-drawing/self-assembling shelving, 3D configurator). |
| facts.ts | `DEMOS[5]` Vale & Vine — name, description | fact | Rob 2026-09-03 — **resolved 2026-09-03**, previously an open question | Fictional brand; description matches the demo's actual features (year-scroll venue site with light/season/price tied to scroll position). |
| facts.ts | Each `DemoModel.provenance: 'fictional'` | fact | Rob 2026-09-03 | Same value for all six — confirmed no real client underlies any demo. |
| facts.ts | `RULES[0]` "Sharp, not sprawling." + body | fact/verbatim live copy | Live `/` "How we work" section, verbatim | |
| facts.ts | `RULES[1]` "Honest by default." + body | fact/verbatim live copy | Live `/` "How we work" section, verbatim | |
| facts.ts | `RULES[2]` "Your data stays yours." + body | fact/verbatim live copy | Live `/` "How we work" section, verbatim | |
| facts.ts | `RULES[3]` "Answered by a person." + body | fact/verbatim live copy | Live `/` "How we work" section, verbatim | |
| facts.ts | `CONTACT.general` — hello@neurotrocity.com | fact | Live site footer/contact mailto, verbatim | |
| facts.ts | `CONTACT.rewire` — rewire@neurotrocity.com | fact | Live `/rewire/landing/` contact mailto, verbatim | |
| facts.ts | `CONTACT.madeIn` — "Australia" | fact | Rob 2026-09-03 | The only team/location claim on either page. |
| facts.ts | `REWIRE.fits[0..3]` (title + body ×4) | verbatim live copy | Live `/rewire/landing/` "Who this is for" section, verbatim | |
| facts.ts | `REWIRE.steps[0..3]` (title + body ×4) | verbatim live copy | Live `/rewire/landing/` "How it works" section, verbatim | Step count (4) asserted in `tests/unit/facts.test.ts`. |
| facts.ts | `REWIRE.contact.form` — `/rewire/contact/`, `.email` | fact | Live site routing | |

---

## `src/content/copy.ts` — `HOME`

| Surface | Item | Kind | Source | Notes |
|---|---|---|---|---|
| Home / meta | `title` — "NeuroTrocity — focused, honest software" | verbatim live copy | Live `index.html` `<title>`, verbatim (SEO parity constraint) | |
| Home / meta | `description` | verbatim live copy | Live `index.html` meta description, verbatim | |
| Home / nav | Nav links (What we build / Proof / How we work) | presentation copy | New — section labels for sections built from `facts.ts` content | Anchors, not claims. |
| Home / nav | CTA "Start a project" → `#contact` | presentation copy | New wording, no fact asserted | |
| Home / hero | Kicker — `Software studio · ${CONTACT.madeIn}` | fact (interpolated) | `CONTACT.madeIn` | |
| Home / hero | Headline "A brain that wires up *honest software*." | verbatim live copy | Live `index.html` hero `<h1>`, verbatim | |
| Home / hero | Lede — "Every idea fires at once…" | presentation copy | New framing; asserts no fact beyond the studio's own process description | |
| Home / hero | Primary/ghost CTA labels | presentation copy | New, no fact asserted | |
| Home / build | Eyebrow "01 — What we build", heading "Three things, done properly." | presentation copy | New | |
| Home / build | Sub — "No discovery theatre…a person who answers the email." | presentation copy / fact | Restates `RULES[3]` ("Answered by a person") in different words | No new fact — same claim as `RULES[3]`. |
| Home / build | Service 01 "Websites that move" — blurb | presentation copy | New; self-referential claim about this page's own construction (verifiable by the reader on the page itself) | |
| Home / build | Service 02 "iOS & web apps" — blurb, incl. platforms and rule references | fact (interpolated) | Platform words derived from `PRODUCTS[].platforms`; rule phrases derived from `RULES[2]`, `RULES[3]` via `.title` | Code enforces derivation — see `dataRule`/`personRule` consts and `.replace()` calls in `copy.ts`. |
| Home / build | Service 03 "Rewire" — blurb, incl. demo count "Six working demo models" | fact (interpolated) | `PRODUCTS[rewire].description` (first sentence, verbatim) + `DEMOS.length` via `asWord()` | Demo count is computed from the live `DEMOS` array length, not hand-typed — cannot drift out of sync. |
| Home / proof | Eyebrow "02 — Proof", heading "We don't show you pictures…" | presentation copy | New | |
| Home / proof | Sub — "Everything below is real and running…" | presentation copy | New | |
| Home / proof | Venture rows (dosetrack/dispoint/rewire slug, description, platforms) | fact (interpolated) | `PRODUCTS[]` via `VentureRow.astro` | See `src/components/VentureRow.astro`. |
| Home / proof | Stance — "We don't use our clients' brands to advertise ourselves…" | presentation copy | Rob's own words, 2026-09-03 | Explicitly contains "clients" per test assertion; states a policy stance, not a client claim — no client is named or implied to exist. |
| Home / proof | Stance note — "Their traffic, their numbers and the fact they needed a rebuild…So we build fictional demo models instead…" | presentation copy | Rob's own words, 2026-09-03 | Directly asserts the fictional-demo policy that `facts.ts` `Provenance` type enforces in code. |
| Home / rules | Eyebrow "03 — How we work", heading "Four rules. No exceptions." | verbatim live copy | Live `index.html` "How we work" heading, verbatim | `RULES.length === 4` asserted in `tests/unit/facts.test.ts`. |
| Home / rules | Four rule list items | fact | `RULES[]`, verbatim | Rendered directly from `facts.ts`, not retyped. |
| Home / contact | Eyebrow "04 — Say hello", heading | presentation copy | New | |
| Home / contact | Sub — "A person reads every message and replies. No ticket queue, no bot." | verbatim live copy | Live `index.html` contact section, verbatim; restates `RULES[3]` | |
| Home / contact | Email link | fact (interpolated) | `CONTACT.general` | |
| Home / footer | Tagline — "Building software that respects the people who use it." | verbatim live copy | Live `index.html` footer, verbatim | |
| Home / footer | Venture links | fact (interpolated) | `PRODUCTS[].slug`, `.path` | |
| Home / footer | Email | fact (interpolated) | `CONTACT.general` | |
| Home / footer | Legal line — "© {year} NeuroTrocity · Made in Australia" | fact (interpolated) | `CONTACT.madeIn`; year computed via `new Date().getFullYear()` | |
| `provenanceLabel()` | "Demo model · Fictional brand" | fact | `Provenance = 'fictional'` is the only legal input; function has no other branch | Enforced in code — cannot render any other provenance string. |

---

## `src/content/copy.ts` — `REWIRE_PAGE`

| Surface | Item | Kind | Source | Notes |
|---|---|---|---|---|
| Rewire / meta | `title` — "Rewire — website design for businesses that deserve better traffic" | verbatim live copy | Live `rewire/landing/index.html` `<title>`, verbatim (SEO parity) | |
| Rewire / meta | `description` | verbatim live copy | Live `rewire/landing/index.html` meta description, verbatim | |
| Rewire / meta | `canonical` | fact | Live site URL structure | |
| Rewire / meta | `image` — `/rewire/sample/assets/${DEMOS[0].slug}-tile.jpg` | fact (interpolated) | `DEMOS[0].slug` ("vernier") | Points at an own-asset screenshot, not a stock/AI image. |
| Rewire / nav | Back link "← NeuroTrocity" → `/` | verbatim live copy | Live page, verbatim | |
| Rewire / nav | CTA label | fact (interpolated) | `REWIRE.steps[0].title` ("Free review") | |
| Rewire / hero | Kicker "Rewire · Website design for real businesses" | verbatim live copy | Live page, verbatim | |
| Rewire / hero | Headline "Your website isn't broken. It's just *wired wrong.*" | verbatim live copy | Live page, verbatim | |
| Rewire / hero | Lede — "We take small and medium business websites…" | verbatim live copy | Live page, verbatim | |
| Rewire / hero | Primary CTA "Get a free site review" | verbatim live copy | Live page, verbatim | |
| Rewire / hero | Ghost CTA "Try a demo model" → `#demos` | presentation copy | New anchor label, no fact asserted | |
| Rewire / fits | Eyebrow, heading, sub | verbatim live copy | Live page "Who this is for" section, verbatim | |
| Rewire / fits | Four fit items | verbatim live copy | `REWIRE.fits[]`, verbatim from live page | |
| Rewire / how | Eyebrow, heading, sub | verbatim live copy | Live page "How it works" section, verbatim | Step count (4) asserted in `tests/unit/facts.test.ts`. |
| Rewire / how | Four numbered steps (01–04) | fact | `REWIRE.steps[]`, verbatim; ordinal numbering (01-04) is a legitimate sequence label, not a fabricated stat | |
| Rewire / demos | Eyebrow "Demo models", heading "Test drive a demo model." | verbatim live copy | Live page, verbatim | |
| Rewire / demos | Stance — "We choose not to use our clients and their websites to advertise ourselves…demo websites you can test-drive…" | presentation copy | Rob's own words, verbatim | |
| Rewire / demos | Note "Open one, click everything, try to break it." | verbatim live copy | Live page, verbatim | |
| Rewire / demos | Deck UI strings (aria label, hint, "Open the demo", keyboard hint) | presentation copy / verbatim live copy | "Open the demo" is live-verbatim; hint/aria/keys strings are new UI copy describing the interaction, no fact asserted | |
| Rewire / demos | "See all demo models" → `/rewire/sample/` | verbatim live copy | Live page, verbatim | |
| Rewire / review | Eyebrow, heading, sub, CTA | verbatim live copy | Live page "Get in touch" section, verbatim | |
| Rewire / footer | Tagline | fact (interpolated) | `PRODUCTS[rewire].description`, verbatim | |
| Rewire / footer | Links, email, legal line | fact (interpolated) | `REWIRE.contact`, `CONTACT.madeIn` | |

---

## Structured data (JSON-LD)

| Surface | Item | Kind | Source | Notes |
|---|---|---|---|---|
| `src/pages/index.astro` | `Organization` JSON-LD — `name`, `url`, `email`, `address.addressCountry: "AU"` | fact | `CONTACT.general`, `CONTACT.madeIn` (interpolated); `name`/`url` are the site's own identity | No metrics, ratings, or `aggregateRating` fields present. |
| `src/pages/index.astro` | `Organization.makesOffer[]` — one `Offer`/`SoftwareApplication` per product | fact (interpolated) | `PRODUCTS[].slug`, `.path` | No price, review count, or rating fields — deliberately omitted since none are real. |
| `src/pages/index.astro` | `description` — "Software studio building websites and iOS apps." | presentation copy | New, factual summary of the business, no metric | |
| `src/pages/rewire/landing.astro` | `Service` JSON-LD — `name: "Rewire"`, `serviceType`, `provider`, `areaServed: "Australia"`, `url` | fact | `CONTACT.madeIn`-equivalent country; provider/name/url are the site's own identity | No `aggregateRating`, `review`, or `offers` fields — none exist to report. |

---

## Generated images (`src/pages/og/[page].png.ts`)

| Surface | Item | Kind | Source | Notes |
|---|---|---|---|---|
| `/og/home.png` | OG card — title/eyebrow text | fact (interpolated) | `HOME.meta.title`, `HOME.hero.kicker` | Text layer only pulls from already-sourced `copy.ts` fields. |
| `/og/home.png` | Backdrop — radial gradients + diagonal sweep | abstract brand visual | generated — abstract | Pure CSS-gradient composition via Satori; no photography, no depicted product, no fabricated screenshot. |
| `/og/rewire.png` | OG card — title/eyebrow text | fact (interpolated) | `REWIRE_PAGE.meta.title`, `REWIRE_PAGE.hero.kicker` | |
| `/og/rewire.png` | Backdrop — radial gradients + diagonal sweep (jade accent) | abstract brand visual | generated — abstract | Same technique as home card, different accent colour. |
| Both cards | "Neuro" / "Trocity" wordmark | fact | Site's own name/wordmark | |

---

## Demo model posters (`public/rewire/sample/assets/*-tile.jpg`)

| Surface | Item | Kind | Source | Notes |
|---|---|---|---|---|
| Rewire deck | `vernier-tile.jpg` | own-asset | Screenshot of NeuroTrocity's own `vernier` demo model, built and hosted at `/rewire/sample/vernier/` | Depicts a fictional brand's demo, but the demo itself and its engineering are NeuroTrocity's real, running work. |
| Rewire deck | `apex-tile.jpg` | own-asset | Screenshot of NeuroTrocity's own `apex` demo model, `/rewire/sample/apex/` | |
| Rewire deck | `northbay-tile.jpg` | own-asset | Screenshot of NeuroTrocity's own `northbay` demo model, `/rewire/sample/northbay/` | |
| Rewire deck | `forge-tile.jpg` | own-asset | Screenshot of NeuroTrocity's own `forge` demo model, `/rewire/sample/forge/` | |
| Rewire deck | `lumen-tile.jpg` | own-asset | Screenshot of NeuroTrocity's own `lumen` demo model, `/rewire/sample/lumen/` | |
| Rewire deck | `vale-tile.jpg` | own-asset | Screenshot of NeuroTrocity's own `vale` demo model, `/rewire/sample/vale/` | |

---

## WebGL cortex field and spine navigation

| Surface | Item | Kind | Source | Notes |
|---|---|---|---|---|
| Both pages, full-page background | Cortex field (`src/motion/cortex/field.glsl.ts`, `scene.ts`, `index.ts`) — neuron point cloud, causal pulse simulation, content-aware attenuation | abstract brand visual | generated — abstract | Procedurally generated geometry and shader; does not depict any real product, person, dataset, or measurement. Device-tiered (`Tier`/`TIER_BUDGET`) for performance, not for content. |
| Both pages, section markers | Dendrite spine navigation (soma flare on section change, driven by `PulseState`/`Arrival`) | abstract brand visual | generated — abstract | Purely a navigational/motion affordance keyed to scroll position and section id (`data-soma` attributes); asserts nothing about the business. |

---

## Fonts and icons (`public/assets/`)

| Surface | Item | Kind | Source | Notes |
|---|---|---|---|---|
| Sitewide | Bricolage Grotesque, Manrope (Regular/Medium/Bold/ExtraBold), IBM Plex Mono (Regular/Medium) — `.woff2`/`.ttf` | own-asset | Licensed/open-source typefaces already in use on the pre-rebuild live site (`public/assets/fonts/`) | Carried forward unchanged; the OG generator (`og/[page].png.ts`) reuses the same `.ttf` files. |
| Sitewide | Favicons, apple-touch-icon, `icon-192`/`icon-512`, `nova-mark`, `signature-mark` | own-asset | NeuroTrocity's own existing brand marks, carried from `public/assets/img/` unchanged | Pre-existing site assets, not new claims. |

---

## Assertions this map guarantees

- **Zero testimonials.** No quote, review, or third-party endorsement appears anywhere on `/` or `/rewire/landing/`.
- **Zero client names.** All six Rewire demo brands (Vernier, Apex Motor Club, Northbay Physio, Forge Athletic, Lumen & Larch, Vale & Vine) are fictional, per `Provenance = 'fictional'` in `facts.ts` — the type system has no other legal value. The live site's five `De-identified` labels were a defect; this rebuild corrects it by removing the implication of a real client behind any demo.
- **Zero metrics or statistics.** No conversion rate, traffic number, revenue figure, client count, uptime, load-time benchmark, or any other number is asserted about NeuroTrocity or its clients anywhere on either page or in either JSON-LD payload.
- **Zero awards.** No award, certification, ranking, or press mention is claimed.
- **Zero team or location claims beyond `Australia`.** `CONTACT.madeIn = 'Australia'` is the only geography/team-size claim on either page; no headcount, office address, or individual bio beyond what already exists on the site's separate `/contact/rob/` and `/contact/jaimi/` pages (out of scope for this rebuild, untouched).
- **All six demo brands fictional.** Confirmed directly in this table and enforced in code via the `Provenance` type.
- **DoseTrack "free for your first five meds, forever" claim confirmed true.** Directly confirmed by Rob 2026-09-03 before reuse in `PRODUCTS[dosetrack].description`.
