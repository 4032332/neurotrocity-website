import { test, expect, type Page } from '@playwright/test';

/* ── Vale & Vine: the gates ───────────────────────────────────────────────
   The season photographs are gone and there is no full-page scrim, so the
   page's legibility now rests entirely on the sky shader's quiet-rect
   attenuation and on the two dense sections carrying their own opaque
   ground. Both of those are claims about pixels, so they are measured
   against pixels.

   The home page's gate reads the WebGL back buffer directly (see
   quality.spec.ts). That is the right instrument there, where the field is
   the only thing behind the text. It is the wrong one here: #dates and
   #place stand on an opaque panel, so the pixel in the canvas is not the
   pixel behind the words. This samples the real composite instead — a
   screenshot of the element's own box, which includes the canvas, the
   panel, the set-piece video and anything else that lands in between. The
   canvas is still checked for a live WebGL2 context first, so a blank
   stage can never quietly pass the contrast bar.                          */

const VALE = '/rewire/sample/vale/';

const srgb = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]: number[]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

interface Target {
  label: string;
  selector: string;
  /** WCAG floor: 4.5 for body text, 3.0 for large text (>=24px, or >=18.66px bold). */
  threshold: number;
}

const TARGETS: Target[] = [
  { label: 'hero lede', selector: '.hero .lede', threshold: 4.5 },
  { label: 'hero h1', selector: '.hero h1', threshold: 3.0 },
  { label: 'hero kicker', selector: '.hero .mono.brass', threshold: 4.5 },
  { label: '#year lede', selector: '#yearP', threshold: 4.5 },
  { label: '#year month', selector: '#yrMonth', threshold: 3.0 },
  { label: '#year facts value', selector: '.yr__stats b', threshold: 4.5 },
  { label: '#year facts label', selector: '.yr__stats .mono.dim', threshold: 4.5 },
  { label: '#year kicker', selector: '#year .kick', threshold: 4.5 },
  { label: '#year h2', selector: '#year h2', threshold: 3.0 },
  { label: '#year chart caption', selector: '.yr__chart figcaption', threshold: 4.5 },
  { label: '#day kicker', selector: '#day .kick', threshold: 4.5 },
  { label: '#day lede', selector: '#dayP', threshold: 4.5 },
  { label: '#dates label', selector: '#dates .cal__side .mono.dim', threshold: 4.5 },
  { label: '#dates lede', selector: '#dates .lede', threshold: 4.5 },
  { label: '#dinner lede', selector: '#dinner .lede', threshold: 4.5 },
];

/** The element's own text colour, as the browser resolves it. */
async function foreground(page: Page, selector: string): Promise<number[]> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)!;
    const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).color)!;
    return m[1].split(',').slice(0, 3).map((n) => parseFloat(n));
  }, selector);
}

/** Is the element on screen and big enough to sample? */
async function onScreen(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    // at least 70% of the box in view, and clear of the fixed header
    const top = Math.max(r.top, 72);
    const visible = Math.min(r.bottom, innerHeight) - top;
    return visible / r.height >= 0.7;
  }, selector);
}

/**
 * The composited background luminance behind an element.
 *
 * A screenshot of the element's box contains its own glyphs as well as its
 * background, so the median luminance is taken across the box: type covers
 * well under half of a text block's area, which makes the median the
 * background by construction and makes it immune to a sample point landing
 * on a stroke. The darkest and lightest samples are returned too, so a
 * failure says which way it went.
 */
async function backdrop(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error('no box for ' + selector);
  const clip = {
    x: Math.max(0, Math.round(box.x)),
    y: Math.max(0, Math.round(box.y)),
    width: Math.max(2, Math.round(box.width)),
    height: Math.max(2, Math.round(box.height)),
  };
  const png = await page.screenshot({ clip });
  const pixels: number[][] = await page.evaluate(async (b64) => {
    const res = await fetch('data:image/png;base64,' + b64);
    const bmp = await createImageBitmap(await res.blob());
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const g = c.getContext('2d')!;
    g.drawImage(bmp, 0, 0);
    const d = g.getImageData(0, 0, bmp.width, bmp.height).data;
    const out: number[][] = [];
    // a coarse grid, ~40x40 samples, is plenty and keeps the payload small
    const sx = Math.max(1, Math.floor(bmp.width / 40));
    const sy = Math.max(1, Math.floor(bmp.height / 40));
    for (let y = 0; y < bmp.height; y += sy) {
      for (let x = 0; x < bmp.width; x += sx) {
        const i = (y * bmp.width + x) * 4;
        out.push([d[i], d[i + 1], d[i + 2]]);
      }
    }
    return out;
  }, png.toString('base64'));

  const lums = pixels.map(lum).sort((a, b) => a - b);
  return {
    median: lums[Math.floor(lums.length / 2)],
    darkest: lums[0],
    lightest: lums[lums.length - 1],
    samples: lums.length,
  };
}

async function scrollTo(page: Page, f: number) {
  await page.evaluate((frac) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, Math.round(max * frac));
  }, f);
  // the walk is rAF-throttled and the shader eases towards the new sun
  await page.waitForTimeout(1200);
}

const MEASURED: Array<{ f: number; label: string; ratio: number; threshold: number }> = [];

