import { toCategory, type Product } from '../../domain/product.js';

/** Upstream shape — treated as untrusted and only used inside this adapter. */
export interface FakeStoreProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: { rate: number; count: number };
}

function isFakeStoreProduct(value: unknown): value is FakeStoreProduct {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (typeof v.id === 'number' || typeof v.id === 'string') &&
    typeof v.title === 'string' &&
    typeof v.price === 'number' &&
    typeof v.description === 'string' &&
    typeof v.category === 'string' &&
    typeof v.image === 'string'
  );
}

/** Returns null for malformed records so one bad item can't break the catalogue. */
export function mapFakeStoreProduct(raw: unknown, currency: string): Product | null {
  if (!isFakeStoreProduct(raw)) return null;
  const rating =
    raw.rating && typeof raw.rating.rate === 'number' && typeof raw.rating.count === 'number'
      ? { rate: raw.rating.rate, count: raw.rating.count }
      : undefined;
  return {
    id: String(raw.id),
    title: raw.title,
    description: raw.description,
    price: { amount: raw.price, currency },
    category: toCategory(raw.category),
    imageUrl: raw.image,
    ...(rating ? { rating } : {}),
  };
}
