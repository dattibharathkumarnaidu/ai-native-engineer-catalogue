/**
 * Core catalogue model. This is OUR shape, not the Fake Store shape —
 * adapters translate upstream data into it so the rest of the system
 * never depends on a particular product data source.
 */
export interface Money {
  amount: number;
  currency: string;
}

export interface Category {
  /** URL-safe, stable identifier, e.g. "mens-clothing". */
  slug: string;
  /** Human-readable label, e.g. "men's clothing". */
  name: string;
}

export interface Rating {
  rate: number;
  count: number;
}

export interface Product {
  /** String so future sources (SKUs, UUIDs, CMS ids) fit without a migration. */
  id: string;
  title: string;
  description: string;
  price: Money;
  category: Category;
  imageUrl: string;
  rating?: Rating;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toCategory(name: string): Category {
  return { slug: slugify(name), name };
}
