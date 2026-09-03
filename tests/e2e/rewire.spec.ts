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

// Real mouse clicks, not synthetic events: pointer capture retargets `click`
// to the capturing element, which is exactly the bug this guards against.
test('a real click on the front card opens its demo', async ({ page }) => {
  await page.goto('/rewire/landing/');
  const deck = page.locator('.deck');
  await deck.scrollIntoViewIfNeeded();
  const front = page.locator('.deck-card.is-front');
  await expect(front).toHaveAttribute('data-href', /\/rewire\/sample\//, { timeout: 15000 });
  const href = (await front.getAttribute('data-href'))!;
  await front.locator('.name').click();
  await page.waitForURL((u) => u.pathname === href, { timeout: 15000 });
  expect(new URL(page.url()).pathname).toBe(href);
});

test('a real click on a side card brings it to the front instead of navigating', async ({ page }) => {
  await page.goto('/rewire/landing/');
  const deck = page.locator('.deck');
  await deck.scrollIntoViewIfNeeded();
  await expect(page.locator('.deck-card.is-front')).toHaveAttribute('data-href', /\/rewire\/sample\//, { timeout: 15000 });
  const before = await deck.getAttribute('data-index');
  // Raw coordinates on purpose: Chrome does not hit-test the 3D side cards,
  // so the deck resolves the card geometrically — that is what's under test.
  const box = (await page.locator('.deck-card').nth(1).boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(deck).not.toHaveAttribute('data-index', before!, { timeout: 5000 });
  expect(new URL(page.url()).pathname).toBe('/rewire/landing/');
});

test('each card states its provenance', async ({ page }) => {
  await page.goto('/rewire/landing/');
  const cards = page.locator('.deck-card');
  for (let i = 0; i < await cards.count(); i++) {
    await expect(cards.nth(i).locator('.provenance')).toHaveText(/fictional/i);
    await expect(cards.nth(i).locator('.provenance')).not.toHaveText(/de-identified/i);
  }
});
