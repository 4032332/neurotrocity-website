import { describe, it, expect } from 'vitest';
import { PRODUCTS, DEMOS, RULES, CONTACT } from '../../src/content/facts';

describe('facts', () => {
  it('has exactly the three real products', () => {
    expect(PRODUCTS.map(p => p.slug).sort()).toEqual(['dispoint', 'dosetrack', 'rewire']);
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
});
