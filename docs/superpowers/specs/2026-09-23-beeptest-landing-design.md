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

### 2.4 What the app actually does with data — verified, not assumed

Established 23 September by a source audit of the `beep-test` repo, carried out while drafting
the policy pages. The page may rely on these:

- **No network code exists anywhere in the app.** A repo-wide search for `URLSession`,
  `URLRequest`, `NWConnection` and `CFNetwork` returns nothing. `BeepCore/Package.swift`
  declares no external dependencies; every import is a first-party Apple framework.
- **No analytics, no crash SDK, no accounts.**
- Location is **speed-only** and each `CLLocation` is discarded after conversion.
- ARKit retains no frame.
- The share card's QR encodes **one fixed URL, identical for every user** — it is not a tracking
  link and must never be described as personalised.
- Purchases are StoreKit 2, processed by Apple.

So "nothing leaves your phone" is not marketing language here — it is literally true, and
unusually strong. The page should lean on it.

> **⚠️ The trap.** `src/content/facts.ts` `RULES[2]` reads *"synced privately through your own
> iCloud."* That is a studio-wide principle and it is **false for this app** — the entitlements
> contain only HealthKit and an app group, and `SwiftDataSessionStore` builds a plain local
> `ModelConfiguration`. There is no CloudKit. Do not copy that sentence onto this page or into
> `beeptest.ts`, however natural it looks sitting in the shared rules.
>
> **Ban the claim, not the word.** A first pass at this test banned the string `iCloud`
> outright and immediately failed a *correct* sentence in the privacy draft: *"If you back up
> your iPhone — to iCloud or to a computer — that backup is made by iOS and may include this
> app's data."* That disclosure is true, and required. What must not appear is the assertion
> that **this app syncs through iCloud** — so B10 matches sync-claim phrasings (`sync`/`synced`
> /`syncs` within the same sentence as `iCloud`, and the verbatim `RULES[2]` string), not the
> bare word.

### 2.5 Performance

`package.json` ships a `perf` Lighthouse script. Page weight is something this repo already
measures, which is why the geometry is coded rather than generated (B6).

---

## 3. Decisions

| ID | Decision | Why |
|---|---|---|
| **B1** | **URL is `/beeptest/`**, not `/beforethebeep/` | Rob, 23 Sep. Matches what people search and type, and is short enough to read off a QR card. The brand name is **Before the Beep** (§11.1) and remains the wordmark; the URL is deliberately the search term rather than the brand, so the page is findable by people who do not yet know the name |
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
| **B16** | **There is no App Store link. A "coming soon" section with an email capture takes its place** (§5.7) | Rob, 23 Sep. The app has no listing yet, so a badge would link nowhere. A launch-notification list converts the traffic this page gets in the meantime instead of wasting it |
| **B17** | **The mailing list uses a real email service provider, not the `formsubmit.co` / `web3forms` relays used elsewhere on this site** | Rob, 23 Sep. Those relay a form to an inbox; they are not a list. The **Spam Act 2003 (Cth)** requires consent, sender identification and a *functional unsubscribe facility* on commercial electronic messages — an inbox full of addresses provides none of that, and the launch broadcast is exactly a commercial electronic message. Provider still to be named (§11.3) |
| **B18** | **The page may claim the app is entirely on-device. It may NOT claim iCloud sync** | Verified 23 Sep by source audit (§2.4). The on-device claim is unusually strong and true. The iCloud claim is **false for this app** and sits in shared site copy, which makes it a live trap |

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

**The headline — Rob's words, 23 Sep, set in three sizes:**

> **THE BEEP TEST SUCKS.**
> It has demonic powers stronger than Final Destination.
> There's only one way to beat it before it beats you… **cheat the beep.**

**Set as a sequence, not a block.** Line 1 enormous, line 2 mid-size, line 3 landing on its own
as the beat before the CTA. One idea, three weights. Setting the whole thing at display size
would be unreadable and would flatten the joke's timing.

**s5M(8) check.** *"The beep test sucks"* is not merely permitted, it is **helpful** — it
reinforces difficulty rather than softening it, which is the direction s5M(8) pushes. No line
states who the app is for, and none implies the app assesses or clears anyone.

