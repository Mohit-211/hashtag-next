"use client";

import { useEffect, useRef, useState } from "react";
import {
  CreditCard as CardIcon,
  Loader2,
  ShieldCheck,
  Lock,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import {
  GetSquareConfigApi,
  SquareConfig,
} from "@/api/operations/payment.api";
import { useCart } from "@/contexts/CartContext";

import { errorMessage } from "@/lib/errors";
import { forgetCashAppOrder, rememberCashAppOrder } from "./cashAppPending";
import type { SquareCashAppPay, SquarePaymentMethod, SquarePayments } from "./square.types";

const SQUARE_SDK_SANDBOX = "https://sandbox.web.squarecdn.com/v1/square.js";
const SQUARE_SDK_PRODUCTION = "https://web.squarecdn.com/v1/square.js";

/** Injects square.js once; resolves when it has loaded (immediately if it already has). */
const loadSquareSdk = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("square-sdk") as HTMLScriptElement | null;
    if (existing) {
      if (window.Square) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Square SDK failed to load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "square-sdk";
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Square SDK failed to load"));
    document.body.appendChild(script);
  });
export type SquareMethod =
  | "CARD"
  | "GOOGLE_PAY"
  | "PAYPAL"
  | "CASH_APP";

interface Props {
  onPlaceOrder: (sourceId?: string, method?: SquareMethod) => Promise<void>;
  onPayPalPay: () => Promise<void>;
  onBack: () => void;
  processing: boolean;
  orderError?: string | null;
  /** The order being paid. Cash App uses its number as the payment's reference. */
  orderId: number | null;
  orderNumber: string | null;
  /** The order's total_amount: what Square charges, and what Google Pay and Cash App show. */
  orderTotal: number | null;
  /** The method to open on, e.g. Cash App when the shopper comes back from the Cash App app. */
  initialMethod?: SquareMethod;
}

const GoogleLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.86z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const PayPalLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <text x="6.5" y="18.5" fontFamily="inherit" fontWeight={700} fontSize="18" fill="#009CDE">P</text>
    <text x="10.5" y="18.5" fontFamily="inherit" fontWeight={700} fontSize="18" fill="#003087">P</text>
  </svg>
);

const CashAppLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <text x="12" y="17.5" textAnchor="middle" fontFamily="inherit" fontWeight={800} fontSize="16" fill="#ffffff">$</text>
  </svg>
);

const METHODS: {
  key: SquareMethod;
  label: string;
  sub: string;
  render: (active: boolean) => React.ReactNode;
  iconBg: string;
  badge?: string;
}[] = [
  {
    key: "CARD",
    label: "Credit / Debit",
    sub: "Visa, Mastercard, Amex, Discover",
    render: (active) => <CardIcon size={16} className={active ? "text-primary" : "text-background"} strokeWidth={2.25} />,
    iconBg: "var(--color-foreground)",
  },
  {
    key: "PAYPAL",
    label: "PayPal",
    sub: "Pay securely with your PayPal account",
    render: () => <PayPalLogo size={17} />,
    iconBg: "var(--color-card)",
  },
  {
    key: "CASH_APP",
    label: "Cash App",
    sub: "Pay instantly with your Cash App balance",
    render: () => <CashAppLogo size={16} />,
    iconBg: "#00D632",
  },
  {
    key: "GOOGLE_PAY",
    label: "Google Pay",
    sub: "Pay with your Google account",
    render: () => <GoogleLogo size={16} />,
    iconBg: "var(--color-card)",
    badge: "Fast",
  },
];

