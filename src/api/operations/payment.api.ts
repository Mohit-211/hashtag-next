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

// ─────────────────────────────────────────────────────────────
// Payment History
// API:
// {{BASE_URL}}payment/history?page=1&limit=10
// ─────────────────────────────────────────────────────────────

export interface PaymentHistoryParams {
  page?: number;
  limit?: number;
}

export const GetPaymentHistoryApi = async (
  params: PaymentHistoryParams = {}
) => {
  const {
    page = 1,
    limit = 10,
  } = params;

  console.log(
    "📜 [payment.api] GetPaymentHistoryApi called",
    { page, limit }
  );

  const response = await client.get(
    `${PAYMENT_ENDPOINTS.PAYMENT_HISTORY}?page=${page}&limit=${limit}`
  );

  console.log(
    "📜 [payment.api] Payment history response:",
    response?.data
  );

  return response?.data;
};