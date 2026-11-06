import { api } from '../api/client';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductGrid';
import { useAsync } from '../hooks/useAsync';

export function HomePage() {
  const featured = useAsync(() => api.getFeatured(), []);
  return (
    <section aria-labelledby="featured-heading">
      <h1 id="featured-heading">Top rated</h1>
      <AsyncView state={featured} loadingLabel="Loading top rated products…">
        {(products) => <ProductGrid products={products} label="Top rated products" />}
      </AsyncView>
    </section>
  );
}
