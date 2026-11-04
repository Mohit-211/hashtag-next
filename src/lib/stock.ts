/** A variant's stock as the API sends it. */
export interface VariantStock {
  stock?: number | null;
  track_inventory?: boolean | null;
}

/** Stock a supplier doesn't report (`stock: null`, `track_inventory: false`) can be ordered freely. */
const isUntracked = (v: VariantStock) => v.track_inventory === false || v.stock == null;

export const isInStock = (v?: VariantStock | null): boolean =>
  !!v && (isUntracked(v) || Number(v.stock) > 0);

/** The most that can be ordered; Infinity when the supplier reports no stock figure. */
export const stockCeiling = (v?: VariantStock | null): number => {
  if (!v) return 0;
  return isUntracked(v) ? Infinity : Math.max(0, Number(v.stock));
};
