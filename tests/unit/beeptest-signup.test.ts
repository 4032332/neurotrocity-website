import { describe, it, expect } from 'vitest';
import { buttondownAction } from '../../src/content/beeptest-signup';
import { BEEPTEST } from '../../src/content/beeptest';

describe('buttondownAction', () => {
  it('is null while there is no Buttondown account, so the form cannot post anywhere', () => {
    expect(buttondownAction(null)).toBeNull();
  });

  it('builds the embed-subscribe endpoint from a bare username', () => {
    expect(buttondownAction('neurotrocity')).toBe(
      'https://buttondown.com/api/emails/embed-subscribe/neurotrocity',
    );
  });

  it('refuses a pasted URL rather than building a broken endpoint', () => {
    expect(() => buttondownAction('https://buttondown.com/api/emails/embed-subscribe/neurotrocity'))
      .toThrow(/bare username/);
  });

  it('refuses an empty string', () => {
    expect(() => buttondownAction('')).toThrow(/bare username/);
  });
});

describe('launch-list configuration', () => {
  it('is null or a bare username, and never a guess', () => {
    const u = BEEPTEST.launch.buttondownUsername;
    expect(u === null || /^[A-Za-z0-9_-]+$/.test(u)).toBe(true);
    if (u !== null) expect(u).not.toMatch(/example|placeholder|todo|xxx/i);
  });
});
