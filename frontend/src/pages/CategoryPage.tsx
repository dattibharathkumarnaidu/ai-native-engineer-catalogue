import { useParams } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { AsyncView } from '../components/AsyncView';
import { ProductGrid } from '../components/ProductGrid';
import { useAsync } from '../hooks/useAsync';
import { NotFoundPage } from './NotFoundPage';

export function CategoryPage() {
  const { slug = '' } = useParams();
  const page = useAsync(() => api.getCategoryPage(slug), [slug]);

  if (page.status === 'error' && page.error instanceof ApiError && page.error.status === 404) {
    return <NotFoundPage message="We couldn't find that category." />;
  }

  return (
    <AsyncView state={page} loadingLabel="Loading category…">
      {({ category, topRated, more }) => (
        <>
          <h1 className="capitalise">{category.name}</h1>
          <section aria-labelledby="top-rated-heading">
            <h2 id="top-rated-heading">Top rated</h2>
            <ProductGrid products={topRated} label={`Top rated in ${category.name}`} />
          </section>
          {more.length > 0 && (
            <section aria-labelledby="more-heading">
              <h2 id="more-heading">More in {category.name}</h2>
              <ProductGrid products={more} label={`More in ${category.name}`} />
            </section>
          )}
        </>
      )}
    </AsyncView>
  );
}
