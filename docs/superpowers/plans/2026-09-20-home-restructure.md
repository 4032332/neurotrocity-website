# Home Page Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the home page from five blocks to three — hero, *What we build*, *Start a project* — replacing the venture list and the four rules with a full-width conversion section built on a new `ENGAGEMENT` fact.

**Architecture:** The home page is an Astro page (`src/pages/index.astro`) whose every string comes from `HOME` in `src/content/copy.ts`, which in turn interpolates facts from `src/content/facts.ts`. Nothing is typed into markup. So the work is: add one fact, rewrite the `HOME` object, delete two `<section>`s and their CSS, delete a now-orphaned component, and repair the tests that assert against the removed DOM.

**Tech Stack:** Astro 5, TypeScript, Vitest (unit), Playwright (e2e). No new dependencies.

## Global Constraints

- **`RULES` must not change.** All four entries stay in `facts.ts`. The apps page (`APPS_PAGE.contact.sub`) and the Rewire page both read from it. `tests/unit/facts.test.ts` asserts `RULES` has length 4 and `RULES[0].title` — both must stay green, untouched.
- **Every factual noun traces to `facts.ts`.** This is the rule stated at the top of `copy.ts`. New copy asserts no client names, no numbers, no outcomes, no metrics.
- **Counts are derived, never typed.** `asWord(APPS.length)`, not the numeral "two".
- **Commit after every task.** Attribution line on every commit: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Unit test command:** `npm test` (runs `astro check && vitest run --passWithNoTests`)
- **E2E test command:** `npm run test:e2e` (Playwright; starts its own server per `playwright.config.ts`)

---

## PREREQUISITE — read before Task 1

`git pull --rebase` on `master` was already done (master is at `fe78125` or later, and `src/pages/apps.astro` exists). If `src/pages/apps.astro` is missing, **stop** — the branch is stale and every file below has moved.

Verify: `ls src/pages/apps.astro` → the file exists.

---

## TWO TRAPS — both will silently destroy the page if missed

**Trap 1: `.pane` is defined inside the `#proof` CSS block.**

`src/pages/index.astro` has a comment banner `/* ── #proof: ventures as evidence, then the stance ── */` at line ~114. The rules underneath it are **not** all `#proof` rules. `.pane` — the translucent sheet used by *every* section on *every* page of the site, plus the footer — is declared there, as are `.pane + .man, .pane + .svc, .pane + .deck`.

Deleting "the `#proof` CSS block" wholesale removes `.pane` and flattens the entire site.

**Delete only these selectors:** `.man`, `.stance`, `.stance p`, `.stance p em`, `.stance .note`, `.rules` (both declarations), `.rule`, `.rule b`.
**Keep:** `.pane`, and `.pane + .svc` / `.pane + .deck` inside the combined rule.

**Trap 2: `.stance` exists on three pages.**

`tests/e2e/quality.spec.ts` has `.stance p` in `HOME_CASES` **and** in `REWIRE_CASES`, and `.stance .note` in `APPS_CASES`. The Rewire landing page and the apps page have their own stance blocks that are **not** being removed.

**Only `HOME_CASES` changes.** `REWIRE_CASES` and `APPS_CASES` stay exactly as they are.

> **Spec correction:** the spec said "three contrast probes, `.stance p` ×2 and `.stance .note`". That was wrong. The three *home* probes that break are `.vrow .ds` (the VentureRow class), `.rule`, and `.stance p` — all three in `HOME_CASES` only.

---

## Task 1: Add the `ENGAGEMENT` fact

**Files:**
- Modify: `src/content/facts.ts` (insert after the `CONTACT` block, ~line 61)
- Test: `tests/unit/facts.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `ENGAGEMENT: { readonly conversation: string; readonly quote: string }`, exported from `src/content/facts.ts`. Task 3 reads both fields.

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/facts.test.ts`, inside the existing `describe('facts', ...)` block, after the `'carries the four rules verbatim'` test. Also add `ENGAGEMENT` to the import on line 2.

```ts
  it('states how we engage, once', () => {
    expect(ENGAGEMENT.conversation).toContain('free conversation');
    expect(ENGAGEMENT.quote).toContain('fixed quote');
  });

  it('promises conduct, not outcomes', () => {
    const words = `${ENGAGEMENT.conversation} ${ENGAGEMENT.quote}`;
    expect(words).not.toMatch(/\d+%|\bx\b|guarantee[sd]? (?:you|results)/i);
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/facts.test.ts`
Expected: FAIL — `ENGAGEMENT` is not exported from `../../src/content/facts`.

