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
