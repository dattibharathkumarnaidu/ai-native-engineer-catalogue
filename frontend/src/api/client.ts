import type {
  Category,
  CategoryPage,
  EnquiryReceipt,
  EnquiryRequest,
  Product,
  SearchResult,
} from './types';

/** Same-origin by default (/api is proxied); override for split deployments. */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { accept: 'application/json', ...(init?.body ? { 'content-type': 'application/json' } : {}) },
    });
  } catch {
    throw new ApiError('We could not reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR');
  }

  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    const error = body?.error ?? {};
    throw new ApiError(error.message ?? 'Something went wrong.', response.status, error.code ?? 'UNKNOWN', error.fields);
  }
  return body as T;
}

/**
 * The only module that knows about HTTP. Components depend on this object, so
 * tests can stub it and a future GraphQL/BFF change stays contained here.
 */
export const api = {
  getFeatured: () => request<{ products: Product[] }>('/api/featured').then((r) => r.products),
  getCategories: () => request<{ categories: Category[] }>('/api/categories').then((r) => r.categories),
  getCategoryPage: (slug: string) => request<CategoryPage>(`/api/categories/${encodeURIComponent(slug)}`),
  getProduct: (id: string) =>
    request<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`).then((r) => r.product),
  search: (term: string) => request<SearchResult>(`/api/search?q=${encodeURIComponent(term)}`),
  submitEnquiry: (enquiry: EnquiryRequest) =>
    request<EnquiryReceipt>('/api/enquiries', { method: 'POST', body: JSON.stringify(enquiry) }),
};
