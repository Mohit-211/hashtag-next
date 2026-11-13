// Cash App on a phone: Square sends the shopper to the Cash App app, then back
// to the checkout page (the widget's redirectURL), which starts again from
// scratch. PaymentSection notes the order here when it shows the Cash App
// button; CheckoutLayout reads it on load and reopens that order's payment
// step, so the widget mounts again and Square can fire `ontokenization`.
//
// localStorage, not sessionStorage: a phone can come back from the Cash App app
// in a new tab, where sessionStorage is empty. The 30-minute limit, and the
// check that the order is still unpaid, keep an old entry from reopening anything.

const KEY = "cashapp_pending_order";
const MAX_AGE_MS = 30 * 60 * 1000;

export interface CashAppPendingOrder {
  order_id: number;
  order_number: string;
  at: number;
}

export function rememberCashAppOrder(orderId: number, orderNumber: string) {
  const pending: CashAppPendingOrder = { order_id: orderId, order_number: orderNumber, at: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(pending));
  } catch {
    // Storage blocked (e.g. private mode): the shopper starts checkout again.
  }
}

export function forgetCashAppOrder() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing stored.
  }
}

/** The order noted in the last 30 minutes, if any. Anything else is cleared. */
export function readCashAppOrder(): CashAppPendingOrder | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as Partial<CashAppPendingOrder> | null;
    if (
      typeof pending?.order_id === "number" &&
      typeof pending.order_number === "string" &&
      typeof pending.at === "number" &&
      Date.now() - pending.at < MAX_AGE_MS
    ) {
      return pending as CashAppPendingOrder;
    }
  } catch {
    // Unreadable: treat as nothing stored.
  }
  forgetCashAppOrder();
  return null;
}
