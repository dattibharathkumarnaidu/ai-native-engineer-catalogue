import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { AsyncView } from '../components/AsyncView';
import { EnquiryForm } from '../components/EnquiryForm';
import { useAsync } from '../hooks/useAsync';
import { formatPrice } from '../lib/format';
import { NotFoundPage } from './NotFoundPage';

export function ProductPage() {
  const { id = '' } = useParams();
  const product = useAsync(() => api.getProduct(id), [id]);
  const [enquiring, setEnquiring] = useState(false);

  // Navigating to a different product resets the enquiry panel.
  useEffect(() => setEnquiring(false), [id]);

  if (product.status === 'error' && product.error instanceof ApiError && product.error.status === 404) {
    return <NotFoundPage message="We couldn't find that product." />;
  }

  return (
    <AsyncView state={product} loadingLabel="Loading product…">
      {(p) => (
        <article className="product">
          <div className="product__media">
            <img src={p.imageUrl} alt={p.title} />
          </div>
          <div className="product__info">
            <Link to={`/categories/${encodeURIComponent(p.category.slug)}`} className="muted capitalise">
              {p.category.name}
            </Link>
            <h1>{p.title}</h1>
            <p className="product__price">{formatPrice(p.price)}</p>
            {p.rating && (
              <p className="muted">
                Rated {p.rating.rate.toFixed(1)} / 5 ({p.rating.count} reviews)
              </p>
            )}
            <p>{p.description}</p>

            {enquiring ? (
              <EnquiryForm product={p} onCancel={() => setEnquiring(false)} />
            ) : (
              <button type="button" className="button button--large" onClick={() => setEnquiring(true)}>
                Enquire
              </button>
            )}
          </div>
        </article>
      )}
    </AsyncView>
  );
}