**Why "cheat the beep" and not "cheat the system"** (Rob's original). The audience is applicants
to police, fire, ambulance and defence. `app-store-listing.md` is careful that nothing implies
the app relates to an agency's *official* assessment — the `ADF`, `police`, `PCT` and `PFA`
keywords are flagged there as "search terms, not claims". *"Cheat the system"* beside a
recruitment fitness test can be read as *beat the official assessment dishonestly*, which is a
reputational risk out of proportion to the joke, and it also undersells the product: the app
teaches pace, it does not circumvent anything. *"Cheat the beep"* keeps the word, the joke and
the edge, and points them at the audio cue — which is literally what pacing cues let you do.

**Do not let this drift back.** A future edit that restores "the system", or that extends the
joke toward "beat the test without training", re-engages both s5M(8) and the agency-association
problem.

*Minor, noted not blocking:* "Final Destination" is a trademarked franchise. A joke comparison
is almost certainly nominative fair use.

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

### 5.7 Coming soon, and the launch list (B16, B17)

Replaces the App Store CTA, which would link nowhere. This is the page's conversion goal until
the app ships, and the hero CTA scrolls here.

A short "not out yet" statement and a single email field. Requirements:

- **One field, one button.** No name, no agency, no goal level. Every extra field costs
  signups, and under §2.4's posture the less collected the better.
- **Consent must be explicit and the wording must survive the Spam Act 2003 (Cth):** the visitor
  is told, at the point of entry, who is sending, what they are signing up to receive (a
  notification when the app is released), and that they can unsubscribe at any time. No
  pre-ticked boxes, no bundling the list into a different action.
- **Real states.** Idle, submitting, success, and a failure state that does not lose what was
  typed. A silent failure on the one conversion point on the page is the worst available bug.
- **Accessible**: a real `<label>`, `type="email"`, `autocomplete="email"`, an `aria-live`
  region for the result.
- **The provider's own embed script is not used** unless unavoidable — post to its endpoint and
  keep the styling ours, so the section matches the page rather than arriving in someone else's
  design (and so it costs nothing against §2.5).
- **The privacy policy must describe this before it goes live.** The list is the *only* thing on
  any NeuroTrocity surface that collects personal information for this app, which makes it the
  one place §2.4's "nothing leaves your phone" needs a careful boundary: that claim is about the
  **app**, and the page must not let it read as covering the website form.

Provider is not yet chosen (§11.3). Until it is, the form is built complete against a clearly
marked placeholder endpoint.

### 5.8 Footer

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
- **App Store link** — replaced by §5.7 until a listing exists (B16).
- **`app-store-listing.md`** in the `beep-test` repo still presents
  `Beep Test: Shuttle Run Trainer` as a live title recommendation. Rob declined it on 23 Sep
  (§11.1); that document should be updated to record the decision.
- **HealthKit purpose-string mismatch** — found 23 Sep during the policy audit and raised
  separately. `NSHealthShareUsageDescription` promises VO2max and heart-rate reads the app does
  not perform. It does not affect this page, but it blocks submission, and the policy drafts
  deliberately do not repeat the claim — so the app and the policy currently disagree, with the
  app in the wrong.
- **`docs/provenance.md` rows** for every new string. Required by §2.2; done as part of the
  build, listed here so it is not forgotten.

---

## 11. Open questions

1. ~~**Store title.**~~ **Resolved, Rob, 23 Sep: the store title is "Before the Beep."** The
   `Beep Test: Shuttle Run Trainer` recommendation in `app-store-listing.md` is declined. The
   wordmark in §5.1, the `PRODUCTS[].name` entry and the JSON-LD `name` all read *Before the
   Beep*. **`app-store-listing.md` in the `beep-test` repo still presents the alternative as a
   live recommendation and should be updated to record this decision** — that is a follow-up in
   the other repo (§10).
2. **Headline wording.** Three candidates are drafted and s5M(8)-checked in §5.1, with a
   recommendation. Rob picks. The build is not blocked — it proceeds on the recommendation
   unless Rob says otherwise.
