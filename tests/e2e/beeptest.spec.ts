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
