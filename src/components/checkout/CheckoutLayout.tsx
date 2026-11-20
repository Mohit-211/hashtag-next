"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { isAxiosError } from "axios";
import { useCart } from "@/contexts/CartContext";
import {
  CreatePaymentApi,
  CreatePaypalOrderApi,
  GetSquarePaymentStatusApi,
} from "@/api/operations/payment.api";
import { CreateOrderApi, GetOrderDetailApi } from "@/api/operations/order.api";
import { GetShippingRatesApi } from "@/api/operations/shipping.api";
import EmptyCart from "./EmptyCart";
import CheckoutSkeleton from "./CheckoutSkeleton";
import CartLoadError from "../cart/CartLoadError";
import ProcessingScreen from "./ProcessingScreen";
import ProgressRail from "./ProgressRail";
import ShippingSection from "./ShippingSection";
import PaymentSection from "./PaymentSection";
import OrderSummary from "./OrderSummary";
import AddressSection from "../account/AddressSection";
import { forgetCashAppOrder, readCashAppOrder } from "./cashAppPending";
import { errorMessage } from "@/lib/errors";
import { confirmationPath } from "@/lib/orderLinks";
export type CheckoutStep =
  | "address"
  | "shipping"
  | "payment"
  | "processing"
  | "done";
export interface ShippingRate {
  label: string;
  service_code: string;
  carrier_code: string;
  carrier_name?: string;
  service_name?: string;
  carrier_id?: string;
  price: number;
  delivery_days?: number;
  delivery_text?: string;
  trackable?: boolean;
}
export type SquareMethod =
  | "CARD"
  | "GOOGLE_PAY"
  | "PAYPAL"
  | "CASH_APP";
