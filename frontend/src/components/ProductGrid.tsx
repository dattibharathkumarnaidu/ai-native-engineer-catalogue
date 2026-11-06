import type { Product } from '../api/types';
import { ProductTile } from './ProductTile';

interface Props {
  products: Product[];
  emptyMessage?: string;
  label?: string;
}

export function ProductGrid({ products, emptyMessage = 'No products to show.', label }: Props) {
  if (products.length === 0) return <p className="status">{emptyMessage}</p>;
  return (
    <ul className="grid" aria-label={label}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductTile product={product} />
        </li>
      ))}
    </ul>
  );
}
