"use client";

import { useEffect, useState, useCallback } from "react";
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
  const router = useRouter();

  const {
    items,
    subtotal,
    customizationTotal,
    grandTotal,
    refreshCart,
    pending_order,
  } = useCart();

  const { addOrder } = useOrders();

  const [step, setStep] =
    useState<CheckoutStep>("address");

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null);

  const [shippingRates, setShippingRates] =
    useState<ShippingRate[]>([]);

  const [selectedRate, setSelectedRate] =
    useState<ShippingRate | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [orderError, setOrderError] =
    useState<string | null>(null);

  const [createdOrderId, setCreatedOrderId] =
    useState<number | null>(null);

  const [hasPendingOrder, setHasPendingOrder] =
    useState(false);

  const shippingAmount =
    selectedRate?.price ?? 0;

  // ─────────────────────────────────────────────
  // AUTO DETECT PENDING ORDER
  // ─────────────────────────────────────────────
  useEffect(() => {
    console.log(
      "🛒 Pending order:",
      pending_order
    );

    if (
      pending_order?.order_id &&
      pending_order?.payment_status === "PENDING"
    ) {
      console.log(
        "✅ Pending payment found → redirect payment step"
      );

      setCreatedOrderId(
        pending_order.order_id
      );

      setHasPendingOrder(true);

      setSelectedRate({
        label: "Saved Shipping",
        service_code: "saved",
        carrier_code: "saved",
        price:
          pending_order.shipping_amount || 0,
      });

      setStep("payment");
    }
  }, [pending_order]);

  // ─────────────────────────────────────────────
  // LOAD ADDRESSES
  // ─────────────────────────────────────────────
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response =
          await GetAddressApi();

        const list: Address[] =
          response?.data?.data ?? [];

        setAddresses(list);

        if (list.length > 0) {
          const defaultAddress =
            list.find(
              (a) => a.is_default
            );

          setSelectedAddressId(
            defaultAddress?.id ??
              list[0].id
          );
        }
      } catch (err) {
        console.error(
          "❌ Failed to load addresses:",
          err
        );
      }
    };

    loadAddresses();
  }, []);

  // ─────────────────────────────────────────────
  // FETCH SHIPPING RATES
  // ─────────────────────────────────────────────
  const fetchRates = useCallback(
    async (addressId: number) => {
      try {
        setProcessing(true);

        const response =
          await GetShippingRatesApi({
            address_id: addressId,
          });

        const rates: ShippingRate[] =
          response?.data?.data ??
          response?.data?.rates ??
          [];

        setShippingRates(rates);

        if (rates.length > 0) {
          setSelectedRate(rates[0]);
        }
      } catch (err) {
        console.error(
          "❌ Shipping fetch failed:",
          err
        );
      } finally {
        setProcessing(false);
      }
    },
    []
  );

  // ─────────────────────────────────────────────
  // CONFIRM SHIPPING
  // ─────────────────────────────────────────────
  const handleConfirmShipping =
    useCallback(async () => {
      try {
        setOrderError(null);
        setProcessing(true);

        if (!selectedAddressId) {
          throw new Error(
            "Please select address"
          );
        }

        if (!selectedRate) {
          throw new Error(
            "Please select shipping"
          );
        }

        const orderResponse =
          await CreateOrderApi({
            address_id:
              selectedAddressId,

            selected_service_code:
              selectedRate.service_code,

            selected_carrier_code:
              selectedRate.carrier_code,

            shipping_amount:
              selectedRate.price ?? 0,
          });

        const orderId =
          orderResponse?.data?.data?.id;

        if (!orderId) {
          throw new Error(
            "Order creation failed"
          );
        }

        setCreatedOrderId(orderId);

        await CreateShipmentLabelApi({
          order_id: orderId,
        });

        setStep("payment");
      } catch (err: any) {
        console.error(err);

        setOrderError(
          err?.response?.data?.message ||
            err?.message ||
            "Something went wrong"
        );
      } finally {
        setProcessing(false);
      }
    }, [
      selectedAddressId,
      selectedRate,
    ]);

  // ─────────────────────────────────────────────
  // PLACE ORDER
  // ─────────────────────────────────────────────
  const handlePlaceOrder = async (
    sourceId?: string,
    method?: SquareMethod
  ) => {
    try {
      setOrderError(null);
      setProcessing(true);
      setStep("processing");

      if (!createdOrderId) {
        throw new Error(
          "No order found"
        );
      }

      if (
        method !== "BANK_ACCOUNT" &&
        !sourceId
      ) {
        throw new Error(
          "Payment token missing"
        );
      }

      const paymentConfig =
        await GetSquareConfigApi();

      if (paymentConfig) {
        await CreatePaymentApi({
          order_id: createdOrderId,
          sourceId,
          payment_mode: method,
        });
      }

      // ✅ Refresh cart after payment success
      await refreshCart();

      // ✅ Add order in context
      addOrder?.({
        id: createdOrderId,
      } as any);

      // ✅ Optional success screen
      setStep("done");

      // ✅ Redirect after 2 seconds
      setTimeout(() => {
        router.push("/categories");
      }, 2000);
    } catch (err: any) {
      console.error(err);

      setOrderError(
        err?.response?.data?.message ||
          err?.message ||
          "Payment failed"
      );

      setStep("payment");
    } finally {
      setProcessing(false);
    }
  };

  // ─────────────────────────────────────────────
  // GUARDS
  // ─────────────────────────────────────────────
  if (
    items.length === 0 &&
    step !== "done"
  ) {
    return <EmptyCart />;
  }

  if (step === "processing") {
    return <ProcessingScreen />;
  }

  if (step === "done") {
    return (
      <SuccessScreen
        orderId={createdOrderId}
      />
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 lg:py-12">
      <div className="container max-w-5xl px-4 mx-auto">

        <ProgressRail current={step} />

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">

          <div className="lg:col-span-3">

            {step === "address" &&
              !hasPendingOrder && (
                <AddressSection
                  addresses={addresses}
                  selectedAddressId={
                    selectedAddressId
                  }
                  setSelectedAddressId={
                    setSelectedAddressId
                  }
                  loading={processing}
                  onContinue={async () => {
                    if (
                      !selectedAddressId
                    )
                      return;

                    await fetchRates(
                      selectedAddressId
                    );

                    setStep("shipping");
                  }}
                />
              )}

            {step === "shipping" &&
              !hasPendingOrder && (
                <ShippingSection
                  shippingRates={
                    shippingRates
                  }
                  selectedRate={
                    selectedRate
                  }
                  setSelectedRate={
                    setSelectedRate
                  }
                  selectedAddressId={
                    selectedAddressId
                  }
                  shippingAmount={
                    shippingAmount
                  }
                  processing={
                    processing
                  }
                  orderError={
                    orderError
                  }
                  onContinue={
                    handleConfirmShipping
                  }
                  onBack={() =>
                    setStep("address")
                  }
                />
              )}

            {step === "payment" && (
              <PaymentSection
                onPlaceOrder={
                  handlePlaceOrder
                }
                onBack={() =>
                  setStep("shipping")
                }
                processing={
                  processing
                }
                orderError={
                  orderError
                }
              />
            )}
          </div>

          <div className="lg:col-span-2">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              customizationTotal={
                customizationTotal
              }
              shippingAmount={
                shippingAmount
              }
              total={
                grandTotal +
                shippingAmount
              }
              selectedRate={
                selectedRate
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}