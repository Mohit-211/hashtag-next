/**
 * pricing.ts
 * ─────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for every price calculation across:
 *   - Productcustomizationpage.tsx (main page + Order Summary)
 *   - Addproductconfigurationmodal.tsx (configuration modal)
 *   - AddToCartModal.tsx (add-to-cart modal)
 *   - the payload sent to the backend
 *
 * Formula (must never be re-derived by hand anywhere else):
 *
 *   Each Variant Total = (Product Unit Price × Quantity)
 *                       + (Decoration Price × Quantity)
 *
 *   Grand Total = Sum of every variant total
 *
 * Every screen that shows a price MUST call calculateVariantTotal (single
 * line) or sumVariantTotals (many lines) rather than writing its own
 * price × qty math — that's how "price differs between Order Summary and
 * Add To Cart modal" bugs happen.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface VariantLineInput {
  /** Product/variant unit price ONLY — never includes decoration. */
  productPrice: number;
  /** Decoration price per unit — 0 when no decoration/skip. */
  decorationPrice: number;
  quantity: number;
}

export interface VariantLineResult {
  /** productPrice × quantity */
  productTotal: number;
  /** decorationPrice × quantity */
  decorationTotal: number;
  /** productTotal + decorationTotal */
  total: number;
}

/**
 * Calculate the total for a SINGLE variant/size line.
 *   Variant Total = (Product Unit Price × Quantity) + (Decoration Price × Quantity)
 */
export function calculateVariantTotal({
  productPrice,
  decorationPrice,
  quantity,
}: VariantLineInput): VariantLineResult {
  const safeProductPrice = Number.isFinite(productPrice) ? productPrice : 0;
  const safeDecorationPrice = Number.isFinite(decorationPrice) ? decorationPrice : 0;
  const safeQuantity = Number.isFinite(quantity) ? quantity : 0;

  const productTotal = safeProductPrice * safeQuantity;
  const decorationTotal = safeDecorationPrice * safeQuantity;

  return {
    productTotal,
    decorationTotal,
    total: productTotal + decorationTotal,
  };
}

/**
 * Sum totals across MANY variant/size lines.
 *   Grand Total = Sum of every variant total
 */
export function sumVariantTotals(lines: VariantLineInput[]): VariantLineResult {
  return lines.reduce<VariantLineResult>(
    (acc, line) => {
      const lineResult = calculateVariantTotal(line);
      return {
        productTotal: acc.productTotal + lineResult.productTotal,
        decorationTotal: acc.decorationTotal + lineResult.decorationTotal,
        total: acc.total + lineResult.total,
      };
    },
    { productTotal: 0, decorationTotal: 0, total: 0 }
  );
}

