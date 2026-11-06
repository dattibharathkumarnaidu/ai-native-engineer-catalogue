import { Link } from 'react-router-dom';

export function NotFoundPage({ message = "We couldn't find that page." }: { message?: string }) {
  return (
    <section>
      <h1>Not found</h1>
      <p>{message}</p>
      <Link to="/">Back to top rated products</Link>
    </section>
  );
}
