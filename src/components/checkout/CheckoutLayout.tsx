"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { isAxiosError } from "axios";
import { useCart } from "@/contexts/CartContext";
import {
  CreatePaymentApi,
  GetSquareConfigApi,
  CreatePaypalOrderApi,
  GetSquarePaymentStatusApi,
} from "@/api/operations/payment.api";
import {
  CreateOrderApi,
  CreateShipmentLabelApi,
} from "@/api/operations/order.api";
import { GetShippingRatesApi } from "@/api/operations/shipping.api";
import EmptyCart from "./EmptyCart";
import ProcessingScreen from "./ProcessingScreen";
import ProgressRail from "./ProgressRail";
import ShippingSection from "./ShippingSection";
import PaymentSection from "./PaymentSection";
import OrderSummary from "./OrderSummary";
import AddressSection from "../account/AddressSection";
import { errorMessage } from "@/lib/errors";
import { NOV4_RELEASE } from "@/lib/features";
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
  | "CASH_APP"
  | "BANK_ACCOUNT";
/** What the order will cost, as the API worked it out. Unknown until the order exists. */
interface OrderTotals {
  subtotal: number;
  taxAmount: number;
  taxRate?: number;
  shippingAmount: number;
  totalAmount: number;
}
const toNumber = (v: unknown): number | undefined => {
  const n = parseFloat(String(v));
  return Number.isNaN(n) ? undefined : n;
};
/** A bad address is fixed on the address step; a shipping outage can be retried. */
const canRetryRates = (status?: number) => status === 502 || status === 503;
export default function CheckoutLayout() {
  const {
    items,
    summary,
    refreshCart,
    clearCart,
    pending_order,
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
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const paypalSubmittingRef = useRef(false);
  const [orderTotals, setOrderTotals] = useState<OrderTotals | null>(null);
  const shippingAmount = orderTotals?.shippingAmount ?? selectedRate?.price ?? 0;
  const checkoutCompletedRef = useRef(false);
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
        ...(NOV4_RELEASE
          ? {}
          : {
              selected_carrier_code: selectedRate.carrier_code,
              shipping_amount: selectedRate.price ?? 0,
            }),
      });
      const orderData = orderResponse?.data?.data;
      const orderId = orderData?.id;
      if (!orderId) throw new Error("Order creation failed");
      setCreatedOrderId(orderId);

      // Nothing is bought here once the 4 November release is live: the
      // backend creates the label itself after payment.
      const shipmentResponse = NOV4_RELEASE
        ? null
        : await CreateShipmentLabelApi({ order_id: orderId });
      // Today's API can change the price when the label is bought, so its
      // figures replace the order's own.
      const pricing = shipmentResponse?.data?.data?.pricing_breakdown;

      setOrderTotals({
        subtotal: toNumber(pricing?.subtotal ?? orderData?.subtotal_amount) ?? subtotal,
        taxAmount: toNumber(pricing?.tax ?? orderData?.tax_amount) ?? 0,
        taxRate: toNumber(orderData?.tax_rate),
        shippingAmount:
          toNumber(pricing?.actual_shipping ?? orderData?.shipping_amount) ?? selectedRate.price ?? 0,
        totalAmount: toNumber(pricing?.final_total ?? orderData?.total_amount) ?? 0,
      });

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
  // Square's create-payment call kicks off processing on the gateway side
  // but doesn't always settle synchronously (Cash App / Google Pay in
  // particular can stay PENDING briefly), so the order's real status is
  // confirmed against payment/square/payment-status (POST { order_id })
  // rather than trusted from the create-payment response alone.
  const POLL_INTERVAL_MS = 3000;
  const MAX_POLL_ATTEMPTS = 10; // ~30s before giving up and surfacing "still processing"

  const waitForSquarePaymentStatus = async (orderId: number) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const statusResponse = await GetSquarePaymentStatusApi({ order_id: orderId });
      const status = statusResponse?.data?.data?.payment_status;
      if (status === "SUCCESS") return true;
      if (status === "FAILED" || status === "REFUNDED") return false;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    return false;
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
      if (method !== "BANK_ACCOUNT" && !sourceId) {
        throw new Error("Payment token missing");
      }
      const paymentConfig = await GetSquareConfigApi();
      if (!paymentConfig) {
        throw new Error("Unable to load payment configuration");
      }
      // CARD, GOOGLE_PAY, and CASH_APP all tokenize client-side and post
      // through this same create-payment endpoint — only the sourceId's
      // origin and payment_mode differ.
      await CreatePaymentApi({
        order_id: createdOrderId,
        sourceId,
        payment_mode: method,
      });

      const paymentConfirmed = await waitForSquarePaymentStatus(createdOrderId);
      if (!paymentConfirmed) {
        throw new Error(
          "We couldn't confirm your payment. Please check your orders shortly or try again."
        );
      }

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
  // ─────────────────────────────────────────────
  if (step === "processing") {
    return <ProcessingScreen />;
  }
  if (step === "done") {
    return <ProcessingScreen title="Payment confirmed" description="Opening your order confirmation…" />;
  }
  if (items.length === 0) {
    return <EmptyCart />;
  }
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
                  // A new choice makes a new order, with its own totals.
                  setOrderTotals(null);
                  setStep("shipping");
                }}
                processing={processing}
                orderError={orderError}
              />
            )}
          </div>
          <div className="lg:col-span-2">
            <OrderSummary
              items={items}
              subtotal={orderTotals?.subtotal ?? subtotal}
              taxAmount={orderTotals?.taxAmount ?? null}
              taxRate={orderTotals?.taxRate}
              shippingAmount={shippingAmount}
              total={orderTotals?.totalAmount ?? subtotal + shippingAmount}
              selectedRate={selectedRate}
            />
          </div>
        </div>
      </div>
    </section>
  );
}