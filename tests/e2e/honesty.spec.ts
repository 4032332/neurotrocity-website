import { test, expect } from '@playwright/test';

const BANNED = [
  /\btestimonial/i, /\bclients? say\b/i, /★|⭐/,
  /\b\d+%\s*(increase|uplift|faster|more)\b/i,
  /\btrusted by\b/i, /\bas seen (in|on)\b/i,
];

for (const path of ['/', '/rewire/landing/']) {
  test(`${path} contains no fabricated social proof`, async ({ page }) => {
    await page.goto(path);
    const text = await page.locator('body').innerText();
    for (const re of BANNED) {
      expect(text, `${path} matched ${re}`).not.toMatch(re);
    }
  });

  test(`${path} images all have non-empty alt text`, async ({ page }) => {
    await page.goto(path);
    const imgs = page.locator('img:not([aria-hidden="true"])');
    for (let i = 0; i < await imgs.count(); i++) {
      expect((await imgs.nth(i).getAttribute('alt'))?.trim() ?? '').not.toBe('');
    }
  });
}
