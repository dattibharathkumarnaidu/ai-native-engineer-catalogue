/**
 * One test per acceptance criterion, driven through the real routes and
 * components with only the API boundary stubbed.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from './api/client';
import { featured, renderApp, stubApi } from './test/utils';

describe('Acceptance criteria', () => {
  it('Home page: shows the 5 featured products', async () => {
    stubApi();
    renderApp('/');

    const list = await screen.findByRole('list', { name: 'Top rated products' });
    const tiles = within(list).getAllByRole('listitem');
    expect(tiles).toHaveLength(5);
    expect(tiles.map((t) => t.textContent)).toEqual(featured.map((p) => expect.stringContaining(p.title)));
  });

  it('Category page: clicking a category link shows top rated and additional products', async () => {
    const api = stubApi();
    const { user } = renderApp('/');

    const nav = await screen.findByRole('navigation', { name: 'Categories' });
    await user.click(await within(nav).findByRole('link', { name: 'electronics' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'electronics' })).toBeInTheDocument();
    expect(api.getCategoryPage).toHaveBeenCalledWith('electronics');
    const top = screen.getByRole('list', { name: 'Top rated in electronics' });
    const more = screen.getByRole('list', { name: 'More in electronics' });
    expect(within(top).getByText('Hard Drive')).toBeInTheDocument();
    expect(within(more).getByText('SSD')).toBeInTheDocument();
  });

  it('Search: clicking the search button shows only matching products', async () => {
    const api = stubApi();
    const { user } = renderApp('/');

    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'bracelet');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('heading', { name: /Results for “bracelet”/ })).toBeInTheDocument();
    const results = await screen.findByRole('list', { name: 'Search results' });
    expect(within(results).getAllByRole('listitem')).toHaveLength(1);
    expect(within(results).getByText('Dragon Bracelet')).toBeInTheDocument();
    expect(api.search).toHaveBeenCalledWith('bracelet');
  });

  it('Search: the button is disabled for an empty term', async () => {
    stubApi();
    renderApp('/');
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  it('Product page: clicking a product tile shows its details', async () => {
    stubApi();
    const { user } = renderApp('/');

    await user.click(await screen.findByRole('link', { name: /Hard Drive/ }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Hard Drive' })).toBeInTheDocument();
    expect(screen.getByText('Hard Drive description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enquire' })).toBeInTheDocument();
  });

  it('Enquiry: completing the form submits it and shows a thank you message', async () => {
    const api = stubApi();
    const { user } = renderApp('/products/5');

    await user.click(await screen.findByRole('button', { name: 'Enquire' }));
    await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Message (optional)'), 'Is this in stock?');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(api.submitEnquiry).toHaveBeenCalledWith({
      productId: '5',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Is this in stock?',
    });
  });
});

describe('Unhappy paths', () => {
  it('shows a retryable error when products fail to load', async () => {
    const api = stubApi();
    api.getFeatured.mockRejectedValueOnce(new ApiError('Products are temporarily unavailable.', 502, 'UPSTREAM_UNAVAILABLE'));
    const { user } = renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('Products are temporarily unavailable.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('list', { name: 'Top rated products' })).toBeInTheDocument();
  });

  it('shows not found for an unknown product', async () => {
    const api = stubApi();
    api.getProduct.mockRejectedValueOnce(new ApiError('Not found', 404, 'NOT_FOUND'));
    renderApp('/products/999');
    expect(await screen.findByText("We couldn't find that product.")).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    stubApi();
    renderApp('/search?q=zzz');
    expect(await screen.findByText(/No products match your search/)).toBeInTheDocument();
  });

  it('does not submit an enquiry with invalid details', async () => {
    const api = stubApi();
    const { user } = renderApp('/products/5');

    await user.click(await screen.findByRole('button', { name: 'Enquire' }));
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByText('Please enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(api.submitEnquiry).not.toHaveBeenCalled();
  });

  it('shows server errors and keeps the form when submission fails', async () => {
    const api = stubApi();
    api.submitEnquiry.mockRejectedValueOnce(
      new ApiError('Enquiry is invalid.', 400, 'VALIDATION_ERROR', { phone: 'Please enter a valid phone number.' }),
    );
    const { user } = renderApp('/products/5');

    await user.click(await screen.findByRole('button', { name: 'Enquire' }));
    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Phone (optional)'), '12');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('Please enter a valid phone number.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Thank you' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send enquiry' })).toBeEnabled());
  });
});
