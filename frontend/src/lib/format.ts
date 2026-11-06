import type { Money } from '../api/types';

export function formatPrice({ amount, currency }: Money, locale = navigator.language || 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