- [ ] **Step 3: Add the fact**

In `src/content/facts.ts`, directly after the closing `} as const;` of `CONTACT`:

```ts
/**
 * How an engagement starts, and what it costs to find out.
 *
 * These are promises about our own conduct — not claims about results — which
 * is why they live here with the other facts rather than being typed into a
 * page's copy. Stated once so the next page that talks about pricing quotes
 * the same words rather than inventing its own.
 */
export const ENGAGEMENT = {
  conversation: 'A free conversation about what you need — no charge, no obligation.',
  quote: 'One fixed quote, agreed upfront. No hidden expenses, no surprise invoices.',
} as const;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, all suites. `RULES` tests still green.

- [ ] **Step 5: Commit**

```bash
git add src/content/facts.ts tests/unit/facts.test.ts
git commit -m "feat(facts): state how an engagement starts and what it costs

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Hoist `APPS` above `HOME`

**Files:**
- Modify: `src/content/copy.ts` (move line 226; it currently sits above `APPS_PAGE`)

**Interfaces:**
- Consumes: `PRODUCTS` from `./facts`
- Produces: `const APPS` in module scope, visible to `HOME`. Task 3 calls `asWord(APPS.length)`.

**Why this is its own task:** it is a pure move with zero behaviour change, so it can be verified green on its own. Bundled into Task 3 it would be noise inside a large copy diff.

- [ ] **Step 1: Cut the declaration**

Delete line 226 of `src/content/copy.ts`:

```ts
const APPS = PRODUCTS.filter((p) => p.slug !== 'rewire');
```

Leave the doc comment above `APPS_PAGE` (lines 220–225) exactly where it is.

- [ ] **Step 2: Paste it above `HOME`**

Insert after line 16 (`const personRule = RULES[3];`) and before `export interface Service {`:

```ts
/**
 * The products that appear on /apps/. Rewire is a service with its own page,
 * so it is not an app. Declared here rather than beside APPS_PAGE because the
 * home page's service blurb counts them too.
 */
const APPS = PRODUCTS.filter((p) => p.slug !== 'rewire');
```

- [ ] **Step 3: Verify nothing broke**

Run: `npm test`
Expected: PASS. This is a move; `astro check` proves the reference in `APPS_PAGE` still resolves.

- [ ] **Step 4: Commit**

```bash
git add src/content/copy.ts
git commit -m "refactor(copy): hoist APPS so the home page can count them

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Rewrite the `HOME` copy object

**Files:**
- Modify: `src/content/copy.ts` lines 10, 37–45 (nav), 56–57 (hero), 78–85 (service blurb), 89–118 (proof/rules/contact)

**Interfaces:**
- Consumes: `ENGAGEMENT` (Task 1), `APPS` (Task 2)
- Produces: `HOME.contact` gains `steps: ReadonlyArray<{ title: string; body: string }>`. `HOME.proof` and `HOME.rules` cease to exist. Task 4 destructures `{ meta, nav, hero, build, contact, footer }` — **no `proof`, no `rules`**.

**Note:** this task leaves the repo red. `index.astro` still references `HOME.proof` and `HOME.rules`, so `astro check` fails until Task 4. That is expected and correct — the two are one atomic change split for reviewability. **Do not commit between 3 and 4.** Run the gate at the end of Task 4.

- [ ] **Step 1: Update the import**

Line 10 — add `ENGAGEMENT`:

```ts
import { PRODUCTS, RULES, CONTACT, DEMOS, ENGAGEMENT, REWIRE, SKILL_PACK, type Provenance } from './facts';
```

- [ ] **Step 2: Cut the dead rule aliases**

Lines 15–16 currently read:

```ts
const dataRule = RULES[2];     // "Your data stays yours."
const personRule = RULES[3];   // "Answered by a person."
```

Both existed only for the home page's service blurb, which Step 4 rewrites. Delete **both lines**.

Then run `grep -n "dataRule\|personRule" src/content/copy.ts`. If either name still appears (it does — `APPS_PAGE.contact.sub` uses `personRule`), **restore only the one still used** and delete the other. Expected outcome: `personRule` stays, `dataRule` goes.

- [ ] **Step 3: Rewrite `nav` (lines 37–45)**

```ts
  nav: {
    links: [
      { label: 'Rewire', href: rewire.path },
      { label: 'Apps', href: '/apps/' },
    ],
    cta: { label: 'Start a project', href: '#contact' },
  },
