# Before the Beep — landing page design

**Date:** 23 September 2026
**Owner:** Rob Brown / NeuroTrocity
**Repo:** `neurotrocity-website` (the app itself lives in `beep-test`)
**Status:** Design. Awaiting Rob's review.

Decision IDs use the **B-series** (B1, B2, …) so they never collide with the app's D-series
in `beep-test/docs/superpowers/specs/`.

---

## 1. What this is

A landing page for the beep test app at `https://neurotrocity.com/beeptest/landing/`, plus the
three policy/support routes an App Store submission needs, plus a tile for the app on `/apps/`.

### 1.1 Why it is blocking

`Constants.landingPageURL` in the `beep-test` repo is `https://PLACEHOLDER.invalid/`. That URL
is encoded into the QR code on **every share card the app generates**, so the QR is currently
dead. This page is what makes it live.

---

## 2. Constraints

These are not preferences. Each one has a source and each one can fail the build.

### 2.1 NSW Civil Liability Act 1998 s5M(8) — the governing constraint

`beep-test/docs/app-store-listing.md` records that a risk warning is void *to the extent that*
any other representation about the risk contradicts it, and that "anywhere" **explicitly
includes the landing page**.

**Banned on this page, in any wording:**

- "suitable for all fitness levels" / "for all abilities" / "for everyone"
- "safe", "safely", "risk-free", "gentle", "easy"
- "no experience needed", "anyone can do it"
- "beginner-friendly" applied to *the test*
- any implication that the app assesses, clears or approves the runner

**Required at least once, verbatim:** a plain sentence that the beep test is a maximal fitness
test. See B9.

The trap named in the listing doc applies here too: **no sentence may say who the app is for.**
Every natural phrasing of that ("whatever your fitness", "from first-timer to recruit") is a
suitability claim.

### 2.2 Provenance — `docs/provenance.md`

*"Nothing on the site may present an invented fact about the business."* Every string traces to
a source. This page inherits that discipline (B11).

### 2.3 Australian English, metric

Per the app spec §0 rule 2. Metres, practise (verb), organisation.

### 2.4 Performance

`package.json` ships a `perf` Lighthouse script. Page weight is something this repo already
measures, which is why the geometry is coded rather than generated (B6).

---

## 3. Decisions

| ID | Decision | Why |
|---|---|---|
| **B1** | **URL is `/beeptest/`**, not `/beforethebeep/` | Rob, 23 Sep. Matches what people search and type; survives the store title becoming `Beep Test: Shuttle Run Trainer`; short enough to read off a QR card. Keeps "Before the Beep" free to remain the wordmark, so the URL does not pre-empt the open store-title question in `app-store-listing.md` |
| **B2** | **Built as Astro pages under `src/pages/beeptest/`**, not hand-written HTML in `public/` | `public/dosetrack/` and `public/dispoint/` are legacy; `src/pages/rewire/` is the current pattern. Astro gives `Base`, `Seo`, JSON-LD and sitemap registration without retyping them |
| **B3** | **The page wears app clothes, not studio clothes.** `Base` is used with `field={false} spine={false}`, and a `--bt-*` token namespace layers over it | Established precedent: `dosetrack.css` and `dispoint.css` each define a venture identity. The violet cortex field and dendrite spine belong to the studio site and fight this brand |
| **B4** | **The skull is the test, personified** — not the user failing | Rob, 23 Sep, chose the skull as protagonist over the number and over the last-shuttle concept. The icon's expression is a *giving-up* expression, which reads as defeat if the skull is the user. Casting it as the opponent — cocky, sweating, already beaten everyone once — turns that expression from a liability into the premise |
| **B5** | **Generated art is reference-locked to the shipped app icon** via Higgsfield Reference Element `a44f8f52-6b91-4a36-991b-02d0df8ed1b0` | Verified 23 Sep: two independent draws of one prompt came back near-identical and faithful to `AppIcon-1024.png`. Prompting freehand would produce a different skull and split the brand between the App Store icon and the web |
| **B6** | **Raster for the character, code for the geometry.** Speed lines, shockwave, impact frame, phone frames and the pacing bar are SVG/CSS | The aesthetic is flat tones and hard ink edges, which is SVG's native idiom. Coded geometry animates, stays crisp at any size, weighs nothing against §2.4, and lets the pacing bar be driven by real data (B8) |
| **B7** | **The character arc is carried by treatment, not pose** | Verified 23 Sep: the reference anchors harder than pose direction does — two attempts at "head-on, tilted back, taunting" both returned the icon's three-quarter pose. Context and treatment, by contrast, responded readily (the flame beat kept the character exactly while accepting flames, split cracks and a new colour family). So the skull stays a fixed point and the coded layer does the moving |
| **B8** | **The pacing bar is driven by real cadence from `protocols.json`**, not an invented rhythm | It is the app's one perceivable differentiator and the section that has to be great. A made-up rhythm would also be an invented fact under §2.2 |
| **B9** | **The maximal-effort text is a prominent section, not footer small print** | s5M(8) requires it; burying it invites the reading that it was minimised. It also happens to be the most on-brand copy available — "it is designed to be run until you cannot keep up" is the aggressive line, so honesty and the brand pull the same way |
| **B10** | **A vitest fails the build on any banned word** in `src/content/beeptest.ts`, and on the required sentence going missing | App spec §0 rule 5: no user-facing promise ships without a test that asserts it. A banned word reaching this page voids the app's in-app risk warning — the most expensive available mistake, and ~20 lines to prevent |
| **B11** | **All copy lives in `src/content/beeptest.ts`** and is sourced in `docs/provenance.md` | Mirrors `copy.ts`/`facts.ts`. Gives B10 one file to scan and §2.2 one table to audit |
| **B12** | **Store-description and screenshot-caption text is quoted verbatim**, not paraphrased | That text is already s5M(8)-checked line by line in `app-store-listing.md`. Rewording it re-opens legal review for no gain |
| **B13** | **Screens are marked placeholder frames**, not drawn mock-ups | Rob, 23 Sep. `app-store-listing.md` records that real screenshots are not producible yet (placeholder screening screen, §"Not producible yet"). Marked frames are honest and swap out in one commit |
| **B14** | **New accent token `--flare:#FF3B2F`** for the `/apps/` tile | All four existing accents are taken (volt=DoseTrack, ember=DisPoint, cyan=Rewire, jade=Wall Estate). Flame is already in the app's own celebration vocabulary |
| **B15** | **Display type is Bricolage Grotesque at 900**, already loaded by `Base` | Big, heavy and brutal, at zero additional font bytes. A new condensed face would cost a download for a page that measures its weight |

