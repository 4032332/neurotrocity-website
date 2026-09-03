# NeuroTrocity Site Reimagine — Implementation Plan (Plan 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild neurotrocity.com's home page and Rewire landing page as an agency-first calling card whose motion craft is itself the proof of capability — a persistent WebGL cortex field with causal signal firing, dendrite-spine navigation, and a live 3D demo deck — on a platform that can host the Tier-3 review service.

**Architecture:** Convert hand-authored static HTML to Astro, **still served by GitHub Pages from `master`** — Astro emits static HTML, so the existing host, domain, DNS and deploy flow are unchanged. Every existing URL stays byte-identical; the six demo models and two app landing pages ship verbatim from `public/`. All motion lives in framework-free TypeScript modules under `src/motion/` (unit-testable pure functions + thin imperative shells), mounted as Astro islands so the marketing pages ship zero JS above the canvas. A single `src/content/facts.ts` is the only source of factual copy, enforced by a test.

**Tech Stack:** Astro 5 · TypeScript · three.js (WebGL2) · GSAP + ScrollTrigger · Lenis · Vitest · Playwright · GitHub Pages (unchanged)

## Hosting: confirmed, not changing

Verified 2026-09-03 by response headers and DNS:

- `server: GitHub.com`, A records `185.199.108–111.153`, `www → 4032332.github.io` — **the site is hosted on GitHub Pages**, publishing `master` directly (no Actions workflow).
- Nameservers `nsc1–4.squarespacedns.com` — **Squarespace is registrar + DNS only** (the 2023 Google Domains migration). Google Workspace handles email. Neither hosts the website.

**Nothing migrates.** Astro's static output is committed/published exactly as the current HTML is. The only server-side requirement in the whole engagement is Plan 2's review endpoint, which lives on `api.neurotrocity.com` as a single Cloudflare Worker (alternative: Google Cloud Run, given the existing Workspace billing relationship) — one CNAME added in Squarespace DNS, zero impact on this plan.

---

## Global Constraints

These apply to **every** task. A task is not done if it violates one.

- **No invented facts.** No testimonials, no client names, no metrics, no statistics, no awards, no team claims. Every factual assertion must exist in `src/content/facts.ts` and be traceable to the current live site or to Rob's explicit confirmation. Fresh presentation copy (headlines, CTAs, section framing) is allowed and must assert no new fact.
- **URL preservation.** These paths must resolve identically after migration: `/`, `/rewire/landing/`, `/rewire/contact/`, `/rewire/contact/thanks.html`, `/rewire/sample/` and all six demo subtrees, `/dispoint/**`, `/dosetrack/**`, `/contact/`, `/favicon.ico`, `/app-ads.txt`, `/robots.txt`, `/sitemap.xml`.
- **`.well-known/apple-app-site-association` must keep resolving at `/.well-known/apple-app-site-association` with no redirect.** It routes `/dispoint/d/*` to app ID `9VY7RCG6Y4.com.robbrown.dispoint` — every DisPoint share-a-deal link in the wild depends on it. Because the host is not changing, the only real risk is a build tool silently dropping the dot-directory; Task 1 asserts it byte-for-byte.
- **SEO parity or better on every page.** Canonical URL, Open Graph + Twitter card with a real image, and JSON-LD are required on both pages. No page may regress an existing `<title>` or `<meta name="description">`.
- **Palette (Brand, locked):** `--ground:#07060E` `--ground-2:#0C0A16` `--line:#221D3A` `--line-2:#332C55` `--ink:#EFEEF7` `--muted:#918DB0` `--dim:#615C82` `--volt:#7C6BFF` `--cyan:#38E1D6` `--ember:#FF8A4C` `--jade:#22C489` (Rewire only).
- **Type (locked):** Bricolage Grotesque (display) · Manrope (body) · IBM Plex Mono (data/labels). Self-hosted as `woff2`, `font-display:swap`.
- **Field runs at hero strength throughout the document** (Rob's explicit decision, made after seeing the alternative). Legibility is solved by content-aware attenuation, not by dimming the field globally.
- **Accessibility floor:** body text ≥ 4.5:1 and large text ≥ 3:1 measured against the *rendered composite* (field included), visible keyboard focus on every interactive element, semantic landmarks, real alt text, `prefers-reduced-motion` honoured everywhere.
- **Performance floor:** 60fps scroll on an M1 MacBook Air at 1440p; Lighthouse Performance ≥ 90 mobile on the home page; LCP ≤ 2.5s on Fast 3G.
- **360px minimum viewport.** No horizontal body scroll at any width ≥ 360px.
- **Never ship debug tooling.** `leva`, `stats.js`, `rstats` are build-time only. Their presence in a production bundle is a release-blocking bug.
- **Commit after every task.** Conventional commit prefixes (`feat:`, `fix:`, `chore:`, `test:`).

## Deploy model (no decision needed — nothing changes)

Astro builds to `dist/`. GitHub Pages publishes `master` directly today, so Task 1 adds a GitHub Actions workflow that builds and publishes `dist/` to Pages on push. `CNAME` and `.nojekyll` move into `public/` so they survive the build. Domain, DNS, host and TLS are all untouched.

`.nojekyll` matters more than it looks: without it, GitHub Pages runs Jekyll, which **strips directories beginning with a dot** — including `.well-known/`. That single file is what keeps the AASA route alive.

---

## File Structure

| Path | Responsibility |
|---|---|
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `.github/workflows/deploy.yml` | Build, test, publish to GitHub Pages |
| `src/content/facts.ts` | **Single source of truth.** Every fact, product, rule, demo model, contact address |
| `src/content/copy.ts` | Presentation copy (headlines, CTAs, framing) — asserts no facts |
| `src/styles/tokens.css` | Colour, type, spacing, layout custom properties |
| `src/styles/base.css` | Reset, typography scale, focus states, landmarks |
| `src/layouts/Base.astro` | `<head>`, fonts, skip link, nav/footer slots, field + spine mounts |
| `src/components/Nav.astro`, `Footer.astro` | Chrome |
| `src/components/CortexField.astro` | Island wrapper: canvas + mount call |
| `src/components/Spine.astro` | Island wrapper: SVG rail + mount call |
| `src/components/VentureRow.astro` | One evidence row, driven by `facts.ts` |
| `src/components/DemoDeck.astro` | Rewire's 3D deck island |
| `src/motion/tier.ts` | Device capability tiering (pure) |
| `src/motion/cortex/geometry.ts` | Fibre/cluster generation (pure) |
| `src/motion/cortex/pulses.ts` | Pulse advancement + arrival detection (pure) |
| `src/motion/cortex/attenuation.ts` | Content-aware dim rects (pure) |
| `src/motion/cortex/field.glsl.ts` | Fragment shader source |
| `src/motion/cortex/index.ts` | Imperative three.js shell |
| `src/motion/spine/geometry.ts` | Spine path + soma placement (pure) |
| `src/motion/spine/index.ts` | Imperative SVG shell |
| `src/motion/deck/layout.ts` | Deck card transforms (pure) |
| `src/motion/deck/index.ts` | Imperative deck shell |
| `src/pages/index.astro` | Home |
| `src/pages/rewire/landing.astro` | Rewire landing |
| `public/**` | Demo models, app landing pages, `.well-known`, icons — shipped verbatim |
| `tests/unit/**` | Vitest |
| `tests/e2e/**` | Playwright |

---

## Task 1: Astro conversion with URL and universal-link preservation

Nothing else can be verified until the site builds and serves the existing assets unchanged. This task deliberately changes *no* design.

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `playwright.config.ts`, `.github/workflows/deploy.yml`
- Move: `CNAME`, `.nojekyll` → `public/`
- Create: `src/pages/index.astro` (temporary passthrough of current markup)
- Move: `rewire/sample/**`, `dispoint/**`, `dosetrack/**`, `.well-known/**`, `contact/**`, `rewire/contact/**`, `favicon.ico`, `app-ads.txt` → `public/`
- Test: `tests/e2e/routes.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a GitHub Pages-deployable Astro site; `npm run build` → `dist/`; `npm run test:e2e` runs Playwright against a preview server.

- [ ] **Step 1: Write the failing route test**

```ts
// tests/e2e/routes.spec.ts
import { test, expect } from '@playwright/test';

const MUST_RESOLVE = [
  '/', '/rewire/landing/', '/rewire/contact/',
  '/rewire/sample/', '/rewire/sample/vernier/', '/rewire/sample/apex/',
  '/rewire/sample/forge/', '/rewire/sample/lumen/',
  '/rewire/sample/northbay/', '/rewire/sample/vale/',
  '/dispoint/', '/dosetrack/',
  '/robots.txt', '/sitemap.xml', '/app-ads.txt', '/favicon.ico',
];

for (const path of MUST_RESOLVE) {
  test(`${path} returns 200`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status(), `${path} must not 404`).toBe(200);
  });
}

