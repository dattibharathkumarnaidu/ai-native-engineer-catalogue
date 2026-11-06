import { toCategory, type Product } from '../domain/product.js';
import { matchesSearch } from '../domain/search.js';
import type { ProductRepository } from '../ports/ProductRepository.js';

export function makeProduct(overrides: Partial<Product> & { id: string }): Product {
  return {
    title: `Product ${overrides.id}`,
    description: 'A product',
    price: { amount: 10, currency: 'USD' },
    category: toCategory('electronics'),
    imageUrl: `https://img.example/${overrides.id}.png`,
    rating: { rate: 3, count: 10 },
    ...overrides,
  };
}

export const products: Product[] = [
  makeProduct({ id: '1', title: 'Fjallraven Backpack', description: 'Fits 15 inch laptops', category: toCategory("men's clothing"), rating: { rate: 3.9, count: 120 } }),
  makeProduct({ id: '2', title: 'Slim Fit T-Shirt', description: 'Casual cotton tee', category: toCategory("men's clothing"), rating: { rate: 4.1, count: 259 } }),
  makeProduct({ id: '3', title: 'Cotton Jacket', description: 'Great outerwear', category: toCategory("men's clothing"), rating: { rate: 4.7, count: 500 } }),
  makeProduct({ id: '4', title: 'Casual Slim Fit', description: 'Colour may vary', category: toCategory("men's clothing"), rating: { rate: 2.1, count: 430 } }),
  makeProduct({ id: '5', title: 'Dragon Bracelet', description: 'Silver chain', category: toCategory('jewelery'), rating: { rate: 4.6, count: 400 } }),
  makeProduct({ id: '9', title: 'WD 2TB Hard Drive', description: 'Portable USB 3.0 storage', category: toCategory('electronics'), rating: { rate: 3.3, count: 203 } }),
];

/** Fake repository used by service and HTTP tests. */
export class InMemoryProductRepository implements ProductRepository {
  constructor(private readonly items: Product[] = products) {}

  async listCategories() {
    const map = new Map(this.items.map((p) => [p.category.slug, p.category]));
    return [...map.values()];
  }
  async listByCategory(slug: string) {
    return this.items.filter((p) => p.category.slug === slug);
  }
  async getById(id: string) {
    return this.items.find((p) => p.id === id) ?? null;
  }
  async getByIds(ids: readonly string[]) {
    return ids.flatMap((id) => this.items.filter((p) => p.id === id));
  }
  async search(term: string) {
    return this.items.filter((p) => matchesSearch(p, term));
  }
  async getImage(_url: string) {
    return { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/png' };
  }
}
