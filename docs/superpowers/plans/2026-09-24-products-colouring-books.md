# Products Page (Colouring Books) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Products as the home page's third service and ship `/products/`, a flare-accented page listing the NeuroTrocity colouring books (3 live → Amazon, 3 coming soon as chalk-outline tiles).

**Architecture:** Book data lives in a new `BOOKS` list in `src/content/facts.ts`; page strings live in `PRODUCTS_PAGE` in `src/content/copy.ts`; `src/pages/products.astro` is built from `src/pages/apps.astro`'s structure with `accent="flare"`. Covers are cropped from the KDP wrap PNGs by a one-shot sharp script. Coming-soon art is an inline-SVG `ChalkOutline.astro` component.

**Tech Stack:** Astro 5 (static, GitHub Pages), TypeScript, three.js field shader, sharp 0.34.5, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-24-products-colouring-books-design.md`

## Global Constraints

- Accent for `/products/` is `flare` = `#FF3B2F` (token `--flare` already exists in `src/styles/tokens.css`).
- Flare is too light for white text at button size (≈3.5:1). Primary buttons on `/products/` use dark ink `#07060E` on flare.
- Titles are shown verbatim as published: `Nurse Sh*t`, `Teacher Sh*t`, `High School Sh*t`, `Ambo Sh*t`, `Christmas Crime Scenes`, `Cop Sh*t`.
- Store link, verbatim: `https://www.amazon.com.au/s?i=books-single-index&rh=p_27%3ANeuroTrocity&s=relevancerank&text=NeuroTrocity&ref=dp_byline_sr_book_1`
- External Amazon links: `target="_blank" rel="noopener"`.
- Coming-soon tiles are NOT links. They are not counted in any "out now" sentence and not listed in JSON-LD.
- `copy.ts` rule: every fact traces to `facts.ts`; counts are derived, never typed as numerals.
- Every hover/lift animation is disabled under `prefers-reduced-motion: reduce`.
- No horizontal scroll at 360px.
- Shared repo: `git pull --rebase` before starting and before every push. Stage files **by name**, never `git add -A` (the workspace root has many untracked files that must not be committed).
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Subagents do the work themselves, with no nested sub-agents.

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `src/motion/cortex/palette.ts` | modify | add `flare` to `Accent` + `PALETTES` |
| `src/layouts/Base.astro`, `src/components/CortexField.astro`, `src/components/Spine.astro` | modify | widen accent union, add spine stops |
| `src/motion/spine/index.ts` | modify | add `flare` soma colours |
| `scripts/books-assets.mjs` | create | crop the front cover from each wrap → webp |
| `public/assets/img/books/{nurses,teachers,high-school}.webp` | create (generated) | tile art |
| `src/content/facts.ts` | modify | `STORE_URL`, `Book`, `BOOKS`, `isLive` |
| `src/components/ChalkOutline.astro` | create | coming-soon SVG art |
| `src/content/copy.ts` | modify | `PRODUCTS_PAGE`; home Service 03, nav, footer |
| `src/pages/products.astro` | create | the page |
| `src/pages/index.astro` | modify | 3-column services grid |
| `src/pages/og/[page].png.ts`, `src/pages/sitemap.xml.ts` | modify | OG card, sitemap |
| `tests/unit/palette.test.ts`, `tests/unit/books.test.ts` | create | unit tests |
| `tests/unit/facts.test.ts` | modify | home has three services |
| `tests/e2e/products.spec.ts` | create | page behaviour |
| `tests/e2e/{routes,honesty,seo,quality}.spec.ts` | modify | add `/products/` to shared lists |

---

### Task 1: Flare accent plumbing

**Files:**
- Modify: `src/motion/cortex/palette.ts`
- Modify: `src/layouts/Base.astro:14`
- Modify: `src/components/CortexField.astro:2`
- Modify: `src/components/Spine.astro:2-13`
- Modify: `src/motion/spine/index.ts:14-17`
- Test: `tests/unit/palette.test.ts`

**Interfaces:**
- Produces: `Accent = 'volt' | 'jade' | 'ember' | 'violet' | 'flare'`; `<Base accent="flare">` compiles.

- [ ] **Step 1: Write the failing test** at `tests/unit/palette.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { PALETTES } from '../../src/motion/cortex/palette';

describe('cortex palettes', () => {
  it('has a flare palette led by #FF3B2F', () => {
    const p = PALETTES.flare;
    expect(p).toBeTruthy();
    expect(p.clusters[0]).toBe(0xFF3B2F);
    expect(p.c1).toEqual([1.0, 0.231, 0.184]);
  });

  it('keeps every shader endpoint in 0..1', () => {
    for (const [name, p] of Object.entries(PALETTES)) {
      for (const v of [...p.c1, ...p.c2]) {
        expect(v, name).toBeGreaterThanOrEqual(0);
        expect(v, name).toBeLessThanOrEqual(1);
      }
    }
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/unit/palette.test.ts`
Expected: FAIL. The first test hits `PALETTES.flare` as undefined.

