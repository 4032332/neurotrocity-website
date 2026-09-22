# Wall Estate on the apps page — design

Date: 2026-09-21
Status: approved (decisions taken during the 2026-09-20 brainstorm), ready to build
Scope: `/apps/` gains a third tile. The home page restructure is done and shipped.

## What Wall Estate is

A PDF calendar generator at `wallestate.neurotrocity.com` (repo:
`Digital-products/calendar-template`, package name `wall-estate`). React + Vite
on Netlify, Stripe paywall, its own privacy and terms pages. Photos in, branded
wall calendars out — batch or single, across three packs (real-estate sales,
kids, personal).

It already has a working front door, so the tile links **off-site**. No on-site
landing page is built.

## The structural problem

`PRODUCTS` in `facts.ts` is the spine of the site: the apps page, the home
page's JSON-LD `makesOffer`, the home footer and the sitemap all read it, and
every one of them assumes `path` is **site-relative**. An absolute URL in that
field would produce `https://neurotrocity.com/https://wallestate…` in the apps
JSON-LD and put a foreign domain in the sitemap — two real SEO faults, neither
visible in a browser.

### Decision: two fields, not one flag

`Product` becomes a union: a product carries **either** a site-relative `path`
**or** an off-site `url`, never both and never neither.

```ts
interface ProductBase {
  slug: 'dosetrack' | 'dispoint' | 'rewire' | 'wallestate';
  name: string;
  description: string;
  platforms: string;
  accent: 'volt' | 'ember' | 'cyan' | 'jade';
  /** Only for the things on /apps/. Rewire is a service and omits it. */
  appCategory?: 'MobileApplication' | 'WebApplication';
}

export type Product = ProductBase &
  ({ path: string; url?: undefined } | { url: string; path?: undefined });
```

The compiler now enforces the invariant that a boolean flag would only have
documented. Three helpers keep every consumer honest:

```ts
/** Where a link to this product points. */
export const productHref = (p: Product): string => p.url ?? p.path;

/** Its absolute URL, for structured data. */
export const productUrl = (p: Product): string =>
  p.url ?? `https://neurotrocity.com${p.path}`;

/** How it reads in a footer directory: a path here, a host elsewhere. */
export const productLabel = (p: Product): string =>
  p.url ? new URL(p.url).host : `/${p.slug}`;
```

`productLabel` exists because the footer renders `/{slug}`. Rendering
`/wallestate` for a link that leaves the site is a small dishonesty on a page
whose comments are otherwise careful, so off-site entries show their real host.

The sitemap keeps reading `path` and skips anything without one — no filter by
slug, no special case, just `flatMap(p => p.path ? [p.path] : [])`.

## The entry

```ts
{ slug: 'wallestate', name: 'Wall Estate',
  url: 'https://wallestate.neurotrocity.com/',
  accent: 'jade', platforms: 'Web · PDF',
  appCategory: 'WebApplication',
  description: 'The calendar every agent hands out at Christmas, with your face on it and your listings in it — made in a minute, not a week.' }