---

## 4. Architecture

```
src/pages/beeptest/landing.astro     the page
src/pages/beeptest/privacy.astro     real page, placeholder body (§7)
src/pages/beeptest/eula.astro        real page, placeholder body (§7)
src/pages/beeptest/support.astro     real page, placeholder body (§7)
src/content/beeptest.ts              every string on all four pages
src/styles/beeptest.css              --bt-* venture identity
tests/beeptest-copy.test.ts          the s5M(8) guard (B10)
public/beeptest/assets/img/          hero, flame and closing skulls, og card
```

Registered by adding one entry to `PRODUCTS` in `src/content/facts.ts`, which yields the
`/apps/` tile and the sitemap row together (`sitemap.xml.ts` derives from `PRODUCTS[].path`).
This requires extending the `accent` union with `'flare'` and adding art to `APPS_PAGE.art`
in `copy.ts`, keyed `beeptest`, using the app icon at `data-fit="contain"`.

The OG card is a hand-made 1200×630 asset under `public/beeptest/assets/img/`, matching how
DoseTrack and DisPoint do it. The satori generator at `src/pages/og/[page].png.ts` renders the
*studio* card style (violet, Manrope) and is deliberately not used here, per B3.

---

## 5. Page structure

### 5.1 Hero

Black. The hero skull large. A coded SVG speed-line burst strikes in once behind it on load and
settles. Wordmark **BEFORE THE BEEP**. One-line challenge headline. One-sentence subhead on
pacing cues, traced to the store description's lead. Primary CTA is the App Store badge,
rendering in a "coming to the App Store" state until the listing exists rather than linking
nowhere. Secondary CTA anchors to §5.2.

**Headline candidates.** This is the only genuinely new copy on the page, so it is the only
line needing fresh s5M(8) clearance. Three, checked against §2.1 — none contains a banned term,
none states who the app is for, none implies the app assesses or clears anyone:

1. **"It's beaten everyone. Learn its rhythm."** *(recommended)* — states the opponent premise
   of B4 and the product benefit in one line. "Learn the pace" is not new framing: the store
   description already says *"the difference between learning the pace and chasing it"*, so it
   inherits that line's existing clearance.
2. **"Hear where you should be."** — the safest option, lifted almost directly from the store
   description's lead (*"This one tells you where you should be"*). Product-led rather than
   character-led, so it under-uses the skull.
3. **"Most apps play you a beep and leave you to guess."** — verbatim-adjacent to the store
   description's opening. Strongest competitive framing, weakest as a hero line at display size.

Note that "learn its rhythm" is a claim about *the app's function*, not about the test being
manageable. If it ever drifts toward the latter in a future edit, it engages s5M(8).

### 5.2 The pacing bar — the signature section

The only section that has to be excellent. A shuttle track runs 0 → 100%: ticks at 70%, 80% and
90% fire in sequence, then the beep lands on 100 with an impact flash. Cadence from
`protocols.json` (B8).

