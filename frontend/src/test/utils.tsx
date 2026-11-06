import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes } from '../App';
import { api } from '../api/client';
import type { Product } from '../api/types';

export function product(id: string, title: string, categorySlug = 'electronics'): Product {
  return {
    id,
    title,
    description: `${title} description`,
    price: { amount: 10 + Number(id), currency: 'USD' },
    category: { slug: categorySlug, name: categorySlug },
    imageUrl: `https://img.test/${id}.png`,
    rating: { rate: 4, count: 10 },
  };
}

export const featured = [
  product('1', 'Backpack', 'mens-clothing'),
  product('5', 'Dragon Bracelet', 'jewelery'),
  product('9', 'Hard Drive'),
  product('13', 'Monitor'),
  product('17', 'Rain Jacket', 'womens-clothing'),
];

/** Stubs the API boundary — components never touch fetch directly. */
export function stubApi() {
  return {
    getCategories: vi.spyOn(api, 'getCategories').mockResolvedValue([
      { slug: 'electronics', name: 'electronics' },
      { slug: 'jewelery', name: 'jewelery' },
    ]),
    getFeatured: vi.spyOn(api, 'getFeatured').mockResolvedValue(featured),
    getProduct: vi
      .spyOn(api, 'getProduct')
      .mockImplementation(async (id) => featured.find((p) => p.id === id) ?? product(id, `Product ${id}`)),
    getCategoryPage: vi.spyOn(api, 'getCategoryPage').mockResolvedValue({
      category: { slug: 'electronics', name: 'electronics' },
      topRated: [product('9', 'Hard Drive'), product('13', 'Monitor')],
      more: [product('10', 'SSD'), product('11', 'Laptop')],
    }),
    search: vi.spyOn(api, 'search').mockImplementation(async (term) => ({
      term,
      results: featured.filter((p) => p.title.toLowerCase().includes(term.toLowerCase())),
    })),
    submitEnquiry: vi.spyOn(api, 'submitEnquiry').mockResolvedValue({ reference: 'ref-123' }),
  };
}

export function renderApp(path = '/') {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  return { user, ...utils };
}
