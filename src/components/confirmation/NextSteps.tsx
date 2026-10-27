import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";
import type { ConfirmationState } from "./ConfirmationHeader";

const linkClass = "font-medium text-foreground underline underline-offset-4";

export default function NextSteps({ state }: { state: ConfirmationState }) {
  return (
    <div className="mb-10">
      <p className="text-xs font-bold uppercase text-muted-foreground mb-3">
        What Happens Next
      </p>

      <div className="space-y-2 text-muted-foreground">
        {state === "paid" && (
          <p>
            We&apos;ll start on your order now. You can follow it any time under{" "}
            <Link href="/orders" className={linkClass}>My Orders</Link> or{" "}
            <Link href="/track-order" className={linkClass}>Track Order</Link>.
          </p>
        )}

        {state === "pending" && (
          <p>
            Check again in a few minutes. The order also appears under{" "}
            <Link href="/orders" className={linkClass}>My Orders</Link> once its payment is confirmed.
          </p>
        )}

        {state === "failed" && (
          <p>
            You can <Link href="/checkout" className={linkClass}>return to checkout</Link> and try again.
          </p>
        )}

        <p>
          Questions about this order? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{CONTACT_EMAIL}</a>{" "}
          with your order number.
        </p>
      </div>
    </div>
  );
}