```

`rewire.path` is `/rewire/landing/` — derived, not typed, and it keeps `home.spec.ts`'s "routes an SMB visitor to Rewire" test green from the very top of the page.

- [ ] **Step 4: Delete the hero's ghost button (line 57)**

Delete this line entirely:

```ts
    ghost: { label: 'See the proof', href: '#proof' },
```

Leave `primary` on line 56 as it is.

- [ ] **Step 5: Rewrite the second service blurb (lines 78–85)**

Replace the `blurb` and the two comment lines above it inside `services[1]`:

```ts
      {
        n: 'Service 02',
        title: 'iOS & web apps',
        href: '/apps/',
        // Count derives from APPS — two today, three when Wall Estate lands.
        // Never type the numeral; it would be false the moment APPS changes.
        blurb: `Shipped on iPhone, Apple Watch and the web. ${asWord(APPS.length)} of them are ours, and you can open and use them right now.`,
        accent: 'cyan',
      },
```

- [ ] **Step 6: Delete `proof` and `rules`, rewrite `contact` (lines 89–118)**

Delete the whole `proof: { ... },` block and the whole `rules: { ... },` block. Replace the `contact` block with:

```ts
  contact: {
    eyebrow: '02 — Start a project',
    heading: 'Almost everything that wastes your time has a simple software solution.',
    lede:
      'The job that takes an hour and should take five minutes. The spreadsheet three people keep in sync by hand. The form you retype into another system. Most of it is a small app or a website away from being over — and in 2026 building that is faster and cheaper than it has ever been. That is the whole reason this is worth a conversation.',
    // Both bodies are ENGAGEMENT verbatim: promises about our conduct, stated
    // once in facts.ts. The titles are framing and assert nothing.
    steps: [
      { title: 'First, a conversation.', body: ENGAGEMENT.conversation },
      { title: 'Then, a number.', body: ENGAGEMENT.quote },
    ],
    // Live-site line, verbatim; restates RULES[3].
    sub: 'A person reads every message and replies. No ticket queue, no bot.',
    email: CONTACT.general,
  },
```

`heading` is now a statement, not a question — the section argues rather than greets.

**Watch the two body fields.** `lede` is the new paragraph; `sub` keeps its old
name and its exact words. Task 4 renders them in the opposite order to what the
names suggest: `contact.lede` goes into `<p class="sub">` (it is the paragraph
directly under the heading, which is what that class styles everywhere on the
site), and `contact.sub` goes into `<p class="close">` at the foot of the
section. So the `.contact .sub` contrast probe in `quality.spec.ts` keeps
matching an element, but it is now measuring the lede. Both are `--muted` at the
same size, so the 4.5 threshold still applies unchanged.

- [ ] **Step 7: Do NOT commit — go straight to Task 4**

`npm test` fails here with `astro check` errors about `proof` and `rules`. Expected.

---

## Task 4: Rewrite `index.astro`

**Files:**
- Modify: `src/pages/index.astro` — line 3 (import), line 7 (destructure), ~114–144 (CSS), ~146–155 (contact CSS), ~218–250 (sections), ~252–261 (contact markup)
- Delete: `src/components/VentureRow.astro`

**Interfaces:**
- Consumes: `HOME.contact.steps` (Task 3)
- Produces: a home page with exactly two `<section>` elements, `#build` then `#contact`. Task 5 asserts this.

- [ ] **Step 1: Drop the VentureRow import (line 3)**

Delete:

```ts
import VentureRow from '../components/VentureRow.astro';
```

- [ ] **Step 2: Fix the destructure (line 7)**

```ts
const { meta, nav, hero, build, contact, footer } = HOME;
```

`proof` and `rules` are gone. Leave the `PRODUCTS` import alone — the JSON-LD `makesOffer` on line ~17 still uses it.

- [ ] **Step 3: Delete the two sections (markup, ~218–250)**

Delete the entire `<!-- proof -->` block — from the comment through `</section>`, including the `.pane`, the `.man` wrapper with its `PRODUCTS.map`, and the `.stance` div.

Delete the entire `<!-- how we work -->` block — from the comment through `</section>`.