test('apple-app-site-association survives the build unchanged', async ({ request }) => {
  const res = await request.get('/.well-known/apple-app-site-association', { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  const body = await res.json();
  // DisPoint share-a-deal universal links depend on this exact routing
  expect(body.applinks.details[0].appIDs).toContain('9VY7RCG6Y4.com.robbrown.dispoint');
  expect(body.applinks.details[0].components[0]['/']).toBe('/dispoint/d/*');
});

test('.nojekyll is present so Pages does not strip dot-directories', async ({ request }) => {
  expect((await request.get('/.nojekyll')).status()).toBe(200);
});

test('CNAME still pins the apex domain', async ({ request }) => {
  expect((await (await request.get('/CNAME')).text()).trim()).toBe('neurotrocity.com');
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx playwright test tests/e2e/routes.spec.ts`
Expected: FAIL — no Astro project exists yet, preview server cannot start.

- [ ] **Step 3: Scaffold Astro and move static assets**

```bash
npm init -y
npm i astro@^5 && npm i -D typescript vitest @playwright/test
mkdir -p public src/pages

git mv rewire/sample public/rewire-sample-tmp
mkdir -p public/rewire && git mv public/rewire-sample-tmp public/rewire/sample
git mv rewire/contact public/rewire/contact
git mv dispoint dosetrack contact .well-known public/
git mv favicon.ico app-ads.txt robots.txt CNAME .nojekyll public/
```

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://neurotrocity.com',
  build: { format: 'directory' },   // /rewire/landing/ not /rewire/landing.html
  trailingSlash: 'always',
});
```

`.github/workflows/deploy.yml` — replaces branch-publishing with a build step. Same host, same domain:

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [master] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Fail if the AASA file did not survive the build
        run: test -s dist/.well-known/apple-app-site-association
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**One manual step:** in the repo's Settings → Pages, switch Source from "Deploy from a branch" to "GitHub Actions". Until that's done the workflow builds but Pages keeps serving the old branch content.

`package.json` scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview --port 4321",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 4: Port the existing home markup verbatim**

Copy the current `index.html` `<body>` contents into `src/pages/index.astro` unchanged, and `rewire/landing/index.html` into `src/pages/rewire/landing.astro`. **No redesign in this task** — this exists solely to prove the migration is lossless.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run build && npm run test:e2e`
Expected: PASS — all 16 route assertions green, including the JSON content-type on `apple-app-site-association`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: convert to Astro on GitHub Pages, preserving all URLs and universal links

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Facts single source of truth + the honesty gate

The anti-fabrication principle becomes a test that fails the build, not a good intention.

**Files:**
- Create: `src/content/facts.ts`, `src/content/copy.ts`
- Test: `tests/unit/facts.test.ts`, `tests/e2e/honesty.spec.ts`

**Interfaces:**
- Produces: `PRODUCTS: Product[]`, `DEMOS: DemoModel[]`, `RULES: Rule[]`, `CONTACT`. Every later task imports facts from here and never hardcodes them.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/facts.test.ts
import { describe, it, expect } from 'vitest';
import { PRODUCTS, DEMOS, RULES, CONTACT } from '../../src/content/facts';

describe('facts', () => {
  it('has exactly the three real products', () => {
    expect(PRODUCTS.map(p => p.slug).sort()).toEqual(['dispoint', 'dosetrack', 'rewire']);
  });

  it('has exactly the six real demo models', () => {
    expect(DEMOS).toHaveLength(6);
  });

  it('labels every demo model with a resolved provenance', () => {
    for (const d of DEMOS) {
      expect(d.provenance).toBe('fictional');   // no real client behind any demo
    }
  });

  it('carries the four rules verbatim', () => {
    expect(RULES).toHaveLength(4);
    expect(RULES[0].title).toBe('Sharp, not sprawling.');
  });

  it('exposes no testimonial or metric fields', () => {
    const serialized = JSON.stringify({ PRODUCTS, DEMOS, RULES, CONTACT });
    for (const banned of ['testimonial', 'quote', 'rating', 'clients', 'increase', 'uplift']) {
      expect(serialized.toLowerCase()).not.toContain(banned);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/facts.test.ts`
Expected: FAIL — `Cannot find module '../../src/content/facts'`.

- [ ] **Step 3: Write `src/content/facts.ts`**

```ts
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
```

- [ ] **Step 4: Add the rendered-page honesty gate**

```ts
// tests/e2e/honesty.spec.ts
import { test, expect } from '@playwright/test';

const BANNED = [
  /\btestimonial/i, /\bclients? say\b/i, /★|⭐/,
  /\b\d+%\s*(increase|uplift|faster|more)\b/i,
  /\btrusted by\b/i, /\bas seen (in|on)\b/i,
];

for (const path of ['/', '/rewire/landing/']) {
  test(`${path} contains no fabricated social proof`, async ({ page }) => {
    await page.goto(path);
    const text = await page.locator('body').innerText();
    for (const re of BANNED) {
      expect(text, `${path} matched ${re}`).not.toMatch(re);
    }
  });

  test(`${path} images all have non-empty alt text`, async ({ page }) => {
    await page.goto(path);
    const imgs = page.locator('img:not([aria-hidden="true"])');
    for (let i = 0; i < await imgs.count(); i++) {
      expect((await imgs.nth(i).getAttribute('alt'))?.trim() ?? '').not.toBe('');
    }
  });
}
```

- [ ] **Step 5: Run both suites to verify they pass**

Run: `npx vitest run tests/unit/facts.test.ts && npx playwright test tests/e2e/honesty.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/content tests/unit/facts.test.ts tests/e2e/honesty.spec.ts
git commit -m "feat: facts single source of truth with anti-fabrication test gate

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Design system — tokens, self-hosted type, base layout

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/layouts/Base.astro`
- Create: `public/assets/fonts/{BricolageGrotesque,Manrope,IBMPlexMono}-*.woff2`
- Test: `tests/e2e/a11y-base.spec.ts`

**Interfaces:**
- Produces: `Base.astro` accepting props `{ title: string; description: string; accent?: 'volt'|'jade' }` and slots `default`, `nav`, `footer`.

- [ ] **Step 1: Write the failing accessibility test**

```ts
// tests/e2e/a11y-base.spec.ts
import { test, expect } from '@playwright/test';

test('skip link is the first focusable element and reaches main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveText(/skip to content/i);
  await focused.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('every interactive element has a visible focus ring', async ({ page }) => {
  await page.goto('/');
  const els = page.locator('a[href], button, input, [tabindex="0"]');
  for (let i = 0; i < await els.count(); i++) {
    await els.nth(i).focus();
    const outline = await els.nth(i).evaluate(
      (n) => getComputedStyle(n).outlineStyle + ' ' + getComputedStyle(n).outlineWidth
    );
    expect(outline).not.toMatch(/none|0px/);
  }
});

test('no horizontal overflow at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('landmarks are present exactly once', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header[role="banner"], body > header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/a11y-base.spec.ts`
Expected: FAIL — no skip link exists.

- [ ] **Step 3: Write `src/styles/tokens.css`**

```css
:root{
  --ground:#07060E; --ground-2:#0C0A16;
  --line:#221D3A;   --line-2:#332C55;
  --ink:#EFEEF7;    --muted:#918DB0;  --dim:#615C82;
  --volt:#7C6BFF;   --cyan:#38E1D6;   --ember:#FF8A4C; --jade:#22C489;

  --display:"Bricolage Grotesque",-apple-system,system-ui,sans-serif;
  --body:"Manrope",-apple-system,system-ui,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;

  --step--1:clamp(13px,.85vw + 11px,14.5px);
  --step-0: clamp(15.5px,.4vw + 15px,16.5px);
  --step-1: clamp(19px,.9vw + 17px,22px);
  --step-2: clamp(27px,3.7vw,44px);
  --step-3: clamp(36px,5.6vw,74px);

  --maxw:1180px; --pad:clamp(20px,4vw,56px); --gutter:96px;
}
```

- [ ] **Step 4: Write `src/styles/base.css` and `Base.astro`**

`base.css` must include the skip link and focus ring:

```css
.skip{
  position:absolute; left:-9999px; top:0; z-index:100;
  background:var(--volt); color:#fff; padding:12px 18px; border-radius:0 0 4px 0;
  font-weight:800;
}
.skip:focus{ left:0 }
:focus-visible{ outline:2px solid var(--cyan); outline-offset:3px; border-radius:2px }
main:focus{ outline:none }
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ animation-duration:.01ms !important; transition-duration:.01ms !important }
  html{ scroll-behavior:auto }
}
```

`Base.astro` renders `<a class="skip" href="#main">Skip to content</a>`, `<main id="main" tabindex="-1">`, and self-hosted `@font-face` rules pointing at `/assets/fonts/*.woff2`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/a11y-base.spec.ts`
Expected: PASS — 4 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/styles src/layouts public/assets/fonts tests/e2e/a11y-base.spec.ts
git commit -m "feat: design tokens, self-hosted type, accessible base layout

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: Device tiering

The field runs at full strength everywhere, so a weak device must get fewer fibres — not a different design.

**Files:**
- Create: `src/motion/tier.ts`
- Test: `tests/unit/tier.test.ts`

**Interfaces:**
- Produces: `detectTier(env: TierEnv): Tier` where `Tier = 'high'|'medium'|'low'|'none'` and `TierEnv = { hasWebgl2: boolean; deviceMemory?: number; hardwareConcurrency?: number; reducedMotion: boolean; maxTextureSize: number }`; `TIER_BUDGET: Record<Tier, { fibresPerCluster: number; maxPulses: number; dust: number; dpr: number }>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/tier.test.ts
import { describe, it, expect } from 'vitest';
import { detectTier, TIER_BUDGET } from '../../src/motion/tier';

const base = { hasWebgl2: true, deviceMemory: 8, hardwareConcurrency: 8, reducedMotion: false, maxTextureSize: 8192 };

describe('detectTier', () => {
  it('returns none without WebGL2', () => {
    expect(detectTier({ ...base, hasWebgl2: false })).toBe('none');
  });
  it('returns none when reduced motion is requested', () => {
    expect(detectTier({ ...base, reducedMotion: true })).toBe('none');
  });
  it('returns high on a capable machine', () => {
    expect(detectTier(base)).toBe('high');
  });
  it('drops to low on 2GB / 2 cores', () => {
    expect(detectTier({ ...base, deviceMemory: 2, hardwareConcurrency: 2 })).toBe('low');
  });
  it('drops to medium on 4 cores', () => {
    expect(detectTier({ ...base, deviceMemory: 4, hardwareConcurrency: 4 })).toBe('medium');
  });
  it('never exceeds dpr 2 and budgets decrease monotonically', () => {
    const order = ['high', 'medium', 'low'] as const;
    for (let i = 1; i < order.length; i++) {
      expect(TIER_BUDGET[order[i]].fibresPerCluster)
        .toBeLessThan(TIER_BUDGET[order[i - 1]].fibresPerCluster);
    }
    expect(TIER_BUDGET.high.dpr).toBeLessThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/tier.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/motion/tier.ts`**

```ts
export type Tier = 'high' | 'medium' | 'low' | 'none';

export interface TierEnv {
  hasWebgl2: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  reducedMotion: boolean;
  maxTextureSize: number;
}

export const TIER_BUDGET = {
  high:   { fibresPerCluster: 104, maxPulses: 300, dust: 440, dpr: 2 },
  medium: { fibresPerCluster: 64,  maxPulses: 180, dust: 260, dpr: 1.5 },
  low:    { fibresPerCluster: 34,  maxPulses: 90,  dust: 120, dpr: 1 },
  none:   { fibresPerCluster: 0,   maxPulses: 0,   dust: 0,   dpr: 1 },
} as const;

export function detectTier(env: TierEnv): Tier {
  if (!env.hasWebgl2 || env.reducedMotion || env.maxTextureSize < 2048) return 'none';
  const mem = env.deviceMemory ?? 4;
  const cores = env.hardwareConcurrency ?? 4;
  if (mem <= 2 || cores <= 2) return 'low';
  if (mem <= 4 || cores <= 4) return 'medium';
  return 'high';
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/unit/tier.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/motion/tier.ts tests/unit/tier.test.ts
git commit -m "feat: device capability tiering for the cortex field

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Cortex geometry and causal pulse simulation (pure)

The firing must be *caused* by arrivals, not scheduled. That property is what makes it read as a brain, so it gets a test.

**Files:**
- Create: `src/motion/cortex/geometry.ts`, `src/motion/cortex/pulses.ts`
- Test: `tests/unit/cortex-geometry.test.ts`, `tests/unit/cortex-pulses.test.ts`

**Interfaces:**
- Produces:
  - `buildClusters(budget: { fibresPerCluster: number }, rng: () => number): Cluster[]`
  - `interface Fibre { pts: Vec3[]; cluster: number; len: number }`, `interface Cluster { origin: Vec3; fibres: Fibre[]; accent: 'volt'|'cyan'|'ember' }`
  - `pointAt(f: Fibre, t: number): Vec3`
  - `advance(state: PulseState, dt: number): Arrival[]` mutating `state.pulses`, returning somata that were reached this frame.

- [ ] **Step 1: Write the failing geometry test**

```ts
// tests/unit/cortex-geometry.test.ts
import { describe, it, expect } from 'vitest';
import { buildClusters, pointAt } from '../../src/motion/cortex/geometry';

const rng = () => 0.5;   // deterministic

describe('buildClusters', () => {
  it('builds three clusters with the budgeted fibre count', () => {
    const cs = buildClusters({ fibresPerCluster: 10 }, rng);
    expect(cs).toHaveLength(3);
    for (const c of cs) expect(c.fibres).toHaveLength(10);
  });
  it('roots every fibre at its cluster origin', () => {
    for (const c of buildClusters({ fibresPerCluster: 5 }, rng)) {
      for (const f of c.fibres) expect(f.pts[0]).toEqual(c.origin);
    }
  });
  it('records a positive arc length matching the polyline', () => {
    const f = buildClusters({ fibresPerCluster: 1 }, Math.random)[0].fibres[0];
    let sum = 0;
    for (let i = 1; i < f.pts.length; i++) {
      const a = f.pts[i - 1], b = f.pts[i];
      sum += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    }
    expect(f.len).toBeCloseTo(sum, 5);
  });
});

describe('pointAt', () => {
  it('returns the origin at t=0 and the tip at t=1', () => {
    const f = buildClusters({ fibresPerCluster: 1 }, Math.random)[0].fibres[0];
    expect(pointAt(f, 0)).toEqual(f.pts[0]);
    const tip = pointAt(f, 1), last = f.pts[f.pts.length - 1];
    expect(tip.x).toBeCloseTo(last.x, 4);
  });
  it('is monotonic in arc length', () => {
    const f = buildClusters({ fibresPerCluster: 1 }, Math.random)[0].fibres[0];
    let prev = pointAt(f, 0), travelled = 0;
    for (let t = 0.1; t <= 1.0001; t += 0.1) {
      const p = pointAt(f, t);
      travelled += Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z);
      prev = p;
    }
    expect(travelled).toBeCloseTo(f.len, 1);
  });
});
```

- [ ] **Step 2: Write the failing pulse test — this is the causality gate**

```ts
// tests/unit/cortex-pulses.test.ts
import { describe, it, expect } from 'vitest';
import { buildClusters } from '../../src/motion/cortex/geometry';
import { advance, spawn, createState } from '../../src/motion/cortex/pulses';

const clusters = buildClusters({ fibresPerCluster: 4 }, Math.random);
const fibres = clusters.flatMap(c => c.fibres);

describe('pulse simulation', () => {
  it('reports an arrival only when an inbound pulse reaches the soma', () => {
    const s = createState(fibres, 50);
    spawn(s, 0, /* outward */ false);           // inbound, starts at t=1
    let arrivals = advance(s, 0.016);
    expect(arrivals).toHaveLength(0);           // still travelling
    for (let i = 0; i < 2000 && arrivals.length === 0; i++) arrivals = advance(s, 0.016);
    expect(arrivals).toEqual([{ cluster: fibres[0].cluster, fibre: 0 }]);
  });

  it('never reports an arrival for an outbound pulse', () => {
    const s = createState(fibres, 50);
    spawn(s, 0, true);
    for (let i = 0; i < 2000; i++) expect(advance(s, 0.016)).toHaveLength(0);
    expect(s.pulses).toHaveLength(0);           // it expired at the tip
  });

  it('respects the pulse budget', () => {
    const s = createState(fibres, 5);
    for (let i = 0; i < 50; i++) spawn(s, i % fibres.length, true);
    expect(s.pulses.length).toBeLessThanOrEqual(5);
  });

  it('is frame-rate independent', () => {
    const a = createState(fibres, 50), b = createState(fibres, 50);
    spawn(a, 0, true); spawn(b, 0, true);
    a.pulses[0].v = b.pulses[0].v = 0.5;
    for (let i = 0; i < 10; i++) advance(a, 0.032);
    for (let i = 0; i < 20; i++) advance(b, 0.016);
    expect(a.pulses[0]?.t ?? 1).toBeCloseTo(b.pulses[0]?.t ?? 1, 5);
  });
});
```

- [ ] **Step 3: Run both to verify they fail**

Run: `npx vitest run tests/unit/cortex-geometry.test.ts tests/unit/cortex-pulses.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement `geometry.ts` and `pulses.ts`**

```ts
// src/motion/cortex/geometry.ts
export interface Vec3 { x: number; y: number; z: number }
export interface Fibre { pts: Vec3[]; cluster: number; len: number }
export interface Cluster { origin: Vec3; fibres: Fibre[]; accent: 'volt' | 'cyan' | 'ember' }

const ORIGINS: { origin: Vec3; accent: Cluster['accent'] }[] = [
  { origin: { x: -1.62, y:  0.44, z:  0.30 }, accent: 'volt'  },
  { origin: { x:  1.48, y: -0.34, z: -0.55 }, accent: 'cyan'  },
  { origin: { x:  0.12, y:  1.16, z: -1.30 }, accent: 'ember' },
];

export function buildClusters(budget: { fibresPerCluster: number }, rng: () => number): Cluster[] {
  return ORIGINS.map((o, ci) => {
    const fibres: Fibre[] = [];
    for (let i = 0; i < budget.fibresPerCluster; i++) {
      const pts: Vec3[] = [o.origin];
      let dx = rng() - 0.5, dy = rng() - 0.5, dz = rng() - 0.5;
      const m = Math.hypot(dx, dy, dz) || 1, s0 = (0.30 + rng() * 0.34) / m;
      dx *= s0; dy *= s0; dz *= s0;
      const steps = 4 + (i % 4);
      let a = o.origin, len = 0;
      for (let s = 0; s < steps; s++) {
        dx += (rng() - 0.5) * 0.30; dy += (rng() - 0.5) * 0.30; dz += (rng() - 0.5) * 0.30;
        const b = { x: a.x + dx, y: a.y + dy, z: a.z + dz };
        len += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        pts.push(b); a = b;
      }
      fibres.push({ pts, cluster: ci, len });
    }
    return { origin: o.origin, fibres, accent: o.accent };
  });
}

export function pointAt(f: Fibre, t: number): Vec3 {
  const target = Math.max(0, Math.min(1, t)) * f.len;
  let acc = 0;
  for (let i = 1; i < f.pts.length; i++) {
    const a = f.pts[i - 1], b = f.pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    if (acc + seg >= target || i === f.pts.length - 1) {
      const lt = seg > 0 ? Math.max(0, Math.min(1, (target - acc) / seg)) : 0;
      return { x: a.x + (b.x - a.x) * lt, y: a.y + (b.y - a.y) * lt, z: a.z + (b.z - a.z) * lt };
    }
    acc += seg;
  }
  return f.pts[0];
}
```

```ts
// src/motion/cortex/pulses.ts
import type { Fibre } from './geometry';

export interface Pulse { f: number; t: number; v: number; dir: 1 | -1 }
export interface Arrival { cluster: number; fibre: number }
export interface PulseState { fibres: Fibre[]; pulses: Pulse[]; max: number }

export function createState(fibres: Fibre[], max: number): PulseState {
  return { fibres, pulses: [], max };
}

export function spawn(s: PulseState, fibreIndex: number, outward: boolean): void {
  if (s.pulses.length >= s.max) return;
  const len = s.fibres[fibreIndex].len || 1;
  s.pulses.push({
    f: fibreIndex,
    t: outward ? 0 : 1,
    v: (0.55 + Math.random() * 0.75) / len,
    dir: outward ? 1 : -1,
  });
}

/** Advances every pulse. Returns the somata reached by an INBOUND pulse this frame. */
export function advance(s: PulseState, dt: number): Arrival[] {
  const arrivals: Arrival[] = [];
  for (let i = s.pulses.length - 1; i >= 0; i--) {
    const p = s.pulses[i];
    p.t += p.v * p.dir * dt;
    if (p.t <= 0) {
      arrivals.push({ cluster: s.fibres[p.f].cluster, fibre: p.f });
      s.pulses.splice(i, 1);
    } else if (p.t >= 1) {
      s.pulses.splice(i, 1);          // outbound reached the tip — no arrival
    }
  }
  return arrivals;
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run tests/unit/cortex-geometry.test.ts tests/unit/cortex-pulses.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 6: Commit**

```bash
git add src/motion/cortex tests/unit/cortex-*.test.ts
git commit -m "feat: cortex geometry and causal pulse simulation

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Content-aware field attenuation

This is what makes "hero strength throughout" legible. Text blocks publish their bounds; the shader dims the field inside them with a soft falloff.

**Files:**
- Create: `src/motion/cortex/attenuation.ts`, `src/motion/cortex/field.glsl.ts`
- Test: `tests/unit/attenuation.test.ts`

**Interfaces:**
- Produces: `collectQuietRects(els: Element[], vw: number, vh: number): Float32Array` returning up to `MAX_RECTS` packed as `[cx, cy, halfW, halfH]` in **clip space** (−1..1, y up); `MAX_RECTS = 8`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/attenuation.test.ts
import { describe, it, expect } from 'vitest';
import { collectQuietRects, MAX_RECTS } from '../../src/motion/cortex/attenuation';

const rect = (x: number, y: number, w: number, h: number) =>
  ({ getBoundingClientRect: () => ({ left: x, top: y, width: w, height: h, right: x + w, bottom: y + h }) }) as unknown as Element;

describe('collectQuietRects', () => {
  it('maps a centred element to the clip-space origin', () => {
    const out = collectQuietRects([rect(250, 200, 500, 400)], 1000, 800);
    expect(out[0]).toBeCloseTo(0, 5);   // cx
    expect(out[1]).toBeCloseTo(0, 5);   // cy
    expect(out[2]).toBeCloseTo(0.5, 5); // halfW  (500/1000)
    expect(out[3]).toBeCloseTo(0.5, 5); // halfH  (400/800)
  });

  it('flips y so that a top-of-viewport element has positive cy', () => {
    const out = collectQuietRects([rect(0, 0, 100, 100)], 1000, 800);
    expect(out[1]).toBeGreaterThan(0);
  });

  it('drops fully offscreen elements', () => {
    const out = collectQuietRects([rect(0, -900, 100, 100)], 1000, 800);
    expect(out[2]).toBe(0);             // zero half-width == inactive slot
  });

  it('never emits more than MAX_RECTS', () => {
    const many = Array.from({ length: 40 }, (_, i) => rect(0, i * 10, 100, 20));
    expect(collectQuietRects(many, 1000, 800)).toHaveLength(MAX_RECTS * 4);
  });

  it('prioritises the elements nearest the viewport centre', () => {
    const far = rect(0, 700, 100, 40);
    const near = rect(0, 380, 100, 40);
    const out = collectQuietRects([far, near], 1000, 800);
    expect(Math.abs(out[1])).toBeLessThan(0.2);   // the near one took slot 0
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/attenuation.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `attenuation.ts`**

```ts
export const MAX_RECTS = 8;

export function collectQuietRects(els: Element[], vw: number, vh: number): Float32Array {
  const out = new Float32Array(MAX_RECTS * 4);
  const scored = els
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { r, dist: Math.abs(r.top + r.height / 2 - vh / 2) };
    })
    .filter(({ r }) => r.bottom > 0 && r.top < vh && r.width > 0 && r.height > 0)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, MAX_RECTS);

  scored.forEach(({ r }, i) => {
    const o = i * 4;
    out[o]     = ((r.left + r.width / 2) / vw) * 2 - 1;
    out[o + 1] = 1 - ((r.top + r.height / 2) / vh) * 2;
    out[o + 2] = (r.width / vw);
    out[o + 3] = (r.height / vh);
  });
  return out;
}
```

- [ ] **Step 4: Add the attenuation term to the fragment shader**

In `src/motion/cortex/field.glsl.ts`, after the field value is computed and before the colour mix:

```glsl
uniform vec4 uQuiet[8];   // cx, cy, halfW, halfH  (clip space)

float quietness(vec2 p){
  float q = 1.0;
  for(int i = 0; i < 8; i++){
    if(uQuiet[i].z <= 0.0) continue;
    vec2 d = abs(p - uQuiet[i].xy) - uQuiet[i].zw;
    // signed distance to the rect, negative inside
    float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    // 0 well inside the rect, 1 beyond the 0.10 falloff band
    q = min(q, smoothstep(-0.02, 0.10, sd));
  }
  return q;
}
```

then apply it: `field *= mix(0.16, 1.0, quietness(vUv * 2.0 - 1.0));`

The `0.16` floor is what preserves contrast under running text while leaving the field visibly present.

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run tests/unit/attenuation.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src/motion/cortex/attenuation.ts src/motion/cortex/field.glsl.ts tests/unit/attenuation.test.ts
git commit -m "feat: content-aware field attenuation keeps text legible at full field strength

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Spine geometry and the cortex island

**Files:**
- Create: `src/motion/spine/geometry.ts`, `src/motion/spine/index.ts`, `src/motion/cortex/index.ts`
- Create: `src/components/CortexField.astro`, `src/components/Spine.astro`
- Test: `tests/unit/spine-geometry.test.ts`

**Interfaces:**
- Produces: `spinePath(w: number, h: number): string`; `somaFraction(rect: DOMRectLike, vh: number): number`; `mountCortex(canvas: HTMLCanvasElement, opts: { tier: Tier }): { destroy(): void }` — the `WebGLRenderer` **must** be created with `preserveDrawingBuffer: true`, otherwise Task 10's `gl.readPixels` contrast test reads zeros and passes vacuously; `mountSpine(svg: SVGSVGElement, sections: HTMLElement[]): { destroy(): void }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/spine-geometry.test.ts
import { describe, it, expect } from 'vitest';
import { spinePath, somaFraction } from '../../src/motion/spine/geometry';

describe('spinePath', () => {
  it('starts above and ends below the viewport so it never shows an end cap', () => {
    const d = spinePath(96, 800);
    expect(d).toMatch(/^M [\d.]+ -40 /);
    expect(d).toContain('840');            // 800 + 40
  });
  it('scales horizontally with the gutter width', () => {
    expect(spinePath(96, 800)).not.toBe(spinePath(140, 800));
  });
});

describe('somaFraction', () => {
  const vh = 800;
  it('is 0 at the top of the viewport and 1 at the bottom', () => {
    expect(somaFraction({ top: 0, height: 10 }, vh)).toBeCloseTo(0, 2);
    expect(somaFraction({ top: vh, height: 10 }, vh)).toBeCloseTo(1, 2);
  });
  it('clamps rather than returning out-of-range values', () => {
    expect(somaFraction({ top: -5000, height: 10 }, vh)).toBe(0);
    expect(somaFraction({ top: 5000, height: 10 }, vh)).toBe(1);
  });
  it('anchors tall sections near their top third, not their centre', () => {
    const f = somaFraction({ top: 0, height: 4000 }, vh);
    expect(f).toBeLessThan(0.5);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/spine-geometry.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the geometry**

```ts
// src/motion/spine/geometry.ts
export interface DOMRectLike { top: number; height: number }

export function spinePath(w: number, h: number): string {
  const x = w * 0.52;
  return `M ${x} -40 ` +
    `C ${x - 22} ${h * 0.24} ${x + 24} ${h * 0.42} ${x} ${h * 0.56} ` +
    `C ${x - 20} ${h * 0.72} ${x + 18} ${h * 0.88} ${x} ${h + 40}`;
}

export function somaFraction(r: DOMRectLike, vh: number): number {
  const y = r.top + Math.min(r.height * 0.5, vh * 0.34);
  return Math.max(0, Math.min(1, y / Math.max(1, vh)));
}
```

- [ ] **Step 4: Write the imperative shells and Astro islands**

`src/motion/cortex/index.ts` owns the three.js renderer, composes `buildClusters` + `createState`/`advance` + `collectQuietRects`, drives soma flare **from the `Arrival[]` returned by `advance`**, and pushes `uQuiet` each frame. `mountCortex` returns `{ destroy }` that cancels the rAF loop, disposes geometries/materials and calls `renderer.dispose()`.

`src/components/CortexField.astro`:

```astro
---
---
<canvas id="field" aria-hidden="true"></canvas>
<script>
  import { mountCortex } from '../motion/cortex';
  import { detectTier } from '../motion/tier';

  const canvas = document.getElementById('field') as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2');
  const tier = detectTier({
    hasWebgl2: !!gl,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
  });
  if (tier === 'none') canvas.classList.add('static-fallback');
  else mountCortex(canvas, { tier });
</script>
<style>
  #field { position: fixed; inset: 0; z-index: 0; display: block; pointer-events: none; }
  #field.static-fallback {
    background: radial-gradient(72% 88% at 66% 30%, #1C1740, #07060E 72%);
  }
</style>
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run tests/unit/spine-geometry.test.ts && npm run build`
Expected: PASS — 5 tests; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/motion/spine src/motion/cortex/index.ts src/components tests/unit/spine-geometry.test.ts
git commit -m "feat: dendrite spine navigation and cortex field island

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Home page

**Files:**
- Create: `src/pages/index.astro`, `src/components/VentureRow.astro`, `src/content/copy.ts`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `Base.astro`, `CortexField.astro`, `Spine.astro`, `PRODUCTS`/`RULES`/`CONTACT` from `facts.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test('leads with the agency offer, not the venture list', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText(/honest software/i);
  const build = page.locator('#build');
  const proof = page.locator('#proof');
  expect((await build.boundingBox())!.y).toBeLessThan((await proof.boundingBox())!.y);
});

test('routes an SMB visitor to Rewire within the first two screens', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('a[href="/rewire/landing/"]').first();
  await expect(link).toBeVisible();
  expect((await link.boundingBox())!.y).toBeLessThan(page.viewportSize()!.height * 2);
});

test('surfaces the client-privacy stance as a heading-scale element', async ({ page }) => {
  await page.goto('/');
  const stance = page.locator('.stance p').first();
  await expect(stance).toContainText(/clients/i);
  const size = await stance.evaluate(n => parseFloat(getComputedStyle(n).fontSize));
  expect(size).toBeGreaterThan(18);
});

test('renders all four rules from facts', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#rules .rule')).toHaveCount(4);
});

test('page is visible at rest with no content parked at opacity 0', async ({ page }) => {
  await page.goto('/');
  const faded = await page.locator('main *').evaluateAll(
    ns => ns.filter(n => parseFloat(getComputedStyle(n).opacity) === 0 &&
                         (n.textContent ?? '').trim().length > 0).length
  );
  expect(faded).toBe(0);
});

test('logs no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.waitForTimeout(2500);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/home.spec.ts`
Expected: FAIL — the temporary passthrough page from Task 1 has no `#build` section.

- [ ] **Step 3: Build the page**

Sections in order, each `<section class="sec" data-soma="…">` so the spine picks them up automatically:
`hero` → `#build` (three services) → `#proof` (venture rows from `PRODUCTS` + the client-privacy stance) → `#rules` (from `RULES`) → `#contact` (`CONTACT.general`).

All running-text containers carry `data-quiet` so `collectQuietRects` finds them.

- [ ] **Step 4: Run to verify pass**

Run: `npx playwright test tests/e2e/home.spec.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/components/VentureRow.astro src/content/copy.ts tests/e2e/home.spec.ts
git commit -m "feat: agency-first home page on the cortex field

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 9: Rewire landing with the live 3D demo deck

Kills the six-JPEGs-in-front-of-six-live-demos leak. Only the focused card may run live.

**Files:**
- Create: `src/pages/rewire/landing.astro`, `src/components/DemoDeck.astro`, `src/motion/deck/layout.ts`, `src/motion/deck/index.ts`
- Test: `tests/unit/deck-layout.test.ts`, `tests/e2e/rewire.spec.ts`

**Interfaces:**
- Produces: `deckTransforms(count: number, offset: number): CardTransform[]` where `CardTransform = { x: number; z: number; rotY: number; opacity: number; scale: number; front: number }`.

- [ ] **Step 1: Write the failing layout test**

```ts
// tests/unit/deck-layout.test.ts
import { describe, it, expect } from 'vitest';
import { deckTransforms } from '../../src/motion/deck/layout';

describe('deckTransforms', () => {
  it('returns one transform per card', () => {
    expect(deckTransforms(6, 0)).toHaveLength(6);
  });
  it('has exactly one frontmost card', () => {
    const t = deckTransforms(6, 0);
    const max = Math.max(...t.map(c => c.front));
    expect(t.filter(c => c.front === max)).toHaveLength(1);
  });
  it('is periodic in the card count', () => {
    const a = deckTransforms(6, 0.5), b = deckTransforms(6, 6.5);
    a.forEach((c, i) => expect(c.x).toBeCloseTo(b[i].x, 6));
  });
  it('fades and shrinks cards toward the back', () => {
    for (const c of deckTransforms(6, 0)) {
      expect(c.opacity).toBeGreaterThanOrEqual(0.3);
      expect(c.opacity).toBeLessThanOrEqual(1);
      expect(c.scale).toBeLessThanOrEqual(1.1);
    }
  });
});
```

- [ ] **Step 2: Write the failing e2e test**

```ts
// tests/e2e/rewire.spec.ts
import { test, expect } from '@playwright/test';
import { DEMOS } from '../../src/content/facts';

test('every demo model is reachable from the deck', async ({ page }) => {
  await page.goto('/rewire/landing/');
  for (const d of DEMOS) {
    await expect(page.locator(`a[href="${d.href}"]`)).toHaveCount(1);
  }
});

test('at most one demo iframe is live at a time', async ({ page }) => {
  await page.goto('/rewire/landing/');
  await page.waitForTimeout(1500);
  expect(await page.locator('.deck-card iframe[src]:not([src=""])').count()).toBeLessThanOrEqual(1);
});

test('the deck is keyboard operable', async ({ page }) => {
  await page.goto('/rewire/landing/');
  const deck = page.locator('.deck');
  await deck.focus();
  const before = await deck.getAttribute('data-index');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  expect(await deck.getAttribute('data-index')).not.toBe(before);
});

test('each card states its provenance', async ({ page }) => {
  await page.goto('/rewire/landing/');
  const cards = page.locator('.deck-card');
  for (let i = 0; i < await cards.count(); i++) {
    await expect(cards.nth(i).locator('.provenance')).toHaveText(/fictional/i);
    await expect(cards.nth(i).locator('.provenance')).not.toHaveText(/de-identified/i);
  }
});
```

- [ ] **Step 3: Run both to verify they fail**

Run: `npx vitest run tests/unit/deck-layout.test.ts && npx playwright test tests/e2e/rewire.spec.ts`
Expected: FAIL — module not found; the current Rewire page has JPEG tiles, no `.deck-card`.

- [ ] **Step 4: Implement**

```ts
// src/motion/deck/layout.ts
export interface CardTransform { x: number; z: number; rotY: number; opacity: number; scale: number; front: number }

export function deckTransforms(count: number, offset: number): CardTransform[] {
  const out: CardTransform[] = [];
  for (let i = 0; i < count; i++) {
    const a = (((i - offset) % count) + count) % count;
    const ang = (a / count) * Math.PI * 2;
    const z = Math.cos(ang) * 2.35 - 0.4;
    const front = (z + 2.75) / 5.5;
    out.push({
      x: Math.sin(ang) * 2.35,
      z,
      rotY: Math.sin(ang) * 0.62,
      opacity: 0.30 + front * 0.70,
      scale: 0.78 + front * 0.30,
      front,
    });
  }
  return out;
}
```

`DemoDeck.astro` renders six `<a class="deck-card">` anchors (real links — the deck degrades to a plain list without JS), each with a `<span class="provenance">` from `DEMOS[i].provenance`, a poster `<img>`, and an empty `<iframe>` hydrated with `src` **only** when that card becomes frontmost. `ArrowLeft`/`ArrowRight` change `data-index` on the container; the container is `tabindex="0"` with `role="listbox"`.

Rewire keeps the jade accent and the `--ground-2` base; the cortex field runs here too, tinted jade, at the same strength.

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run tests/unit/deck-layout.test.ts && npx playwright test tests/e2e/rewire.spec.ts`
Expected: PASS — 8 tests.

- [ ] **Step 6: Commit**

```bash
git add src/pages/rewire src/components/DemoDeck.astro src/motion/deck tests/unit/deck-layout.test.ts tests/e2e/rewire.spec.ts
git commit -m "feat: Rewire landing with live 3D demo deck replacing static tiles

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 10: Quality floor — contrast, motion, performance, SEO

The release gate. Every Global Constraint that can be machine-checked becomes a test here.

**Files:**
- Create: `tests/e2e/quality.spec.ts`, `public/sitemap.xml` (regenerated)
- Modify: `.github/workflows/deploy.yml` (add the Lighthouse budget check)

- [ ] **Step 1: Write the failing test**

```ts
// tests/e2e/quality.spec.ts
import { test, expect } from '@playwright/test';

// Samples the ACTUAL composited pixels behind text — the field is included,
// which is the whole point of the content-aware attenuation.
async function contrastUnderText(page: any, selector: string) {
  return page.evaluate(async (sel: string) => {
    const el = document.querySelector(sel)!;
    const r = el.getBoundingClientRect();
    const canvas = document.getElementById('field') as HTMLCanvasElement | null;
    if (!canvas) return 21;
    const gl = canvas.getContext('webgl2')!;
    const px = new Uint8Array(4);
    gl.readPixels(
      Math.round((r.left + r.width / 2) * devicePixelRatio),
      Math.round((canvas.height - (r.top + r.height / 2) * devicePixelRatio)),
      1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px
    );
    const lum = (c: number[]) => {
      const [R, G, B] = c.map(v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    const bg = lum([px[0], px[1], px[2]]);
    const fg = lum([0xEF, 0xEE, 0xF7]);
    return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  }, selector);
}

for (const path of ['/', '/rewire/landing/']) {
  test(`${path} keeps body text above 4.5:1 against the live field`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(2000);
    expect(await contrastUnderText(page, '[data-quiet] p')).toBeGreaterThanOrEqual(4.5);
  });

  test(`${path} holds a still frame under prefers-reduced-motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    const a = await page.screenshot();
    await page.waitForTimeout(1200);
    expect(Buffer.compare(a, await page.screenshot())).toBe(0);
  });

  test(`${path} ships no debug tooling`, async ({ page }) => {
    await page.goto(path);
    const found = await page.evaluate(
      () => ['Stats', 'leva', 'rstats'].filter(k => k in window)
    );
    expect(found).toEqual([]);
  });
}

```

*(SEO assertions live in Task 10a below.)*

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/quality.spec.ts`
Expected: FAIL — sitemap omits every Rewire URL (the Gate-2 defect).

- [ ] **Step 3: Tune the attenuation floor**

If the contrast test fails, lower the shader's attenuation floor from `0.16` until it passes — do **not** dim the field globally. Full-strength field is a locked constraint.

- [ ] **Step 4: Run the full suite**

Run: `npm run test && npm run test:e2e`
Expected: PASS — all suites green.

- [ ] **Step 5: Measure performance against the floor**

Run: `npx lighthouse http://localhost:4321/ --preset=desktop --only-categories=performance`
Expected: Performance ≥ 90. Profile GPU frame time in DevTools, not just the main thread — a 3D scene can hit 60fps on the CPU and still stutter on the GPU.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/quality.spec.ts .github/workflows/deploy.yml
git commit -m "test: contrast, reduced-motion, debug-tooling and sitemap release gates

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 10a: Full SEO — canonicals, social cards, structured data, generated sitemap

Audited 2026-09-03. Present and correct today: `<title>`, `<meta name="description">`, `lang="en"`, exactly one `<h1>` per page, alt text on all six Rewire images. **Absent entirely:** canonical tags, Open Graph, Twitter cards, JSON-LD, and every Rewire URL in the sitemap.

**Files:**
- Create: `src/components/Seo.astro`, `src/pages/sitemap.xml.ts`, `src/pages/og/[page].png.ts`
- Modify: `src/layouts/Base.astro`, `public/robots.txt`
- Test: `tests/e2e/seo.spec.ts`

**Interfaces:**
- Produces: `Seo.astro` with props `{ title: string; description: string; path: string; ogImage?: string; jsonLd?: object }`, rendered in `<head>` by `Base.astro`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/e2e/seo.spec.ts
import { test, expect } from '@playwright/test';
import { DEMOS, PRODUCTS } from '../../src/content/facts';

const PAGES = [
  { path: '/',                 canonical: 'https://neurotrocity.com/' },
  { path: '/rewire/landing/',  canonical: 'https://neurotrocity.com/rewire/landing/' },
];

for (const p of PAGES) {
  test(`${p.path} declares a self-referencing canonical`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', p.canonical);
  });

  test(`${p.path} has a complete Open Graph card`, async ({ page }) => {
    await page.goto(p.path);
    for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name']) {
      const c = await page.locator(`meta[property="${prop}"]`).getAttribute('content');
      expect(c?.trim(), `${p.path} missing ${prop}`).toBeTruthy();
    }
    await expect(page.locator('meta[name="twitter:card"]'))
      .toHaveAttribute('content', 'summary_large_image');
  });

  test(`${p.path} og:image resolves and is 1200x630`, async ({ page, request }) => {
    await page.goto(p.path);
    const src = (await page.locator('meta[property="og:image"]').getAttribute('content'))!;
    const res = await request.get(src);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/image\/(png|jpeg)/);
    const { width, height } = await page.evaluate((u: string) => new Promise<any>(r => {
      const i = new Image();
      i.onload = () => r({ width: i.naturalWidth, height: i.naturalHeight });
      i.src = u;
    }), src);
    expect([width, height]).toEqual([1200, 630]);
  });

  test(`${p.path} emits valid JSON-LD`, async ({ page }) => {
    await page.goto(p.path);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      const parsed = JSON.parse(b);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBeTruthy();
    }
  });
}

test('home declares the Organization', async ({ page }) => {
  await page.goto('/');
  const types = (await page.locator('script[type="application/ld+json"]').allTextContents())
    .map(b => JSON.parse(b)['@type']);
  expect(types).toContain('Organization');
});

test('Rewire declares a Service, not an Organization', async ({ page }) => {
  await page.goto('/rewire/landing/');
  const types = (await page.locator('script[type="application/ld+json"]').allTextContents())
    .map(b => JSON.parse(b)['@type']);
  expect(types).toContain('Service');
});

test('sitemap is generated from facts and covers every indexable URL', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const required = [
    '/', '/rewire/landing/', '/rewire/contact/', '/contact/',
    ...PRODUCTS.map(p => p.path),
    ...DEMOS.map(d => d.href),
  ];
  for (const loc of required) {
    expect(xml, `sitemap missing ${loc}`).toContain(`https://neurotrocity.com${loc}`);
  }
});

test('every sitemap URL returns 200 — no orphans', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  expect(locs.length).toBeGreaterThan(10);
  for (const loc of locs) {
    const path = new URL(loc).pathname;
    expect((await request.get(path)).status(), `${path} is in the sitemap but 404s`).toBe(200);
  }
});

test('robots.txt allows crawling and points at the sitemap', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toContain('Sitemap: https://neurotrocity.com/sitemap.xml');
  expect(txt).not.toMatch(/Disallow:\s*\/\s*$/m);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/seo.spec.ts`
Expected: FAIL on every assertion — no canonical, no OG, no JSON-LD, and the sitemap omits all 8 Rewire URLs.

- [ ] **Step 3: Write `src/components/Seo.astro`**

```astro
---
export interface Props {
  title: string; description: string; path: string;
  ogImage?: string; jsonLd?: Record<string, unknown>;
}
const { title, description, path, ogImage = '/og/home.png', jsonLd } = Astro.props;
const canonical = new URL(path, 'https://neurotrocity.com').href;
const image = new URL(ogImage, 'https://neurotrocity.com').href;
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="NeuroTrocity" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={image} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={image} />

{jsonLd && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />}
```

- [ ] **Step 4: Add the JSON-LD payloads**

Home (`Organization` — every field traceable to `facts.ts`, no invented claims):

```ts
{
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NeuroTrocity',
  url: 'https://neurotrocity.com/',
  email: CONTACT.general,
  description: 'Software studio building websites and iOS apps.',
  address: { '@type': 'PostalAddress', addressCountry: 'AU' },
  makesOffer: PRODUCTS.map(p => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'SoftwareApplication', name: p.slug, url: `https://neurotrocity.com${p.path}` },
  })),
}
```

Rewire (`Service`):

```ts
{
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Rewire',
  serviceType: 'Website design and rebuild',
  provider: { '@type': 'Organization', name: 'NeuroTrocity', url: 'https://neurotrocity.com/' },
  areaServed: { '@type': 'Country', name: 'Australia' },
  url: 'https://neurotrocity.com/rewire/landing/',
}
```

**No `aggregateRating`, no `review`.** Both are the classic invented-proof vector and would fail Task 2's honesty gate.

- [ ] **Step 5: Generate the sitemap and OG images from facts**

`src/pages/sitemap.xml.ts` builds every `<loc>` from `PRODUCTS` + `DEMOS` + a static page list, with `lastmod` from git commit time. It can never drift again — Step 1's orphan test cross-checks every emitted URL against a live 200.

`src/pages/og/[page].png.ts` renders 1200×630 cards using the locked palette and Bricolage Grotesque: page title, the NeuroTrocity mark, and a still frame of the cortex field. Home and Rewire get one each. The existing `_build/og-*.html` generators for the app pages are left alone.

- [ ] **Step 6: Run to verify pass**

Run: `npx playwright test tests/e2e/seo.spec.ts`
Expected: PASS — 12 tests.

- [ ] **Step 7: Commit**

```bash
git add src/components/Seo.astro src/pages/sitemap.xml.ts src/pages/og src/layouts/Base.astro public/robots.txt tests/e2e/seo.spec.ts
git commit -m "feat: canonicals, social cards, JSON-LD and a fact-generated sitemap

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 11: Provenance map and staged deploy

**Files:**
- Create: `docs/provenance.md`

- [ ] **Step 1: Write the provenance map**

A table of every asset and factual claim on both pages: what it is, where it came from (live site / `facts.ts` / abstract brand element), and whether it is real or generated. Every WebGL visual is an abstract brand element and must be marked as such. Zero rows may read "invented fact."

- [ ] **Step 2: Review on a branch preview, not the apex domain**

Push to a `reimagine` branch and review the Actions build artifact locally via `npm run preview`. Nothing reaches neurotrocity.com until Rob approves — the workflow only publishes on `master`.

- [ ] **Step 3: Verify the universal-link route survived the build**

```bash
npm run build
test -s dist/.well-known/apple-app-site-association && \
  python3 -c "import json;d=json.load(open('dist/.well-known/apple-app-site-association'));print(d['applinks']['details'][0]['appIDs'])"
```
Expected: `['9VY7RCG6Y4.com.robbrown.dispoint']`. If `dist/.well-known/` is missing, `.nojekyll` did not make it into `public/` — fix before merging or DisPoint share links break silently.

- [ ] **Step 4: Post-merge live verification**

```bash
curl -sI https://neurotrocity.com/.well-known/apple-app-site-association | head -3
curl -s  https://neurotrocity.com/sitemap.xml | grep -c '<loc>'
```
Expected: `200`; sitemap `<loc>` count ≥ 14.

- [ ] **Step 5: Submit the new sitemap**

Resubmit `https://neurotrocity.com/sitemap.xml` in Google Search Console so the six demo models and the Rewire landing page get crawled — they have never been indexed.

- [ ] **Step 6: Commit**

```bash
git add docs/provenance.md
git commit -m "docs: provenance map for the reimagined pages

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Open questions blocking release

These are carried from Gate ② and must be answered before the site goes live on the apex domain:

1. ~~Vale & Vine provenance~~ **Resolved 2026-09-03:** all six demo brands are fictional. The live site's five `De-identified` labels are a defect this plan corrects.
2. ~~DoseTrack claim~~ **Resolved 2026-09-03:** "free for your first five meds, forever" confirmed accurate.
3. **One manual GitHub setting.** Settings → Pages → Source must change from "Deploy from a branch" to "GitHub Actions" when Task 1 merges. Rob has to click this; the workflow cannot.

*(Hosting is resolved — GitHub Pages, unchanged. See the Hosting block at the top.)*

---

## Plan 2 — Site Review service (Tier 3), written separately

Scope, for reference: a **Cloudflare Worker on `api.neurotrocity.com`** (one CNAME in Squarespace DNS; alternative is Google Cloud Run given the existing Workspace billing) accepting a URL, validating it against an SSRF denylist (no private ranges, no redirects into them), calling the PageSpeed Insights API for **real measured** Core Web Vitals and mobile-usability data, rendering a plain-language report, emailing it, and persisting the lead. Rate-limited per IP. Testable independently of every page in this plan, and it touches nothing GitHub Pages serves.

Honesty note: the report contains real measurements of the prospect's own site. No NeuroTrocity metric is asserted anywhere in it.

---

## Self-review

- **Spec coverage:** Astro conversion on the existing host (T1) · anti-fabrication (T2, T11) · design system (T3) · tiering (T4) · cortex + causal firing (T5) · full-strength field with legibility (T6) · spine navigation (T7) · home (T8) · Rewire + deck (T9) · quality floor (T10) · full SEO incl. the sitemap defect (T10a) · provenance + safe deploy (T11). Tier 3 is explicitly deferred to Plan 2 rather than left implicit.
- **Correction applied 2026-09-03:** the first draft proposed migrating to Netlify. That was wrong — DNS and headers confirm GitHub Pages hosts the site and Squarespace is registrar/DNS only. All Netlify references are removed; the host does not change.
- **Placeholder scan:** the only `TBD`-shaped item is the Vale & Vine provenance value, which is deliberately encoded as a real value plus a blocking open question rather than left blank.
- **Type consistency:** `Fibre`/`Cluster`/`Vec3` (T5) are consumed unchanged by T7; `PulseState`/`Arrival` (T5) drive soma flare in T7; `MAX_RECTS = 8` (T6) matches `uniform vec4 uQuiet[8]`; `Tier`/`TIER_BUDGET` (T4) are consumed by `mountCortex` (T7) and `buildClusters` (T5); `DemoModel.provenance` (T2) is asserted by the T9 e2e test.
