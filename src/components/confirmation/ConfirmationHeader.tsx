import Image from "next/image";
import { Clock, XCircle } from "lucide-react";

export type ConfirmationState = "paid" | "pending" | "failed" | "cancelled";

const COPY: Record<ConfirmationState, { title: string; body: string }> = {
  paid: {
    title: "Order Confirmed",
    body: "Thank you. Your payment went through and your order is in.",
  },
  pending: {
    title: "Payment Processing",
    body: "Your order is placed, but its payment isn't confirmed yet. This usually takes a few minutes.",
  },
  failed: {
    title: "Payment Not Completed",
    body: "We couldn't take payment for this order.",
  },
  cancelled: {
    title: "Order Cancelled",
    body: "This order has been cancelled.",
  },
};

export default function ConfirmationHeader({ state }: { state: ConfirmationState }) {
  const { title, body } = COPY[state];

  return (
    <div className="text-center space-y-4 mb-12">
      {state === "paid" ? (
        <Image
          src="/assets/order-confirmed.jpg"
          alt=""
          width={112}
          height={112}
          className="mx-auto object-contain"
          priority
        />
      ) : (
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            state === "pending" ? "bg-primary-soft" : "bg-destructive-soft"
          }`}
        >
          {state === "pending" ? (
            <Clock className="h-9 w-9 text-primary-ink" />
          ) : (
            <XCircle className="h-9 w-9 text-destructive" />
          )}
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-heading font-bold">
        {title}
      </h1>

      <p className="text-muted-foreground max-w-lg mx-auto">
        {body}
      </p>
    </div>
  );
}
