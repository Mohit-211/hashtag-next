interface Props {
  orderNumber: string;
  /** Null when the API didn't return the order date. */
  orderDate: string | null;
  paymentLabel: string;
  shippingMethod: string | null;
}

export default function OrderInfoCard({
  orderNumber,
  orderDate,
  paymentLabel,
  shippingMethod,
}: Props) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-3 mb-8">
      <p className="text-xs font-bold uppercase text-muted-foreground">
        Order Details
      </p>

      <dl className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Order Number</dt>
          <dd className="font-bold">#{orderNumber}</dd>
        </div>

        {orderDate && (
          <div>
            <dt className="text-muted-foreground">Order Date</dt>
            <dd>{orderDate}</dd>
          </div>
        )}

        <div>
          <dt className="text-muted-foreground">Payment</dt>
          <dd>{paymentLabel}</dd>
        </div>

        {shippingMethod && (
          <div>
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{shippingMethod}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