test('vale keeps text above its WCAG floor against the live sky, with no full-page scrim', async ({
  page,
}) => {
  // Deliberately slow: 4 scroll positions x up to 10 elements, each a
  // screenshot and a decode, on top of SwiftShader shader compilation.
  test.setTimeout(180_000);

  await page.goto(VALE);
  // three.js is fetched from an idle callback and the stage mounts when it
  // lands, so there is no fixed moment to wait for — poll until it has drawn.
  // The sky must actually be drawing: a stage that failed to build would
  // leave every element sitting on the same flat --night ground and would
  // sail through the contrast bar while showing nothing.
  await page.waitForFunction(
    () => {
      const c = document.getElementById('stageGL') as HTMLCanvasElement | null;
      const s = (window as any).VV?.__stage;
      return !!c && !!(c.getContext('webgl2') || c.getContext('webgl')) && !!s && s.draws() > 0;
    },
    { timeout: 40000 }
  );

  // And there must be no full-page veil doing the work instead.
  const veils = await page.evaluate(() => {
    const bad: string[] = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width < innerWidth * 0.95 || r.height < innerHeight * 0.95) continue;
      if (el.id === 'stage' || el.closest('#stage')) continue; // the stage itself
      const a = parseFloat(cs.opacity);
      if (a > 0.02 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bad.push(el.id || el.className);
    }
    return bad;
  });
  expect(veils, 'a full-page scrim is still covering the stage').toEqual([]);

  await page.mouse.move(2, 2);

  for (const f of [0, 0.22, 0.45, 0.72, 0.88]) {
    await scrollTo(page, f);
    for (const t of TARGETS) {
      if (!(await onScreen(page, t.selector))) continue;
      const fg = await foreground(page, t.selector);
      const bg = await backdrop(page, t.selector);
      const r = ratio(lum(fg), bg.median);
      MEASURED.push({ f, label: t.label, ratio: r, threshold: t.threshold });
      expect(
        r,
        `at scroll ${f}, ${t.label} measured ${r.toFixed(2)}:1 against the composited ` +
          `background (median luminance ${bg.median.toFixed(4)}, ` +
          `range ${bg.darkest.toFixed(4)}–${bg.lightest.toFixed(4)}), ` +
          `floor ${t.threshold}:1`
      ).toBeGreaterThanOrEqual(t.threshold);
    }
  }

  // The sweep above catches whatever happens to be on screen at those four
  // stops. Anything it missed is brought into view deliberately, so a
  // selector cannot quietly opt out of the gate by never being visible.
  for (const t of TARGETS) {
    if (MEASURED.some((m) => m.label === t.label)) continue;
    await page.locator(t.selector).first().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120)); // clear the fixed header
    await page.waitForTimeout(1200);
    expect(await onScreen(page, t.selector), `${t.label} could not be brought into view`).toBe(true);
    const fg = await foreground(page, t.selector);
    const bg = await backdrop(page, t.selector);
    const r = ratio(lum(fg), bg.median);
    const f = await page.evaluate(
      () => window.scrollY / (document.documentElement.scrollHeight - innerHeight)
    );
    MEASURED.push({ f: +f.toFixed(2), label: t.label, ratio: r, threshold: t.threshold });
    expect(
      r,
      `${t.label} measured ${r.toFixed(2)}:1 against the composited background ` +
        `(median luminance ${bg.median.toFixed(4)}), floor ${t.threshold}:1`
    ).toBeGreaterThanOrEqual(t.threshold);
  }

  const missed = TARGETS.filter((t) => !MEASURED.some((m) => m.label === t.label)).map((t) => t.label);
  expect(missed, 'these elements were never measured').toEqual([]);
  console.table(
    MEASURED.map((m) => ({ scroll: m.f, element: m.label, ratio: +m.ratio.toFixed(2), floor: m.threshold }))
  );
});

test('vale holds a still frame under prefers-reduced-motion', async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(VALE);
  await page.evaluate(() => document.fonts.ready);
  // The stage renders exactly one frame in still mode; wait until it has.
  await page.waitForFunction(
    () => {
      const s = (window as any).VV?.__stage;
      return !!s && s.still === true && s.draws() > 0;
    },
    { timeout: 30000 }
  );
  await page.waitForTimeout(800);
  const a = await page.screenshot();
  await page.waitForTimeout(1200);
  const b = await page.screenshot();
  expect(Buffer.compare(a, b), 'the page is still moving under reduced motion').toBe(0);
});

test('vale has no horizontal overflow at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(VALE);
  await page.waitForTimeout(1500);
  // check the whole document, not just the first screen
  for (const f of [0, 0.5, 1]) {
    await scrollTo(page, f);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `horizontal overflow at 360px, scroll ${f}`).toBeLessThanOrEqual(0);
  }
});

test('vale offers a skip link and shows keyboard focus', async ({ page }) => {
  await page.goto(VALE);
  const skip = page.locator('a.skip');
  await expect(skip).toHaveCount(1);
  await expect(skip).toHaveAttribute('href', '#top');

  // it is the first thing a keyboard reaches
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? { tag: el.tagName, cls: el.className, href: el.getAttribute('href') } : null;
  });
  expect(focused?.cls).toContain('skip');
  expect(focused?.href).toBe('#top');

  // and it becomes visible when it has focus
  await expect(skip).toBeInViewport();

  // the focus ring is a real outline, not a removed one
  const ring = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const cs = getComputedStyle(el);
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(ring.style).not.toBe('none');
  expect(ring.width).toBeGreaterThanOrEqual(1);

  // every interactive control keeps a visible ring
  const naked = await page.evaluate(() => {
    const out: string[] = [];
    const els = Array.from(document.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      // a control that is not rendered at this viewport (the burger, on
      // desktop) cannot take focus, so it has no ring to check
      .filter((el) => el.getClientRects().length > 0)
      .slice(0, 40);
    for (const el of els) {
      el.focus();
      const cs = getComputedStyle(el);
      if (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) < 1) {
        out.push(el.tagName + '.' + el.className);
      }
    }
    return out;
  });
  expect(naked, 'controls with no visible focus ring').toEqual([]);
});
