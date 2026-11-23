/** A variant's stock as the API sends it. */
export interface VariantStock {
  stock?: number | null;
  track_inventory?: boolean | null;
}

/** Stock a supplier doesn't report (`stock: null`, `track_inventory: false`) can be ordered freely. */
const isUntracked = (v: VariantStock) => v.track_inventory === false || v.stock == null;

/** In stock exactly when something can be ordered, so the two helpers can't disagree
 *  (a tracked "Infinity" or "1e999" counts as invalid: ceiling 0, not in stock). */
export const isInStock = (v?: VariantStock | null): boolean => stockCeiling(v) > 0;

/** The most that can be ordered; Infinity when the supplier reports no stock figure.
 *  A figure that isn't a finite number (e.g. "abc") counts as 0, never NaN. */
export const stockCeiling = (v?: VariantStock | null): number => {
  if (!v) return 0;
  if (isUntracked(v)) return Infinity;
  const n = Number(v.stock);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};
