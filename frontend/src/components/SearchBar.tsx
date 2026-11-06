import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function SearchBar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const current = params.get('q') ?? '';
  const [term, setTerm] = useState(current);

  // Keep the box in sync when the URL changes (back/forward, shared links).
  useEffect(() => setTerm(current), [current]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form role="search" className="search" onSubmit={onSubmit}>
      <label htmlFor="search-input" className="visually-hidden">
        Search products
      </label>
      <input
        id="search-input"
        type="search"
        placeholder="Search products"
        value={term}
        maxLength={100}
        onChange={(e) => setTerm(e.target.value)}
      />
      <button type="submit" className="button" disabled={!term.trim()}>
        Search
      </button>
    </form>
  );
}
