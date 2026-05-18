"use client";

import { useEffect, useState, useCallback } from "react";

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

import { GetAddressApi } from "@/api/operations/address.api";
import { GetShippingRatesApi } from "@/api/operations/shipping.api";

import EmptyCart from "./EmptyCart";
import ProcessingScreen from "./ProcessingScreen";
import SuccessScreen from "./SuccessScreen";
import ProgressRail from "./ProgressRail";
import AddressSection from "./AddressSection";
import ShippingSection from "./ShippingSection";
import PaymentSection from "./PaymentSection";
import OrderSummary from "./OrderSummary";

export type CheckoutStep =
  | "address"
  | "shipping"
  | "payment"
  | "processing"
  | "done";

export interface Address {
  id: number;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  is_default?: boolean;
}

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

export default function CheckoutLayout() {
  const { items, subtotal, customizationTotal, grandTotal } = useCart();
  const { addOrder } = useOrders();

  const [step, setStep] = useState<CheckoutStep>("address");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [processing, setProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  const shippingAmount = selectedRate?.price ?? 0;

  // ─── Load addresses ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        console.log("📍 Loading addresses...");
        const response = await GetAddressApi();
        const list: Address[] = response?.data?.data ?? [];
        console.log("📍 Addresses loaded:", list);
        setAddresses(list);

        if (list.length > 0) {
          const defaultAddress = list.find((a) => a.is_default);
          const selectedId = defaultAddress?.id ?? list[0].id;
          console.log("📍 Default address selected:", selectedId);
          setSelectedAddressId(selectedId);
        }
      } catch (err) {
        console.error("❌ Failed to load addresses:", err);
      }
    };

    loadAddresses();
  }, []);

  // ─── Fetch shipping rates ─────────────────────────────────────────────────
  const fetchRates = useCallback(async (addressId: number) => {
    try {
      console.log("🚚 Fetching shipping rates for address:", addressId);
      setProcessing(true);
      const response = await GetShippingRatesApi({ address_id: addressId });
      const rates: ShippingRate[] =
        response?.data?.data ?? response?.data?.rates ?? [];
      console.log("🚚 Shipping rates received:", rates);
      setShippingRates(rates);
      if (rates.length > 0) setSelectedRate(rates[0]);
    } catch (err) {
      console.error("❌ Failed to fetch shipping rates:", err);
    } finally {
      setProcessing(false);
    }
  }, []);

  // ─── Confirm shipping ─────────────────────────────────────────────────────
  const handleConfirmShipping = useCallback(async () => {
    try {
      setOrderError(null);
      setProcessing(true);

      if (!selectedAddressId) throw new Error("Please select an address");
      if (!selectedRate) throw new Error("Please select a shipping method");

      console.log("📦 Creating order with payload:", {
        address_id: selectedAddressId,
        selected_service_code: selectedRate.service_code,
        selected_carrier_code: selectedRate.carrier_code,
        shipping_amount: selectedRate.price,
      });

      const orderResponse = await CreateOrderApi({
        address_id: selectedAddressId,
        selected_service_code: selectedRate.service_code,
        selected_carrier_code: selectedRate.carrier_code,
        shipping_amount: selectedRate.price ?? 0,
      });

      console.log("📦 Order API response:", orderResponse?.data);

      const orderId = orderResponse?.data?.data?.id;
      if (!orderId) throw new Error("Order creation failed — no order ID returned");

      setCreatedOrderId(orderId);
      console.log("📦 Order created, ID:", orderId);

      console.log("🏷️ Creating shipment label for order:", orderId);
      const labelResponse = await CreateShipmentLabelApi({ order_id: orderId });
      console.log("🏷️ Shipment label response:", labelResponse?.data);

      setStep("payment");
    } catch (err: any) {
      console.error("❌ handleConfirmShipping failed:", {
        message: err?.message,
        status: err?.response?.status,
        backendMessage: err?.response?.data?.message,
        backendErrors: err?.response?.data?.errors,
        fullResponse: err?.response?.data,
      });
      setOrderError(
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  }, [selectedAddressId, selectedRate]);

  // ─── Place order (payment step) ───────────────────────────────────────────
  //
  //  Fixes:
  //    1. payment_method mapped correctly → "square" | "cod"
  //    2. amount passed (grandTotal + shippingAmount)
  //    3. source_id forwarded (Square token from tokenize())
  //    4. Full debug logs at every step
  //
const { refreshCart } = useCart();

const handlePlaceOrder = async (
  sourceId?: string,
  method?: SquareMethod
) => {
  try {
    setOrderError(null);
    setProcessing(true);
    setStep("processing");

    console.log("💳 handlePlaceOrder called:", {
      sourceId,
      method,
      createdOrderId,
      grandTotal,
      shippingAmount,
      totalAmount: grandTotal + shippingAmount,
    });

    if (!createdOrderId) {
      throw new Error(
        "No order found. Please go back and try again."
      );
    }

    if (
      method !== "BANK_ACCOUNT" &&
      !sourceId
    ) {
      throw new Error(
        "Payment token missing. Please re-enter your card details and try again."
      );
    }

    // ── Get Square config ─────────────────────────────
    console.log("⚙️ Fetching Square config...");

    let paymentConfig = null;

    try {
      paymentConfig =
        await GetSquareConfigApi();

      console.log("⚙️ Square config:", {
        applicationId:
          paymentConfig?.applicationId,

        locationId:
          paymentConfig?.locationId,

        isSandbox:
          paymentConfig?.applicationId?.startsWith(
            "sandbox"
          ),
      });
    } catch (err) {
      console.warn(
        "⚠️ Square config fetch failed:",
        err
      );
    }

    // ── Create payment ────────────────────────────────
    if (paymentConfig) {
      const backendMethod =
        method === "BANK_ACCOUNT"
          ? "cod"
          : "square";

      const payload = {
        order_id: createdOrderId,
        sourceId: sourceId,
        payment_mode: method,
      };

      console.log(
        "💳 CreatePaymentApi payload:",
        payload
      );

      const paymentResponse =
        await CreatePaymentApi(payload);

      console.log(
        "💳 CreatePaymentApi response:",
        paymentResponse?.data
      );
    } else {
      console.warn(
        "⚠️ No Square config returned — payment step skipped"
      );
    }

    // ✅ REFRESH CART AFTER SUCCESS
    await refreshCart();

    // ── Done ──────────────────────────────────────────
    addOrder?.({
      id: createdOrderId,
    } as any);

    setStep("done");
  } catch (err: any) {
    console.error(
      "❌ handlePlaceOrder failed:",
      {
        message: err?.message,
        httpStatus:
          err?.response?.status,

        backendMessage:
          err?.response?.data?.message,

        squareErrors:
          err?.response?.data?.errors,

        fullBackendResponse:
          err?.response?.data,
      }
    );

    setOrderError(
      err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again."
    );

    setStep("payment");
  } finally {
    setProcessing(false);
  }
};

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (items.length === 0 && step !== "done") return <EmptyCart />;
  if (step === "processing") return <ProcessingScreen />;
  if (step === "done") return <SuccessScreen orderId={createdOrderId} />;

  return (
    <section className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 lg:py-12">
      <div className="container max-w-5xl px-4 mx-auto">
        <ProgressRail current={step} />

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-3">
            {step === "address" && (
          <AddressSection
  addresses={addresses}
  selectedAddressId={selectedAddressId}
  setSelectedAddressId={setSelectedAddressId}
  loading={processing}
  onContinue={async () => {
    if (!selectedAddressId) return;

    await fetchRates(selectedAddressId);
    setStep("shipping");
  }}
/>
            )}

            {step === "shipping" && (
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
              customizationTotal={customizationTotal}
              shippingAmount={shippingAmount}
              total={grandTotal + shippingAmount}
              selectedRate={selectedRate}
            />
          </div>
        </div>
      </div>
    </section>
  );
}