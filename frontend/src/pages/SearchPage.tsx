import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductGrid';
import { useAsync } from '../hooks/useAsync';

export function SearchPage() {
  const [params] = useSearchParams();
  const term = (params.get('q') ?? '').trim();
  const search = useAsync(
    () => (term ? api.search(term) : Promise.resolve({ term: '', results: [] })),
    [term],
  );

  if (!term) {
    return (
      <>
        <h1>Search</h1>
        <p className="status">Enter a search term above to find products.</p>
      </>
    );
  }

  return (
    <section aria-labelledby="search-heading">
      <h1 id="search-heading">Results for “{term}”</h1>
      <AsyncView state={search} loadingLabel="Searching…">
        {({ results }) => (
          <>
            <p className="muted">
              {results.length} {results.length === 1 ? 'product' : 'products'} found
            </p>
            <ProductGrid
              products={results}
              label="Search results"
              emptyMessage="No products match your search. Try a different term."
            />
          </>
        )}
      </AsyncView>
    </section>
  );
}
