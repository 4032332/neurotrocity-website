# Home page restructure — design

Date: 2026-09-20
Status: approved, ready for planning
Scope: `/` only. The Wall Estate apps tile is a separate spec.

## Why

The home page currently argues for the studio in five blocks: hero, *What we
build*, *Proof* (a list of individual ventures), *How we work* (four rules), and
a narrow *Say hello* pane.

Two of those blocks are being removed:

- **Proof** lists the individual ventures. That is what `/apps/` is for, and
  duplicating it on the home page splits the same argument across two pages.
- **How we work** states four rules. It is being cut outright.

The contact block absorbs the space they leave. It stops being a greeting and
becomes the page's conversion section: what we can build, why now, and exactly
what happens if you email.

Resulting page: **hero → What we build → Start a project.**

`RULES` itself stays in `facts.ts`. The apps page contact line and the Rewire
page both read from it. Only the home page's *section* is removed.

## Content model

### `facts.ts` — one addition

How we trade is a commitment, not framing, so it lives with the other facts
rather than being typed into presentation copy:

```ts
export const ENGAGEMENT = {
  conversation: 'A free conversation about what you need — no charge, no obligation.',
  quote: 'One fixed quote, agreed upfront. No hidden expenses, no surprise invoices.',
} as const;
```

Stated once, reusable by the next page that talks about pricing.

This is a promise about our own conduct, not a claim about results, which is
why it is safe under the rule `copy.ts` states at the top of the file and why
`honesty.spec.ts` stays green.

Nothing else in `facts.ts` changes. `RULES` keeps all four entries.

### `copy.ts` — `HOME`

| Key | Change |
|---|---|
| `nav.links` | → `[{ Rewire → /rewire/landing/ }, { Apps → /apps/ }]`. `Proof` and `How we work` deleted. |
| `nav.cta` | unchanged — `Start a project → #contact` |
| `hero.ghost` | **deleted.** The hero drops to a single `Start a project` button. |
| `build.eyebrow` | unchanged — `01 — What we build` |
| `build.services[1].blurb` | **rewritten** — see below |
| `HOME.proof` | deleted entirely (heading, sub, and the client-privacy stance) |
| `HOME.rules` | deleted |
| `contact.eyebrow` | `04 — Say hello` → `02 — Start a project` |
| `contact` | rebuilt — see below |
| `footer.ventures` | code unchanged (`PRODUCTS.map`); off-site entries render by host, not by slug path |

#### The rewritten service blurb

`build.services[1]` currently reads *"held to the same four rules as our own
ventures"* and interpolates `RULES[2]` and `RULES[3]`. With the rules section
gone, "four rules" refers to nothing the reader can see.

It is repointed at the apps page instead, trading a promise for a verifiable
claim:

> Shipped on iPhone, Apple Watch and the web. `{asWord(APPS.length)}` of them
> are ours, and you can open and use them right now.

The count **must be derived, not typed**. `APPS` is `PRODUCTS` with Rewire
filtered out, so it is *two* today and *three* once the Wall Estate spec lands.
Writing "three" now would be false until that spec ships. `copy.ts` already has
`asWord()` for exactly this; `APPS` is currently declared below `HOME` and will
need hoisting above it.

#### The footer venture labels

`footer.ventures` renders `/{slug}`. That is honest for the three on-site
products. An off-site product rendered as `/wallestate` would be a path-shaped
label on a link that leaves the site, so off-site entries render their real host
(`wallestate.neurotrocity.com`). The mechanism arrives with the Wall Estate
spec; this spec only records the decision.

## The new `02 — Start a project` section

Full-width `.wrap`, matching `#build`. Not the narrow centred `.copy.pane` it
replaces — it now carries the weight of two removed sections.

**Eyebrow** — `02 — Start a project`

**Heading** — the argument, not a greeting:

> Almost everything that wastes your time has a simple software solution.

**Lede**:

> The job that takes an hour and should take five minutes. The spreadsheet three
> people keep in sync by hand. The form you retype into another system. Most of
> it is a small app or a website away from being over — and in 2026 building
> that is faster and cheaper than it has ever been. That is the whole reason
> this is worth a conversation.

