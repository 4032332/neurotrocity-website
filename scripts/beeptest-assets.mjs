// One-shot export for /beeptest/: 2048px Higgsfield sources -> web images.
// Run from the repo root:  node scripts/beeptest-assets.mjs
// Sources live in assets-src/beeptest/ (git-ignored); outputs are committed.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const SRC = 'assets-src/beeptest';
const OUT = 'public/beeptest/assets/img';
fs.mkdirSync(OUT, { recursive: true });

const src = (f) => path.join(SRC, f);

async function webp(file, width, out) {
  await sharp(src(file)).resize({ width }).webp({ quality: 82 }).toFile(path.join(OUT, out));
}

// The generated art sits on opaque black (#010101), so on the hero it hides
// the speed lines behind a solid square and the drop-shadow filter traces
// that square's corner instead of the skull's silhouette. This cuts the
// skull out: flood-fill the near-black background that touches the image
// border away to transparency, close the mask so the open mouth and any
// narrow leak through the ink don't stay punched through, then grow the
// mask back out a little so the skull's own black outline — which the
// flood also removed, since it is dark and touches the background — is
// restored around the cutout.
//
// Two implementation notes the naive version of this algorithm runs into:
//
// 1. In this sharp build (0.34.5), .dilate() SHRINKS bright regions and
//    .erode() GROWS them — the opposite of the conventional morphology
//    names. Verified directly on a 9x9 single-channel mask with one white
//    pixel dead centre: .dilate(1) REMOVES it (0 white pixels left);
//    .erode(1) GROWS it into a solid 3x3 block (9 white pixels). Also
//    checked on a 40x40 white square on black: dilate(5) shrinks it to
//    30x30; erode(5) grows it to 50x50. So "growing" a mask here means
//    calling .erode(), and "shrinking" it means .dilate().
// 2. The skull's ink (outline, cracks, eye sockets, nostril, mouth cavity)
//    is drawn in the same near-black as the background, and the outline is
//    one continuous stroke touching the background all the way round. A
//    plain border flood over "is this pixel dark" therefore leaks through
//    that thin (a few px) outline into the interior fills — the eye
//    sockets and mouth cavity are themselves solid near-black, so once the
//    flood reaches them via the outline it swallows them whole. The mouth
//    in particular reaches the background through a narrow gap by the
//    tongue, wide open on both sides once the flood is through it. A
//    single large close-after-the-fact can bridge those interior holes,
//    but by the time it is large enough to do that it also bridges genuine
//    exterior background gaps next to the artwork (e.g. between a sweat
//    drop's stem and the skull's edge), painting solid black rectangles
//    into what should stay transparent. So instead the candidate "is dark"
//    mask is shrunk BEFORE flooding — enough to sever the thin outline
//    stroke, and the narrow corridor by the tongue, from the wide-open
//    background they sit between — and the flood result is grown back by
//    the same amount afterwards. That keeps the eye sockets, nostril and
//    mouth correctly enclosed (never reached by the border flood) without
//    needing a large, over-eager close step. The radius has to be at least
//    half the corridor's width to sever it: 4px left the mouth (and a
//    smaller notch by the jaw) reachable and transparent; the mouth itself
//    closed at 8px, but the jaw notch needed 16px. 16px was checked against
//    the gaps between the flying sweat drops and the skull on both sides —
//    still clean, no black wedge — so that's what's used; going as high as
//    40px (tried while diagnosing this) starts painting exactly those
//    wedges solid.
async function cutout(file, width) {
  const { data, info } = await sharp(src(file))
    .resize({ width })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  const firstChannel = (buf, channels) => {
    if (channels === 1) return buf;
    const out = Buffer.alloc(w * h);
    for (let p = 0; p < w * h; p++) out[p] = buf[p * channels];
    return out;
  };
  // See note 1 above: .dilate() shrinks bright regions, .erode() grows them.
  const shrinkWhite = async (buf, r) => {
    if (r <= 0) return buf;
    const res = await sharp(buf, { raw: { width: w, height: h, channels: 1 } })
      .dilate(r).raw().toBuffer({ resolveWithObject: true });
    const out = firstChannel(res.data, res.info.channels);
    if (out.length !== w * h) throw new Error(`shrink: expected ${w * h} bytes, got ${out.length}`);
    return out;
  };
  const growWhite = async (buf, r) => {
    if (r <= 0) return buf;
    const res = await sharp(buf, { raw: { width: w, height: h, channels: 1 } })
      .erode(r).raw().toBuffer({ resolveWithObject: true });
    const out = firstChannel(res.data, res.info.channels);
    if (out.length !== w * h) throw new Error(`grow: expected ${w * h} bytes, got ${out.length}`);
    return out;
  };

  // Candidate-dark mask: 255 where a pixel is near-black.
  const darkMask = Buffer.alloc(w * h);
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    darkMask[p] = (data[i] < 40 && data[i + 1] < 40 && data[i + 2] < 40) ? 255 : 0;
  }

  // Shrink the candidate mask (severs the thin ink outline, and the narrow
  // corridor by the tongue, from the true background field — see note 2),
  // flood-fill background from the image border through it, then grow the
  // result back to restore its true extent, right up to the object's edge.
  const shrunkDark = await shrinkWhite(darkMask, 16);
  const bg = new Uint8Array(w * h); // 1 = background
  const stack = [];
  const seed = (x, y) => {
    const p = y * w + x;
    if (bg[p]) return;
    if (!shrunkDark[p]) return;
    bg[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < w; x++) {
    seed(x, 0);
    seed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    seed(0, y);
    seed(w - 1, y);
  }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) seed(x - 1, y);
    if (x < w - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < h - 1) seed(x, y + 1);
  }
  let bgMask = Buffer.alloc(w * h);
  for (let p = 0; p < w * h; p++) bgMask[p] = bg[p] ? 255 : 0;
  bgMask = await growWhite(bgMask, 16);

  // keep mask: 255 where not background, 0 where background.
  let mask = Buffer.alloc(w * h);
  for (let p = 0; p < w * h; p++) mask[p] = bgMask[p] ? 0 : 255;

  // Close: grow then shrink, as a safety net for any narrow gap the flood
  // still leaked through, so speed lines never show inside the mouth.
  mask = await growWhite(mask, 16);
  mask = await shrinkWhite(mask, 16);

  // Grow the closed mask back out: the flood removed the skull's outer
  // black ink outline too, since it is dark and touches the background.
  // Growing puts that band — and its original black pixels — back. Then
  // soften the edge slightly.
  let finalMask = await growWhite(mask, 8);
  const blurred = await sharp(finalMask, { raw: { width: w, height: h, channels: 1 } })
    .blur(0.8).raw().toBuffer({ resolveWithObject: true });
  finalMask = firstChannel(blurred.data, blurred.info.channels);
  if (finalMask.length !== w * h) throw new Error(`blur: expected ${w * h} bytes, got ${finalMask.length}`);

  // Write the mask into the alpha channel of the original RGBA buffer.
  const rgba = Buffer.from(data);
  for (let p = 0; p < w * h; p++) rgba[p * 4 + 3] = finalMask[p];

  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } });
}

