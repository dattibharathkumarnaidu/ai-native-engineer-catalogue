import { NavLink } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../hooks/useAsync';

export function CategoryNav() {
  const state = useAsync(() => api.getCategories(), []);
  // Navigation failing shouldn't break the page; the content area shows errors.
  if (state.status !== 'success') return <nav aria-label="Categories" className="categories" />;

  return (
    <nav aria-label="Categories" className="categories">
      <ul>
        {state.data.map((category) => (
          <li key={category.slug}>
            <NavLink to={`/categories/${encodeURIComponent(category.slug)}`}>{category.name}</NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
