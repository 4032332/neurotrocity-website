import { test, expect } from '@playwright/test';
import { BEEPTEST } from '../../src/content/beeptest';
import { pacingSchedule } from '../../src/content/beeptest-protocol';

const LANDING = '/beeptest/landing/';

test('the landing page has exactly one h1, and it is the headline', async ({ page }) => {
  await page.goto(LANDING);
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toContainText(BEEPTEST.hero.lines[0]);
  await expect(h1).toContainText(BEEPTEST.hero.payoff);
});

test('the page is on black, not the studio ground', async ({ page }) => {
  await page.goto(LANDING);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(0, 0, 0)');
});

test('the studio cortex field and spine are off', async ({ page }) => {
  await page.goto(LANDING);
  await expect(page.locator('body.layered')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('no link points at the App Store yet', async ({ page }) => {
  await page.goto(LANDING);
  await expect(page.locator('a[href*="apps.apple.com"]')).toHaveCount(0);
});

test('the hero skull loads', async ({ page }) => {
  await page.goto(LANDING);
  const img = page.locator('.bt-hero img');
  await expect(img).toHaveAttribute('alt', BEEPTEST.hero.skullAlt);
  expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
});

test('the speed lines cover the whole hero, edge to edge', async ({ page }) => {
  // Motion off: the entrance scale(1.35) would inflate the box and hide a clipped SVG.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(LANDING);
  const [hero, rays] = await Promise.all([
    page.locator('.bt-hero').boundingBox(),
    page.locator('.bt-rays').boundingBox(),
  ]);
  // base.css caps svg at max-width:100%; the rays must still overhang both sides.
  expect(rays!.x).toBeLessThanOrEqual(hero!.x);
  expect(rays!.x + rays!.width).toBeGreaterThanOrEqual(hero!.x + hero!.width);
});

test('the pacing bar shows its three cue marks and the beep, even with motion reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(LANDING);
  const pace = page.locator('#pacing .bt-pace');
  for (const label of ['70%', '80%', '90%', BEEPTEST.pacing.beepLabel]) {
    await expect(pace.getByText(label, { exact: true })).toBeVisible();
  }
  const name = await page.locator('.bt-runner').evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe('none');
});

test('the pacing bar runs at the demo level’s real shuttle time', async ({ page }) => {
  await page.goto(LANDING);
  const expected = pacingSchedule(BEEPTEST.pacing.demoLevel).durationSec;
  const dur = await page.locator('.bt-runner').evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(dur)).toBeCloseTo(expected, 3);
});

test('each cue flashes at its fraction of the shuttle', async ({ page }) => {
  await page.goto(LANDING);
  const s = pacingSchedule(BEEPTEST.pacing.demoLevel);
  const delays = await page.locator('.bt-tick:not(.beep)').evaluateAll((els) =>
    els.map((el) => parseFloat(getComputedStyle(el, '::before').animationDelay)),
  );
  expect(delays).toHaveLength(3);
  delays.forEach((d, i) => expect(d).toBeCloseTo(s.cues[i].atSec, 3));
});

test('the hero’s second button reaches the pacing bar', async ({ page }) => {
  await page.goto(LANDING);
  await page.getByRole('link', { name: BEEPTEST.hero.secondary.label }).click();
  await expect(page).toHaveURL(/#pacing$/);
  await expect(page.locator('#pacing')).toBeInViewport();
});

test('the pacing bar labels never overlap, even on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(LANDING);
  const boxes = await page.locator('#pacing .bt-tick b').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left, r: r.right, t: r.top, b: r.bottom, text: el.textContent };
    }),
  );
  expect(boxes).toHaveLength(4);
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], c = boxes[j];
      const overlap = a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b;
      expect(overlap, `${a.text} overlaps ${c.text}`).toBe(false);
    }
  }
});

for (const doc of ['privacy', 'eula', 'support'] as const) {
  const path = `/beeptest/${doc}/`;
  const meta = BEEPTEST.docs.pages[doc];

  test(`${path} is a real page, honestly pending, and kept out of search`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveText(meta.heading);
    await expect(page.locator('main')).toContainText(BEEPTEST.docs.pending);
    await expect(page.locator(`main a[href="mailto:${BEEPTEST.footer.email}"]`)).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page).toHaveTitle(meta.title);
  });
}

test('pending policy pages are not in the sitemap yet', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const doc of ['privacy', 'eula', 'support']) {
    expect(xml).not.toContain(`/beeptest/${doc}/`);
  }
  expect(xml).toContain('/beeptest/landing/');
});