- [ ] **Step 4: Rewrite the contact markup (~252–261)**

```astro
<!-- start a project -->
<section class="sec contact" id="contact" data-soma="Start a project">
  <div class="wrap">
    <div class="pane">
      <p class="mono eyebrow">{contact.eyebrow}</p>
      <h2>{contact.heading}</h2>
      <p class="sub">{contact.lede}</p>
    </div>
    <div class="steps">
      {contact.steps.map((s) => (
        <div>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </div>
      ))}
    </div>
    <p class="close">{contact.sub}</p>
    <a class="say" href={`mailto:${contact.email}`}>{contact.email}</a>
  </div>
</section>
```

The `.copy` wrapper is gone — the section is full-width now, so the pane fills `.wrap` exactly as `#build`'s does. `data-soma` changes from `"Contact"` to `"Start a project"`; the spine reads it from the DOM and relabels itself with no code change.

- [ ] **Step 5: Delete the dead CSS — READ TRAP 1 ABOVE FIRST**

In the block under `/* ── #proof ── */`, delete **only**: `.man`, `.stance`, `.stance p`, `.stance p em`, `.stance .note`.

**Keep `.pane` in full.** In the combined rule `.pane + .man, .pane + .svc, .pane + .deck{ margin-top:22px }`, drop only `.pane + .man`:

```css
.pane + .svc, .pane + .deck{ margin-top:22px }
```

Delete the standalone `.rules{ margin-top:26px }` line, and the whole `/* ── #rules: four ruled lines ── */` block: `.rules`, `.rule`, `.rule b`.

Retitle the surviving banner comment, since it no longer describes `#proof`:

```css
/* ── the shared sheet: one pane wherever text sits on the field ────────── */
```

- [ ] **Step 6: Rewrite the contact CSS (~146–155)**

Replace the three `.contact` rules. Keep `.say` exactly as it is.

```css
/* ── #contact: the pitch, the two steps, the address ───────────────────── */
.contact .sub{ margin-top:16px; max-width:64ch }
.steps{
  margin-top:22px; display:grid; gap:14px; grid-template-columns:1fr 1fr;
}
@media (max-width:900px){ .steps{ grid-template-columns:1fr } }
.steps > div{
  padding:clamp(20px,2.4vw,28px); border-radius:10px;
  border:1px solid color-mix(in srgb, var(--volt) 22%, transparent);
  background:color-mix(in srgb, var(--ground-2) 58%, transparent);
}
.steps h3{ font-weight:800; font-size:18px; letter-spacing:-.024em; color:var(--ink) }
.steps p{ margin-top:8px; color:var(--muted); font-size:15px; line-height:1.62 }
.close{ margin-top:30px; color:var(--muted); font-size:15.5px; line-height:1.64 }
```

`text-align:center` and the `56ch` clamp are deliberately gone — that centring is what made the old block a narrow pane. The `900px` breakpoint matches `.svc` so both grids collapse on the same line.

- [ ] **Step 7: Delete the orphaned component**

```bash
grep -rn "VentureRow" src/ tests/
```

Expected: no matches. Then:

```bash
git rm src/components/VentureRow.astro
```

If `grep` finds a match, stop and resolve it — something else still imports it.

- [ ] **Step 8: Run the gate**

Run: `npm test`
Expected: PASS. `astro check` is now satisfied — nothing references `HOME.proof` or `HOME.rules`.

- [ ] **Step 9: Commit Tasks 3 and 4 together**

```bash
git add src/content/copy.ts src/pages/index.astro
git add -u src/components/
git commit -m "feat(home): proof and the four rules out, start a project in

The venture list belongs on /apps/, not duplicated on the home page, and
the rules section is cut outright. The contact block takes their space as
a full-width section: what we can build, why now, a free conversation and
one fixed quote.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

> Stage by path, never `git add -A` — the repo has untracked design-asset directories at its root that must not be committed.

---

## Task 5: Repair the e2e tests

**Files:**
- Modify: `tests/e2e/home.spec.ts` (lines 3–9, 18–29)
- Modify: `tests/e2e/quality.spec.ts` (`HOME_CASES`, ~lines 77–84)

**Interfaces:**
- Consumes: the DOM Task 4 produces
- Produces: nothing downstream

- [ ] **Step 1: Rewrite the first home test (lines 3–9)**

```ts
test('leads with the agency offer, then asks for the project', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText(/before it fizzles/i);
  const build = page.locator('#build');
  const contact = page.locator('#contact');
  expect((await build.boundingBox())!.y).toBeLessThan((await contact.boundingBox())!.y);
});
```

- [ ] **Step 2: Delete two obsolete tests (lines 18–29)**

Delete `'surfaces the client-privacy stance as a heading-scale element'` in full — it targets `.stance p`, which no longer exists on this page.

Delete `'renders all four rules from facts'` in full — it targets `#rules .rule`.

