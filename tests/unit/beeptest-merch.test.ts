import { describe, it, expect } from 'vitest';
import { BEEPTEST } from '../../src/content/beeptest';

describe('the merch store link', () => {
  it('is null or a real https store URL, never a guess', () => {
    const u = BEEPTEST.merch.url;
    expect(u === null || /^https:\/\/[^\s/]+\.[^\s/]+/.test(u)).toBe(true);
    if (u !== null) expect(u).not.toMatch(/example|placeholder|todo|xxx/i);
  });
});
