"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { CapturePaypalOrderApi } from "@/api/operations/payment.api";
import { GetOrderDetailApi } from "@/api/operations/order.api";
import { useCart } from "@/contexts/CartContext";
import ProcessingScreen from "./ProcessingScreen";

import { errorMessage } from "@/lib/errors";
import { confirmationPath } from "@/lib/orderLinks";
// "processing" covers both the initial capture call and the follow-up
// polling while the backend is still confirming — the UI doesn't need to
// tell those two apart, it just needs to never show success early.
type ReturnState = "processing" | "success" | "pending" | "failed";

const PAYPAL_ORDER_ID_KEY = "paypal_pending_order_id";
// The order id this page resolved, kept against the PayPal token (BUG-021).
// The stash above is single-use, and PayPal's return URL has no order_id, so
// without this a reload (or coming back from a login) can't find the order.
const PAYPAL_RETURN_KEY = "paypal_return_order";

/** The order id remembered for this PayPal token, if this tab saw it before. */
function rememberedOrderId(paypalToken: string): string | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PAYPAL_RETURN_KEY) ?? "null");
    return saved?.token === paypalToken && saved.orderId != null ? String(saved.orderId) : null;
  } catch {
    return null;
  }
}

/** Whether the backend says the order is paid. A failed lookup counts as no. */
async function isOrderPaid(id: number): Promise<boolean> {
  try {
    // The caller shows its own failure message, so no toast here.
    const res = await GetOrderDetailApi(id, { skipErrorToast: true });
    const detail = res?.data?.data ?? res?.data ?? null;
    return detail?.payment_status === "SUCCESS";
  } catch (err) {
    console.error(err);
    return false;
  }
}

// PayPal can land the user back here before the backend has finished
// updating the order, so a PENDING capture result is polled against the
// order detail (the backend's source of truth) rather than trusted as-is.
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 15; // ~1 minute before we stop and show "still pending"

interface Props {
  // Which PayPal redirect landed the user here. "cancel" means the buyer
  // cancelled on PayPal's page, so nothing is captured; only "success" is.
  landedFrom: "success" | "cancel";
}