- [ ] **Step 3: Implement**

`src/motion/cortex/palette.ts`: change line 1, then add an entry after `violet`:

```ts
export type Accent = 'volt' | 'jade' | 'ember' | 'violet' | 'flare';
```

```ts
  flare: {
    clusters: [0xFF3B2F, 0xFFC93C, 0xFF4FA3],
    c1: [1.0, 0.231, 0.184],
    // Hazard yellow, not the shared cyan, so the field reads crime-scene red
    // and tape yellow rather than drifting green next to Rewire.
    c2: [1.0, 0.788, 0.235],
    dust: 0xD88A86,
  },
```

In `src/layouts/Base.astro` line 14, `src/components/CortexField.astro` line 2 and `src/components/Spine.astro` line 2, change the union to:

```ts
'volt' | 'jade' | 'ember' | 'violet' | 'flare'
```

In `src/components/Spine.astro`, add to `STOPS`:

```ts
  flare:  ['#FF3B2F', '#FFC93C', '#FF4FA3'],
```

In `src/motion/spine/index.ts`, add to `COL_SETS`:

```ts
  flare:  ['#FF3B2F', '#FF6B5F', '#FFC93C', '#FFD970', '#FF4FA3'],
```

- [ ] **Step 4: Run the tests and type check**

Run: `npx vitest run tests/unit/palette.test.ts && npx astro check`
Expected: PASS, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/motion/cortex/palette.ts src/layouts/Base.astro src/components/CortexField.astro src/components/Spine.astro src/motion/spine/index.ts tests/unit/palette.test.ts
git commit -m "feat(accent): add flare to the field, spine and layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Cover assets

**Files:**
- Create: `scripts/books-assets.mjs`
- Create (generated): `public/assets/img/books/nurses.webp`, `teachers.webp`, `high-school.webp`

**Interfaces:**
- Produces: three webp files, 600px wide and about 783px tall (front cover plus bleed, ratio 8.625:11.25), referenced by `BOOKS[].cover` in Task 3.

Background: each KDP wrap is one image laid out as `[bleed | back 8.5in | spine | front 8.5in | bleed]`, 11.25in tall (11in trim + 2 × 0.125in bleed). The front panel plus its outer bleed is the right-most `8.625 / 11.25 × height` pixels. Deriving the crop from the height avoids needing each book's spine width.

- [ ] **Step 1: Write the script** at `scripts/books-assets.mjs`

```js
// One-shot export for /products/: front covers cropped from the KDP wraps.
// Run from the repo root:  node scripts/books-assets.mjs
// Sources live in the sibling colouring-books repo; outputs are committed.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = process.env.BOOKS_SRC ?? path.resolve('../../Digital-products/colouring-books');
const OUT = 'public/assets/img/books';
fs.mkdirSync(OUT, { recursive: true });

// slug -> wrap file inside <SRC>/<dir>/cover/
const BOOKS = {
  nurses: 'nurses/cover/nurse-shit-cover.png',
  teachers: 'teachers/cover/teacher-shit-cover.png',
  'high-school': 'high-school/cover/high-school-shit-cover.png',
};

// Front panel + outer bleed, as a fraction of the wrap's height (8.625in / 11.25in).
const FRONT_W_PER_H = 8.625 / 11.25;

for (const [slug, rel] of Object.entries(BOOKS)) {
  const file = path.join(SRC, rel);
  const { width, height } = await sharp(file).metadata();
  const frontW = Math.round(height * FRONT_W_PER_H);
  await sharp(file)
    .extract({ left: width - frontW, top: 0, width: frontW, height })
    .resize({ width: 600 })
    .webp({ quality: 82 })
    .toFile(path.join(OUT, `${slug}.webp`));
  console.log(`${slug}: ${width}x${height} -> front ${frontW}px -> ${OUT}/${slug}.webp`);
}
```

- [ ] **Step 2: Run it**

Run: `node scripts/books-assets.mjs`
Expected: three lines like `nurses: 5233x3375 -> front 2588px -> public/assets/img/books/nurses.webp`.

- [ ] **Step 3: Check a crop by eye**

Open `public/assets/img/books/nurses.webp` with the Read tool. Expected: the front cover only, showing the "NURSE SH*T" panel and the NeuroTrocity wordmark, with no back-cover text and no spine strip on the left edge. If a sliver of spine shows, reduce `FRONT_W_PER_H` to `8.5 / 11.25`, re-run, and re-check.

- [ ] **Step 4: Commit**

