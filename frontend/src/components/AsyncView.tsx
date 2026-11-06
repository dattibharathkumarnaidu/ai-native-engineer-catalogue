import type { ReactNode } from 'react';
import type { AsyncState } from '../hooks/useAsync';

interface Props<T> {
  state: AsyncState<T> & { retry: () => void };
  children: (data: T) => ReactNode;
  loadingLabel?: string;
}

/** One consistent way to show loading and error states across every page. */
export function AsyncView<T>({ state, children, loadingLabel = 'Loading…' }: Props<T>) {
  if (state.status === 'loading') {
    return (
      <p className="status" role="status" aria-live="polite">
        {loadingLabel}
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="status status--error" role="alert">
        <p>{state.error.message}</p>
        <button type="button" className="button button--secondary" onClick={state.retry}>
          Try again
        </button>
      </div>
    );
  }
  return <>{children(state.data)}</>;
}
