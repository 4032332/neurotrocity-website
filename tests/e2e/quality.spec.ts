import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Contrast ───────────────────────────────────────────────────────────────
// Samples the ACTUAL composited pixels behind text — the field is included,
// which is the whole point of the content-aware attenuation. Sampled 5 times
// ~300ms apart (the field animates), using the minimum ratio observed. The
// mouse is never positioned over the sampled element — pointer parallax
// moves the field and would make the sample non-deterministic.
const INK = [0xef, 0xee, 0xf7];
const MUTED = [0x91, 0x8d, 0xb0];

async function samplePixelRatio(page: Page, selector: string, fg: number[]): Promise<number> {
  return page.evaluate(
    ({ sel, fg }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`selector not found: ${sel}`);
      const r = el.getBoundingClientRect();
      const canvas = document.getElementById('field') as HTMLCanvasElement | null;
      if (!canvas) throw new Error('no #field canvas found');
      const gl = canvas.getContext('webgl2');
      if (!gl) throw new Error('WebGL2 context unavailable on #field');
      const px = new Uint8Array(4);
      gl.readPixels(
        Math.round((r.left + r.width / 2) * devicePixelRatio),
        Math.round(canvas.height - (r.top + r.height / 2) * devicePixelRatio),
        1,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        px
      );
      const lum = (c: number[]) => {
        const [R, G, B] = c.map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
      };
      const bg = lum([px[0], px[1], px[2]]);
      const fgLum = lum(fg);
      return (Math.max(fgLum, bg) + 0.05) / (Math.min(fgLum, bg) + 0.05);
    },
    { sel: selector, fg }
  );
}

async function minContrastRatio(page: Page, selector: string, fg: number[]): Promise<number> {
  const samples: number[] = [];
  for (let i = 0; i < 5; i++) {
    samples.push(await samplePixelRatio(page, selector, fg));
    if (i < 4) await page.waitForTimeout(300);
  }
  return Math.min(...samples);
}

// Verify the WebGL2 context is actually available before trusting any sample.
async function assertWebGL2Available(page: Page) {
  const ok = await page.evaluate(() => {
    const canvas = document.getElementById('field') as HTMLCanvasElement | null;
    return !!canvas && !!canvas.getContext('webgl2');
  });
  expect(ok, 'WebGL2 context on #field is unavailable — cannot verify field-composite contrast').toBe(true);
}

interface ContrastCase {
  label: string;
  selector: string;
  fg: number[];
  threshold: number;
}

const HOME_CASES: ContrastCase[] = [
  { label: 'hero .lede', selector: '.hero .lede', fg: MUTED, threshold: 4.5 },
  { label: 'hero h1', selector: '.hero h1', fg: INK, threshold: 3.0 },
  { label: 'first .vrow .ds', selector: '.vrow .ds', fg: MUTED, threshold: 4.5 },
  { label: 'first .rule', selector: '.rule', fg: MUTED, threshold: 4.5 },
  { label: '.stance p', selector: '.stance p', fg: INK, threshold: 3.0 },
  { label: '.contact .sub', selector: '.contact .sub', fg: MUTED, threshold: 4.5 },
];

const REWIRE_CASES: ContrastCase[] = [
  { label: 'hero .lede', selector: '.hero .lede', fg: MUTED, threshold: 4.5 },
  { label: 'hero h1', selector: '.hero h1', fg: INK, threshold: 3.0 },
  { label: 'first "who this is for" body', selector: '.fit p', fg: MUTED, threshold: 4.5 },
  { label: 'first step body', selector: '.step p', fg: MUTED, threshold: 4.5 },
  { label: '.stance p', selector: '.stance p', fg: INK, threshold: 3.0 },
  { label: 'front .deck-card .desc', selector: '.deck-card .desc', fg: MUTED, threshold: 4.5 },
];

const CONTRAST_TABLE: Array<{ path: string; label: string; min: number; threshold: number }> = [];

for (const [pagePath, cases] of [
  ['/', HOME_CASES],
  ['/rewire/landing/', REWIRE_CASES],
] as const) {
  test(`${pagePath} keeps every text element above its WCAG floor against the live field`, async ({ page }) => {
    await page.goto(pagePath);
    // The cortex module (and three.js) now loads via a dynamic import fired
    // from an idle callback, so the WebGL2 context on #field can land later
    // than a fixed timeout would reliably cover — poll for it instead of
    // guessing a duration.
    await page.waitForFunction(
      () => {
        const canvas = document.getElementById('field') as HTMLCanvasElement | null;
        return !!canvas && !!canvas.getContext('webgl2');
      },
      { timeout: 10000 }
    );
    await assertWebGL2Available(page);
    // Keep the mouse away from sampled elements so pointer parallax cannot
    // move the field under the pixel we're reading.
    await page.mouse.move(2, 2);

    for (const c of cases) {
      const min = await minContrastRatio(page, c.selector, c.fg);
      CONTRAST_TABLE.push({ path: pagePath, label: c.label, min, threshold: c.threshold });
      expect(min, `${pagePath} ${c.label} min ratio ${min.toFixed(2)} below floor ${c.threshold}`).toBeGreaterThanOrEqual(
        c.threshold
      );
    }
  });
}

// ── Reduced motion: still frame ─────────────────────────────────────────────
for (const pagePath of ['/', '/rewire/landing/']) {
  test(`${pagePath} holds a still frame under prefers-reduced-motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(pagePath);
    await page.evaluate(() => document.fonts.ready);
    // The static-fallback class lands from an idle callback; wait for it so it
    // cannot arrive between the two captures.
    await page.locator('#field.static-fallback').waitFor({ timeout: 10000 });
    await page.waitForTimeout(600);
    const a = await page.screenshot();
    await page.waitForTimeout(1200);
    const b = await page.screenshot();
    expect(Buffer.compare(a, b)).toBe(0);
  });
}

// ── Debug tooling ────────────────────────────────────────────────────────────
for (const pagePath of ['/', '/rewire/landing/']) {
  test(`${pagePath} ships no debug tooling on window`, async ({ page }) => {
    await page.goto(pagePath);
    const found = await page.evaluate(() => ['Stats', 'leva', 'rstats', 'dat'].filter((k) => k in (window as any)));
    expect(found).toEqual([]);
  });
}

test('built dist/ bundles contain no debug-tooling identifiers', () => {
  const distDir = path.resolve(__dirname, '../../dist');
  expect(fs.existsSync(distDir), 'dist/ does not exist — run `npm run build` first').toBe(true);

  const forbidden = ['leva', 'stats.js', 'rstats', 'dat.gui'];
  const jsFiles: string[] = [];
  (function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) jsFiles.push(full);
    }
  })(distDir);

  expect(jsFiles.length).toBeGreaterThan(0);

  const offenders: Array<{ file: string; term: string }> = [];
  for (const file of jsFiles) {
    const contents = fs.readFileSync(file, 'utf8');
    for (const term of forbidden) {
      if (contents.includes(term)) offenders.push({ file: path.relative(distDir, file), term });
    }
  }
  expect(offenders, JSON.stringify(offenders)).toEqual([]);
});

// ── 360px overflow (Rewire) ──────────────────────────────────────────────────
test('no horizontal overflow at 360px on /rewire/landing/', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/rewire/landing/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