/** Format a number as money with exactly 2 decimal places, comma-separated. */
export function formatMoney(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * APPAREL DECORATION (print) PRICING — SINGLE SOURCE OF TRUTH
 *
 * Tiers and per-piece rates for each decoration method, used by the
 * customization page (pricing + "View Full Price Table") and by
 * AddProductConfigurationModal, which prices every row at its own quantity.
 * ─────────────────────────────────────────────────────────────────────────
 */
export type MaterialId = "embroidery" | "dtf" | "screen_print" | "dtg";

export const EMB_TIERS = [
  { label: "1–11", min: 1, max: 11 },
  { label: "12–23", min: 12, max: 23 },
  { label: "24–35", min: 24, max: 35 },
  { label: "36–71", min: 36, max: 71 },
  { label: "72–95", min: 72, max: 95 },
  { label: "96–143", min: 96, max: 143 },
  { label: "144+", min: 144, max: Infinity },
];
export const EMB_PRICES: Record<string, number[]> = {
  LEFT_CHEST: [12, 11, 10, 9, 8, 7, 6],
  RIGHT_CHEST: [12, 11, 10, 9, 8, 7, 6],
  SLEEVE_LEFT: [12, 11, 10, 9, 8, 7, 6],
  SLEEVE_RIGHT: [12, 11, 10, 9, 8, 7, 6],
  // FULL_FRONT: [18, 16, 14, 13, 12, 11, 10],
  FULL_BACK_STANDARD: [18, 16, 14, 13, 12, 11, 10],
  FULL_BACK_LARGE: [22, 20, 18, 16, 15, 14, 12],

  HAT_FRONT: [15, 14, 12, 11, 10, 9, 8],
  HAT_SIDE: [10, 9, 8, 7, 6, 5, 5],
  HAT_BACK_ARCH: [10, 9, 8, 7, 6, 5, 5],
};
/**
 * An embroidery location with no row above (hoodie Full Front and Full Back)
 * is quoted by the team, never sold at $0 (client decision Q5).
 */
export const isQuoteOnlyLocation = (material: MaterialId | null, location: string) =>
  material === "embroidery" && !EMB_PRICES[location];
export const DTF_TIERS = [1, 12, 24, 36, 72, 96, 144];
export const DTF_PRICES = [15, 12, 10, 9, 7, 5, 5];
export const SP_PRICES: Record<string, number[]> = {
  "1 Color": [11.19, 7.46, 4.85, 3.36, 2.24, 1.87],
  "2 Color": [22.39, 11.19, 7.09, 5.22, 3.36, 3.21],
  "3 Color": [37.31, 14.93, 9.33, 7.46, 4.48, 4.25],
  "4 Color": [52.24, 26.87, 11.19, 10.07, 5.60, 5.37],
  "5 Color": [67.16, 32.84, 14.93, 11.57, 6.72, 6.49],
  "6 Color": [82.09, 37.31, 17.16, 13.06, 8.58, 7.61],
};
/** Number-of-colours options for Screen Print — derived from SP_PRICES so
 *  adding/removing a colour tier there automatically updates the picker. */
export type SpColorCount = keyof typeof SP_PRICES;
export const SP_COLOR_COUNTS = Object.keys(SP_PRICES) as SpColorCount[];
/** Screen Print quantity tiers — order/count must match each SP_PRICES row.
 *  Single source of truth for the min order qty, the price-index lookup,
 *  and the "View Full Price Table" headers. */
export const SP_TIERS = [
  { label: "12–23", min: 12 },
  { label: "24–47", min: 24 },
  { label: "48–99", min: 48 },
  { label: "100–299", min: 100 },
  { label: "300–499", min: 300 },
  { label: "500+", min: 500 },
];
export const SP_MIN_QTY = SP_TIERS[0].min;
export const DTG_TIERS = [{ min: 1 }, { min: 24 }, { min: 48 }, { min: 100 }];
export const DTG_PRICES: Record<string, number[]> = {
  "Front Regular": [15, 12, 11, 9],
  "Oversized": [20, 17, 16, 14],
  "Front & Back Regular": [30, 24, 22, 18],
  "Front & Back Oversized": [40, 34, 32, 28],
};
export function getMaterialPrintTotal(
  material: MaterialId | null,
  locations: string[],
  qty: number,
  spColorCount: SpColorCount = "1 Color",
  dtgStyle: keyof typeof DTG_PRICES = "Front Regular"
): number | null {
  if (!material) return null;
  if (locations.length === 0) return null;
  if (qty <= 0) return null;
  switch (material) {
    case "embroidery": {
      const tierIndex = EMB_TIERS.findIndex(t => qty >= t.min && qty <= t.max);
      let total = 0;
      locations.forEach(location => {
        const row = EMB_PRICES[location];
        if (!row) return;
        total += row[tierIndex] * qty;
      });
      if (qty <= 11) total += 35;
      return total;
    }
    case "dtf": {
      const tier =
        qty >= 144 ? 6 :
          qty >= 96 ? 5 :
            qty >= 72 ? 4 :
              qty >= 36 ? 3 :
                qty >= 24 ? 2 :
                  qty >= 12 ? 1 : 0;
      return DTF_PRICES[tier] * qty * locations.length;
    }
    case "screen_print": {
      if (qty < SP_MIN_QTY) return null;
      const priceIndex = SP_TIERS.reduce((found, t, idx) => (qty >= t.min ? idx : found), 0);
      const price = SP_PRICES[spColorCount]?.[priceIndex];
      if (price == null) return null;
      return price * qty * locations.length;
    }
    case "dtg": {
      const tier =
        qty >= 100 ? 3 :
          qty >= 48 ? 2 :
            qty >= 24 ? 1 : 0;
      return DTG_PRICES[dtgStyle][tier] * qty;
    }
    default:
      return null;
  }
}
/** Minimum apparel quantity for a decoration method (screen print has a run minimum). */
export function getMaterialFloor(material: MaterialId | null): number {
  return material === "screen_print" ? SP_MIN_QTY : 1;
}
/** One-time embroidery digitizing fee — applies to runs of 11 pieces or fewer. */
export function getDigitizingFee(material: MaterialId | null, qty: number): number {
  return material === "embroidery" && qty > 0 && qty <= 11 ? 35 : 0;
}
/**
 * ─────────────────────────────────────────────────────────────────────────
 * MANUAL-PRODUCT CUSTOMIZATION PRICING — SINGLE SOURCE OF TRUTH
 *
 * Prices one customization option value (GET .../customizations) for the
 * selected product quantity, driven entirely by its `pricing_type`:
 *
 *   FIXED          → fixed_price, charged PER PIECE (total = price × qty)
 *   TIERED         → pricing[] row whose min_quantity..max_quantity contains
 *                    qty; that price is charged PER PIECE (total = price × qty)
 *   QUANTITY_BASED → pricing[] row whose `quantity` equals qty; that price is
 *                    the charge for the whole quantity (like a qty pack)
 *
 * When no rule covers qty the value is `available: false` with a 0 charge —
 * we never fall back to a neighbouring tier's price.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type CustomizationPricingType = "FIXED" | "TIERED" | "QUANTITY_BASED";

export interface CustomizationPriceRule {
  min_quantity?: number | null;
  max_quantity?: number | null;
  quantity?: number | null;
  price: string | number;
  is_active?: boolean;
}

export interface CustomizationPricedValue {
  pricing_type: CustomizationPricingType | string;
  fixed_price?: string | number | null;
  pricing?: CustomizationPriceRule[] | null;
}

export interface CustomizationPriceRow {
  /** "1 - 50", "51+" or "25". */
  label: string;
  price: number;
  matches: (qty: number) => boolean;
}

