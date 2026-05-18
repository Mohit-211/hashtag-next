import client from "../client";
import { PAYMENT_ENDPOINTS } from "../endpoints";

// ─────────────────────────────────────────────────────────────
// Square Config
// ─────────────────────────────────────────────────────────────

export interface SquareConfig {
  applicationId: string;
  locationId: string;
}

export const GetSquareConfigApi = async (): Promise<SquareConfig> => {
  console.log("⚙️ [payment.api] GetSquareConfigApi called");

  const res = await client.get(
    PAYMENT_ENDPOINTS.SQUARE_CONFIG
  );

  console.log(
    "⚙️ [payment.api] Square config response:",
    res?.data
  );

  return res?.data?.data;
};

// ─────────────────────────────────────────────────────────────
// Create Payment
// IMPORTANT:
// Backend expects OLD FIELD NAMES:
//   sourceId
//   payment_mode
// ─────────────────────────────────────────────────────────────

export interface CreatePaymentPayload {
  order_id: number;

  // REQUIRED BY BACKEND
  sourceId?: string;

  // CARD | GOOGLE_PAY | APPLE_PAY | BANK_ACCOUNT
  payment_mode?: string;

  // Optional
  amount?: number;
}

export const CreatePaymentApi = async (
  payload: CreatePaymentPayload
) => {
  console.log(
    "💳 [payment.api] CreatePaymentApi called with:",
    payload
  );

  // Debug check
  if (
    payload.payment_mode !== "BANK_ACCOUNT" &&
    !payload.sourceId
  ) {
    console.error(
      "❌ sourceId missing for Square payment"
    );
  }

  const response = await client.post(
    PAYMENT_ENDPOINTS.CREATE_PAYMENT,
    payload
  );

  console.log(
    "💳 [payment.api] CreatePaymentApi response:",
    response?.data
  );

  return response;
};