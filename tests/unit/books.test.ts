import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BOOKS, STORE_URL, isLive } from '../../src/content/facts';

describe('BOOKS', () => {
  it('lists the eight titles verbatim, live first', () => {
    expect(BOOKS.map(b => [b.title, b.status])).toEqual([
      ['Nurse Sh*t', 'live'],
      ['Little Kid Teacher Shit', 'live'],
      ['Big Kid Teacher Shit', 'live'],
      ['Ambo Sh*t', 'live'],
      ['Gym Sh*t', 'live'],
      ['Cop Sh*t', 'coming-soon'],
      ['Firefighter Sh*t', 'coming-soon'],
      ['Parent Sh*t', 'coming-soon'],
    ]);
  });

  it('has unique slugs', () => {
    const slugs = BOOKS.map(b => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every live book an Amazon url', () => {
    for (const b of BOOKS.filter(isLive)) {
      expect(b.url, b.slug).toMatch(/^https:\/\/www\.amazon\.com\.au\//);
    }
  });

  it('gives every book a cover, alt text and two inside pages that exist', () => {
    for (const b of BOOKS) {
      expect(b.coverAlt.trim().length, b.slug).toBeGreaterThan(0);
      for (const f of [b.cover, ...b.peeks]) {
        expect(fs.existsSync(path.join('public', f)), `${f} missing`).toBe(true);
      }
    }
  });

  it('never gives a coming-soon book a link', () => {
    for (const b of BOOKS.filter(b => !isLive(b))) {
      expect('url' in b, b.slug).toBe(false);
    }
  });

  it('points at the NeuroTrocity author store', () => {
    expect(STORE_URL).toBe('https://www.amazon.com.au/s?i=books-single-index&rh=p_27%3ANeuroTrocity&s=relevancerank&text=NeuroTrocity&ref=dp_byline_sr_book_1');
  });
});
