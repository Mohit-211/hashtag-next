"use client";

import { useEffect, useRef, useState } from "react";
import {
  CreditCard as CardIcon,
  Smartphone,
  Landmark,
  Loader2,
  ShieldCheck,
  Wallet,
  Lock,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import {
  GetSquareConfigApi,
  SquareConfig,
} from "@/api/operations/payment.api";

export type SquareMethod =
  | "CARD"
  | "GOOGLE_PAY"
  | "APPLE_PAY"
  | "BANK_ACCOUNT";

interface Props {
  onPlaceOrder: (sourceId?: string, method?: SquareMethod) => Promise<void>;
  onBack: () => void;
  processing: boolean;
  orderError?: string | null;
}

const METHODS: {
  key: SquareMethod;
  label: string;
  sub: string;
  icon: React.ElementType;
  badge?: string;
}[] = [
  {
    key: "CARD",
    label: "Credit / Debit Card",
    sub: "Visa, Mastercard, Amex, Discover",
    icon: CardIcon,
  },
  {
    key: "GOOGLE_PAY",
    label: "Google Pay",
    sub: "Pay with your Google account",
    icon: Wallet,
    badge: "Fast",
  },
  {
    key: "APPLE_PAY",
    label: "Apple Pay",
    sub: "Touch ID or Face ID",
    icon: Smartphone,
    badge: "Fast",
  },
  {
    key: "BANK_ACCOUNT",
    label: "Bank Transfer",
    sub: "ACH direct debit · 1–3 business days",
    icon: Landmark,
  },
];

export default function PaymentSection({
  onPlaceOrder,
  onBack,
  processing,
  orderError,
}: Props) {
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null);
  const [squareLoading, setSquareLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<SquareMethod>("CARD");

  const paymentsRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const googlePayRef = useRef<any>(null);
  const applePayRef = useRef<any>(null);

  // ── Step 1: Load Square config ────────────────────────────────────────────
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log("⚙️ [PaymentSection] Fetching Square config...");
        const config = await GetSquareConfigApi();
        console.log("⚙️ [PaymentSection] Square config loaded:", {
          applicationId: config?.applicationId,
          locationId: config?.locationId,
          isSandbox: config?.applicationId?.startsWith("sandbox"),
        });
        setSquareConfig(config);
      } catch (err) {
        console.error("❌ [PaymentSection] Failed to load Square config:", err);
        setPaymentError("Unable to load payment configuration. Please try again.");
        setSquareLoading(false);
      }
    };
    loadConfig();
  }, []);

  // ── Step 2: Inject Square SDK ─────────────────────────────────────────────
  useEffect(() => {
    if (!squareConfig) return;

    if (document.getElementById("square-sdk")) {
      console.log("⚙️ [PaymentSection] Square SDK already injected");
      setSdkReady(true);
      setSquareLoading(false);
      return;
    }

    const isSandbox = squareConfig.applicationId.startsWith("sandbox");
    const sdkUrl = isSandbox
      ? "https://sandbox.web.squarecdn.com/v1/square.js"
      : "https://web.squarecdn.com/v1/square.js";

    console.log(`⚙️ [PaymentSection] Loading Square SDK (${isSandbox ? "SANDBOX" : "PRODUCTION"}):`, sdkUrl);

    const script = document.createElement("script");
    script.id = "square-sdk";
    script.src = sdkUrl;

    script.onload = () => {
      console.log("✅ [PaymentSection] Square SDK loaded successfully");
      setSdkReady(true);
      setSquareLoading(false);
    };
    script.onerror = () => {
      console.error("❌ [PaymentSection] Square SDK failed to load");
      setPaymentError("Failed to load payment SDK. Please refresh and try again.");
      setSquareLoading(false);
    };

    document.body.appendChild(script);
  }, [squareConfig]);

  // ── Step 3: Initialize Square payments instance ───────────────────────────
  useEffect(() => {
    if (!sdkReady || !squareConfig) return;

    try {
      console.log("⚙️ [PaymentSection] Initialising Square.payments()...");
      paymentsRef.current = (window as any).Square.payments(
        squareConfig.applicationId,
        squareConfig.locationId
      );
      console.log("✅ [PaymentSection] Square.payments() initialised");
    } catch (err) {
      console.error("❌ [PaymentSection] Square.payments() init failed:", err);
      setPaymentError("Payment system initialisation failed. Please try again.");
    }
  }, [sdkReady, squareConfig]);

  // ── Step 4: Mount widgets on method change ────────────────────────────────
  useEffect(() => {
    if (!paymentsRef.current) return;

    const cleanup = async () => {
      if (cardRef.current) {
        try { await cardRef.current.destroy(); } catch (_) {}
        cardRef.current = null;
      }
      if (googlePayRef.current) {
        try { await googlePayRef.current.destroy(); } catch (_) {}
        googlePayRef.current = null;
      }
      if (applePayRef.current) {
        try { await applePayRef.current.destroy(); } catch (_) {}
        applePayRef.current = null;
      }
    };

    const mount = async () => {
      await cleanup();
      setPaymentError(null);

      console.log(`🔧 [PaymentSection] Mounting widget for method: ${selectedMethod}`);

      try {
        if (selectedMethod === "CARD") {
          const card = await paymentsRef.current.card();
          await card.attach("#sq-card-container");
          cardRef.current = card;
          console.log("✅ [PaymentSection] Card widget mounted");

        } else if (selectedMethod === "GOOGLE_PAY") {
          const paymentRequest = paymentsRef.current.paymentRequest({
            countryCode: "US",
            currencyCode: "USD",
            total: { amount: "1.00", label: "Total" },
          });
          try {
            const googlePay = await paymentsRef.current.googlePay(paymentRequest);
            await googlePay.attach("#sq-google-pay-button");
            googlePayRef.current = googlePay;
            console.log("✅ [PaymentSection] Google Pay widget mounted");
          } catch (err) {
            console.warn("⚠️ [PaymentSection] Google Pay unavailable:", err);
            setPaymentError("Google Pay is not available on this device / browser.");
          }

        } else if (selectedMethod === "APPLE_PAY") {
          const paymentRequest = paymentsRef.current.paymentRequest({
            countryCode: "US",
            currencyCode: "USD",
            total: { amount: "1.00", label: "Total" },
          });
          try {
            const applePay = await paymentsRef.current.applePay(paymentRequest);
            await applePay.attach("#sq-apple-pay-button");
            applePayRef.current = applePay;
            console.log("✅ [PaymentSection] Apple Pay widget mounted");
          } catch (err) {
            console.warn("⚠️ [PaymentSection] Apple Pay unavailable:", err);
            setPaymentError("Apple Pay is not available on this device / browser.");
          }
        }
      } catch (err: any) {
        console.error("❌ [PaymentSection] Widget mount failed:", err);
        setPaymentError(err?.message ?? "Failed to initialise payment form.");
      }
    };

    mount();
    return () => { cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMethod, sdkReady]);

  // ── Tokenize & pay ────────────────────────────────────────────────────────
  const tokenizeAndPay = async (
    widgetRef: React.MutableRefObject<any>,
    method: SquareMethod
  ) => {
    if (!widgetRef.current) {
      console.error("❌ [PaymentSection] Widget ref is null — form not ready");
      setPaymentError("Payment form is not ready. Please wait a moment.");
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentError(null);

      console.log(`💳 [PaymentSection] Calling tokenize() for method: ${method}`);
      const result = await widgetRef.current.tokenize();
      console.log("💳 [PaymentSection] tokenize() result:", result);
      // result.status should be "OK"
      // result.token should be a string like "cnon:CBASExxxxxxx"
      // result.errors will have detail if status !== "OK"

      if (result.status !== "OK") {
        const msgs = result.errors?.map((e: any) => e.message).join(", ");
        console.error("❌ [PaymentSection] Tokenization failed:", result.errors);
        throw new Error(msgs || "Tokenisation failed. Please check your details.");
      }

      console.log("✅ [PaymentSection] Token received:", result.token);
      // Passing token as source_id up to CheckoutLayout → CreatePaymentApi
      await onPlaceOrder(result.token, method);
    } catch (err: any) {
      console.error("❌ [PaymentSection] tokenizeAndPay failed:", err);
      setPaymentError(err?.message ?? "Payment failed. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCardPay = () => tokenizeAndPay(cardRef, "CARD");
  const handleGooglePay = () => tokenizeAndPay(googlePayRef, "GOOGLE_PAY");
  const handleApplePay = () => tokenizeAndPay(applePayRef, "APPLE_PAY");

  const isLoading = processing || paymentLoading;
  const displayError = paymentError || orderError;
  const activeMethod = METHODS.find((m) => m.key === selectedMethod)!;

  return (
    <div className="payment-section">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .payment-section {
          font-family: 'DM Sans', sans-serif;
          max-width: 480px;
          margin: 0 auto;
        }

        .ps-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e8eaf0;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
          overflow: hidden;
        }

        .ps-header {
          padding: 22px 28px 20px;
          border-bottom: 1px solid #f0f2f7;
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
        }

        .ps-header-icon {
          height: 42px;
          width: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(26,26,46,0.25);
        }

        .ps-header-title {
          font-size: 16px;
          font-weight: 600;
          color: #0d0d1a;
          margin: 0 0 2px;
          letter-spacing: -0.2px;
        }

        .ps-header-sub {
          font-size: 12px;
          color: #8b90a0;
          margin: 0;
        }

        .ps-body {
          padding: 24px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ps-method-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a0a5b5;
          margin-bottom: 10px;
        }

        .ps-method-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .ps-method-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1.5px solid #e8eaf0;
          background: #fafbff;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
          outline: none;
        }

        .ps-method-btn:hover:not(.active) {
          border-color: #c8cadb;
          background: #f3f4fb;
        }

        .ps-method-btn.active {
          border-color: #1a1a2e;
          background: #1a1a2e;
          box-shadow: 0 4px 16px rgba(26,26,46,0.2);
        }

        .ps-method-icon-wrap {
          height: 32px;
          width: 32px;
          border-radius: 10px;
          background: rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ps-method-btn:not(.active) .ps-method-icon-wrap {
          background: #eef0f8;
        }

        .ps-method-name {
          font-size: 13px;
          font-weight: 600;
          color: #0d0d1a;
          line-height: 1.2;
        }

        .ps-method-btn.active .ps-method-name {
          color: #ffffff;
        }

        .ps-method-badge {
          position: absolute;
          top: -1px;
          right: -1px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 2px 7px;
          border-radius: 0 12px 0 8px;
          background: #22c55e;
          color: #fff;
        }

        .ps-form-wrap {
          border-radius: 16px;
          border: 1px solid #e8eaf0;
          overflow: hidden;
          background: #fafbff;
        }

        .ps-form-header {
          padding: 12px 18px;
          border-bottom: 1px solid #eef0f8;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ps-form-header-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a0a5b5;
          margin: 0;
        }

        .ps-form-body { padding: 18px; }

        #sq-card-container { min-height: 89px; }

        #sq-google-pay-button,
        #sq-apple-pay-button {
          min-height: 48px;
          cursor: pointer;
        }

        .ps-pay-btn {
          width: 100%;
          margin-top: 16px;
          padding: 15px;
          border-radius: 12px;
          border: none;
          background: #1a1a2e;
          color: #ffffff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: opacity 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .ps-pay-btn:hover:not(:disabled) { opacity: 0.88; }
        .ps-pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .ps-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 40px 20px;
          color: #8b90a0;
        }

        .ps-loading-spinner { animation: spin 1s linear infinite; color: #1a1a2e; opacity: 0.5; }

        @keyframes spin { to { transform: rotate(360deg); } }

        .ps-loading-text { font-size: 13px; color: #a0a5b5; }

        .ps-error {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px 16px;
          border-radius: 14px;
          background: #fff5f5;
          border: 1px solid #fecdcd;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ps-error-icon { color: #e53e3e; flex-shrink: 0; margin-top: 1px; }
        .ps-error-text { font-size: 13px; color: #c53030; line-height: 1.5; }

        .ps-bank-info { padding: 20px; text-align: center; }

        .ps-bank-icon-wrap {
          height: 56px;
          width: 56px;
          border-radius: 18px;
          background: #f0f2f8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
        }

        .ps-bank-title { font-size: 14px; font-weight: 600; color: #0d0d1a; margin: 0 0 6px; }
        .ps-bank-desc { font-size: 12px; color: #8b90a0; line-height: 1.6; margin: 0; }

        .ps-back-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 13px;
          border-radius: 14px;
          border: 1.5px solid #e8eaf0;
          background: transparent;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #6b7080;
          transition: all 0.16s ease;
        }

        .ps-back-btn:hover:not(:disabled) {
          background: #f3f4fb;
          border-color: #c8cadb;
          color: #1a1a2e;
        }

        .ps-back-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .ps-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding-top: 4px;
        }

        .ps-footer-text { font-size: 11px; color: #b0b5c5; font-family: 'DM Mono', monospace; }
        .ps-footer-dot { color: #d0d3e0; font-size: 11px; }
      `}</style>

      <div className="ps-card">
        <div className="ps-header">
          <div className="ps-header-icon">
            <Lock size={18} color="#ffffff" />
          </div>
          <div>
            <p className="ps-header-title">Secure Payment</p>
            <p className="ps-header-sub">256-bit TLS encryption · Powered by Square</p>
          </div>
        </div>

        <div className="ps-body">
          {/* Method selector */}
          <div>
            <p className="ps-method-label">Payment Method</p>
            <div className="ps-method-grid">
              {METHODS.map(({ key, label, icon: Icon, badge }) => (
                <button
                  key={key}
                  className={`ps-method-btn${selectedMethod === key ? " active" : ""}`}
                  onClick={() => setSelectedMethod(key)}
                  disabled={isLoading}
                  type="button"
                >
                  {badge && <span className="ps-method-badge">{badge}</span>}
                  <div className="ps-method-icon-wrap">
                    <Icon size={15} color={selectedMethod === key ? "#ffffff" : "#5a5f75"} />
                  </div>
                  <span className="ps-method-name">{label}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#a0a5b5", marginTop: 8 }}>
              {activeMethod.sub}
            </p>
          </div>

          {/* Square form area */}
          <div className="ps-form-wrap">
            <div className="ps-form-header">
              <activeMethod.icon size={13} color="#a0a5b5" />
              <p className="ps-form-header-label">
                {selectedMethod === "CARD"
                  ? "Card Details"
                  : selectedMethod === "GOOGLE_PAY"
                  ? "Google Pay"
                  : selectedMethod === "APPLE_PAY"
                  ? "Apple Pay"
                  : "Bank Transfer"}
              </p>
            </div>

            {squareLoading ? (
              <div className="ps-loading">
                <Loader2 size={22} className="ps-loading-spinner" />
                <span className="ps-loading-text">Loading payment form…</span>
              </div>
            ) : !squareConfig ? (
              <div className="ps-loading">
                <AlertCircle size={20} color="#e53e3e" />
                <span className="ps-loading-text">Payment form unavailable</span>
              </div>
            ) : (
              <div className="ps-form-body">
                {/*
                  Always keep Square containers in the DOM.
                  Square's .attach() needs a real DOM node — hide inactive ones via CSS.
                */}
                <div
                  id="sq-card-container"
                  style={{ display: selectedMethod === "CARD" ? "block" : "none" }}
                />
                <div
                  id="sq-google-pay-button"
                  style={{ display: selectedMethod === "GOOGLE_PAY" ? "block" : "none" }}
                  onClick={selectedMethod === "GOOGLE_PAY" ? handleGooglePay : undefined}
                />
                <div
                  id="sq-apple-pay-button"
                  style={{ display: selectedMethod === "APPLE_PAY" ? "block" : "none" }}
                  onClick={selectedMethod === "APPLE_PAY" ? handleApplePay : undefined}
                />

                {selectedMethod === "BANK_ACCOUNT" && (
                  <div className="ps-bank-info">
                    <div className="ps-bank-icon-wrap">
                      <Landmark size={24} color="#5a5f75" />
                    </div>
                    <p className="ps-bank-title">ACH Bank Transfer</p>
                    <p className="ps-bank-desc">
                      You'll be prompted to securely link your bank account.
                      <br />
                      Funds typically arrive in 1–3 business days.
                    </p>
                  </div>
                )}

                {selectedMethod === "CARD" && (
                  <button
                    className="ps-pay-btn"
                    onClick={handleCardPay}
                    disabled={isLoading}
                    type="button"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                        Processing…
                      </>
                    ) : (
                      "Pay Now"
                    )}
                  </button>
                )}

                {selectedMethod === "BANK_ACCOUNT" && (
                  <button
                    className="ps-pay-btn"
                    onClick={() => onPlaceOrder(undefined, "BANK_ACCOUNT")}
                    disabled={isLoading}
                    type="button"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                        Processing…
                      </>
                    ) : (
                      "Continue to Bank Transfer"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {displayError && (
            <div className="ps-error">
              <AlertCircle size={16} className="ps-error-icon" />
              <p className="ps-error-text">{displayError}</p>
            </div>
          )}

          {/* Back */}
          <button
            onClick={onBack}
            disabled={isLoading}
            className="ps-back-btn"
            type="button"
          >
            <ChevronLeft size={15} />
            Back to shipping
          </button>

          {/* Footer */}
          <div className="ps-footer">
            <ShieldCheck size={12} color="#22c55e" />
            <span className="ps-footer-text">Square PCI-DSS</span>
            <span className="ps-footer-dot">·</span>
            <span className="ps-footer-text">256-bit SSL</span>
            <span className="ps-footer-dot">·</span>
            <span className="ps-footer-text">End-to-end encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}