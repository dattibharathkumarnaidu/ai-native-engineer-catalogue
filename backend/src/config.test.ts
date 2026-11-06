import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('provides working local defaults', () => {
    const config = loadConfig({});
    expect(config.port).toBe(4000);
    expect(config.merchandising.featuredProductIds).toHaveLength(5);
    expect(config.mail.transport).toBe('smtp');
  });

  it('parses lists and numbers from the environment', () => {
    const config = loadConfig({ FEATURED_PRODUCT_IDS: '3, 4 ,', CATALOG_CACHE_TTL_SECONDS: '10', MAIL_TRANSPORT: 'console' });
    expect(config.merchandising.featuredProductIds).toEqual(['3', '4']);
    expect(config.productSource.cacheTtlMs).toBe(10_000);
    expect(config.mail.transport).toBe('console');
  });

  it('fails fast with every problem listed', () => {
    const load = () => loadConfig({ PORT: 'abc', MAIL_TRANSPORT: 'pigeon', FAKESTORE_BASE_URL: 'not a url' });
    // Order-independent: we care that every problem is reported, not the order.
    for (const key of ['PORT', 'MAIL_TRANSPORT', 'FAKESTORE_BASE_URL']) {
      expect(load).toThrow(key);
    }
  });
});
