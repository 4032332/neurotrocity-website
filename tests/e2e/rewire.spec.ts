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
  await deck.scrollIntoViewIfNeeded();
  // Precondition: the initial front demo has mounted (the deck settles its
  // iframe SETTLE_MS after coming into view, later still under load).
  await expect(page.locator('.deck-card.is-front iframe')).toHaveAttribute('src', /\/rewire\/sample\//, { timeout: 15000 });
  await deck.focus();
  await page.keyboard.press('ArrowRight');
  const front = page.locator('.deck-card.is-front');
  const href = await front.getAttribute('data-href');
  expect(href).toBeTruthy();
  await expect(front.locator('iframe')).toHaveAttribute('src', href!, { timeout: 15000 });
  await expect(page.locator('.deck-card iframe[src]:not([src=""])')).toHaveCount(1);
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
