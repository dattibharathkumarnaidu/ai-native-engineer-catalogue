import type { Merchandising } from '../../ports/Merchandising.js';

/** Merchandising decisions supplied via configuration (env vars). */
export class StaticMerchandising implements Merchandising {
  constructor(
    private readonly featuredIds: readonly string[],
    private readonly topRatedPerCategory: number,
  ) {}

  featuredProductIds(): readonly string[] {
    return this.featuredIds;
  }

  categoryTopRatedCount(): number {
    return this.topRatedPerCategory;
  }
}
