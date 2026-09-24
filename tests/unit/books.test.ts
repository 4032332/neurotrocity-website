import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BOOKS, STORE_URL, isLive } from '../../src/content/facts';

describe('BOOKS', () => {
  it('lists the six titles verbatim, live first', () => {
    expect(BOOKS.map(b => [b.title, b.status])).toEqual([
      ['Nurse Sh*t', 'live'],
      ['Teacher Sh*t', 'live'],
      ['High School Sh*t', 'live'],
      ['Ambo Sh*t', 'coming-soon'],
      ['Christmas Crime Scenes', 'coming-soon'],
      ['Cop Sh*t', 'coming-soon'],
    ]);
  });

  it('has unique slugs', () => {
    const slugs = BOOKS.map(b => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every live book an Amazon url and a cover file that exists', () => {
    for (const b of BOOKS.filter(isLive)) {
      expect(b.url, b.slug).toMatch(/^https:\/\/www\.amazon\.com\.au\//);
      expect(b.coverAlt.trim().length, b.slug).toBeGreaterThan(0);
      expect(fs.existsSync(path.join('public', b.cover)), `${b.cover} missing`).toBe(true);
    }
  });

  it('gives every coming-soon book a chalk-outline prop', () => {
    for (const b of BOOKS.filter(b => !isLive(b))) {
      expect(['defib', 'santa-hat', 'doughnut']).toContain((b as { prop: string }).prop);
    }
  });

  it('points at the NeuroTrocity author store', () => {
    expect(STORE_URL).toBe('https://www.amazon.com.au/s?i=books-single-index&rh=p_27%3ANeuroTrocity&s=relevancerank&text=NeuroTrocity&ref=dp_byline_sr_book_1');
  });
});
