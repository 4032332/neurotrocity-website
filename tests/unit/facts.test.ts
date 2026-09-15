import { describe, it, expect } from 'vitest';
import { PRODUCTS, DEMOS, RULES, CONTACT, REWIRE, SKILL_PACK } from '../../src/content/facts';

describe('facts', () => {
  it('has exactly the three real products', () => {
    expect(PRODUCTS.map(p => p.slug).sort()).toEqual(['dispoint', 'dosetrack', 'rewire']);
  });

  it('names every product with its live-site display name', () => {
    expect(PRODUCTS.map(p => [p.slug, p.name])).toEqual([
      ['dosetrack', 'DoseTrack'], ['dispoint', 'DisPoint'], ['rewire', 'Rewire'],
    ]);
  });

  it('has exactly the six real demo models', () => {
    expect(DEMOS).toHaveLength(6);
  });

  it('labels every demo model with a resolved provenance', () => {
    for (const d of DEMOS) {
      expect(d.provenance).toBe('fictional');   // no real client behind any demo
    }
  });

  it('carries the four rules verbatim', () => {
    expect(RULES).toHaveLength(4);
    expect(RULES[0].title).toBe('Sharp, not sprawling.');
  });

  it('exposes no testimonial or metric fields', () => {
    const serialized = JSON.stringify({ PRODUCTS, DEMOS, RULES, CONTACT });
    for (const banned of ['testimonial', 'quote', 'rating', 'clients', 'increase', 'uplift']) {
      expect(serialized.toLowerCase()).not.toContain(banned);
    }
  });

  it('carries the four Rewire fits and the four steps verbatim', () => {
    expect(REWIRE.fits).toHaveLength(4);
    expect(REWIRE.steps).toHaveLength(4);
    expect(REWIRE.steps.map(s => s.title)).toEqual([
      'Free review', 'A plan, priced upfront', 'Rebuild', 'Handover, not lock-in',
    ]);
    expect(REWIRE.contact.form).toBe('/rewire/contact/');
    expect(REWIRE.contact.email).toBe(CONTACT.rewire);
  });
});

describe('skill pack', () => {
  it('states a price with a currency and no fabricated anchor', () => {
    expect(SKILL_PACK.price.amount).toBeGreaterThan(0);
    expect(SKILL_PACK.price.currency).toBe('AUD');
    // An inflated "was" price is the engineered regret RULES[1] rules out.
    const s = JSON.stringify(SKILL_PACK).toLowerCase();
    for (const banned of ['was', 'rrp', 'discount', 'normally', 'save']) {
      expect(s).not.toMatch(new RegExp(`\\b${banned}\\b`));
    }
  });

  it('makes no outcome, earnings or testimonial claim anywhere', () => {
    const s = JSON.stringify(SKILL_PACK).toLowerCase();
    // Whole words only — substring matching gives false hits ("earn" in "learning").
    for (const banned of ['testimonial', 'guarantee', 'earn', 'earnings', 'income',
                          'revenue', 'results', 'proven', 'guaranteed']) {
      expect(s).not.toMatch(new RegExp(`\\b${banned}\\b`));
    }
    expect(s).not.toContain('$5k');
  });

  it('states prerequisites and who it is not for, so buyers can self-select out', () => {
    expect(SKILL_PACK.prerequisites.length).toBeGreaterThanOrEqual(3);
    expect(SKILL_PACK.notFor.length).toBeGreaterThanOrEqual(3);
  });

  it('lists contents that each correspond to something that ships', () => {
    expect(SKILL_PACK.contents.length).toBeGreaterThanOrEqual(6);
    for (const c of SKILL_PACK.contents) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.body.length).toBeGreaterThan(30);
    }
  });
});

describe('skill-pack funnel links', () => {
  it('never ships a placeholder video id or free-edition URL', () => {
    // Both are null until the real asset exists. The page hides its section
    // when they are null, so a null here is correct — a guessed URL is not.
    for (const v of [SKILL_PACK.videoId, SKILL_PACK.freeCheckout]) {
      expect(v === null || (typeof v === 'string' && v.length > 0)).toBe(true);
      if (typeof v === 'string') {
        expect(v).not.toMatch(/example|placeholder|TODO|XXXX/i);
      }
    }
  });

  it('stores a bare YouTube id, not a URL, so the embed cannot double up', () => {
    if (SKILL_PACK.videoId !== null) {
      expect(SKILL_PACK.videoId).not.toMatch(/^https?:|youtu/i);
      expect(SKILL_PACK.videoId).toMatch(/^[A-Za-z0-9_-]{11}$/);
    }
  });

  it('points the free edition at a different product than the paid one', () => {
    if (SKILL_PACK.freeCheckout !== null) {
      expect(SKILL_PACK.freeCheckout).not.toBe(SKILL_PACK.checkout);
      expect(SKILL_PACK.freeCheckout).toMatch(/^https:\/\//);
    }
  });
});