/** What the order will cost, as the API worked it out. Unknown until the order exists. */
interface OrderTotals {
  subtotal: number;
  handlingAmount: number;
  taxAmount: number;
  taxRate?: number;
  shippingAmount: number;
  totalAmount: number;
}
/** The order fields checkout reads from POST order and GET order/:id. */
interface ApiOrder {
  id?: number;
  order_number?: string;
  status?: string;
  payment_status?: string;
  subtotal_amount?: number | string;
  handling_amount?: number | string;
  tax_rate?: number | string;
  tax_amount?: number | string;
  shipping_amount?: number | string;
  total_amount?: number | string;
}
const toNumber = (v: unknown): number | undefined => {
  const n = parseFloat(String(v));
  return Number.isNaN(n) ? undefined : n;
};
/** The order's own figures; `fallback` only covers fields the API left out. */
const orderTotalsFrom = (
  order: ApiOrder | undefined,
  fallback = { subtotal: 0, shipping: 0 }
): OrderTotals => ({
  subtotal: toNumber(order?.subtotal_amount) ?? fallback.subtotal,
  handlingAmount: toNumber(order?.handling_amount) ?? 0,
  taxAmount: toNumber(order?.tax_amount) ?? 0,
  taxRate: toNumber(order?.tax_rate),
  shippingAmount: toNumber(order?.shipping_amount) ?? fallback.shipping,
  totalAmount: toNumber(order?.total_amount) ?? 0,
});
const PAYMENT_REJECTED = "Your payment didn't go through. Please try again or use another payment method.";
/** A bad address is fixed on the address step; a shipping outage can be retried. */
const canRetryRates = (status?: number) => status === 502 || status === 503;
export default function CheckoutLayout() {
  const {
    items,
    summary,
    refreshCart,
    clearCart,
    pending_order,
    loading: cartLoading,
    error: cartError,
    retry: retryCart,
  } = useCart();
  const subtotal = summary?.items_total ?? 0;
  const [step, setStep] = useState<CheckoutStep>("address");
  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [processing, setProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const paypalSubmittingRef = useRef(false);
  const [orderTotals, setOrderTotals] = useState<OrderTotals | null>(null);
  const shippingAmount = orderTotals?.shippingAmount ?? selectedRate?.price ?? 0;
  const checkoutCompletedRef = useRef(false);
  // Set when the shopper comes back from the Cash App app (see below).
  const [initialMethod, setInitialMethod] = useState<SquareMethod | undefined>(undefined);
  const [resumingCashApp, setResumingCashApp] = useState(false);

  // Cash App on a phone: Square sends the shopper to the Cash App app and back
  // to this page, which starts again at the address step. Reopen that order's
  // payment step with Cash App selected, so the widget mounts again and Square
  // can finish the payment (its `ontokenization` event).
  useEffect(() => {
    const pending = readCashAppOrder();
    if (!pending) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResumingCashApp(true);
    GetOrderDetailApi(pending.order_id, { skipErrorToast: true })
      .then((res) => {
        if (cancelled) return;
        const order: ApiOrder | undefined = res?.data?.data;
        if (!order?.id || order.payment_status === "SUCCESS" || order.status === "CANCELLED") {
          forgetCashAppOrder();
          return;
        }
        setCreatedOrderId(order.id);
        setOrderNumber(order.order_number ?? pending.order_number);
        setOrderTotals(orderTotalsFrom(order));
        setInitialMethod("CASH_APP");
        setStep("payment");
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) forgetCashAppOrder();
      })
      .finally(() => {
        if (!cancelled) setResumingCashApp(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (checkoutCompletedRef.current) return;
    if (step === "processing" || step === "done") return;
    if (
      pending_order?.order_id &&
      pending_order?.payment_status === "PENDING"
    ) {
      // Resume an unpaid order: the cart's pending order arrives from the
      // server after mount and jumps the flow straight to payment.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreatedOrderId(pending_order.order_id);
      setHasPendingOrder(true);
      setSelectedRate({
        label: "Saved Shipping",
        service_code: "saved",
        carrier_code: "saved",
        price: pending_order.shipping_amount || 0,
      });
      setStep("payment");
    }
  }, [pending_order, step]);
  /** Loads the rates; false when the customer has to go back and fix the address. */
  const fetchRates = useCallback(async (addressId: number) => {
    try {
      setProcessing(true);
      setAddressError(null);
      setRatesError(null);
      const response = await GetShippingRatesApi({
        address_id: addressId,
      });
      const rates: ShippingRate[] =
        response?.data?.data ?? response?.data?.rates ?? [];
      setShippingRates(rates);
      if (rates.length > 0) {
        setSelectedRate(rates[0]);
      }
      return true;
    } catch (err) {
      console.error("❌ Shipping fetch failed:", err);
      setShippingRates([]);
      setSelectedRate(null);
      const message = errorMessage(err, "We couldn't load shipping options. Please try again.");
      if (canRetryRates(isAxiosError(err) ? err.response?.status : undefined)) {
        setRatesError(message);
        return true;
      }
      setAddressError(message);
      return false;
    } finally {
      setProcessing(false);
    }
  }, []);
  const handleConfirmShipping = useCallback(async () => {
    try {
      setOrderError(null);
      setProcessing(true);
      if (!selectedAddressId) throw new Error("Please select address");
      if (!selectedRate) throw new Error("Please select shipping");
      const orderResponse = await CreateOrderApi({
        address_id: selectedAddressId,
        selected_service_code: selectedRate.service_code,
      });
      const orderData: ApiOrder | undefined = orderResponse?.data?.data;
      const orderId = orderData?.id;
      if (!orderId) throw new Error("Order creation failed");
      setCreatedOrderId(orderId);
      setOrderNumber(orderData?.order_number ?? null);

      // These are what the customer pays. The backend asks ShipStation again
      // here, so shipping can differ a little from the option they picked.
      setOrderTotals(orderTotalsFrom(orderData, { subtotal, shipping: selectedRate.price ?? 0 }));

      await refreshCart();
      setStep("payment");
    } catch (err) {
      console.error(err);
      setOrderError(
        errorMessage(err, "Something went wrong")
      );
      // The chosen option has gone: load the current ones and let the
      // customer pick again.
      if (isAxiosError(err) && err.response?.status === 409 && selectedAddressId) {
        if (await fetchRates(selectedAddressId)) setSelectedRate(null);
        else setStep("address");
      }
    } finally {
      setProcessing(false);
    }
  }, [selectedAddressId, selectedRate, refreshCart, subtotal, fetchRates]);
  // create-payment answers SUCCESS (paid), REJECTED (failed) or PENDING
  // (Square is still processing, e.g. Cash App / Google Pay). A PENDING
  // payment is followed on payment/square/payment-status (POST { order_id }).
  const POLL_INTERVAL_MS = 3000;
  const MAX_POLL_ATTEMPTS = 10; // ~30s before giving up and surfacing "still processing"

  const waitForSquarePaymentStatus = async (orderId: number) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      try {
        const statusResponse = await GetSquarePaymentStatusApi({ order_id: orderId });
        const status = statusResponse?.data?.data?.payment_status;
        if (status === "SUCCESS" || status === "REJECTED") return status;
      } catch (err) {
        // One failed check says nothing about the payment: keep checking.
        console.error(err);
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    return "TIMEOUT" as const;
  };

  const handlePlaceOrder = async (
    sourceId?: string,
    method?: SquareMethod
  ) => {
    try {
      setOrderError(null);
      setProcessing(true);
      setStep("processing");
      if (!createdOrderId) {
        throw new Error("No order found");
      }
      if (!sourceId) {
        throw new Error("Payment token missing");
      }
      // CARD, GOOGLE_PAY, and CASH_APP all tokenize client-side and post
      // through this same create-payment endpoint — only the sourceId's
      // origin and payment_mode differ.
      const paymentResponse = await CreatePaymentApi({
        order_id: createdOrderId,
        sourceId,
        payment_mode: method,
      });

      const charged = paymentResponse?.data?.data?.payment_status;
      const paymentStatus =
        charged === "SUCCESS" || charged === "REJECTED"
          ? charged
          : await waitForSquarePaymentStatus(createdOrderId);
      if (paymentStatus === "REJECTED") {
        throw new Error(PAYMENT_REJECTED);
      }
      if (paymentStatus === "TIMEOUT") {
        // It may still go through: don't invite a second payment.
        throw new Error(
          "We're still confirming your payment. Check My Orders in a minute before trying again."
        );
      }

      forgetCashAppOrder();
      checkoutCompletedRef.current = true;
      setStep("done");
      clearCart();
      // Full page load, so CartProvider refetches the emptied cart; replace()
      // keeps Back from returning to the payment step.
      window.location.replace(confirmationPath(createdOrderId));
    } catch (err) {
      console.error(err);
      setOrderError(
        errorMessage(err, "Payment failed")
      );
      checkoutCompletedRef.current = false;
      setStep("payment");
    } finally {
      setProcessing(false);
    }
  };

  // ─────────────────────────────────────────────
  // PAYPAL
  // create-order kicks off a redirect to PayPal's hosted approval page.
  // The redirect leaves the SPA entirely, so React state (createdOrderId)
  // won't survive the round trip — we stash it in sessionStorage right
  // before leaving so /checkout/paypal/success|cancel can read it back
  // dynamically, without depending on the backend echoing order_id in
  // the return_url/cancel_url query string.
  // ─────────────────────────────────────────────
  const handlePayPalPay = async () => {
    if (paypalSubmittingRef.current) return;
    try {
      paypalSubmittingRef.current = true;
      setOrderError(null);
      setProcessing(true);
      if (!createdOrderId) {
        throw new Error("No order found");
      }
      const response = await CreatePaypalOrderApi({ order_id: createdOrderId });
      const approvalUrl = response?.data?.data?.approval_url;
      if (!approvalUrl) {
        throw new Error("Unable to start PayPal checkout. Please try again.");
      }
      sessionStorage.setItem("paypal_pending_order_id", String(createdOrderId));
      window.location.href = approvalUrl;
    } catch (err) {
      console.error(err);
      setOrderError(
        errorMessage(err, "Unable to start PayPal checkout")
      );
      paypalSubmittingRef.current = false;
      setProcessing(false);
    }
  };

  // ─────────────────────────────────────────────
  // GUARDS
  // NOTE: order matters. "processing" and "done" are
  // checked BEFORE the empty-cart check, because
  // refreshCart() during/after payment can legitimately
  // empty the cart while we still want to show the
  // processing/success screens instead of EmptyCart.
  // The cart counts as empty only once it has loaded:
  // until then show a skeleton, and Retry if it failed.
  // ─────────────────────────────────────────────
  if (step === "processing") {
    return <ProcessingScreen />;
  }
  if (step === "done") {
    return <ProcessingScreen title="Payment confirmed" description="Opening your order confirmation…" />;
  }
  if (resumingCashApp) {
    return <ProcessingScreen title="Finishing your Cash App payment…" description="One moment while we reopen your order." />;
  }
  if (cartLoading) {
    return <CheckoutSkeleton />;
  }
  if (cartError) {
    return <CartLoadError message={cartError} onRetry={retryCart} />;
  }
  if (items.length === 0) {
    return <EmptyCart />;
  }
  // Before the order exists: the cart's items and handling fee plus the chosen
  // shipping. Tax is added when the order is made.
  const cartTotal = summary?.grand_total ?? subtotal;
  return (
    <section className="py-8 lg:py-12">
      <div className="container max-w-5xl">
        <ProgressRail current={step} />

        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-6 lg:gap-8 items-stretch lg:items-start">
          <div className="lg:col-span-3">
            {step === "address" && !hasPendingOrder && (
              <AddressSection
                mode="select"
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                onContinue={async () => {
                  if (!selectedAddressId) return;
                  if (await fetchRates(selectedAddressId)) setStep("shipping");
                }}
                continueLoading={processing}
                addressError={addressError}
              />
            )}
            {step === "shipping" && !hasPendingOrder && (
              <ShippingSection
                shippingRates={shippingRates}
                selectedRate={selectedRate}
                setSelectedRate={setSelectedRate}
                selectedAddressId={selectedAddressId}
                shippingAmount={shippingAmount}
                processing={processing}
                orderError={orderError}
                ratesError={ratesError}
                onRetryRates={async () => {
                  if (selectedAddressId && !(await fetchRates(selectedAddressId))) setStep("address");
                }}
                onContinue={handleConfirmShipping}
                onBack={() => setStep("address")}
              />
            )}
            {step === "payment" && (
              <PaymentSection
                onPlaceOrder={handlePlaceOrder}
                onPayPalPay={handlePayPalPay}
                onBack={() => {
                  forgetCashAppOrder();
                  setInitialMethod(undefined);
                  setOrderError(null);
                  // A new choice makes a new order, with its own totals.
                  setOrderTotals(null);
                  // An order reopened after Cash App has no address or rates
                  // loaded here: start again from the address.
                  setStep(selectedAddressId ? "shipping" : "address");
                }}
                processing={processing}
                orderError={orderError}
                orderId={createdOrderId}
                orderNumber={orderNumber}
                orderTotal={orderTotals?.totalAmount ?? null}
                initialMethod={initialMethod}
              />
            )}
          </div>
          <div className="lg:col-span-2">
            <OrderSummary
              items={items}
              subtotal={orderTotals?.subtotal ?? subtotal}
              handlingAmount={orderTotals?.handlingAmount ?? summary?.handling_fee ?? 0}
              handlingLabel={summary?.handling_fee_label}
              taxAmount={orderTotals?.taxAmount ?? null}
              taxRate={orderTotals?.taxRate}
              shippingAmount={shippingAmount}
              total={orderTotals?.totalAmount ?? cartTotal + shippingAmount}
              selectedRate={selectedRate}
            />
          </div>
        </div>
      </div>
    </section>
  );
}