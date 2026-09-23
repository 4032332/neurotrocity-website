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

// The flame and closing beats are generated in Task 8; until they exist this
// script skips them, so it can be re-run as each source arrives.
for (const [file, width, out] of [
  ['hero.png', 1200, 'skull-hero.webp'],
  ['flame.png', 1000, 'skull-flame.webp'],
  ['closing.png', 1000, 'skull-closing.webp'],
]) {
  if (!fs.existsSync(src(file))) {
    console.log(`skipped ${out}: ${src(file)} not generated yet`);
    continue;
  }
  await webp(file, width, out);
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
