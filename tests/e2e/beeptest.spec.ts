import { test, expect } from '@playwright/test';
import { BEEPTEST } from '../../src/content/beeptest';

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
