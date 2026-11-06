import type { Product } from './product.js';

export const SEARCH_TERM_MAX_LENGTH = 100;

export function normaliseSearchTerm(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ').slice(0, SEARCH_TERM_MAX_LENGTH);
}

/**
 * A product matches when the whole (normalised) term appears, case-insensitively,
 * in its title, description or category name. Plain substring matching keeps the
 * behaviour predictable for the PoC; a real search engine can replace this behind
 * ProductRepository.search().
 */
export function matchesSearch(product: Product, term: string): boolean {
  const needle = normaliseSearchTerm(term).toLowerCase();
  if (!needle) return false;
  return [product.title, product.description, product.category.name].some((field) =>
    field.toLowerCase().includes(needle),
  );
}
