/**
 * API contract types. Mirrors backend/src/domain/product.ts — duplicated for
 * now; the next step is a shared package or OpenAPI-generated types.
 */
export interface Money {
  amount: number;
  currency: string;
}

export interface Category {
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: Money;
  category: Category;
  imageUrl: string;
  rating?: { rate: number; count: number };
}

export interface CategoryPage {
  category: Category;
  topRated: Product[];
  more: Product[];
}

export interface SearchResult {
  term: string;
  results: Product[];
}

export interface EnquiryRequest {
  productId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  /** Honeypot — always empty for humans. */
  website?: string;
}

export interface EnquiryReceipt {
  reference: string;
}