export default function PaymentSection({
  onPlaceOrder,
  onPayPalPay,
  onBack,
  processing,
  orderError,
  orderId,
  orderNumber,
  orderTotal,
  initialMethod,
}: Props) {
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null);
  const [squareLoading, setSquareLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<SquareMethod>(initialMethod ?? "CARD");
  // Square wants the amount as text with 2 decimals.
  const walletAmount =
    orderTotal != null && Number.isFinite(orderTotal) && orderTotal > 0 ? orderTotal.toFixed(2) : null;

  const paymentsRef  = useRef<SquarePayments | null>(null);
  const cardRef      = useRef<SquarePaymentMethod | null>(null);
  const googlePayRef = useRef<SquarePaymentMethod | null>(null);
  const cashAppRef   = useRef<SquareCashAppPay | null>(null);

  useEffect(() => {
    // Set on cleanup: a reply that arrives after that is ignored.
    let cancelled = false;
    const loadConfig = async () => {
      try {
        const config = await GetSquareConfigApi();
        if (!cancelled) setSquareConfig(config);
      } catch {
        if (!cancelled) {
          setPaymentError("Unable to load payment configuration. Please try again.");
          setSquareLoading(false);
        }
      }
    };
    loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load Square's SDK, then create the payments instance the widgets mount from.
  useEffect(() => {
    if (!squareConfig) return;
    let cancelled = false;
    const isSandbox = squareConfig.applicationId.startsWith("sandbox");
    (async () => {
      try {
        await loadSquareSdk(isSandbox ? SQUARE_SDK_SANDBOX : SQUARE_SDK_PRODUCTION);
      } catch {
        if (!cancelled) {
          setPaymentError("Failed to load payment SDK. Please refresh.");
          setSquareLoading(false);
        }
        return;
      }
      if (cancelled) return;
      try {
        if (!window.Square) throw new Error("Square SDK missing");
        paymentsRef.current = window.Square.payments(squareConfig.applicationId, squareConfig.locationId);
        setSdkReady(true);
      } catch {
        setPaymentError("Payment system initialisation failed. Please try again.");
      } finally {
        setSquareLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [squareConfig]);

  // Google Pay and Cash App show the order's total, and Square can't change a
  // Cash App payment request once it's built, so the widgets are made again
  // whenever the order or its total changes.
  useEffect(() => {
    const payments = paymentsRef.current;
    if (!payments) return;
    // Set when this run is replaced: a widget that finishes loading after that is thrown away.
    let stale = false;
    const cleanup = async () => {
      for (const ref of [cardRef, googlePayRef, cashAppRef]) {
        if (ref.current) { try { await ref.current.destroy(); } catch {} ref.current = null; }
      }
    };
    const attach = async <W extends { attach(selector: string): Promise<void>; destroy(): Promise<void> }>(
      widget: W,
      selector: string,
      ref: React.RefObject<W | null>
    ) => {
      if (!stale) await widget.attach(selector);
      if (stale) { try { await widget.destroy(); } catch {} return false; }
      ref.current = widget;
      return true;
    };
    const showSetupError = (err: unknown, fallback: string) => {
      console.error(err);
      if (!stale) setPaymentError(errorMessage(err, fallback));
    };
    const walletRequest = () => {
      if (!walletAmount) throw new Error("We couldn't load your order total. Please go back to shipping and try again.");
      return payments.paymentRequest({ countryCode: "US", currencyCode: "USD", total: { amount: walletAmount, label: "Total" } });
    };
    const mount = async () => {
      await cleanup();
      if (stale) return;
      setPaymentError(null);
      if (selectedMethod === "CARD") {
        try { await attach(await payments.card(), "#sq-card-container", cardRef); }
        catch (err) { showSetupError(err, "Failed to initialise payment form."); }
      } else if (selectedMethod === "GOOGLE_PAY") {
        try { await attach(await payments.googlePay(walletRequest()), "#sq-google-pay-button", googlePayRef); }
        catch (err) { showSetupError(err, "Google Pay couldn't load. Please choose another payment method."); }
      } else if (selectedMethod === "CASH_APP") {
        try {
          if (!orderId || !orderNumber) throw new Error("We couldn't find your order. Please go back to shipping and try again.");
          const cashApp = await payments.cashAppPay(walletRequest(), {
            redirectURL: window.location.href,
            // The same on the way back from the Cash App app.
            referenceId: orderNumber,
          });
          cashApp.addEventListener("ontokenization", async (event) => {
            const { tokenResult } = event?.detail || {};
            if (tokenResult?.status === "OK" && tokenResult?.token) {
              // Destroy the widget (it manages its own overlay/modal DOM)
              // while the container is still mounted, before onPlaceOrder
              // advances the checkout step and React unmounts this
              // component out from under it — otherwise Square's own
              // async cleanup can try to remove a node React already
              // tore down.
              try { await cashApp.destroy(); } catch {}
              cashAppRef.current = null;
              onPlaceOrder(tokenResult.token, "CASH_APP");
            } else {
              setPaymentError(
                tokenResult?.errors?.map((e) => e.message).join(", ") ||
                  "Cash App payment failed."
              );
            }
          });
          // On a phone the shopper leaves for the Cash App app and comes back
          // to this page: note the order so checkout reopens it.
          if (await attach(cashApp, "#sq-cash-app-button", cashAppRef)) rememberCashAppOrder(orderId, orderNumber);
        } catch (err) { showSetupError(err, "Cash App Pay couldn't load. Please choose another payment method."); }
      }
    };
    mount();
    return () => {
      stale = true;
      // The Cash App button went away inside the page (another method, another
      // step), so no approval is coming back. The trip to the Cash App app
      // unloads the page instead, which doesn't run this.
      forgetCashAppOrder();
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMethod, sdkReady, walletAmount, orderId, orderNumber]);

  const tokenizeAndPay = async (widgetRef: React.RefObject<SquarePaymentMethod | null>, method: SquareMethod) => {
    if (!widgetRef.current) { setPaymentError("Payment form is not ready. Please wait a moment."); return; }
    try {
      setPaymentLoading(true); setPaymentError(null);
      const result = await widgetRef.current.tokenize();
      if (result.status !== "OK" || !result.token) throw new Error(result.errors?.map((e) => e.message).join(", ") || "Tokenisation failed.");
      // Let the widget clean up its own DOM (e.g. Google Pay's button/sheet)
      // while the container is still mounted, before onPlaceOrder advances
      // the checkout step and unmounts this component.
      if (method !== "CARD") { try { await widgetRef.current.destroy(); } catch {} widgetRef.current = null; }
      await onPlaceOrder(result.token, method);
    } catch (err) {
      setPaymentError(errorMessage(err, "Payment failed. Please try again."));
    } finally { setPaymentLoading(false); }
  };

  const { refreshCart } = useCart();
  const handleCardPay   = async () => { try { await tokenizeAndPay(cardRef, "CARD"); await refreshCart(); } catch (err) { console.error(err); } };
  const handleGooglePay = () => tokenizeAndPay(googlePayRef, "GOOGLE_PAY");

  const handlePayPalClick = async () => {
    try {
      setPaymentError(null);
      await onPayPalPay();
    } catch (err) {
      setPaymentError(errorMessage(err, "Unable to start PayPal checkout. Please try again."));
    }
  };

  const isLoading    = processing || paymentLoading;
  const displayError = paymentError || orderError;
  const activeMethod = METHODS.find((m) => m.key === selectedMethod)!;

  return (
    <div className="ps-root">
      <style>{`
        .ps-root {
          font-family: inherit;
          max-width: 480px;
          margin: 0 auto;
        }

        /* ── SHELL ── */
        .ps-shell {
          background: var(--color-card);
          border-radius: 24px;
          border: 1.5px solid var(--color-border);
          overflow: hidden;
          box-shadow: 0 2px 16px color-mix(in srgb, var(--color-foreground) 6%, transparent), 0 1px 4px color-mix(in srgb, var(--color-foreground) 4%, transparent);
        }

        /* ── HEADER ── */
        .ps-header {
          position: relative;
          padding: 20px 24px 18px;
          background: var(--color-foreground);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          gap: 14px;
          overflow: hidden;
        }
        .ps-header-glow {
          position: absolute;
          top: -24px; right: -24px;
          width: 110px; height: 110px;
          background: var(--color-primary);
          opacity: 0.12;
          border-radius: 50%;
          pointer-events: none;
        }
        .ps-header-icon {
          width: 42px; height: 42px;
          border-radius: 13px;
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ps-header-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--color-background);
          margin: 0 0 2px;
          letter-spacing: -0.02em;
        }
        .ps-header-sub {
          font-size: 11.5px;
          color: color-mix(in srgb, var(--color-background) 70%, transparent);
          margin: 0;
        }

        /* yellow accent bar */
        .ps-accent-bar {
          height: 3px;
          background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary) 40%, var(--color-border) 100%);
        }

        /* ── BODY ── */
        .ps-body {
          padding: 22px 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: var(--color-card);
        }

        /* ── LABELS ── */
        .ps-section-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: var(--color-muted-foreground);
          margin-bottom: 10px;
        }

        /* ── METHOD GRID ── */
        .ps-method-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .ps-method-btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 8px 12px;
          border-radius: 14px;
          border: 1.5px solid var(--color-border);
          background: var(--color-muted);
          cursor: pointer;
          transition: all 0.16s ease;
          text-align: center;
          outline: none;
        }
        .ps-method-btn:hover:not(.active):not(:disabled) {
          border-color: var(--color-input);
          background: var(--color-muted);
          transform: translateY(-1px);
        }
        .ps-method-btn.active {
          border-color: var(--color-foreground);
          background: var(--color-foreground);
          box-shadow: 0 4px 14px color-mix(in srgb, var(--color-foreground) 15%, transparent);
        }
        .ps-method-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .ps-method-icon-wrap {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: var(--color-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid color-mix(in srgb, var(--color-foreground) 6%, transparent);
        }

        .ps-method-name {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--color-muted-foreground);
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .ps-method-btn.active .ps-method-name { color: var(--color-primary); }

        .ps-method-badge {
          position: absolute;
          top: -1px; right: -1px;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 2px 7px;
          border-radius: 0 12px 0 8px;
          background: var(--color-primary);
          color: var(--color-foreground);
        }

        .ps-method-sub {
          font-size: 11px;
          color: var(--color-muted-foreground);
          margin-top: 4px;
          text-align: center;
        }

        /* ── FORM WRAP ── */
        .ps-form-wrap {
          border-radius: 16px;
          border: 1.5px solid var(--color-border);
          background: var(--color-muted);
          overflow: hidden;
        }
        .ps-form-header {
          padding: 11px 16px;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--color-muted);
        }
        .ps-form-header-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-muted-foreground);
          margin: 0;
        }
        .ps-form-header-icon {
          width: 20px; height: 20px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ps-form-header-icon svg { width: 12px; height: 12px; }
        .ps-form-body { padding: 16px; background: var(--color-card); }

        #sq-card-container { min-height: 89px; }
        #sq-google-pay-button, #sq-apple-pay-button, #sq-cash-app-button { min-height: 48px; cursor: pointer; }

        /* ── PAY BUTTON ── */
        .ps-pay-btn {
          width: 100%;
          margin-top: 14px;
          padding: 15px;
          border-radius: 13px;
          border: none;
          background: var(--color-foreground);
          color: var(--color-primary);
          font-family: inherit;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .ps-pay-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(110deg, transparent 35%, color-mix(in srgb, var(--color-background) 8%, transparent) 50%, transparent 65%);
          opacity: 0;
          transition: opacity 0.4s;
        }
        .ps-pay-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--color-foreground) 88%, var(--color-card)); }
        .ps-pay-btn:hover:not(:disabled)::after { opacity: 1; }
        .ps-pay-btn:active:not(:disabled) { transform: scale(0.98); }
        .ps-pay-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── LOADING ── */
        .ps-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 36px 20px;
          background: var(--color-card);
        }
        .ps-loading-spinner { animation: spin 1s linear infinite; color: var(--color-foreground); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ps-loading-text { font-size: 12.5px; color: var(--color-muted-foreground); }

        /* ── ERROR ── */
        .ps-error {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 13px 15px;
          border-radius: 13px;
          background: var(--color-destructive-soft);
          border: 1px solid color-mix(in srgb, var(--color-destructive) 30%, transparent);
          animation: slideIn 0.2s ease;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ps-error-icon { color: var(--color-destructive); flex-shrink: 0; margin-top: 1px; }
        .ps-error-text { font-size: 12.5px; color: var(--color-destructive); line-height: 1.5; }

        /* ── PAYPAL TEXT ── */
        .ps-bank-title { font-size: 14px; font-weight: 800; color: var(--color-foreground); margin: 0 0 6px; }
        .ps-bank-desc  { font-size: 12px; color: var(--color-muted-foreground); line-height: 1.6; margin: 0; }

        /* ── PAYPAL INFO ── */
        .ps-paypal-info { padding: 20px 20px 22px; text-align: center; }
        .ps-paypal-icon-wrap {
          width: 52px; height: 52px;
          border-radius: 16px;
          background: var(--color-muted);
          border: 1.5px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
        }

        /* ── BACK BUTTON ── */
        .ps-back-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          border-radius: 13px;
          border: 1.5px solid var(--color-border);
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-muted-foreground);
          transition: all 0.16s ease;
        }
        .ps-back-btn:hover:not(:disabled) {
          background: var(--color-muted);
          border-color: var(--color-input);
          color: var(--color-foreground);
        }
        .ps-back-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── FOOTER ── */
        .ps-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding-top: 2px;
        }
        .ps-footer-text { font-size: 10.5px; color: var(--color-muted-foreground); }
        .ps-footer-dot  { color: var(--color-border); font-size: 11px; }
      `}</style>

      <div className="ps-shell">

        {/* ── HEADER ── */}
        <div className="ps-header">
          <div className="ps-header-glow" />
          <div className="ps-header-icon">
            <Lock size={18} className="text-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="ps-header-title">Secure Payment</h1>
            <p className="ps-header-sub">256-bit TLS encryption · Powered by Square</p>
          </div>
        </div>

        {/* yellow accent bar */}
        <div className="ps-accent-bar" />

        {/* ── BODY ── */}
        <div className="ps-body">

          {/* Method selector */}
          <div>
            <p className="ps-section-label">Payment Method</p>
            <div className="ps-method-grid">
              {METHODS.map(({ key, label, render, iconBg, badge }) => {
                const active = selectedMethod === key;
                return (
                  <button
                    key={key}
                    className={`ps-method-btn${active ? " active" : ""}`}
                    onClick={() => setSelectedMethod(key)}
                    disabled={isLoading}
                    type="button"
                  >
                    {badge && <span className="ps-method-badge">{badge}</span>}
                    <div
                      className="ps-method-icon-wrap"
                      style={{ background: active ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : iconBg }}
                    >
                      {render(active)}
                    </div>
                    <span className="ps-method-name">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="ps-method-sub">{activeMethod.sub}</p>
          </div>

          {/* Square form area */}
          <div className="ps-form-wrap">
            <div className="ps-form-header">
              <div className="ps-form-header-icon" style={{ background: activeMethod.iconBg }}>
                {activeMethod.render(false)}
              </div>
              <p className="ps-form-header-label">
                {selectedMethod === "CARD" ? "Card Details" : activeMethod.label}
              </p>
            </div>

            {selectedMethod === "PAYPAL" ? (
              <div className="ps-form-body">
                <div className="ps-paypal-info">
                  <div className="ps-paypal-icon-wrap">
                    <PayPalLogo size={22} />
                  </div>
                  <p className="ps-bank-title">Pay with PayPal</p>
                  <p className="ps-bank-desc">
                    You&apos;ll be redirected to PayPal to log in and approve this payment,
                    then brought back here automatically.
                  </p>
                </div>

                <button className="ps-pay-btn" onClick={handlePayPalClick} disabled={isLoading} type="button">
                  {isLoading
                    ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> Redirecting…</>
                    : "Continue with PayPal"}
                </button>
              </div>
            ) : squareLoading ? (
              <div className="ps-loading">
                <Loader2 size={22} className="ps-loading-spinner" />
                <span className="ps-loading-text">Loading payment form…</span>
              </div>
            ) : !squareConfig ? (
              <div className="ps-loading">
                <AlertCircle size={20} className="text-destructive" />
                <span className="ps-loading-text">Payment form unavailable</span>
              </div>
            ) : (
              <div className="ps-form-body">
                <div id="sq-card-container"      style={{ display: selectedMethod === "CARD"       ? "block" : "none" }} />
                <div id="sq-google-pay-button"   style={{ display: selectedMethod === "GOOGLE_PAY" ? "block" : "none" }} onClick={selectedMethod === "GOOGLE_PAY" ? handleGooglePay : undefined} />
                <div id="sq-cash-app-button"     style={{ display: selectedMethod === "CASH_APP"   ? "block" : "none" }} />

                {selectedMethod === "CARD" && (
                  <button className="ps-pay-btn" onClick={handleCardPay} disabled={isLoading} type="button">
                    {isLoading
                      ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> Processing…</>
                      : "Pay Now"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {displayError && (
            <div className="ps-error">
              <AlertCircle size={15} className="ps-error-icon" />
              <p className="ps-error-text">{displayError}</p>
            </div>
          )}

          {/* Back */}
          <button onClick={onBack} disabled={isLoading} className="ps-back-btn" type="button">
            <ChevronLeft size={14} />
            Back to shipping
          </button>

          {/* Footer */}
          <div className="ps-footer">
            <ShieldCheck size={12} className="text-primary-ink" strokeWidth={2.5} />
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