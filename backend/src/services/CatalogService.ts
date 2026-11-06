import { NotFoundError } from '../domain/errors.js';
import type { Category, Product } from '../domain/product.js';
import { normaliseSearchTerm } from '../domain/search.js';
import type { Logger } from '../ports/Logger.js';
import type { Merchandising } from '../ports/Merchandising.js';
import type { ProductImage, ProductRepository } from '../ports/ProductRepository.js';

export interface CategoryPage {
  category: Category;
  topRated: Product[];
  more: Product[];
}

const byRatingDesc = (a: Product, b: Product) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0);

/** Use cases for browsing the catalogue. Knows nothing about HTTP or Fake Store. */
export class CatalogService {
  constructor(
    private readonly products: ProductRepository,
    private readonly merchandising: Merchandising,
    private readonly logger: Logger,
  ) {}

  async getFeatured(): Promise<Product[]> {
    const ids = this.merchandising.featuredProductIds();
    const featured = await this.products.getByIds(ids);
    if (featured.length !== ids.length) {
      const found = new Set(featured.map((p) => p.id));
      this.logger.warn('Some featured products were not found', {
        missing: ids.filter((id) => !found.has(id)),
      });
    }
    return featured;
  }

  listCategories(): Promise<Category[]> {
    return this.products.listCategories();
  }

  /**
   * Top rated = the entrepreneur's hand-picked products that belong to this
   * category first, topped up with the highest customer-rated products until we
   * reach the configured count. Everything else is "more" in source order.
   */
  async getCategoryPage(slug: string): Promise<CategoryPage> {
    const category = (await this.products.listCategories()).find((c) => c.slug === slug);
    if (!category) throw new NotFoundError(`Category "${slug}" not found.`);

    const products = await this.products.listByCategory(slug);
    const limit = this.merchandising.categoryTopRatedCount();
    const featuredIds = this.merchandising.featuredProductIds();

    const curated = featuredIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined);
    const topUp = products.filter((p) => !curated.includes(p)).sort(byRatingDesc);
    const topRated = [...curated, ...topUp].slice(0, Math.max(limit, curated.length));
    const topIds = new Set(topRated.map((p) => p.id));

    return { category, topRated, more: products.filter((p) => !topIds.has(p.id)) };
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.products.getById(id);
    if (!product) throw new NotFoundError(`Product "${id}" not found.`);
    return product;
  }

  async getProductImage(id: string): Promise<ProductImage> {
    const product = await this.getProduct(id);
    return this.products.getImage(product.imageUrl);
  }

  /** An empty/whitespace term returns no results rather than the whole catalogue. */
  async search(rawTerm: unknown): Promise<{ term: string; results: Product[] }> {
    const term = normaliseSearchTerm(rawTerm);
    if (!term) return { term, results: [] };
    return { term, results: await this.products.search(term) };
  }
}
