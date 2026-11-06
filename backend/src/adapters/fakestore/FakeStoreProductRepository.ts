import { UpstreamError } from '../../domain/errors.js';
import type { Category, Product } from '../../domain/product.js';
import { matchesSearch } from '../../domain/search.js';
import { cachedLoader } from '../../lib/ttlCache.js';
import type { Logger } from '../../ports/Logger.js';
import type { ProductImage, ProductRepository } from '../../ports/ProductRepository.js';
import { mapFakeStoreProduct } from './mapFakeStoreProduct.js';

export interface FakeStoreOptions {
  baseUrl: string;
  cacheTtlMs: number;
  timeoutMs: number;
  currency: string;
  logger: Logger;
  fetchImpl?: typeof fetch;
}

/**
 * Fake Store exposes ~20 products, so we load the full list once (cached) and
 * derive categories, lookups and search from it. This also sidesteps a Fake
 * Store quirk where GET /products/:id returns 200 with an empty body for
 * unknown ids. A large catalogue would get an adapter that queries natively.
 */
export class FakeStoreProductRepository implements ProductRepository {
  private readonly loadAll: () => Promise<Product[]>;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: FakeStoreOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.loadAll = cachedLoader(() => this.fetchAll(), options.cacheTtlMs);
  }

  async listCategories(): Promise<Category[]> {
    const bySlug = new Map<string, Category>();
    for (const p of await this.loadAll()) bySlug.set(p.category.slug, p.category);
    return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async listByCategory(categorySlug: string): Promise<Product[]> {
    return (await this.loadAll()).filter((p) => p.category.slug === categorySlug);
  }

  async getById(id: string): Promise<Product | null> {
    return (await this.loadAll()).find((p) => p.id === id) ?? null;
  }

  async getByIds(ids: readonly string[]): Promise<Product[]> {
    const byId = new Map((await this.loadAll()).map((p) => [p.id, p]));
    return ids.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    });
  }

  async search(term: string): Promise<Product[]> {
    return (await this.loadAll()).filter((p) => matchesSearch(p, term));
  }

  async getImage(imageUrl: string): Promise<ProductImage> {
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      throw new UpstreamError('Product image source is invalid.');
    }
    const source = new URL(this.options.baseUrl);
    if (
      url.origin !== source.origin ||
      url.username ||
      url.password ||
      !url.pathname.startsWith('/img/')
    ) {
      throw new UpstreamError('Product image source is invalid.');
    }

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        headers: { accept: 'image/*' },
        redirect: 'error',
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (cause) {
      this.options.logger.error('Product image source unreachable', { url: url.toString(), cause: String(cause) });
      throw new UpstreamError('Product image is unavailable.');
    }
    if (!response.ok) throw new UpstreamError('Product image is unavailable.');

    const contentType = response.headers.get('content-type')?.split(';', 1)[0];
    const contentLength = Number(response.headers.get('content-length'));
    if (!contentType?.startsWith('image/') || (Number.isFinite(contentLength) && contentLength > 5_000_000)) {
      throw new UpstreamError('Product image source returned an invalid image.');
    }

    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await response.arrayBuffer());
    } catch {
      throw new UpstreamError('Product image source returned an invalid image.');
    }
    if (bytes.byteLength > 5_000_000) throw new UpstreamError('Product image source returned an invalid image.');
    return { bytes, contentType };
  }

  private async fetchAll(): Promise<Product[]> {
    const url = new URL('/products', this.options.baseUrl);
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (cause) {
      this.options.logger.error('Product source unreachable', { url: url.toString(), cause: String(cause) });
      throw new UpstreamError('Product source is unavailable.');
    }
    if (!response.ok) {
      this.options.logger.error('Product source returned an error', { status: response.status });
      throw new UpstreamError('Product source is unavailable.');
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new UpstreamError('Product source returned invalid JSON.');
    }
    if (!Array.isArray(body)) throw new UpstreamError('Product source returned an unexpected payload.');

    const products: Product[] = [];
    for (const raw of body) {
      const product = mapFakeStoreProduct(raw, this.options.currency);
      if (product) products.push(product);
      else this.options.logger.warn('Skipping malformed product from source', { raw });
    }
    return products;
  }
}