```

### Two deliberate deviations, decided by Rob 2026-09-21

**The description asserts a claim `facts.ts` cannot back.** "every agent hands
out at Christmas" is a claim about the market, which the rule at the top of
`copy.ts` bans. Rob chose to keep it: he owns the claim. Recorded here so a
later reader does not "correct" it back to a capability line.

The line originally ended "— made in a minute, not a week". That was cut on
2026-09-22 as generated filler. Cutting it lost the product's real edge, so the
speed went back the same day as "— the whole folder done in one go": the speed
IS the batch, which is a mechanism the product demonstrably has rather than a
time it has to live up to. Do not restore a bare time claim here.

**`platforms` no longer reads device · market.** Rather than bend Wall Estate to
the old pattern, Rob simplified the pattern itself: DisPoint drops `· AU` to
read `iPhone`, and Wall Estate reads `Web`. The field now names the platform
only. DoseTrack (`iPhone · Watch`) still names two devices, which is a device
list, not a market. Rewire keeps `Web · AU` — it is a service sold into a
market, not an app.

**Accent.** `--jade` is the one unused accent token. Wall Estate's own identity
is deliberately monochrome — its brand README says *"One ink, always… a Wall
Estate brand colour would fight every calendar it is printed on."* Jade is
NeuroTrocity's shelf, not Wall Estate's packaging; it tints the tile frame on
this site and appears nowhere in the product.

## Tile art

`public/assets/img/apps/wallestate-sheets.webp`, 1040×780, matching the other
two tiles.

Three **real** calendar sheets — Classic, Bold and Editorial — rendered through
the product's own `renderCalendarPdf`, each with a different real photo from the
app's `sample-images/`, two-year span, QR block present. Fanned on the dark
ground with a drop shadow, under a faint jade wash.

**Framed for the thumbnail, not the full page (2026-09-22).** The first version
fanned all three sheets whole, which at the tile's real render size (333×250)
read as white rectangles with grey texture — you could not tell they were
calendars. The front sheet is now scaled past the frame so its listing photo,
agent block, QR and month grid are all legible small; the other two peek from
behind to keep the stack. The framing was chosen by rendering candidates at
333×250 and judging them at that size, not scaled down from the full composition.

The mark's corner is **verified dark before the paste** (mean luminance 18.6 of
a 42 threshold) rather than placed by eye — at this crop the sheet covers most
of the frame, and an earlier attempt left the mark straddling the paper edge.

The Wall Estate mark sits on the **ground**, never on the paper. Printing the
mark onto a sheet would say Wall Estate brands the agent's calendar, which is
the opposite of what the product does. Ink is `#f2f0ec`, the brand's dark-scheme
ink.

The agent details on the sheets are the product's own placeholder wording ("Your
Name", "Your Agency"). Using a real agency name would fabricate a client on a
page that forbids exactly that, and `honesty.spec.ts` sweeps for it.

## Page changes

| Where | Change |
|---|---|
| `apps.astro` JSON-LD | `url` from `productUrl(a)`, not `https://neurotrocity.com${a.path}`; `applicationCategory` from `a.appCategory`, not the hardcoded `MobileApplication` |
| `apps.astro` tile | `href={productHref(a)}` |
| `apps.astro` `.apps` grid | `1fr 1fr` → `repeat(auto-fit, minmax(280px, 1fr))`; the `860px` single-column query goes, since auto-fit handles it |
| `APPS_PAGE.apps.art` | a `wallestate` entry, `fit: 'cover'` |
| `APPS_PAGE.meta.description` | `join(' and ')` breaks at three — becomes a proper list ("A, B and C") |
| `APPS_PAGE.footer.links` | `productHref` |
| `HOME.footer.ventures` | `productLabel` + `productHref`; `index.astro` renders `{v.label}` rather than `/{v.label}` |
| `sitemap.xml.ts` | skip products with no `path` |

## What follows for free

`HOME.build.services[1].blurb` is `asWord(APPS.length)`. Adding Wall Estate
flips it from "Two of them are ours" to "**Three**" with no edit — and makes the
sentence's existing "and the web" true, closing the one finding the home-page
review left open by explicit decision.

## Tests

- `facts.test.ts`: the product list assertions both change (three slugs → four,
  three name pairs → four). Add: every product has exactly one of `path`/`url`;
  every member of `APPS` has an `appCategory`.
- `seo.spec.ts`: `items.map(i => i.url)` must compare against `productUrl`, and
  the sitemap's `required` list must stop mapping `p.path` unfiltered.
- `quality.spec.ts`: add a 360px horizontal-overflow check for `/apps/` — it
  already exists; confirm it still passes with three tiles.
- New: the apps page renders one tile per `APPS` member with a non-empty `alt`
  (already asserted — it will now cover three).
