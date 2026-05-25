// components/orders/OrderPriceSummary.tsx

interface Order {
  subtotal?: number | string;
  customizationTotal?: number | string;
  shippingCost?: number | string;
  tax?: number | string;
  total?: number | string;
  [key: string]: any;
}

interface OrderPriceSummaryProps {
  order: Order;
}

export default function OrderPriceSummary({ order }: OrderPriceSummaryProps) {
  const subtotal = Number(order?.subtotal || 0);
  const customizationTotal = Number(order?.customizationTotal || 0);
  const shippingCost = Number(order?.shippingCost || 0);
  const tax = Number(order?.tax || 0);
  const total = Number(order?.total || 0);

  return (
    <div className="rounded-2xl overflow-hidden border border-border/60">
      {/* Header */}
      <div className="bg-muted/40 px-4 py-2.5 border-b border-border/40">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Order Summary
        </p>
      </div>

      {/* Line items */}
      <div className="bg-card px-4 py-3 space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Subtotal</span>
          <span className="text-xs font-medium tabular-nums">${subtotal.toFixed(2)}</span>
        </div>

        {/* {customizationTotal > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Customization</span>
            <span className="text-xs font-medium tabular-nums">
              +${customizationTotal.toFixed(2)}
            </span>
          </div>
        )} */}

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Shipping</span>
          <span className={`text-xs font-medium tabular-nums ${shippingCost === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
            {shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}
          </span>
        </div>

        {tax > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Tax</span>
            <span className="text-xs font-medium tabular-nums">${tax.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="bg-foreground/[0.03] dark:bg-white/[0.04] border-t border-border/60 px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-semibold tracking-tight">Total</span>
        <span className="text-base font-bold tabular-nums tracking-tight">
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}