It must communicate with **no audio** (most visitors will not have sound on) and with **no
motion** — under `prefers-reduced-motion` it becomes a static diagram with the three marks
labelled. Copy from the store description's `PACING CUES` block, verbatim (B12).

### 5.3 Five screen frames

Phone frames drawn in CSS, each marked as a pending screenshot (B13). Captions verbatim from
the Screenshots table in `app-store-listing.md`, in that document's order.

Per that document, no frame may show an agency logo, crest or name, or imply endorsement by a
recruiting agency.

### 5.4 Apple Watch

From the store description's `APPLE WATCH` block.

### 5.5 The maximal-effort panel (B9)

The flame-beat skull. A hard inked panel carrying the store description's `BEFORE YOU START`
block **verbatim and complete**, including:

> The beep test is a maximal fitness test: it is designed to be run until you cannot keep up.

and the training-aid paragraph that follows it. This text is not to be trimmed for length or
rhythm.

### 5.6 Free first test

The closing beat. "Your first test is free. No account, no sign-up — nothing leaves your
phone." — verbatim from the store description.

### 5.7 Footer

NeuroTrocity mark and tie-back, and links to the four routes in §4 plus the contact address.

---

## 6. Identity

| Token | Value | From |
|---|---|---|
| `--bt-void` | `#000` | Icon background |
| `--bt-bone` | `#F2EDE4` | Icon cranium |
| `--bt-ink` | `#000` | Icon outlines |
| `--bt-sweat` | `#4DD9F0` | Icon sweat droplets |
| `--bt-tongue` | `#F08C9E` | Icon tongue |
| `--bt-flare` | `#FF3B2F` | Flame beat; also the `/apps/` accent (B14) |
| `--bt-ember` | `#FF8A1E` | Flame beat mid-tone |
| `--bt-gold` | `#FFC43D` | Flame beat highlight |

Display Bricolage Grotesque 900 (B15), body Manrope, data and tick labels IBM Plex Mono — all
already loaded by `Base`.

---

## 7. The three stub routes

`privacy`, `eula` and `support` ship as **real, styled pages at the correct URLs** with a body
that is explicitly marked as pending. They are not written in this pass: the legal text needs
Rob's review, and writing it before the page shape settles wastes it.

**This is a submission blocker, recorded here so it is not discovered late:** App Store Connect
requires a working privacy policy URL, and a page reading "pending" will not satisfy review.
The route exists so nothing 404s and so the app can hardcode the URL now; the text must be
written before submission.

---

## 8. Assets

| Asset | How | Notes |
|---|---|---|
| Hero skull | Generated, reference-locked (B5) | 2048×2048, exported to web sizes |
| Flame beat | Generated, reference-locked | Verified 23 Sep. **Fix on the real run:** the test draw lost the white highlight dots in the eye sockets |
| Closing beat | Generated, reference-locked | Treatment-driven per B7 |
| OG card 1200×630 | Composed from the hero skull | Hand-made, per §4 |
| Speed lines, shockwave, impact frame, phone frames, pacing bar | Coded SVG/CSS (B6) | — |

All generated assets must be exported at web-appropriate sizes and formats; the 2048×2048 PNGs
are ~3 MB each and are source material, not shippable assets.

---

## 9. Testing

- **`tests/beeptest-copy.test.ts` (B10)** — scans every exported string in
  `src/content/beeptest.ts` for each banned term in §2.1, case-insensitively, and asserts the
  required maximal-effort sentence is present. Fails the build on either.
- **`astro check`** passes.
- **Playwright smoke** — all four routes return 200; the landing page has exactly one `h1`;
  the reduced-motion variant of §5.2 renders its three labelled marks.

---

## 10. Out of scope, and follow-ups

- **EULA and privacy body text** — §7. Blocks submission, not this pass.
- **`Constants.landingPageURL`** in the `beep-test` repo becomes
  `https://neurotrocity.com/beeptest/landing/`. One line, different repo. Not changed from here
  without Rob asking.
- **Real screenshots** — blocked upstream on the placeholder screening screen (B13).
- **App Store link** — the hero CTA stays in its pre-launch state until a listing exists.
- **`docs/provenance.md` rows** for every new string. Required by §2.2; done as part of the
  build, listed here so it is not forgotten.

---

## 11. Open questions

1. **Store title.** `app-store-listing.md` records `Beep Test: Shuttle Run Trainer` as a
   recommendation explicitly *not* approved. B1 is deliberately compatible with either outcome,
   so this does not block the page — but the wordmark in §5.1 assumes "Before the Beep".
2. **Headline wording.** Three candidates are drafted and s5M(8)-checked in §5.1, with a
   recommendation. Rob picks. The build is not blocked — it proceeds on the recommendation
   unless Rob says otherwise.