// The flame and closing beats are generated in Task 12; until they exist this
// script skips them, so it can be re-run as each source arrives. The hero is
// exported specially, cut out of its black square (see cutout() above); the
// flame and closing beats stay opaque — they sit on plain black with no
// speed lines and no drop-shadow behind them.
for (const [file, width, out] of [
  ['hero.png', 1200, 'skull-hero.webp'],
  ['flame.png', 1000, 'skull-flame.webp'],
  ['closing.png', 1000, 'skull-closing.webp'],
]) {
  if (!fs.existsSync(src(file))) {
    console.log(`skipped ${out}: ${src(file)} not generated yet`);
    continue;
  }
  if (file === 'hero.png') {
    await (await cutout(file, width)).webp({ quality: 82, alphaQuality: 90 }).toFile(path.join(OUT, out));
  } else {
    await webp(file, width, out);
  }
}

// /apps/ tile: 4:3 like every other tile (1040x780), skull centred on black.
await sharp(src('hero.png'))
  .resize({ width: 1040, height: 780, fit: 'contain', background: '#000000' })
  .webp({ quality: 82 })
  .toFile('public/assets/img/apps/beeptest-skull.webp');

// OG card, 1200x630 PNG (tests/e2e/seo.spec.ts checks both).
// Text duplicates beeptest.ts hero.lines[0] and the status by hand: this is
// a .mjs script and cannot import the TS module. Recorded in provenance.
const skull = (await sharp(src('hero.png')).resize({ width: 560 }).png().toBuffer()).toString('base64');
const manrope = fs.readFileSync('public/assets/fonts/Manrope-ExtraBold.ttf');

const svg = await satori(
  {
    type: 'div',
    props: {
      style: { width: 1200, height: 630, display: 'flex', alignItems: 'center', background: '#000000', padding: '0 64px 0 36px' },
      children: [
        { type: 'img', props: { src: `data:image/png;base64,${skull}`, width: 560, height: 560 } },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', marginLeft: 28, width: 512, color: '#F2EDE4' },
            children: [
              { type: 'div', props: { style: { fontSize: 72, lineHeight: 0.95, letterSpacing: -3 }, children: 'THE BEEP TEST SUCKS.' } },
              { type: 'div', props: { style: { fontSize: 34, marginTop: 30, color: '#FF3B2F' }, children: 'Before the Beep · coming soon' } },
            ],
          },
        },
      ],
    },
  },
  { width: 1200, height: 630, fonts: [{ name: 'Manrope', data: manrope, weight: 800, style: 'normal' }] },
);
fs.writeFileSync(path.join(OUT, 'og-beeptest.png'), new Resvg(svg).render().asPng());

console.log('beeptest assets written');
