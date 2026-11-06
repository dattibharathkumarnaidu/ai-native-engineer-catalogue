import { describe, expect, it } from 'vitest';
import { makeProduct } from '../test-support/fixtures.js';
import { toCategory } from './product.js';
import { matchesSearch, normaliseSearchTerm } from './search.js';

const backpack = makeProduct({
  id: '1',
  title: 'Fjallraven Backpack',
  description: 'Fits 15 inch laptops',
  category: toCategory("men's clothing"),
});

describe('matchesSearch', () => {
  it('matches the title case-insensitively', () => {
    expect(matchesSearch(backpack, 'BACKPACK')).toBe(true);
  });

  it('matches the description and the category name', () => {
    expect(matchesSearch(backpack, 'laptops')).toBe(true);
    expect(matchesSearch(backpack, "men's")).toBe(true);
  });

  it('does not match unrelated text', () => {
    expect(matchesSearch(backpack, 'bracelet')).toBe(false);
  });

  it('never matches an empty or whitespace term', () => {
    expect(matchesSearch(backpack, '')).toBe(false);
    expect(matchesSearch(backpack, '   ')).toBe(false);
  });

  it('treats the term as a phrase after collapsing whitespace', () => {
    expect(matchesSearch(backpack, '  15   inch ')).toBe(true);
    expect(matchesSearch(backpack, 'inch 15')).toBe(false);
  });
});

describe('normaliseSearchTerm', () => {
  it('rejects non-strings and caps length', () => {
    expect(normaliseSearchTerm(['a', 'b'])).toBe('');
    expect(normaliseSearchTerm('x'.repeat(500))).toHaveLength(100);
  });
});