```bash
git add scripts/books-assets.mjs public/assets/img/books/nurses.webp public/assets/img/books/teachers.webp public/assets/img/books/high-school.webp
git commit -m "feat(products): crop colouring-book front covers for the site

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Book data

**Files:**
- Modify: `src/content/facts.ts` (append after `PRODUCTS`)
- Test: `tests/unit/books.test.ts`

**Interfaces:**
- Produces:
  - `STORE_URL: string`
  - `type Book = { slug: string; title: string; hook: string } & ({ status: 'live'; url: string; cover: string; coverAlt: string } | { status: 'coming-soon'; prop: 'defib' | 'santa-hat' | 'doughnut' })`
  - `BOOKS: Book[]` (live first)
  - `isLive(b: Book): b is Extract<Book, { status: 'live' }>`

- [ ] **Step 1: Write the failing test** at `tests/unit/books.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BOOKS, STORE_URL, isLive } from '../../src/content/facts';

describe('BOOKS', () => {
  it('lists the six titles verbatim, live first', () => {
    expect(BOOKS.map(b => [b.title, b.status])).toEqual([
      ['Nurse Sh*t', 'live'],
      ['Teacher Sh*t', 'live'],
      ['High School Sh*t', 'live'],
      ['Ambo Sh*t', 'coming-soon'],
      ['Christmas Crime Scenes', 'coming-soon'],
      ['Cop Sh*t', 'coming-soon'],
    ]);
  });

  it('has unique slugs', () => {
    const slugs = BOOKS.map(b => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every live book an Amazon url and a cover file that exists', () => {
    for (const b of BOOKS.filter(isLive)) {
      expect(b.url, b.slug).toMatch(/^https:\/\/www\.amazon\.com\.au\//);
      expect(b.coverAlt.trim().length, b.slug).toBeGreaterThan(0);
      expect(fs.existsSync(path.join('public', b.cover)), `${b.cover} missing`).toBe(true);
    }
  });

  it('gives every coming-soon book a chalk-outline prop', () => {
    for (const b of BOOKS.filter(b => !isLive(b))) {
      expect(['defib', 'santa-hat', 'doughnut']).toContain((b as { prop: string }).prop);
    }
  });

  it('points at the NeuroTrocity author store', () => {
    expect(STORE_URL).toBe('https://www.amazon.com.au/s?i=books-single-index&rh=p_27%3ANeuroTrocity&s=relevancerank&text=NeuroTrocity&ref=dp_byline_sr_book_1');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/unit/books.test.ts`
Expected: FAIL, because `BOOKS` is not exported.

- [ ] **Step 3: Implement.** Append to `src/content/facts.ts`:

```ts
/** The NeuroTrocity author store on Amazon AU. A live book links here until it
 *  has its own listing URL, which then replaces its `url`. */
export const STORE_URL =
  'https://www.amazon.com.au/s?i=books-single-index&rh=p_27%3ANeuroTrocity&s=relevancerank&text=NeuroTrocity&ref=dp_byline_sr_book_1';

interface BookBase {
  slug: string;
  /** Verbatim as published on the cover. */
  title: string;
  /** Live: the KDP subtitle up to the colon, from colouring-books/<book>/kdp/listing.md. */
  hook: string;
}

export type Book = BookBase & (
  | { status: 'live'; url: string; cover: string; coverAlt: string }
  | { status: 'coming-soon'; prop: 'defib' | 'santa-hat' | 'doughnut' }
);

export const isLive = (b: Book): b is Extract<Book, { status: 'live' }> => b.status === 'live';

export const BOOKS: Book[] = [
  { slug: 'nurses', title: 'Nurse Sh*t', status: 'live', url: STORE_URL,
    hook: 'What Nurses Really Want to Say at Crime Scenes',
    cover: '/assets/img/books/nurses.webp',
    coverAlt: 'Nurse Sh*t cover: the title on a white panel over a pattern of pills, coffee cups and crime-scene tape' },
  { slug: 'teachers', title: 'Teacher Sh*t', status: 'live', url: STORE_URL,
    hook: 'What Primary Teachers Really Want to Say by Week Three',
    cover: '/assets/img/books/teachers.webp',
    coverAlt: 'Teacher Sh*t cover: the title on a white panel over a patterned classroom background' },
  { slug: 'high-school', title: 'High School Sh*t', status: 'live', url: STORE_URL,
    hook: 'What High School Teachers Really Want to Say by Period Five',
    cover: '/assets/img/books/high-school.webp',
    coverAlt: 'High School Sh*t cover: the title on a white panel over a patterned high-school background' },
  // Coming-soon hooks are draft copy. Rob reviews them before merge.
  { slug: 'ambos', title: 'Ambo Sh*t', status: 'coming-soon', prop: 'defib',
    hook: 'What paramedics really want to say with the lights on' },
  { slug: 'christmas', title: 'Christmas Crime Scenes', status: 'coming-soon', prop: 'santa-hat',
    hook: 'Festive felonies, ready to colour' },
  { slug: 'cops', title: 'Cop Sh*t', status: 'coming-soon', prop: 'doughnut',
    hook: 'What cops really want to say at the scene' },
];
```

After the step passes, look at the three cropped covers (Task 2) and correct the Teacher and High School `coverAlt` wording to describe what the pattern actually shows.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/books.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/content/facts.ts tests/unit/books.test.ts
git commit -m "feat(products): add BOOKS and the Amazon author store link

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: ChalkOutline component

**Files:**
- Create: `src/components/ChalkOutline.astro`

**Interfaces:**
- Consumes: the `prop` values `'defib' | 'santa-hat' | 'doughnut'` from Task 3.
- Produces: `<ChalkOutline prop="defib" />`, which renders a single `<svg class="chalk" viewBox="0 0 120 160" aria-hidden="true">`. The accessible label comes from the tile, not the SVG.

- [ ] **Step 1: Create** `src/components/ChalkOutline.astro`

```astro
---
/**
 * Coming-soon art for /products/: a crime-scene chalk outline, with one prop
 * per book so the three tiles are told apart. Decorative only; the tile
 * carries the title and "Coming soon" as text.
 */
interface Props { prop: 'defib' | 'santa-hat' | 'doughnut' }
const { prop } = Astro.props;
---
<svg class="chalk" viewBox="0 0 120 160" aria-hidden="true" data-prop={prop}>
  <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <!-- the body: head, torso, one arm flung up, one out, legs splayed -->
    <path d="M52 22c0-7 5-12 11-12s11 5 11 12-5 12-11 12-11-5-11-12z"/>
    <path d="M58 34c-3 6-4 10-4 14l-18-16c-3-3-8 0-6 4l19 22c2 3 2 7 1 11l-3 24-16 30c-2 4 3 7 6 4l19-28 4 0 13 30c2 4 7 2 6-2l-9-32 1-26c0-4 2-7 5-8l22-6c4-1 3-7-1-6l-24 4c-3-6-5-11-6-15"/>
    {prop === 'defib' && (
      <!-- a defib paddle in the raised hand -->
      <g transform="translate(14 6) rotate(-20)">
        <rect x="0" y="0" width="18" height="12" rx="3"/>
        <path d="M9 12v10M5 22h8"/>
        <path d="M22 4l5-3M23 9h6M22 14l5 3" stroke-width="2"/>
      </g>
    )}
    {prop === 'santa-hat' && (
      <!-- a Santa hat, slipped half off the head -->
      <g>
        <path d="M50 20c4-10 16-14 26-8l14 14"/>
        <path d="M48 22c8-3 20-3 28 1"/>
        <circle cx="93" cy="29" r="4"/>
      </g>
    )}
    {prop === 'doughnut' && (
      <!-- a doughnut, dropped by the outstretched hand -->
      <g>
        <circle cx="104" cy="66" r="9"/>
        <circle cx="104" cy="66" r="3"/>
        <path d="M98 60l2 1M108 59l1 2M111 68l-2 1M100 72l1-2" stroke-width="1.8"/>
      </g>
    )}
  </g>
</svg>
```

- [ ] **Step 2: Type check**

Run: `npx astro check`
Expected: 0 errors. The component is exercised visually and by e2e in Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/components/ChalkOutline.astro
git commit -m "feat(products): chalk-outline art for coming-soon books

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `/products/` page

**Files:**
- Modify: `src/content/copy.ts` (add `PRODUCTS_PAGE` after `APPS_PAGE`, and extend the import from `./facts`)
- Create: `src/pages/products.astro`
- Test: `tests/e2e/products.spec.ts`

**Interfaces:**
- Consumes: `BOOKS`, `STORE_URL`, `isLive` (Task 3); `ChalkOutline` (Task 4); `accent="flare"` (Task 1).
- Produces: `PRODUCTS_PAGE` with `meta.title`, `meta.description`, `meta.canonical`, and `hero.kicker` (used by Task 7's OG card). DOM hooks for tests: `#books`, `.book` (every tile), `a.book.live`, `div.book.soon`.

- [ ] **Step 1: Write the failing e2e test** at `tests/e2e/products.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { BOOKS, isLive } from '../../src/content/facts';

const live = BOOKS.filter(isLive);
const soon = BOOKS.filter(b => !isLive(b));

test('lists every book, live first', async ({ page }) => {
  await page.goto('/products/');
  const titles = await page.locator('#books .book h3').allInnerTexts();
  expect(titles).toEqual(BOOKS.map(b => b.title));
});

test('live tiles open Amazon in a new tab', async ({ page }) => {
  await page.goto('/products/');
  const tiles = page.locator('#books a.book.live');
  await expect(tiles).toHaveCount(live.length);
  for (let i = 0; i < live.length; i++) {
    const t = tiles.nth(i);
    await expect(t).toHaveAttribute('href', live[i].url);
    await expect(t).toHaveAttribute('target', '_blank');
    expect(await t.getAttribute('rel')).toContain('noopener');
    await expect(t.locator('img')).toHaveAttribute('alt', live[i].coverAlt);
  }
});

test('coming-soon tiles are not links and say so in text', async ({ page }) => {
  await page.goto('/products/');
  const tiles = page.locator('#books div.book.soon');
  await expect(tiles).toHaveCount(soon.length);
  await expect(tiles.locator('a')).toHaveCount(0);
  for (let i = 0; i < soon.length; i++) {
    await expect(tiles.nth(i)).toContainText(/coming soon/i);
    await expect(tiles.nth(i).locator('svg.chalk')).toHaveCount(1);
  }
});

test('says the books are for adults', async ({ page }) => {
  await page.goto('/products/');
  await expect(page.locator('#books')).toContainText(/for adults/i);
});

test('hero button goes to the author store', async ({ page }) => {
  await page.goto('/products/');
  const btn = page.locator('.hero a.btn.p');
  await expect(btn).toHaveAttribute('href', /amazon\.com\.au/);
  await expect(btn).toHaveAttribute('target', '_blank');
});

test('no horizontal overflow at 360px on /products/', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/products/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('logs no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/products/');
  await page.waitForTimeout(2500);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Build and run it to confirm it fails**

Run: `npm run build && npx playwright test tests/e2e/products.spec.ts`
Expected: FAIL. `/products/` returns 404, so the locators find nothing.

- [ ] **Step 3: Add `PRODUCTS_PAGE` to `src/content/copy.ts`**

Extend the facts import on line 10 to include `BOOKS, STORE_URL, isLive`. Then add after `APPS_PAGE`:

```ts
/**
 * Presentation strings for /products/. Same rule as the rest of this file:
 * titles, hooks and links come from BOOKS in facts.ts. A coming-soon book is
 * never counted as available and never linked.
 */
export const PRODUCTS_PAGE = {
  meta: {
    title: 'Products — NeuroTrocity',
    description: `Things NeuroTrocity makes that you can buy. Swear-word colouring books for adults: ${listJoin(BOOKS.filter(isLive).map((b) => b.title))}, on Amazon.`,
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
    sub: 'Things we make that you can actually buy.',
    lede: {
      a: 'Not everything we build is software. ',
      strong: 'These ones you can hold in your hands',
      b: ', and they are on Amazon now.',
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
    sub: personRule.body,
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
```

- [ ] **Step 4: Create `src/pages/products.astro`**

Copy `src/pages/apps.astro` in full to `src/pages/products.astro`, then make these edits:

1. Frontmatter. Replace everything between the `---` fences with:

```astro
---
import Base from '../layouts/Base.astro';
import ChalkOutline from '../components/ChalkOutline.astro';
import { PRODUCTS_PAGE } from '../content/copy';
import { isLive } from '../content/facts';

const { meta, nav, hero, books, contact, footer } = PRODUCTS_PAGE;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: meta.title,
  description: meta.description,
  url: meta.canonical,
  isPartOf: { '@type': 'WebSite', name: 'NeuroTrocity', url: 'https://neurotrocity.com/' },
  mainEntity: {
    '@type': 'ItemList',
    // Live books only: a coming-soon book is not on offer.
    itemListElement: books.items.filter(isLive).map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@type': 'Book', name: b.title, url: b.url, author: { '@type': 'Organization', name: 'NeuroTrocity' } },
    })),
  },
};
---
```

2. The `<Base …>` tag becomes:

```astro
<Base title={meta.title} description={meta.description} path="/products/" ogImage="/og/products.png" jsonLd={jsonLd} accent="flare" field spine>
```

3. In the `<style is:global>` block, replace every `var(--violet)` with `var(--flare)`. Change `.hero .kick{ color:var(--ember) …}` to `color:var(--flare)`. Change the primary button rule to dark ink, and replace the stale "Ember is a light accent" comment:

```css
/* Flare is too light for white text at this size (≈3.5:1): dark ink instead. */
.btn.p{ background:var(--flare); color:#07060E }
.btn.p:hover{ background:color-mix(in srgb, var(--flare) 88%, white); transform:translateY(-2px) }
```

4. Delete the whole `#apps` CSS block (from `/* ── #apps` through the `@media (prefers-reduced-motion:reduce){ … }` that follows it). Delete the `.stance` rules as well. In their place add:

```css
/* ── #books: a range pane, then one 3:4 tile per book ─────────────────── */
.range{ margin-top:0 }
.range .note{ margin-top:14px; color:var(--muted); font-size:15.5px; line-height:1.62; max-width:56ch }
.books{ margin-top:22px; display:grid; gap:18px; grid-template-columns:repeat(3,1fr) }
@media (max-width:900px){ .books{ grid-template-columns:repeat(2,1fr) } }
@media (max-width:520px){ .books{ grid-template-columns:1fr } }
.book{
  display:flex; flex-direction:column; overflow:hidden; color:inherit;
  border:1px solid var(--line); border-radius:8px;
  background:color-mix(in srgb, var(--ground-2) 80%, transparent);
  transition:border-color .25s, background .25s, transform .25s;
}
.book .art{ display:block; position:relative; aspect-ratio:3/4; overflow:hidden; border-bottom:1px solid var(--line) }
.book .art img{ width:100%; height:100%; display:block; object-fit:cover; transition:transform .5s cubic-bezier(.22,1,.36,1) }
.book .body{ display:flex; flex-direction:column; flex:1; padding:18px 20px 22px }
.book h3{ font-weight:800; letter-spacing:-.03em; font-size:clamp(20px,2vw,24px); color:var(--ink) }
.book p{ margin-top:8px; color:var(--muted); font-size:14.5px; line-height:1.55 }
.book .go{ margin-top:auto; padding-top:16px; font-family:var(--mono); font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--flare) }
.book .go .arw{ display:inline-block; transition:transform .25s }
a.book:hover, a.book:focus-visible{
  border-color:color-mix(in srgb, var(--flare) 58%, transparent);
  background:color-mix(in srgb, var(--flare) 7%, var(--ground-2));
  transform:translateY(-3px);
}
a.book:hover .art img, a.book:focus-visible .art img{ transform:scale(1.03) }
a.book:hover .go .arw, a.book:focus-visible .go .arw{ transform:translateX(4px) }

/* Coming soon: a chalk outline on the dark, the title on a white cover
   panel, and a strip of hazard tape. Not a link. */
.book.soon .art{ background:var(--ground-2); color:#E9E6F2; display:grid; place-items:center }
.book.soon .chalk{ width:62%; height:auto; opacity:.9 }
.book.soon .panel{
  position:absolute; left:10%; right:10%; top:9%; padding:8px 6px;
  background:#fff; color:#000; text-align:center;
  font-family:var(--display); font-weight:800; font-size:clamp(14px,1.5vw,17px); letter-spacing:-.01em; line-height:1.05;
}
.book.soon .tape{
  position:absolute; left:-20%; right:-20%; bottom:22%; transform:rotate(-12deg);
  background:#FFC93C; color:#07060E; padding:6px 0; text-align:center; white-space:nowrap;
  font-family:var(--mono); font-size:11px; font-weight:600; letter-spacing:.18em; text-transform:uppercase;
  box-shadow:0 2px 0 rgba(0,0,0,.35);
}
.book.soon .go{ color:var(--muted) }

@media (prefers-reduced-motion:reduce){
  .book, .book .art img, .book .go .arw{ transition:none }
  a.book:hover, a.book:focus-visible{ transform:none }
  a.book:hover .art img, a.book:focus-visible .art img{ transform:none }
}
```

5. Hero markup. Keep the Apps hero markup. On the primary button, add `target="_blank" rel="noopener"` and change the arrow to `↗`:

```astro
<a class="btn p" href={hero.primary.href} target="_blank" rel="noopener">{hero.primary.label} <span class="arw" aria-hidden="true">↗</span></a>
```

6. Replace the whole `<section class="sec" id="apps" …>…</section>` with:

```astro
<section class="sec" id="books" data-soma="Colouring books">
  <div class="wrap">
    <div class="range pane">
      <p class="mono eyebrow">{books.eyebrow}</p>
      <h2>{books.heading}</h2>
      <p class="note">{books.note}</p>
    </div>
    <div class="books">
      {books.items.map((b) => isLive(b) ? (
        <a class="book live" href={b.url} target="_blank" rel="noopener">
          <span class="art">
            <img src={b.cover} alt={b.coverAlt} width="600" height="783" loading="lazy" decoding="async" />
          </span>
          <span class="body">
            <h3>{b.title}</h3>
            <p>{b.hook}</p>
            <span class="go">{books.buy} <span class="arw" aria-hidden="true">↗</span></span>
          </span>
        </a>
      ) : (
        <div class="book soon">
          <span class="art">
            <ChalkOutline prop={b.prop} />
            <span class="panel" aria-hidden="true">{b.title}</span>
            <span class="tape" aria-hidden="true">{books.soon} · {books.soon} · {books.soon}</span>
          </span>
          <span class="body">
            <h3>{b.title}</h3>
            <p>{b.hook}</p>
            <span class="go">{books.soon}</span>
          </span>
        </div>
      ))}
    </div>
  </div>
</section>
```

7. The contact section and footer markup stay as copied. They read `contact.*` and `footer.links`, which `PRODUCTS_PAGE` provides.

- [ ] **Step 5: Build and run**

Run: `npx astro check && npm run build && npx playwright test tests/e2e/products.spec.ts`
Expected: 0 check errors, build succeeds, 7 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/content/copy.ts src/pages/products.astro tests/e2e/products.spec.ts
git commit -m "feat(products): /products/ page with the colouring books range

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Home page — Service 03, three columns, nav and footer

**Files:**
- Modify: `src/content/copy.ts` (`Service.accent` type, `HOME.nav.links`, `HOME.build.services`, `HOME.footer.ventures`)
- Modify: `src/pages/index.astro` (`.svc` grid)
- Test: `tests/unit/facts.test.ts`, `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `BOOKS`, `isLive` (Task 3); the `/products/` route (Task 5).

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/facts.test.ts`, and add `BOOKS, isLive` to its import from `../../src/content/facts`:

```ts
describe('home services', () => {
  it('offers three services, Products third, linking to /products/', () => {
    const s = HOME.build.services;
    expect(s.map(x => x.title)).toEqual(['Rewire', 'iOS & web apps', 'Products']);
    expect(s[2].href).toBe('/products/');
    expect(s[2].n).toBe('Service 03');
  });

  it('counts only live books as out now', () => {
    const n = BOOKS.filter(isLive).length;
    const word = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][n];
    expect(HOME.build.services[2].blurb).toContain(`${word} out now on Amazon.`);
  });

  it('links Products from the home nav', () => {
    expect(HOME.nav.links.map(l => l.href)).toContain('/products/');
  });
});
```

Append to `tests/e2e/home.spec.ts`:

```ts
test('shows three services side by side on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const cells = page.locator('#build .svc > div');
  await expect(cells).toHaveCount(3);
  const ys = await cells.evaluateAll(ns => ns.map(n => Math.round(n.getBoundingClientRect().top)));
  expect(new Set(ys).size).toBe(1);
  await expect(page.locator('#build a[href="/products/"]')).toBeVisible();
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run tests/unit/facts.test.ts`
Expected: FAIL. `services` has only 2 entries.

- [ ] **Step 3: Implement in `src/content/copy.ts`**

On line 10, add `BOOKS, isLive` to the facts import.

In `interface Service`, widen the accent type:

```ts
  accent: 'volt' | 'cyan' | 'ember' | 'flare';
```

In `HOME.nav.links`, add after Apps:

```ts
      { label: 'Products', href: '/products/' },
```

In `HOME.build.services`, append after Service 02:

```ts
      {
        n: 'Service 03',
        title: 'Products',
        href: '/products/',
        // Count derives from live BOOKS; a coming-soon book is never "out now".
        blurb: `Swear-word colouring books for adults, one profession at a time. ${asWord(BOOKS.filter(isLive).length)} out now on Amazon.`,
        accent: 'flare',
      },
```

In `HOME.footer`, change `ventures` to:

```ts
    ventures: [
      ...PRODUCTS.map((p) => ({ label: productLabel(p), href: productHref(p) })),
      { label: '/products', href: '/products/' },
    ],
```

- [ ] **Step 4: Implement in `src/pages/index.astro`**

In the `.svc` rule, change `grid-template-columns:repeat(2,1fr);` to `grid-template-columns:repeat(3,1fr);`. Leave the existing `@media (max-width:900px){ .svc{ grid-template-columns:1fr } }` unchanged.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run && npm run build && npx playwright test tests/e2e/home.spec.ts`
Expected: all pass. The existing "renders exactly two sections" test still passes, because no section was added.

- [ ] **Step 6: Commit**

```bash
git add src/content/copy.ts src/pages/index.astro tests/unit/facts.test.ts tests/e2e/home.spec.ts
git commit -m "feat(home): Products as Service 03 in a three-column grid

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: SEO, OG card, sitemap and shared test lists

**Files:**
- Modify: `src/pages/og/[page].png.ts` (import + `CARDS`)
- Modify: `src/pages/sitemap.xml.ts` (`STATIC_URLS`)
- Modify: `tests/e2e/routes.spec.ts`, `tests/e2e/honesty.spec.ts`, `tests/e2e/seo.spec.ts`, `tests/e2e/quality.spec.ts`

**Interfaces:**
- Consumes: `PRODUCTS_PAGE.meta.title`, `PRODUCTS_PAGE.hero.kicker` (Task 5).

- [ ] **Step 1: Add `/products/` to the shared test lists (these now fail)**

`tests/e2e/routes.spec.ts`: add `'/products/', '/og/products.png',` to `MUST_RESOLVE`.

`tests/e2e/honesty.spec.ts` line 9: change the list to `['/', '/rewire/landing/', '/apps/', '/products/', '/beeptest/landing/']`.

`tests/e2e/seo.spec.ts`:
- In the canonical list, add `{ path: '/products/', canonical: 'https://neurotrocity.com/products/' },`
- In the sitemap `required` array, add `'/products/',`
- Append this test:

```ts
test('products declares a CollectionPage of live books only', async ({ page }) => {
  await page.goto('/products/');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const collection = blocks.map(b => JSON.parse(b)).find(j => j['@type'] === 'CollectionPage');
  expect(collection).toBeTruthy();
  const items = collection.mainEntity.itemListElement.map((i: any) => i.item);
  expect(items.map((i: any) => i['@type'])).toEqual(BOOKS.filter(isLive).map(() => 'Book'));
  expect(items.map((i: any) => i.name)).toEqual(BOOKS.filter(isLive).map(b => b.title));
});
```

Add `BOOKS, isLive` to seo.spec.ts's facts import. If it has no facts import, add `import { BOOKS, isLive } from '../../src/content/facts';`.

`tests/e2e/quality.spec.ts`: add a case list after `APPS_CASES`, then add `['/products/', PRODUCTS_CASES],` to the contrast loop's tuple list:

```ts
const PRODUCTS_CASES: ContrastCase[] = [
  { label: 'hero .lede', selector: '.hero .lede', fg: MUTED, threshold: 4.5 },
  { label: 'hero h1', selector: '.hero h1', fg: INK, threshold: 3.0 },
  { label: 'banner .sub', selector: '.hero .sub', fg: INK, threshold: 4.5 },
  { label: 'range note', selector: '.range .note', fg: MUTED, threshold: 4.5 },
  { label: '.contact .sub', selector: '.contact .sub', fg: MUTED, threshold: 4.5 },
];
```

Also add `'/products/'` to the two `for (const pagePath of ['/', '/rewire/landing/', '/apps/'])` loops at lines 148 and 165.

- [ ] **Step 2: Run them and confirm the new cases fail**

Run: `npm run build && npx playwright test tests/e2e/routes.spec.ts tests/e2e/seo.spec.ts`
Expected: FAIL on `/og/products.png` (404) and on the sitemap missing `/products/`.

- [ ] **Step 3: Implement**

`src/pages/og/[page].png.ts`: change the import to `import { HOME, REWIRE_PAGE, APPS_PAGE, PRODUCTS_PAGE } from '../../content/copy';` and add to `CARDS`:

```ts
  products: {
    title: PRODUCTS_PAGE.meta.title,
    eyebrow: PRODUCTS_PAGE.hero.kicker.toUpperCase(),
    accent: '#FF3B2F',
  },
```

`src/pages/sitemap.xml.ts`: add `'/products/',` after `'/apps/',` in `STATIC_URLS`.

- [ ] **Step 4: Run the full suite**

Run: `npm test && npm run build && npx playwright test`
Expected: everything passes. The contrast tests are slow, up to about 2 minutes per page.

- [ ] **Step 5: Commit**

```bash
git add "src/pages/og/[page].png.ts" src/pages/sitemap.xml.ts tests/e2e/routes.spec.ts tests/e2e/honesty.spec.ts tests/e2e/seo.spec.ts tests/e2e/quality.spec.ts
git commit -m "feat(products): OG card, sitemap entry and shared page checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Visual verification and ship

**Files:** none (verification only; any fixes go back into the owning task's files, each with its own commit).

- [ ] **Step 1: Check visually on a phone**

Serve with `npm run preview`, then open `http://localhost:4321/products/` and `http://localhost:4321/` in the iOS Simulator's Safari. Don't rely on the in-app browser pane: when the pane is hidden it pauses requestAnimationFrame, so the shader field doesn't render. Take screenshots. Check that:
- the field and spine read red and yellow
- the cover crops are clean
- the chalk outlines, white title panels and tape band look right
- the three home services stack on mobile

Then check desktop width in the browser pane, where the home services should sit in a row of three.

- [ ] **Step 2: Rob signs off the copy**

Send Rob the three coming-soon hooks and the hero lines for approval. Apply any edits in `src/content/facts.ts` / `src/content/copy.ts`, re-run `npm test`, and commit.

- [ ] **Step 3: Push (only after Rob gives the go-ahead)**

```bash
git pull --rebase
git push
```

- [ ] **Step 4: Confirm the deploy**

A green push doesn't guarantee a deploy on this repo. Check with `gh run list --limit 3` that the Pages workflow for the pushed commit finished `success`. Then fetch `https://neurotrocity.com/products/` and confirm it returns 200 and contains "Nurse Sh*t". If the run failed or the page 404s, re-run the workflow with `gh run rerun <id>` and check again.
