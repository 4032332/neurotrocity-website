import { describe, it, expect } from 'vitest';
import { PRODUCTS, DEMOS, RULES, CONTACT, REWIRE } from '../../src/content/facts';

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
