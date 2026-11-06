import { Link, Outlet } from 'react-router-dom';
import { CategoryNav } from './CategoryNav';
import { SearchBar } from './SearchBar';

export function Layout() {
  return (
    <div className="app">
      <header className="header">
        <div className="header__bar container">
          <Link to="/" className="brand">
            Catalogue
          </Link>
          <SearchBar />
        </div>
        <div className="container">
          <CategoryNav />
        </div>
      </header>
      <main className="container main">
        <Outlet />
      </main>
      <footer className="footer container">Proof of concept · product data from Fake Store API</footer>
    </div>
  );
}
