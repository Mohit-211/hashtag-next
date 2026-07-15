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