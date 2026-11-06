/**
 * Business decisions about what to promote. Today it is static config; later it
 * could be an admin UI, CMS or analytics-driven ranking — without touching the
 * catalogue service or the product source.
 */
export interface Merchandising {
  /** The hand-picked "top rated" products, in display order. */
  featuredProductIds(): readonly string[];
  /** How many top rated products to show at the top of a category page. */
  categoryTopRatedCount(): number;
}
