import { describe, expect, it } from 'vitest';
import { slugify } from './product.js';

describe('slugify', () => {
  it('produces stable URL-safe slugs from Fake Store category names', () => {
    expect(slugify("men's clothing")).toBe('mens-clothing');
    expect(slugify("women's clothing")).toBe('womens-clothing');
    expect(slugify('jewelery')).toBe('jewelery');
    expect(slugify('  Home & Garden ')).toBe('home-garden');
  });
});