export default function PaypalReturnStatus({ landedFrom }: Props) {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [state, setState] = useState<ReturnState>("processing");
  const [message, setMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);

  const captureAttemptedRef = useRef(false);
  const unmountedRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollInFlightRef = useRef(false);
  const pollAttemptsRef = useRef(0);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      clearPollTimer();
    };
  }, [clearPollTimer]);

  const finishSuccess = useCallback(
    (paidOrderId: number) => {
      clearPollTimer();
      clearCart();
      toast.success("Payment successful — your order is confirmed!");
      setState("success");
      // Full page load so the cart refetches; replace() keeps Back off this page.
      window.location.replace(confirmationPath(paidOrderId));
    },
    [clearCart, clearPollTimer]
  );

  const finishFailed = useCallback((failMessage: string) => {
    clearPollTimer();
    toast.error(failMessage);
    setMessage(failMessage);
    setState("failed");
  }, [clearPollTimer]);

  // Polls the order's payment status until it resolves, the attempt limit
  // is hit, or the component unmounts. Only one request is ever in flight.
  const pollOrderStatus = useCallback(
    (id: number) => {
      const check = async () => {
        if (unmountedRef.current || pollInFlightRef.current) return;
        pollInFlightRef.current = true;

        try {
          // Failed checks are retried below, so no toast for each one.
          const res = await GetOrderDetailApi(id, { skipErrorToast: true });
          const detail = res?.data?.data ?? res?.data ?? null;
          const status = detail?.payment_status;

          if (unmountedRef.current) return;

          if (status === "SUCCESS") {
            finishSuccess(id);
            return;
          }
          if (status === "REJECTED") {
            finishFailed("PayPal payment failed. Please try again.");
            return;
          }

          pollAttemptsRef.current += 1;
          if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
            setState("pending");
            return;
          }
          pollTimerRef.current = setTimeout(check, POLL_INTERVAL_MS);
        } catch (err) {
          console.error(err);
          pollAttemptsRef.current += 1;
          if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
            setState("pending");
            return;
          }
          pollTimerRef.current = setTimeout(check, POLL_INTERVAL_MS);
        } finally {
          pollInFlightRef.current = false;
        }
      };

      check();
    },
    [finishSuccess, finishFailed]
  );

  useEffect(() => {
    // The buyer cancelled on PayPal's page: nothing was approved, so there is
    // nothing to capture. Never read the token or call the capture API here.
    if (landedFrom === "cancel") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("failed");
      setMessage("You cancelled the PayPal payment before it could be confirmed.");
      return;
    }

    if (captureAttemptedRef.current) return;
    captureAttemptedRef.current = true;

    const paypalToken = searchParams.get("token");

    if (!paypalToken) {
      // One-shot check of the return URL on arrival from PayPal.
      setState("failed");
      setMessage("We couldn't confirm this PayPal payment — some details were missing.");
      return;
    }

    // The order id isn't guaranteed to come back from PayPal itself, so we
    // prefer whatever the backend echoed on the return_url/cancel_url query
    // string, then the id this tab remembered for this same PayPal token (a
    // reload of this page), and finally the id CheckoutLayout stashed in
    // sessionStorage right before redirecting to PayPal (handlePayPalPay).
    const orderIdParam = searchParams.get("order_id");
    const storedOrderId = sessionStorage.getItem(PAYPAL_ORDER_ID_KEY);
    const resolvedOrderIdStr = orderIdParam ?? rememberedOrderId(paypalToken) ?? storedOrderId;
    const parsedOrderId = resolvedOrderIdStr ? Number(resolvedOrderIdStr) : NaN;

    if (!resolvedOrderIdStr || Number.isNaN(parsedOrderId)) {
      setState("failed");
      setMessage("We couldn't find the order for this PayPal payment.");
      return;
    }

    setOrderId(parsedOrderId);
    sessionStorage.setItem(
      PAYPAL_RETURN_KEY,
      JSON.stringify({ token: paypalToken, orderId: parsedOrderId })
    );

    (async () => {
      try {
        const response = await CapturePaypalOrderApi({
          order_id: parsedOrderId,
          paypal_order_id: paypalToken,
        });
        // SUCCESS: the order is paid. PENDING: PayPal is still processing, so
        // wait for the order to say paid. A failed capture is an error (catch).
        if (response?.data?.data?.payment_status === "SUCCESS") {
          finishSuccess(parsedOrderId);
        } else {
          toast("Your PayPal payment is still processing.");
          pollAttemptsRef.current = 0;
          pollOrderStatus(parsedOrderId);
        }
      } catch (err) {
        // A failed capture doesn't always mean an unpaid order: the request
        // can time out after the backend captured, or a reload can send a
        // second capture while the first is still running. The order is the
        // source of truth, so check it once before showing the failure. A 401
        // has already signed the shopper out and sent them to log in, so a
        // lookup can't succeed.
        const signedOut = isAxiosError(err) && err.response?.status === 401;
        if (!signedOut && (await isOrderPaid(parsedOrderId))) {
          finishSuccess(parsedOrderId);
          return;
        }
        finishFailed(
          errorMessage(err, "Unable to confirm your PayPal payment.")
        );
      } finally {
        // The stashed id is single-use — clear it so a future PayPal
        // attempt (a new order) can't accidentally pick up a stale value.
        sessionStorage.removeItem(PAYPAL_ORDER_ID_KEY);
      }
    })();
  }, [searchParams, landedFrom, finishSuccess, finishFailed, pollOrderStatus]);

  if (state === "processing") {
    return (
      <ProcessingScreen
        title="Confirming your payment…"
        description="We're verifying your payment with PayPal. Please don't close this page."
      />
    );
  }
  if (state === "success") {
    return <ProcessingScreen title="Payment confirmed" description="Opening your order confirmation…" />;
  }

  const isPending = state === "pending";
  // A pending order has its own confirmation page, which shows when the payment lands.
  const actionHref = isPending ? (orderId != null ? confirmationPath(orderId) : "/orders") : "/checkout";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-sm w-full">
        <div className="bg-card rounded-[1.5rem] border border-border shadow-xl overflow-hidden">
          <div className={`h-2 ${isPending ? "bg-primary" : "bg-destructive"}`} />

          <div className="px-8 py-10 text-center">
            <div
              className={`relative h-20 w-20 mx-auto rounded-full flex items-center justify-center ${
                isPending ? "bg-primary-soft" : "bg-destructive-soft"
              }`}
            >
              {isPending ? (
                <Clock className="h-10 w-10 text-primary-ink" strokeWidth={2.25} />
              ) : (
                <XCircle className="h-10 w-10 text-destructive" strokeWidth={2.25} />
              )}
            </div>

            <h1 className="mt-6 font-heading text-2xl font-bold text-foreground tracking-tight">
              {isPending ? "Payment Pending" : "Payment Not Completed"}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {message ??
                (isPending
                  ? "Your payment is still being processed. Please check again shortly."
                  : "We weren't able to confirm your PayPal payment.")}
            </p>

            <div className="mt-8 space-y-3">
              <a
                href={actionHref}
                className="w-full inline-flex bg-primary hover:brightness-95 text-primary-foreground py-3.5 rounded-[1rem] font-bold text-sm tracking-wide transition-all duration-200 items-center justify-center gap-2"
              >
                {isPending ? "View Your Order" : "Return to Checkout"}
              </a>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Questions? Contact our support team anytime.
        </p>
      </div>
    </div>
  );
}
