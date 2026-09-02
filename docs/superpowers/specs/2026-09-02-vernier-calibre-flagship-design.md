# VERNIER — Calibre 01
## Flagship demo model: premium 3D product showcase

**Date:** 2026-09-02
**Status:** Approved design, not yet implemented
**Location:** `/rewire/sample/vernier/` — a sixth demo model alongside apex, northbay, forge, lumen, vale

---

## 1. Purpose

Rewire's demo models are the sales argument for the venture: prospects judge the
standard from them because client sites stay private. The existing five prove we
ship real interaction design, but none of them is a flagship. This one exists to
answer a single question — *how good can these people actually make a page look* —
and the benchmark is Apple's flagship device showcase pages.

Success means a prospect who has just looked at apple.com finds this at least as
considered, and notices something Apple's page cannot do.

## 2. Why this beats the benchmark

Our existing WebGL work (Forge's barbell, Lumen's shelf) uses primitive geometry,
`MeshStandardMaterial` and three directional lights, with no shadows, tone mapping,
environment lighting or post-processing. That is exactly why it reads as "3D on a
website" rather than "product page".

The tier jump is **light and material, not part count**:

- `ACESFilmicToneMapping` with sRGB output and physically-correct lights
- Image-based lighting from a procedurally generated environment via `PMREMGenerator`
- Soft shadows plus a separately rendered, blurred contact shadow
- `MeshPhysicalMaterial` with real transmission (IOR 1.77) for sapphire
- Canvas-generated roughness maps for brushed and polished steel
- Restrained bloom, vignette and depth of field

Three things the benchmark does not do:

1. **The visitor can wind it.** Dragging the crown coils the mainspring and fills a
   power reserve. Apple's product pages are look-only.
2. **The escapement runs live** at 4Hz / 28,800 vph against the visitor's own clock,
   not a baked loop.
3. **Under 1MB.** All geometry is generated in code, so there is no model to
   download and no image sequence. Apple's flagship pages run to many megabytes.

## 3. Identity

**Brand:** VERNIER. Named for the vernier scale — a precision-measurement
reference, deliberately not Swiss-heritage. **Product:** Calibre 01.

**Register:** brand (design IS the product).

**Aesthetic lane: clinical white void.** Light-mode WebGL, the movement floating in
a bright studio void with true soft shadows. Chosen against two reflexes: the
black-and-gold vitrine every watch brand defaults to, and the fact that all five
existing demos are now dark, so this adds range to the set as well as avoiding the
category cliché.

**Palette** — restrained strategy, one accent:

| Token | Value | Role |
|---|---|---|
| `--void` | `#F7F7F8` | body ground, chroma ~0, NOT cream |
| `--void-2` | `#EDEDEF` | raised surface |
| `--ink` | `#101114` | primary text |
| `--ink-2` | `#4A4C54` | secondary text |
| `--muted` | `#6E7078` | metadata |
| `--blued` | `#2B4C8C` | the single accent |

The accent is blued steel — the colour of heat-treated watch screws — so the
brand's one colour is drawn from the object itself.

**Typography:** Familjen Grotesk (display + body, weight contrast) and Fragment
Mono (measurement readouts only). Neither is on the reflex-reject list; neither is
used by the other five demos. The mono is earned: the page carries real tolerances,
frequencies and jewel counts.

Both load from Google Fonts via `<link>`, matching the other five demos, with the
stylesheet URL carrying a content-hash query. Self-hosting would be marginally
faster but would mean committing font binaries; consistency with the existing
demos wins here.

## 4. Scroll spine

| # | Section | What happens |
|---|---|---|
| 1 | Hero | Assembled movement, slow auto-rotation, one hairline contact shadow |
| 2 | Wind it | Drag the crown; mainspring coils, power reserve fills |
| 3 | Exploded view | Scroll scrubs parts apart along true axes, with leader-line annotations |
| 4 | The escapement | Camera dives to macro; balance runs at a real 4Hz |
| 5 | Materials | Three macro studies: sapphire refraction, blued screws, Geneva striping |
| 6 | Tolerances | Animated figures counted up on scroll |
| 7 | Specification + enquiry | Full spec table, contact CTA |

