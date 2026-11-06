import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './client';

function mockFetch(impl: () => Promise<Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(impl);
}

afterEach(() => vi.restoreAllMocks());

describe('api client', () => {
  it('calls the backend (never Fake Store) and unwraps the payload', async () => {
    const fetchSpy = mockFetch(async () => new Response(JSON.stringify({ products: [] }), { status: 200 }));
    await expect(api.getFeatured()).resolves.toEqual([]);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('/api/featured');
  });

  it('encodes user input in URLs', async () => {
    const fetchSpy = mockFetch(async () => new Response(JSON.stringify({ term: 'a&b', results: [] })));
    await api.search('a&b/../x');
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('/api/search?q=a%26b%2F..%2Fx');
  });

  it('turns error envelopes into ApiError with field errors', async () => {
    mockFetch(
      async () =>
        new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Bad', fields: { email: 'x' } } }), {
          status: 400,
        }),
    );
    const error = await api.submitEnquiry({ productId: '1', name: 'a', email: 'b' }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', fields: { email: 'x' } });
  });

  it('reports network failures in plain language', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(api.getCategories()).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });
});