**Two steps**, read from `ENGAGEMENT`. A pair, not a numbered process — two
steps dressed as a methodology is the discovery theatre `#build` already
disowns:

> **First, a conversation.** `ENGAGEMENT.conversation`
>
> **Then, a number.** `ENGAGEMENT.quote`

**Close** — the existing line verbatim, then the mailto:

> A person reads every message and replies. No ticket queue, no bot.
>
> **hello@neurotrocity.com**

### Why this shape

The heading asserts the premise. The lede makes it concrete with examples a
reader recognises in their own week. The two steps answer the question that
actually stops people emailing a studio: *what happens to me if I do, and what
will it cost?* Free conversation and fixed quote are both answers to fear, which
is why they carry the most visual weight.

The lede's examples are illustrations, not claims about clients — no names, no
numbers, nothing `facts.ts` would need to vouch for.

The "faster and cheaper than ever" line is a claim about the industry, not about
us, and not a promise that can be broken. It is phrased as reasoning: no
percentages, no multipliers, no statistic.

## Markup

### `index.astro` deletions

- `<section id="proof">` in full
- `<section id="rules">` in full
- The `VentureRow` import and its `PRODUCTS.map`
- CSS for `.man`, `.stance`, `.rules`, `.rule`, and the `#proof` block

`PRODUCTS` stays imported — the home page's JSON-LD `makesOffer` still uses it.

### `VentureRow.astro`

Imported nowhere else once `#proof` goes. **Delete the component**, rather than
leave a dead file behind.

### `.contact` rewrite

From a narrow centred `.copy.pane` to a full-width `.wrap` matching `#build`:
heading and lede on the line, the two `ENGAGEMENT` steps as a two-column grid
collapsing to one column at the breakpoint `#build` already uses, mailto below.

The `data-soma` spine markers drop from five to three on their own — they are
derived from the sections present.

## Tests

| Test | Action |
|---|---|
| `home.spec.ts` — "leads with the agency offer, not the venture list" | **Rewrite.** Asserts `#build.y < #proof.y`; becomes `#build.y < #contact.y`. |
| `home.spec.ts` — "surfaces the client-privacy stance" | **Delete.** Targets `.stance p`; the stance is gone. |
| `home.spec.ts` — "renders all four rules from facts" | **Delete.** Targets `#rules .rule`. |
| `quality.spec.ts` — three contrast probes | **Retarget.** `.stance p` ×2 and `.stance .note` point at removed selectors; repoint at the new section's body and muted text at the same thresholds. |
| `home.spec.ts` — "routes an SMB visitor to Rewire within the first two screens" | **Keep, verify.** See below. |
| `facts.test.ts` — "carries the four rules verbatim" | **Keep, untouched.** `RULES` is unchanged. |
| `honesty.spec.ts` | **Keep, untouched.** New copy adds no names, numbers or outcomes. |

### The one test to watch

"routes an SMB visitor to Rewire within the first two screens" asserts a visible
link to `/rewire/landing/` within two viewport heights. Today three elements
satisfy it: the nav, the Service 01 heading, and the `/rewire` venture row.

After this change the venture row is gone and the hero loses a button, so the
content above the fold shifts. The new `Rewire` nav item sits at the very top,
so it passes — but this is the test most likely to go red for a reason unrelated
to any decision recorded here. Check it explicitly rather than assuming.

### New coverage

Add one test asserting the home page renders exactly two `<section>` elements,
`#build` then `#contact`, in that order — so a future edit cannot silently
reintroduce a third.

## Out of scope

Wall Estate's `PRODUCTS` entry, the `url` field for off-site products, the tile
artwork and the third apps-page grid column are all **spec #2**. No Wall Estate
change is made here; the footer picks it up for free once that spec lands.

## Prerequisite

`master` must be current with `origin/master` before this work starts. Every
file this spec touches moved in the reimagine merge, so starting from a stale
local `master` guarantees conflicts in `copy.ts` and `index.astro`.
