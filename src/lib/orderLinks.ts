/** The order confirmation page for an order id. */
export const confirmationPath = (orderId: number | string) =>
  `/confirmation?order=${encodeURIComponent(String(orderId))}`;