export interface CustomizationPrice {
  /** false when no pricing rule covers the quantity (or the type is unknown). */
  available: boolean;
  /** FIXED / TIERED are charged per piece; QUANTITY_BASED once for the quantity. */
  perPiece: boolean;
  /** The price as the API defines it (per piece for FIXED / TIERED). */
  price: number;
  /** What this value adds for `qty` pieces. */
  total: number;
}

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** The value's pricing rules as display rows (empty for FIXED), active only. */
export function getCustomizationPriceRows(value: CustomizationPricedValue): CustomizationPriceRow[] {
  const active = (value.pricing ?? []).filter((r) => r.is_active !== false);
  if (value.pricing_type === "TIERED") {
    return active
      .map((r) => ({ min: toNumber(r.min_quantity), max: toNumber(r.max_quantity), price: toNumber(r.price) }))
      .filter((r): r is { min: number; max: number | null; price: number } => r.min != null && r.price != null)
      .sort((a, b) => a.min - b.min)
      .map(({ min, max, price }) => ({
        label: max == null ? `${min}+` : `${min} - ${max}`,
        price,
        matches: (qty: number) => qty >= min && (max == null || qty <= max),
      }));
  }
  if (value.pricing_type === "QUANTITY_BASED") {
    return active
      .map((r) => ({ quantity: toNumber(r.quantity), price: toNumber(r.price) }))
      .filter((r): r is { quantity: number; price: number } => r.quantity != null && r.price != null)
      .sort((a, b) => a.quantity - b.quantity)
      .map(({ quantity, price }) => ({
        label: String(quantity),
        price,
        matches: (qty: number) => qty === quantity,
      }));
  }
  return [];
}

/** Price of one customization value at `qty` pieces. */
export function getCustomizationPrice(value: CustomizationPricedValue, qty: number): CustomizationPrice {
  const none: CustomizationPrice = { available: false, perPiece: false, price: 0, total: 0 };
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 0;
  if (value.pricing_type === "FIXED") {
    const price = toNumber(value.fixed_price) ?? 0;
    return { available: true, perPiece: true, price, total: price * safeQty };
  }
  if (value.pricing_type === "TIERED" || value.pricing_type === "QUANTITY_BASED") {
    const row = safeQty > 0 ? getCustomizationPriceRows(value).find((r) => r.matches(safeQty)) : undefined;
    if (!row) return none;
    const perPiece = value.pricing_type === "TIERED";
    return { available: true, perPiece, price: row.price, total: perPiece ? row.price * safeQty : row.price };
  }
  return none;
}
