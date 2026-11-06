import { describe, expect, it } from 'vitest';
import { StaticMerchandising } from '../adapters/merchandising/StaticMerchandising.js';
import { NotFoundError } from '../domain/errors.js';
import { silentLogger } from '../lib/logger.js';
import { InMemoryProductRepository } from '../test-support/fixtures.js';
import { CatalogService } from './CatalogService.js';

const service = (featured: string[], topRatedCount = 2) =>
  new CatalogService(new InMemoryProductRepository(), new StaticMerchandising(featured, topRatedCount), silentLogger);

const ids = (items: { id: string }[]) => items.map((p) => p.id);

describe('CatalogService', () => {
  describe('getFeatured (home page)', () => {
    it('returns the chosen top rated products in the chosen order', async () => {
      expect(ids(await service(['9', '1', '5', '3', '2']).getFeatured())).toEqual(['9', '1', '5', '3', '2']);
    });

    it('skips featured ids that no longer exist instead of failing the page', async () => {
      expect(ids(await service(['1', 'gone', '5']).getFeatured())).toEqual(['1', '5']);
    });
  });

  describe('getCategoryPage', () => {
    it('puts curated products first, tops up by rating, and lists the rest as more', async () => {
      // Category has 1, 2, 3, 4. Curated: 1. Highest rated of the rest: 3 (4.7).
      const page = await service(['1', '5'], 2).getCategoryPage('mens-clothing');
      expect(page.category).toEqual({ slug: 'mens-clothing', name: "men's clothing" });
      expect(ids(page.topRated)).toEqual(['1', '3']);
      expect(ids(page.more)).toEqual(['2', '4']);
    });

    it('never shows a product in both sections and loses none', async () => {
      const page = await service([], 3).getCategoryPage('mens-clothing');
      const all = [...ids(page.topRated), ...ids(page.more)];
      expect(new Set(all).size).toBe(all.length);
      expect(all.sort()).toEqual(['1', '2', '3', '4']);
      expect(ids(page.topRated)).toEqual(['3', '2', '1']);
    });

    it('throws NotFoundError for an unknown category', async () => {
      await expect(service([]).getCategoryPage('nope')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('search', () => {
    it('only returns products whose text matches the term', async () => {
      const result = await service([]).search('slim fit');
      expect(result.term).toBe('slim fit');
      expect(ids(result.results)).toEqual(['2', '4']);
    });

    it('returns nothing (not everything) for a blank term', async () => {
      expect((await service([]).search('   ')).results).toEqual([]);
      expect((await service([]).search(undefined)).results).toEqual([]);
    });
  });

  it('getProduct throws NotFoundError for an unknown id', async () => {
    await expect(service([]).getProduct('999')).rejects.toBeInstanceOf(NotFoundError);
    expect((await service([]).getProduct('5')).title).toBe('Dragon Bracelet');
  });
});
