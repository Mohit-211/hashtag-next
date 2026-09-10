"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { CapturePaypalOrderApi } from "@/api/operations/payment.api";
import { GetOrderDetailApi } from "@/api/operations/order.api";
import { useCart } from "@/contexts/CartContext";
import { useOrders } from "@/contexts/OrdersContext";
import ProcessingScreen from "./ProcessingScreen";
import SuccessScreen from "./SuccessScreen";

// "processing" covers both the initial capture call and the follow-up
// polling while the backend is still confirming — the UI doesn't need to
// tell those two apart, it just needs to never show success early.
type ReturnState = "processing" | "success" | "pending" | "failed";

const PAYPAL_ORDER_ID_KEY = "paypal_pending_order_id";

// PayPal can land the user back here before the backend has finished
// updating the order, so a PENDING capture result is polled against the
// order detail (the backend's source of truth) rather than trusted as-is.
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 15; // ~1 minute before we stop and show "still pending"

interface Props {
  // Which PayPal redirect landed the user here — only changes the copy
  // shown when the payment didn't succeed, the capture call itself is
  // identical either way.
  landedFrom: "success" | "cancel";
}

export default function PaypalReturnStatus({ landedFrom }: Props) {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { addOrder } = useOrders();
  const [state, setState] = useState<ReturnState>("processing");
  console.log(state, "state")
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
    (id: number) => {

      clearPollTimer();
      clearCart();
      addOrder?.({ id } as any);
      toast.success("Payment successful — your order is confirmed!");
      setState("success");
      setTimeout(() => {
        window.location.href = "/categories";
      }, 3000);
    },
    [clearCart, addOrder, clearPollTimer]
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
          const res = await GetOrderDetailApi(id);
          const detail = res?.data?.data ?? res?.data ?? null;
          const status = detail?.payment_status;

          if (unmountedRef.current) return;

          if (status === "SUCCESS") {
            finishSuccess(id);
            return;
          }
          if (status === "FAILED" || status === "REFUNDED") {
            finishFailed(
              landedFrom === "cancel"
                ? "Your PayPal payment was cancelled. No charge was made."
                : "PayPal payment failed. Please try again."
            );
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
    [finishSuccess, finishFailed, landedFrom]
  );

  useEffect(() => {
    if (captureAttemptedRef.current) return;
    captureAttemptedRef.current = true;

    const paypalToken = searchParams.get("token");

    if (!paypalToken) {
      setState("failed");
      setMessage(
        landedFrom === "cancel"
          ? "You cancelled the PayPal payment before it could be confirmed."
          : "We couldn't confirm this PayPal payment — some details were missing."
      );
      return;
    }

    // The order id isn't guaranteed to come back from PayPal itself, so we
    // prefer whatever the backend echoed on the return_url/cancel_url query
    // string, and fall back to the id CheckoutLayout stashed in
    // sessionStorage right before redirecting to PayPal (handlePayPalPay).
    const orderIdParam = searchParams.get("order_id");
    const storedOrderId = sessionStorage.getItem(PAYPAL_ORDER_ID_KEY);
    const resolvedOrderIdStr = orderIdParam ?? storedOrderId;
    const parsedOrderId = resolvedOrderIdStr ? Number(resolvedOrderIdStr) : NaN;

    if (!resolvedOrderIdStr || Number.isNaN(parsedOrderId)) {
      setState("failed");
      setMessage("We couldn't find the order for this PayPal payment.");
      return;
    }

    setOrderId(parsedOrderId);

    (async () => {
      try {
        const response = await CapturePaypalOrderApi({
          order_id: parsedOrderId,
          paypal_order_id: paypalToken,
        });
        console.log(response, "response")
        const status = response?.data?.data?.status;
        console.log(status, "status=========")
        if (status === "COMPLETED") {
          finishSuccess(parsedOrderId);
        } else if (status === "PENDING") {
          toast("Your PayPal payment is still processing.");
          pollAttemptsRef.current = 0;
          pollOrderStatus(parsedOrderId);
        } else {
          finishFailed(
            landedFrom === "cancel"
              ? "Your PayPal payment was cancelled. No charge was made."
              : "PayPal payment failed. Please try again."
          );
        }
      } catch (err: any) {
        finishFailed(
          err?.response?.data?.message || err?.message || "Unable to confirm your PayPal payment."
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
  if (state === "success") return <SuccessScreen orderId={orderId} />;

  const isPending = state === "pending";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-sm w-full">
        <div className="bg-card rounded-[1.5rem] border border-border shadow-xl overflow-hidden">
          <div className={`h-2 ${isPending ? "bg-amber-400" : "bg-destructive"}`} />

          <div className="px-8 py-10 text-center">
            <div
              className="relative h-20 w-20 mx-auto rounded-full flex items-center justify-center"
              style={{ background: isPending ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)" }}
            >
              {isPending ? (
                <Clock className="h-10 w-10 text-amber-500" strokeWidth={2.25} />
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
                href={isPending ? "/categories" : "/checkout"}
                className="w-full inline-flex bg-primary hover:brightness-95 text-primary-foreground py-3.5 rounded-[1rem] font-bold text-sm tracking-wide transition-all duration-200 items-center justify-center gap-2"
              >
                {isPending ? "Back to Home" : "Return to Checkout"}
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