The stance itself survives on `/rewire/landing/` and `/apps/`; this deletion is scoped to the home page only.

- [ ] **Step 3: Add the structural guard**

Append to `tests/e2e/home.spec.ts`:

```ts
test('renders exactly two sections, build then contact', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main section, body > section').evaluateAll(
    ns => ns.map(n => n.id)
  );
  expect(ids).toEqual(['build', 'contact']);
});
```

This is what stops a future edit quietly reintroducing a third section.

- [ ] **Step 4: Fix `HOME_CASES` — READ TRAP 2 ABOVE FIRST**

In `tests/e2e/quality.spec.ts`, three entries reference removed DOM: `.vrow .ds`, `.rule`, `.stance p`. Replace the array with:

```ts
const HOME_CASES: ContrastCase[] = [
  { label: 'hero .lede', selector: '.hero .lede', fg: MUTED, threshold: 4.5 },
  { label: 'hero h1', selector: '.hero h1', fg: INK, threshold: 3.0 },
  { label: 'first service blurb', selector: '.svc p', fg: MUTED, threshold: 4.5 },
  { label: 'first step body', selector: '.steps p', fg: MUTED, threshold: 4.5 },
  { label: '.contact h2', selector: '.contact h2', fg: INK, threshold: 3.0 },
  { label: '.contact .sub', selector: '.contact .sub', fg: MUTED, threshold: 4.5 },
];
```

Six probes in, six out — the same coverage shape, retargeted at what the page now renders.

**Do not touch `REWIRE_CASES` or `APPS_CASES`.** Their `.stance` selectors point at other pages, which still have stances.

- [ ] **Step 5: Run the e2e suite**

Run: `npm run test:e2e`
Expected: PASS.

Pay attention to **`'routes an SMB visitor to Rewire within the first two screens'`**, which is unchanged. It asserts a visible `a[href="/rewire/landing/"]` within two viewport heights. It used to be satisfied three ways; now the `Rewire` nav item carries it. If it fails, the nav link from Task 3 Step 3 is wrong — check `rewire.path` resolved to `/rewire/landing/`, not that the test is at fault.

Also confirm `honesty.spec.ts` is green: the new copy adds no names, numbers or outcomes, so it should be.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/home.spec.ts tests/e2e/quality.spec.ts
git commit -m "test(home): follow the page down to two sections

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Verify in the browser

**Files:** none — verification only.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: succeeds, no warnings about missing references.

- [ ] **Step 2: Serve and look**

Start the preview server (`npm run preview`, port 4321) and open `/`.

Check, in order:
1. Three blocks only: hero, *What we build*, *Start a project*. No venture rows, no rules list.
2. Hero has **one** button.
3. Nav reads `Rewire · Apps` with the `Start a project` CTA. Both links go somewhere real.
4. **Every pane still has its translucent sheet** — hero, build, contact, footer. If anything looks flat and unblurred, `.pane` was deleted. See Trap 1.
5. The two steps sit side by side, and collapse to one column below 900px.
6. The spine in the left gutter shows **three** soma markers, the last labelled `START A PROJECT`.
7. Service 02 reads "**Two** of them are ours" — not "Three". Three would mean `APPS` was miscounted.

- [ ] **Step 3: Check the console**

Devtools console must be clean — `home.spec.ts` asserts zero console errors, but confirm by eye since the spine re-derives its markers from the DOM.

- [ ] **Step 4: Commit nothing**

Verification task. If anything above is wrong, fix it in the task that owns it and re-run that task's gate.

---

## Out of scope

Wall Estate's `PRODUCTS` entry, the `url` field for off-site products, the host-based footer label, the tile artwork and the third apps-page grid column are **spec #2**. No file in this plan touches them. The footer picks Wall Estate up for free once that spec lands, because `footer.ventures` is already a `PRODUCTS.map`.
