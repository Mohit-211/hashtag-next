// components/cart/CartItemsList.tsx
import CartItem from "./CartItem";

export type CustomizationLocation = {
  location: string;
};

export type CustomizationBreakdownItem = {
  variant_id: number;
  size?: string;
  color?: string;
  quantity: number;
  product_price: number;
  decoration_price?: number;
  total_price: number;
};

export type PricingSnapshot = {
  handling_charge?: {
    amount: number;
    label?: string;
  };
  [key: string]: unknown;
};

export type CartItemType = {
  cart_id: number;
  product_id?: number;
  variant_id?: number;

  name: string;
  image: string;
  logo_image?: string;

  size?: string;
  color?: string;
  color_code?: string | null;

  base_price: number;
  price?: number;
  total_price?: number;
  quantity: number;

  can_increase?: boolean;
  can_decrease?: boolean;

  // ★ FIXED — this is the single source of truth for print method /
  // locations now (CartItem.tsx reads item.customization_config
  // directly). The old parallel `customization: {...}` shape built by
  // page.tsx's mapper is no longer read anywhere, so it's dropped here
  // to stop the type lying about what's actually available.
  customization_config?: {
    print_method: string | null;
    locations: CustomizationLocation[];
  };

  // ★ NEW — was being read via optional-chaining in a console.log with
  // no type backing it. Added properly so handling_charge (and anything
  // else in the snapshot) is type-safe wherever it's read.
  pricing_snapshot?: PricingSnapshot;
};

interface Props {
  items: CartItemType[];
  onRefresh: () => void;
}

export default function CartItemsList({ items, onRefresh }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="lg:col-span-2 text-center py-10 text-muted-foreground">
        No items in cart
      </div>
    );
  }

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  // ★ NEW — handling charges are now shown per-item in CartItem.tsx.
  // This cart-level line is the SUM of every item's own handling charge
  // (each item can carry a different amount), only counting items whose
  // charge is > 1 — consistent with the per-item display threshold.
  const totalHandlingCharge = items.reduce((sum, i) => {
    const amt = i.pricing_snapshot?.handling_charge?.amount ?? 0;
    return amt > 1 ? sum + amt : sum;
  }, 0);

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Your Cart
        </h1>
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {String(totalItems).padStart(2, "0")} {totalItems === 1 ? "item" : "items"}
        </span>
      </div>

      {/* {totalHandlingCharge > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700">
          <span>Total Handling Charges</span>
          <span>${totalHandlingCharge.toFixed(2)}</span>
        </div>
      )} */}

      <div className="space-y-4">
        {items.map((item) => (
          <CartItem key={item.cart_id} item={item} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}