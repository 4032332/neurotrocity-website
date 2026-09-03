import { test, expect } from '@playwright/test';
import { DEMOS } from '../../src/content/facts';

test('every demo model is reachable from the deck', async ({ page }) => {
  await page.goto('/rewire/landing/');
  for (const d of DEMOS) {
    await expect(page.locator(`a[href="${d.href}"]`)).toHaveCount(1);
  }
});

test('at most one demo iframe is live at a time', async ({ page }) => {
  await page.goto('/rewire/landing/');
  await page.waitForTimeout(1500);
  expect(await page.locator('.deck-card iframe[src]:not([src=""])').count()).toBeLessThanOrEqual(1);
});

test('exactly one demo iframe is live, matching the front card', async ({ page }) => {
  await page.goto('/rewire/landing/');
  const deck = page.locator('.deck');
  await deck.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);
  const liveFrames = page.locator('.deck-card iframe[src]:not([src=""])');
  await expect(liveFrames).toHaveCount(1);
  const frontHref = await page.locator('.deck-card.is-front').getAttribute('data-href');
  const frameSrc = await liveFrames.first().getAttribute('src');
  expect(frontHref).toBeTruthy();
  expect(frameSrc).toContain(frontHref!);
});

test('the deck is keyboard operable', async ({ page }) => {
  await page.goto('/rewire/landing/');
  const deck = page.locator('.deck');
  await deck.focus();
  const before = await deck.getAttribute('data-index');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  expect(await deck.getAttribute('data-index')).not.toBe(before);
});

test('each card states its provenance', async ({ page }) => {
  await page.goto('/rewire/landing/');
  const cards = page.locator('.deck-card');
  for (let i = 0; i < await cards.count(); i++) {
    await expect(cards.nth(i).locator('.provenance')).toHaveText(/fictional/i);
    await expect(cards.nth(i).locator('.provenance')).not.toHaveText(/de-identified/i);
  }
});
