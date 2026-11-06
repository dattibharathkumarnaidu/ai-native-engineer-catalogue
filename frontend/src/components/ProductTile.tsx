import { Link } from 'react-router-dom';
import type { Product } from '../api/types';
import { formatPrice } from '../lib/format';

export function ProductTile({ product }: { product: Product }) {
  return (
    <article className="tile">
      <Link to={`/products/${encodeURIComponent(product.id)}`} className="tile__link">
        <div className="tile__media">
          <img src={product.imageUrl} alt="" loading="lazy" />
        </div>
        <h3 className="tile__title">{product.title}</h3>
        <p className="tile__price">{formatPrice(product.price)}</p>
      </Link>
    </article>
  );
}
