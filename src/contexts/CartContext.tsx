"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";

import { GetAllCartItemsApi } from "@/api/operations/cart.api";
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";
import { hasAuthToken } from "@/lib/authRedirect";

export interface CartItem {
  cart_id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;

  name: string;
  image?: string;
  logo_image?: string;
  size?: string;
  color?: string;
  color_code?: string;

  price?: number;
  total_price?: number;

  can_increase?: boolean;
  can_decrease?: boolean;

  customization_config?: {
    print_method?: string | null;
    locations?: { location: string }[];
    [key: string]: unknown;
  };

  [key: string]: unknown;
}

export interface CartSummary {
  /** The cart lines; they never include the handling fee. */
  items_total: number;
  /** Charged once per order when a product in the cart triggers it; 0 otherwise. */
  handling_fee: number;
  handling_fee_label: string;
  /** Always 0: shipping (and tax) are worked out at checkout. */
  shipping_cost: number;
  /** items_total + handling_fee. */
  grand_total: number;
}

export interface PendingOrder {
  order_id: number;
  order_number: string;
  total_amount: number;
  shipping_amount: number;
  payment_status: string;
  shipment_status: string;
  tracking_number?: string;
  label_url?: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  summary: CartSummary | null;
  pending_order: PendingOrder | null;
  /** True until the first cart fetch settles, and again while a retry of a
   *  failed load runs. Refreshing a cart that's already loaded doesn't set it. */
  loading: boolean;
  /** Set when the cart couldn't be loaded; `items` is then not the real cart. */
  error: string | null;
  /** Fetches the cart again after a failed load. */
  retry: () => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCart: () => void;
}

const CART_LOAD_ERROR = "We couldn't load your cart";

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }

  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  // True on the server and on the first client render alike, so nothing
  // reads the initial empty `items` as an empty cart.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Whether `items` holds a cart the server returned. Once it does, refreshes
  // run in the background and a failed one keeps the cart on screen.
  const hasCartRef = useRef(false);
  // Only the newest request may write the cart.
  const requestIdRef = useRef(0);

  const resetCart = useCallback(() => {
    setItems([]);
    setSummary(null);
    setPendingOrder(null);
  }, []);

  // Session over: drop the cart and ignore any reply still on its way.
  const dropCart = useCallback(() => {
    requestIdRef.current++;
    hasCartRef.current = false;
    resetCart();
  }, [resetCart]);

  const fetchCart = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!hasAuthToken()) {
      // Signed out: an empty cart is the real answer.
      hasCartRef.current = false;
      resetCart();
      setError(null);
      setLoading(false);
      return;
    }

    if (!hasCartRef.current) {
      setError(null);
      setLoading(true);
    }

    try {
      const res = await GetAllCartItemsApi();
      if (requestId !== requestIdRef.current) return;
      const data = res?.data?.data || res?.data;

      setItems(data?.items ?? []);
      setSummary(data?.summary ?? null);
      setPendingOrder(data?.pending_order ?? null);
      hasCartRef.current = true;
      setError(null);
      setLoading(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Fetch Cart Error:", err);
      // A failed request says nothing about what's in the cart: keep the one
      // on screen, and report an error only when there's none to show.
      if (!hasCartRef.current) setError(CART_LOAD_ERROR);
      setLoading(false);
    }
  }, [resetCart]);

  // Load the cart on page load with a stored token and on every login;
  // clear it on logout.
  const loggedIn = useIsLoggedIn();
  useEffect(() => {
    // Hydration renders as signed out even with a stored token, and
    // `loggedIn` catches up on the next render. Settling now would flash an
    // empty cart.
    if (!loggedIn && hasAuthToken()) return;
    // Signed out, this settles `loading` at once; signed in, it marks the
    // cart as loading and fetches it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCart();
    return dropCart;
  }, [loggedIn, fetchCart, dropCart]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Resets local cart state immediately, without waiting on a server
  // round trip — used right after a successful payment so the header
  // badge clears at once instead of lagging behind refreshCart().
  // The cart is now known to be empty: a reply to an earlier request must
  // not bring the old items back.
  const clearCart = useCallback(() => {
    requestIdRef.current++;
    hasCartRef.current = true;
    resetCart();
    setError(null);
    setLoading(false);
  }, [resetCart]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        summary,
        pending_order: pendingOrder,
        loading,
        error,
        retry: fetchCart,
        refreshCart: fetchCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};