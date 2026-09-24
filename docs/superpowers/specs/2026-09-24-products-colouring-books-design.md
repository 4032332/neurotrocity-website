# Products page — colouring books (design)

Date: 2026-09-24 · Status: approved in brainstorm, awaiting spec review

## Goal

NeuroTrocity now publishes adult swear-word colouring books on Amazon KDP. Add
**Products** as the third service on the home page and give it its own page,
`/products/`, in the same design language as `/apps/` and Rewire, with the
**flare** accent (`#FF3B2F`). Colouring books are the first product range.

## Decisions (from brainstorm)

| Question | Decision |
|---|---|
| How books appear | A "Colouring books" range with one cover tile per book (room for more ranges later) |
| Tone | Titles verbatim as published (e.g. *Nurse Sh\*t*), plus one plain "for adults" line |
| Unreleased books | Shown as "Coming soon" tiles |
| Coming-soon art | SVG chalk-outline silhouettes, one distinguishing prop each, with COMING SOON tape |
| Home grid | Three equal columns on desktop, stacked on mobile |
| Accent | `flare` `#FF3B2F` (shared with the Before the Beep app accent — accepted) |

## 1. Data — `src/content/facts.ts`

A new `BOOKS` list, separate from `PRODUCTS` (books are neither apps nor services).

```ts
export const STORE_URL =
  'https://www.amazon.com.au/s?i=books-single-index&rh=p_27%3ANeuroTrocity&s=relevancerank&text=NeuroTrocity&ref=dp_byline_sr_book_1';

interface BookBase { slug: string; title: string; hook: string; }
export type Book = BookBase & (
  | { status: 'live'; url: string; cover: string; coverAlt: string }
  | { status: 'coming-soon'; prop: 'defib' | 'santa-hat' | 'doughnut' }
);
```

| slug | title | status | art |
|---|---|---|---|
| nurses | Nurse Sh\*t | live | cover crop |
| teachers | Teacher Sh\*t | live | cover crop |
| high-school | High School Sh\*t | live | cover crop |
| ambos | Ambo Sh\*t | coming-soon | chalk outline + defib paddle |
| christmas | Christmas Crime Scenes | coming-soon | chalk outline + Santa hat |
| cops | Cop Sh\*t | coming-soon | chalk outline + doughnut |

- Every live book's `url` starts as `STORE_URL`. It is replaced by the direct listing URL when one exists — a one-line data change.
- `hook` for live books is the subtitle taken verbatim from its `colouring-books/<book>/kdp/listing.md`. The three coming-soon hooks are new copy, reviewed by Rob before merge.
- Covers: the front panel is cropped from `colouring-books/<book>/cover/*-cover.png` (the right-hand half of the wrap, spine excluded), then exported as webp to `public/assets/img/books/<slug>.webp` at about 600px wide. An asset script (following `scripts/beeptest-assets.mjs`) makes the crop repeatable.

## 2. Home page

- `HOME.build.services` gains **Service 03 — Products**, `href: '/products/'`. The blurb is "Swear-word colouring books for adults, one profession at a time." followed by a count of live books derived from `BOOKS` (e.g. "Three out now on Amazon.").
- `.svc` becomes `repeat(3,1fr)` above 900px and one column below.
- A Products link goes in the nav and footer of home, `/apps/`, the Rewire landing page and `/products/`, wherever those pages already list Rewire and Apps.
- JSON-LD `makesOffer` is unchanged: books are covered on `/products/` instead.

## 3. `/products/` page — `src/pages/products.astro` + `PRODUCTS_PAGE` in `copy.ts`

Built from `apps.astro`: the same frame, bar, hero, `.pane`, contact and footer structure, with `accent="flare"`, `field` and `spine`.

1. **Hero** — a mono kicker, an h1 like "Things you can *actually buy*." (emphasis in flare), a short lede, and a primary button "Shop on Amazon ↗" linking to `STORE_URL`.
2. **Range 01 — Colouring books** (`#books`)
   - A pane with an intro sentence plus: "Swear-word colouring books for adults. Printed single-sided, so your pens can't bleed through."
   - A grid of six tiles, with live books first: 3 columns on desktop, 2 on tablet, 1 below roughly 520px. Each tile is 3:4.
   - **Live tile:** an `<a href={url} target="_blank" rel="noopener">` containing the cover image (lazy-loaded, with explicit width and height), the title, the hook and "Buy on Amazon ↗". On hover, the border turns flare and the tile lifts slightly. That effect is disabled under `prefers-reduced-motion`.
   - **Coming-soon tile:** a `<div>`, not a link. It shows an inline SVG chalk-outline body in off-white strokes on `--ground-2`, the book's prop in the same stroke style, the title on a white panel in the covers' heavy type, and a hazard-yellow diagonal tape band reading `COMING SOON · COMING SOON`. The label is also given as text for assistive technology.
3. **Contact** — "Question about one of them?" with the general email, matching Apps.
4. **Footer** — the shared footer, with a Books link to `STORE_URL`.

The chalk-outline SVG lives in `src/components/ChalkOutline.astro` and takes a `prop` input, so the three props share one body path.

## 4. Plumbing

- Add `flare` to the `accent` union in `Base.astro` and to the maps in `src/motion/cortex/palette.ts` and `CortexField.astro` / `Spine.astro`, wherever `violet` and `jade` currently have entries.
- JSON-LD: a `CollectionPage` whose `ItemList` contains `Book` items (name, url, author: NeuroTrocity) for **live books only**.
- Add `/og/products.png` via the existing `src/pages/og/[page].png.ts`.
- Add `/products/` to `sitemap.xml.ts`.

## 5. Testing

- **Unit (vitest):** every live book has `url`, `cover` and `coverAlt`, and its cover file exists. Every coming-soon book has a `prop`. Slugs are unique. `HOME.build.services.length === 3`. The live-book count in the Products blurb matches `BOOKS`.
- **E2E (playwright):** `/products/` renders 6 tiles. The 3 live tiles are links to amazon.com.au with `target="_blank"` and `rel` containing `noopener`. The 3 coming-soon tiles contain no `<a>`. There's no horizontal scroll at 375px. Home shows 3 services and links to `/products/`.
- `npm test`, `npm run build`, then a visual check in the iOS Simulator at mobile width (the browser pane pauses rAF when hidden).
- After push, confirm the GitHub Pages build actually deployed (these deploys are known to fail silently).

## Out of scope

- Per-book detail pages, a store integration or prices on the site.
- Generating real covers for the coming-soon books (the tiles swap to cover art when those exist).
- Any change to the colouring-books repo.
