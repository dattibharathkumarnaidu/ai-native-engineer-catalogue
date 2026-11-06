import type { Category, Product } from '../domain/product.js';

export interface ProductImage {
  bytes: Uint8Array;
  contentType: string;
}

/**
 * The boundary to whatever owns product data (Fake Store today; a PIM, CMS,
 * database or commerce platform tomorrow). Search and category filtering live
 * here, not in the service, so a real backend can do them natively and at scale.
 */
export interface ProductRepository {
  listCategories(): Promise<Category[]>;
  listByCategory(categorySlug: string): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  getByIds(ids: readonly string[]): Promise<Product[]>;
  search(term: string): Promise<Product[]>;
  getImage(url: string): Promise<ProductImage>;
}
