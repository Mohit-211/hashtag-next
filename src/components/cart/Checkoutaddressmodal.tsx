"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Plus, CheckCircle2, Loader2, Truck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddAddressApi, GetAddressApi } from "@/api/operations/address.api";
import AddressForm from "../account/AddressForm";
import { GetShippingRatesApi } from "@/api/operations/shipping.api";
import { CreateOrderApi } from "@/api/operations/order.api";
import { useCart } from "@/contexts/CartContext";

interface Address {
  id: string | number;
  fullName: string;
  phone: string;
  line1: string;
  state: string;
  city: string;
  postalCode: string;
  state_id?: number;
  city_id?: number;
}

interface ShippingRate {
  label: string;
  service_code: string;
  carrier_code: string;
  price: number;
  delivery_days: number;
  delivery_text?: string;
}

interface CheckoutAddressModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: (addressId: string, shippingData: any) => void;
}

type Step = "address" | "shipping";

const emptyForm = {
  fullName: "",
  phone: "",
  line1: "",
  state: "",
  state_id: undefined,
  city: "",
  city_id: undefined,
  postalCode: "",
};

export default function CheckoutAddressModal({
  open,
  onClose,
  onConfirm,
}: CheckoutAddressModalProps) {
  const [step, setStep] = useState<Step>("address");
const { refreshCart } = useCart();
  // ── Address state ──────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm);
  const [savingAddress, setSavingAddress] = useState(false);

  // ── Shipping state ─────────────────────────────────────────────────────────
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [fetchingRates, setFetchingRates] = useState(false);

  // ── Order state ────────────────────────────────────────────────────────────
  const [placingOrder, setPlacingOrder] = useState(false);

  // ── Fetch saved addresses ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    fetchAddresses();
  }, [open]);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await GetAddressApi();
      const list: Address[] = res?.data?.data || res?.data || [];
      setAddresses(list);

      if (list.length > 0 && !selectedId) {
        setSelectedId(String(list[0].id));
      }

      if (list.length === 0) {
        setShowAddForm(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // ── Save new address ───────────────────────────────────────────────────────
  const handleSaveAddress = async (data: any) => {
    setSavingAddress(true);
    try {
      const res = await AddAddressApi(data);
      const saved = res?.data?.data || res?.data;
      await fetchAddresses();
      if (saved?.id) setSelectedId(String(saved.id));
      setShowAddForm(false);
      setFormData(emptyForm);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAddress(false);
    }
  };

  // ── Confirm address → fetch shipping rates ─────────────────────────────────
  const handleConfirmAddress = async () => {
    if (!selectedId) return;
    setFetchingRates(true);
    try {
      const res = await GetShippingRatesApi({ address_id: selectedId });
      const rates: ShippingRate[] = res?.data?.data || [];
      setShippingRates(rates);
      // Auto-select first rate
      setSelectedRate(rates[0] ?? null);
      setStep("shipping");
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingRates(false);
    }
  };

  // ── Place order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
  if (!selectedId || !selectedRate) return;
  setPlacingOrder(true);
  try {
    await CreateOrderApi({
      address_id: Number(selectedId),
      selected_service_code: selectedRate.service_code,
      selected_carrier_code: selectedRate.carrier_code,
      shipping_amount: selectedRate.price,
    });


    onConfirm?.(selectedId, selectedRate);
    onClose();
      refreshCart(); // refresh cart after order placed

  } catch (err) {
    console.error(err);
  } finally {
    setPlacingOrder(false);
  }
};

  // ── Reset & close ──────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep("address");
    setShippingRates([]);
    setSelectedRate(null);
    setShowAddForm(false);
    setFormData(emptyForm);
    onClose();
  };

  if (!open) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const selectedAddress = addresses.find((a) => String(a.id) === selectedId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step === "address" ? (
              <MapPin className="w-5 h-5 text-primary" />
            ) : (
              <Truck className="w-5 h-5 text-primary" />
            )}
            <h2 className="font-semibold text-lg">
              {step === "address" ? "Delivery Address" : "Choose Shipping"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  step === "address" ? "bg-primary" : "bg-gray-200"
                }`}
              />
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  step === "shipping" ? "bg-primary" : "bg-gray-200"
                }`}
              />
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* ═══════════════ STEP 1: ADDRESS ═══════════════ */}
          {step === "address" && (
            <>
              {/* Loading */}
              {loadingAddresses && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Loading addresses…</span>
                </div>
              )}

              {/* Address List */}
              {!loadingAddresses && !showAddForm && addresses.length > 0 && (
                <div className="space-y-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedId === String(addr.id);
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedId(String(addr.id))}
                        className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? "border-primary" : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-primary block" />
                            )}
                          </span>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">
                              {addr.fullName}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                              {addr.line1}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {addr.city}, {addr.state} – {addr.postalCode}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              📞 {addr.phone}
                            </p>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* Add new address toggle */}
                  {!showAddForm && (
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center gap-2 justify-center border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add a new address
                    </button>
                  )}
                </div>
              )}

              {/* Add Address Form */}
              {!loadingAddresses && showAddForm && (
                <div className="space-y-2">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setFormData(emptyForm);
                      }}
                      className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
                    >
                      ← Back to saved addresses
                    </button>
                  )}

                  <AddressForm
                    formData={formData}
                    setFormData={setFormData}
                    onSave={handleSaveAddress}
                    onCancel={() => {
                      if (addresses.length > 0) {
                        setShowAddForm(false);
                        setFormData(emptyForm);
                      } else {
                        handleClose();
                      }
                    }}
                    editing={false}
                  />

                  {savingAddress && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving address…
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {!loadingAddresses && addresses.length === 0 && !showAddForm && (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <MapPin className="w-10 h-10 text-muted-foreground/40" />
                  <div>
                    <p className="font-medium text-gray-700">No saved addresses</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add an address to continue with checkout.
                    </p>
                  </div>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Address
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ═══════════════ STEP 2: SHIPPING RATES ═══════════════ */}
          {step === "shipping" && (
            <>
              {/* Delivering to */}
              {selectedAddress && (
                <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-100">
                  <p className="text-xs text-muted-foreground mb-0.5">Delivering to</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedAddress.line1}, {selectedAddress.city},{" "}
                    {selectedAddress.state} – {selectedAddress.postalCode}
                  </p>
                </div>
              )}

              {/* Rate list */}
              {shippingRates.length > 0 && (
                <div className="space-y-3">
                  {shippingRates.map((rate) => {
                    const isSelected =
                      selectedRate?.service_code === rate.service_code;
                    return (
                      <button
                        key={rate.service_code}
                        type="button"
                        onClick={() => setSelectedRate(rate)}
                        className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Radio */}
                          <span
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? "border-primary" : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-primary block" />
                            )}
                          </span>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900">
                              {rate.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {rate.delivery_text
                                ? rate.delivery_text
                                : `${rate.delivery_days} business day${rate.delivery_days !== 1 ? "s" : ""}`}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <span className="font-semibold text-sm text-gray-900">
                              ${rate.price.toFixed(2)}
                            </span>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No rates fallback */}
              {shippingRates.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Truck className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No shipping options available for this address.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}

        {/* Address step footer */}
        {step === "address" && !showAddForm && addresses.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100">
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              disabled={!selectedId || fetchingRates}
              onClick={handleConfirmAddress}
            >
              {fetchingRates ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching shipping rates…
                </>
              ) : (
                "Confirm Address & Continue"
              )}
            </Button>
          </div>
        )}

        {/* Shipping step footer */}
        {step === "shipping" && (
          <div className="px-6 py-4 border-t border-gray-100 space-y-3">
            {/* Selected rate summary */}
            {selectedRate && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {selectedRate.label}
                  {selectedRate.delivery_text
                    ? ` · ${selectedRate.delivery_text}`
                    : ` · ${selectedRate.delivery_days} day${selectedRate.delivery_days !== 1 ? "s" : ""}`}
                </span>
                <span className="font-semibold text-gray-900">
                  ${selectedRate.price.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-shrink-0"
                onClick={() => setStep("address")}
                disabled={placingOrder}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="hero"
                size="lg"
                className="flex-1"
                disabled={!selectedRate || placingOrder}
                onClick={handlePlaceOrder}
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing order…
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}