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
  console.log(value,"value")
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * APPAREL DECORATION (print) PRICING — SINGLE SOURCE OF TRUTH
 *
 * These tables/tiers previously only lived inside Productcustomizationpage.tsx,
 * so any other screen (e.g. Addproductconfigurationmodal.tsx, which lets a
 * user add MULTIPLE rows each with its own quantity) had no way to price
 * decoration per-row — it could only reuse the single decorationUnitPrice
 * computed for the page's "current" quantity, which is wrong wherever a
 * row's own quantity falls into a different pricing tier.
 * ─────────────────────────────────────────────────────────────────────────
 */

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
  FULL_FRONT: [18, 16, 14, 13, 12, 11, 10],
  FULL_BACK: [18, 16, 14, 13, 12, 11, 10],
  HAT_FRONT: [15, 14, 12, 11, 10, 9, 8],
  HAT_SIDE: [10, 9, 8, 7, 6, 5, 5],
  HAT_BACK_ARCH: [10, 9, 8, 7, 6, 5, 5],
};
export const DTF_TIERS = [1, 12, 24, 36, 72, 96, 144];
export const DTF_PRICES = [15, 12, 10, 9, 7, 5, 5];
export const SP_PRICES: Record<string, number[]> = {
  "1 Color": [6.58, 4.40],
  "2 Color": [9.43, 7.98],
  "3 Color": [11.55, 9.54],
};
export const DTG_PRICES: Record<string, number[]> = {
  "Front Regular": [15, 12, 11, 9],
  "Oversized": [20, 17, 16, 14],
  "Front & Back Regular": [30, 24, 22, 18],
  "Front & Back Oversized": [40, 34, 32, 28],
};

export interface PrintPriceParams {
  material: string;
  locations: string[];
  quantity: number;
  spColorCount?: keyof typeof SP_PRICES;
  dtgStyle?: keyof typeof DTG_PRICES;
}

/**
 * Total decoration charge for a print run at `quantity` pieces — mirrors
 * Productcustomizationpage.tsx's getPrintPrice() exactly (same tiers, same
 * embroidery digitizing-fee smear for qty <= 11). Returns null when the
 * selection isn't priceable yet (no material/location, or qty <= 0).
 */
export function getPrintPriceTotal({
  material,
  locations,
  quantity,
  spColorCount = "1 Color",
  dtgStyle = "Front Regular",
}: PrintPriceParams): number | null {
  if (!material) return null;
  if (!locations || locations.length === 0) return null;
  if (quantity <= 0) return null;
  switch (material) {
    case "embroidery": {
      const tierIndex = EMB_TIERS.findIndex(t => quantity >= t.min && quantity <= t.max);
      let total = 0;
      locations.forEach(location => {
        const row = EMB_PRICES[location];
        if (!row) return;
        total += row[tierIndex] * quantity;
      });
      if (quantity <= 11) total += 35;
      return total;
    }
    case "dtf": {
      const tier =
        quantity >= 144 ? 6 :
          quantity >= 96 ? 5 :
            quantity >= 72 ? 4 :
              quantity >= 36 ? 3 :
                quantity >= 24 ? 2 :
                  quantity >= 12 ? 1 : 0;
      return DTF_PRICES[tier] * quantity * locations.length;
    }
    case "screen_print": {
      if (quantity < 50) return null;
      const price = quantity >= 100 ? SP_PRICES[spColorCount][1] : SP_PRICES[spColorCount][0];
      return price * quantity * locations.length;
    }
    case "dtg": {
      const tier =
        quantity >= 100 ? 3 :
          quantity >= 48 ? 2 :
            quantity >= 24 ? 1 : 0;
      return DTG_PRICES[dtgStyle][tier] * quantity;
    }
    default:
      return null;
  }
}

/** The $35 embroidery digitizing fee — already folded into getPrintPriceTotal's
 *  total for qty <= 11 above. Exported purely so screens can call this out as
 *  its own breakdown line without re-deriving/duplicating the qty <= 11 rule. */
export function getDigitizingFee(material: string, quantity: number): number {
  return material === "embroidery" && quantity > 0 && quantity <= 11 ? 35 : 0;
}

/** Per-unit decoration price for `quantity` pieces — the tiered total divided
 *  back down to a per-piece rate, ready to feed into calculateVariantTotal. */
export function getDecorationUnitPrice(params: PrintPriceParams): number {
  if (params.quantity <= 0) return 0;
  const total = getPrintPriceTotal(params);
  return total == null ? 0 : total / params.quantity;
}