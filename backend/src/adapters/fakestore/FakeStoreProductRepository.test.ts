import { describe, expect, it } from 'vitest';
import { UpstreamError } from '../../domain/errors.js';
import { silentLogger } from '../../lib/logger.js';
import { FakeStoreProductRepository } from './FakeStoreProductRepository.js';

const upstream = [
  { id: 1, title: 'Backpack', price: 109.95, description: 'Laptop bag', category: "men's clothing", image: 'https://x/1.png', rating: { rate: 3.9, count: 120 } },
  { id: 5, title: 'Bracelet', price: 695, description: 'Dragon', category: 'jewelery', image: 'https://x/5.png', rating: { rate: 4.6, count: 400 } },
  { id: 9, title: 'Hard Drive', price: 64, description: 'USB storage', category: 'electronics', image: 'https://x/9.png' },
  { id: 'broken' }, // malformed record must be skipped, not crash the catalogue
];

function stubFetch(respond: () => Promise<Response> | Response) {
  const calls: string[] = [];
  const fetchImpl = (async (input: string | URL | Request) => {
    calls.push(String(input));
    return respond();
  }) as typeof fetch;
  return { fetchImpl, calls };
}

function repo(fetchImpl: typeof fetch) {
  return new FakeStoreProductRepository({
    baseUrl: 'https://fakestore.test',
    cacheTtlMs: 60_000,
    timeoutMs: 1000,
    currency: 'USD',
    logger: silentLogger,
    fetchImpl,
  });
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('FakeStoreProductRepository', () => {
  it('maps upstream products into the domain model', async () => {
    const { fetchImpl } = stubFetch(() => json(upstream));
    const product = await repo(fetchImpl).getById('1');
    expect(product).toEqual({
      id: '1',
      title: 'Backpack',
      description: 'Laptop bag',
      price: { amount: 109.95, currency: 'USD' },
      category: { slug: 'mens-clothing', name: "men's clothing" },
      imageUrl: 'https://x/1.png',
      rating: { rate: 3.9, count: 120 },
    });
  });

  it('derives sorted categories and filters by category slug', async () => {
    const { fetchImpl } = stubFetch(() => json(upstream));
    const r = repo(fetchImpl);
    expect((await r.listCategories()).map((c) => c.slug)).toEqual(['electronics', 'jewelery', 'mens-clothing']);
    expect((await r.listByCategory('jewelery')).map((p) => p.id)).toEqual(['5']);
  });

  it('skips malformed records and returns null for unknown ids', async () => {
    const { fetchImpl } = stubFetch(() => json(upstream));
    const r = repo(fetchImpl);
    expect(await r.getById('broken')).toBeNull();
    expect(await r.getById('999')).toBeNull();
    expect((await r.getByIds(['9', '999', '1'])).map((p) => p.id)).toEqual(['9', '1']);
  });

  it('searches across the catalogue', async () => {
    const { fetchImpl } = stubFetch(() => json(upstream));
    expect((await repo(fetchImpl).search('usb')).map((p) => p.id)).toEqual(['9']);
  });

  it('fetches same-origin image assets and rejects other hosts', async () => {
    const calls: string[] = [];
    const fetchOptions: RequestInit[] = [];
    const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
      calls.push(String(input));
      if (init) fetchOptions.push(init);
      if (String(input).endsWith('/products')) return json(upstream);
      return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } });
    }) as typeof fetch;
    const r = repo(fetchImpl);

    const image = await r.getImage('https://fakestore.test/img/1.png');
    expect(image.contentType).toBe('image/png');
    expect([...image.bytes]).toEqual([1, 2, 3]);
    expect(fetchOptions[0]?.redirect).toBe('error');
    await expect(r.getImage('https://untrusted.test/img/1.png')).rejects.toBeInstanceOf(UpstreamError);
    await expect(r.getImage('https://fakestore.test/products')).rejects.toBeInstanceOf(UpstreamError);
    await expect(r.getImage('https://user@fakestore.test/img/1.png')).rejects.toBeInstanceOf(UpstreamError);
    expect(calls).toEqual(['https://fakestore.test/img/1.png']);
  });

  it('calls the upstream once and serves subsequent reads from cache', async () => {
    const { fetchImpl, calls } = stubFetch(() => json(upstream));
    const r = repo(fetchImpl);
    await Promise.all([r.listCategories(), r.getById('1'), r.search('bag')]);
    await r.getById('5');
    expect(calls).toEqual(['https://fakestore.test/products']);
  });

  it('raises UpstreamError on HTTP errors, network failures and bad payloads', async () => {
    await expect(repo(stubFetch(() => json({}, 503)).fetchImpl).getById('1')).rejects.toBeInstanceOf(UpstreamError);
    await expect(
      repo(stubFetch(() => Promise.reject(new TypeError('fetch failed'))).fetchImpl).getById('1'),
    ).rejects.toBeInstanceOf(UpstreamError);
    await expect(repo(stubFetch(() => json({ not: 'an array' })).fetchImpl).getById('1')).rejects.toBeInstanceOf(
      UpstreamError,
    );
    await expect(
      repo(stubFetch(() => new Response('<html>', { status: 200 })).fetchImpl).getById('1'),
    ).rejects.toBeInstanceOf(UpstreamError);
  });
});