Motion is GSAP + ScrollTrigger, scroll smoothing via Lenis. All three are already
vendored in the existing demos and are copied in, not loaded from a CDN.

## 5. Architecture

Files under `rewire/sample/vernier/`:

```
index.html
css/style.css
js/
  vendor/{three.min.js,gsap.min.js,ScrollTrigger.min.js,lenis.min.js}
  main.js        scroll timelines, section wiring, DOM
  movement.js    scene, camera, renderer, lighting, adaptive tier
  geometry.js    procedural part generation (gears, bridges, jewels, screws)
  materials.js   PBR material definitions + generated roughness maps
```

Each module has one job and a narrow interface: `geometry.js` returns meshes and
knows nothing about scroll; `movement.js` owns the scene and exposes
`{ scene, setTier, explode(t), wind(v), focus(part) }`; `main.js` owns the
timelines and calls into it. No module reaches into another's internals.

**Part count target:** ~140. This is the ambitious half of the build. If geometry
authoring runs long, the escapement and materials sections must land; the exploded
view can ship with fewer, better-made parts rather than more crude ones.

## 6. Adaptive quality

One WebGL scene for all devices. On load the renderer measures frame time across
~60 frames and selects a tier:

| Tier | Pixel ratio | Shadows | Post | Sapphire | Tooth segments |
|---|---|---|---|---|---|
| High | up to 2 | 2048, soft | bloom + vignette + DOF | full transmission | full |
| Medium | up to 1.5 | 1024 | bloom + vignette | full transmission | reduced |
| Low | 1 | contact shadow only | none | cheap approximation | minimum |

Tier is re-evaluated once after the first scroll section in case the initial
measurement was taken during page load contention.

## 7. Accessibility and fallbacks

- **All text lives in the DOM**, never only in the canvas — readable and indexable
  with WebGL disabled.
- **No WebGL** → statically lit fallback image, full scroll story in 2D. The
  fallback is captured from the high-tier render during the build (canvas →
  `toDataURL` → committed PNG), so it is the real scene rather than a stand-in and
  cannot drift from it silently.
- **`prefers-reduced-motion`** → escapement stops, auto-rotation stops, scroll
  scrub becomes stepped section transitions. Checked in **JS as well as CSS**,
  because a CSS media query does not stop GSAP or a WebGL render loop.
- `:focus-visible` rings on every control, `<main>` landmark, alt text on the
  fallback image.
- Contrast: all text pairings verified against WCAG before ship; body text ≥4.5:1,
  large text ≥3:1.
- The crown-drag interaction has a keyboard equivalent (arrow keys adjust wind).

## 8. Budget

| Item | Target |
|---|---|
| three.min.js | ~600KB |
| GSAP + ScrollTrigger + Lenis | ~120KB |
| Fonts (2 families, Google Fonts, woff2) | ~100KB |
| Geometry, textures | 0 — generated at runtime |
| Fallback image | ~160KB |
| **Total** | **< 1MB** |

Staying under 1MB is a deliberate competitive claim, not just hygiene.

## 11. Deviations recorded at review

- Leader-line annotations in the exploded view were not built — the section uses
  a static parts list instead. Deferred to a follow-up.
- Parts explode along +Y (a layered lift) rather than each part's own axis.
- The fallback image carries `alt=""` inside an `aria-hidden` stage, because
  every word of content already lives in the DOM. §7's "alt text on the
  fallback image" is satisfied by that emptiness being deliberate, not an
  oversight.

## 9. Out of scope

- Real product photography (there is no product; this is a demo model)
- A working enquiry backend — the form posts nowhere, matching the other demos
- Any claim that this is client work; it is labelled a demo model like the rest
- Retiring Vale — considered and deferred; this ships as a sixth, not a replacement

## 10. Definition of done

- Runs at 60fps on desktop and holds ≥45fps on a mid-range phone at its tier
- Passes the impeccable detector with no true-positive findings
- Verified in-browser at desktop and mobile widths, and on the iOS Simulator,
  since these demos are usually opened from a phone
- Total transferred weight under 1MB
- Linked from `/rewire/sample/` and the Rewire landing page demo grid
- Footer links back to neurotrocity.com, consistent with every other page
