"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useOrders } from "@/contexts/OrdersContext";
import {
  CreatePaymentApi,
  GetSquareConfigApi,
} from "@/api/operations/payment.api";
import {
  CreateOrderApi,
  CreateShipmentLabelApi,
} from "@/api/operations/order.api";
import { GetShippingRatesApi } from "@/api/operations/shipping.api";
import EmptyCart from "./EmptyCart";
import ProcessingScreen from "./ProcessingScreen";
import SuccessScreen from "./SuccessScreen";
import ProgressRail from "./ProgressRail";
import ShippingSection from "./ShippingSection";
import PaymentSection from "./PaymentSection";
import OrderSummary from "./OrderSummary";
import AddressSection from "../account/AddressSection";
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
  price: number;
  delivery_days?: number;
  delivery_text?: string;
  trackable?: boolean;
}
export type SquareMethod =
  | "CARD"
  | "GOOGLE_PAY"
  | "APPLE_PAY"
  | "BANK_ACCOUNT";
// Tax is applied to (subtotal + customization), never to shipping.
const TAX_RATE = 8.25;
export default function CheckoutLayout() {
  const router = useRouter();
  const {
    items,
    summary,
    refreshCart,
    pending_order,
  } = useCart();
  const subtotal = summary?.items_total ?? 0;
  const { addOrder } = useOrders();
  const [step, setStep] = useState<CheckoutStep>("address");
  console.log(step, "step===>")
  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [processing, setProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [orderTax, setOrderTax] = useState<{
    subtotal: number;
    taxAmount: number;
    taxRate: number;
    totalAmount: number;
  } | null>(null);
  // ★ ADDED — the shipping rate the user picked at checkout is only an
  // estimate. CreateShipmentLabelApi actually buys the label with the
  // carrier and can return a different (often higher) real price — see
  // pricing_breakdown.actual_shipping vs .estimated_shipping in that
  // response. This tracks the post-label authoritative numbers once
  // they're known, so the UI reflects what the order actually costs.
  const [shipmentPricing, setShipmentPricing] = useState<{
    estimatedShipping: number;
    actualShipping: number;
    shippingDifference: number;
    explanation: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    labelUrl: string | null;
    carrier: string | null;
  } | null>(null);
  console.log(selectedRate,"selectedRate")
  // ★ FIXED — was always `selectedRate?.price` (the pre-label estimate),
  // even after the label was created with a different actual price.
  const shippingAmount = shipmentPricing?.actualShipping ?? selectedRate?.price ?? 0;
  console.log(subtotal,"subtotal")
  const estimatedTaxableBase = subtotal || 0;
  const estimatedTaxAmount = +(estimatedTaxableBase * (TAX_RATE / 100)).toFixed(2);
  const taxAmount = orderTax ? orderTax.taxAmount : estimatedTaxAmount;
  const taxRate = orderTax ? orderTax.taxRate : TAX_RATE;
  const checkoutCompletedRef = useRef(false);
  useEffect(() => {
    if (checkoutCompletedRef.current) return;
    if (step === "processing" || step === "done") return;
    if (
      pending_order?.order_id &&
      pending_order?.payment_status === "PENDING"
    ) {
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
  const fetchRates = useCallback(async (addressId: number) => {
    try {
      setProcessing(true);
      const response = await GetShippingRatesApi({
        address_id: addressId,
      });
      const rates: ShippingRate[] =
        response?.data?.data ?? response?.data?.rates ?? [];
      setShippingRates(rates);
      if (rates.length > 0) {
        setSelectedRate(rates[0]);
      }
    } catch (err) {
      console.error("❌ Shipping fetch failed:", err);
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
        selected_carrier_code: selectedRate.carrier_code,
        shipping_amount: selectedRate.price ?? 0,
      });
      const orderData = orderResponse?.data?.data;
      const orderId = orderData?.id;
      if (!orderId) throw new Error("Order creation failed");
      setCreatedOrderId(orderId);

      // ★ FIXED — response was discarded (`await CreateShipmentLabelApi(...)`
      // with no assignment). This is where the carrier locks in the real
      // shipping price via pricing_breakdown, which supersedes the
      // estimate used above and the order-creation response's own
      // tax/subtotal numbers.
      const shipmentResponse = await CreateShipmentLabelApi({ order_id: orderId });
      const shipmentData = shipmentResponse?.data?.data;
      const pricing = shipmentData?.pricing_breakdown;

      if (pricing) {
        setShipmentPricing({
          estimatedShipping: pricing.estimated_shipping ?? selectedRate.price ?? 0,
          actualShipping: pricing.actual_shipping ?? selectedRate.price ?? 0,
          shippingDifference: pricing.shipping_difference ?? 0,
          explanation: shipmentData?.explanation ?? null,
          trackingNumber: shipmentData?.tracking_number ?? null,
          trackingUrl: shipmentData?.tracking_url ?? null,
          labelUrl: shipmentData?.label_url ?? null,
          carrier: shipmentData?.carrier ?? null,
        });

        setOrderTax({
          subtotal: pricing.subtotal ?? estimatedTaxableBase,
          taxAmount: pricing.tax ?? estimatedTaxAmount,
          // pricing_breakdown doesn't echo a tax_rate, so fall back to the
          // order-creation response's rate, then the flat TAX_RATE const.
          taxRate: parseFloat(orderData?.tax_rate) || TAX_RATE,
          totalAmount: pricing.final_total ?? subtotal + estimatedTaxAmount + (pricing.actual_shipping ?? 0),
        });
      } else {
        // Fallback: no pricing_breakdown came back — use whatever the
        // order-creation response provided, same as before.
        const parsedTaxAmount = parseFloat(orderData?.tax_amount);
        const parsedTaxRate = parseFloat(orderData?.tax_rate);
        const parsedSubtotal = parseFloat(orderData?.subtotal_amount);
        const parsedTotal = parseFloat(orderData?.total_amount);
        if (!isNaN(parsedTaxAmount) && !isNaN(parsedTotal)) {
          setOrderTax({
            subtotal: isNaN(parsedSubtotal) ? estimatedTaxableBase : parsedSubtotal,
            taxAmount: parsedTaxAmount,
            taxRate: isNaN(parsedTaxRate) ? TAX_RATE : parsedTaxRate,
            totalAmount: parsedTotal,
          });
        }
      }

      await refreshCart();
      setStep("payment");
    } catch (err: any) {
      console.error(err);
      setOrderError(
        err?.response?.data?.message || err?.message || "Something went wrong"
      );
    } finally {
      setProcessing(false);
    }
  }, [selectedAddressId, selectedRate, refreshCart, estimatedTaxableBase, estimatedTaxAmount, subtotal]);
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
      await CreatePaymentApi({
        order_id: createdOrderId,
        sourceId,
        payment_mode: method,
      });
      checkoutCompletedRef.current = true;
      setStep("done");
      await refreshCart();
      addOrder?.({
        id: createdOrderId,
      } as any);
      setTimeout(() => {
        router.push("/categories");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setOrderError(
        err?.response?.data?.message || err?.message || "Payment failed"
      );
      checkoutCompletedRef.current = false;
      setStep("payment");
    } finally {
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
    return <SuccessScreen orderId={createdOrderId} />;
  }
  if (items.length === 0) {
    return <EmptyCart />;
  }
  return (
    <section className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 lg:py-12">
      <div className="container max-w-5xl px-4 mx-auto">
        <ProgressRail current={step} />

        {/* ★ ADDED — surface it when the carrier's actual label price
            differs from the estimate the user picked, instead of
            silently swapping the total on the payment step. */}
        {/* {shipmentPricing && shipmentPricing.shippingDifference !== 0 && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {shipmentPricing.explanation ??
              `Shipping was updated to $${shipmentPricing.actualShipping.toFixed(2)} based on the carrier's final rate.`}
          </div>
        )} */}

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-3">
            {step === "address" && !hasPendingOrder && (
              <AddressSection
                mode="select"
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                onContinue={async () => {
                  if (!selectedAddressId) return;
                  await fetchRates(selectedAddressId);
                  setStep("shipping");
                }}
                continueLoading={processing}
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
                onContinue={handleConfirmShipping}
                onBack={() => setStep("address")}
              />
            )}
            {step === "payment" && (
              <PaymentSection
                onPlaceOrder={handlePlaceOrder}
                onBack={() => setStep("shipping")}
                processing={processing}
                orderError={orderError}
              />
            )}
          </div>
          <div className="lg:col-span-2">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              taxAmount={taxAmount}
              taxRate={taxRate}
              shippingAmount={shippingAmount}
              total={
                orderTax
                  ? orderTax.totalAmount
                  : subtotal + taxAmount + shippingAmount
              }
              selectedRate={selectedRate}
            />
          </div>
        </div>
      </div>
    </section>
  );
}