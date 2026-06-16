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

  const res = await client.get(
    PAYMENT_ENDPOINTS.SQUARE_CONFIG
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


  const response = await client.get(
    `${PAYMENT_ENDPOINTS.PAYMENT_HISTORY}?page=${page}&limit=${limit}`
  );

 

  return response?.data;
};