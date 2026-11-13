import client from "../client";
import { PAYMENT_ENDPOINTS } from "../endpoints";

/** Every API response wraps its payload as { success, status, message, data }. */
interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

/**
 * An order's payment_status: SUCCESS is paid, PENDING is not paid yet (or a
 * payment is in progress), REJECTED means the last attempt failed.
 */
export type PaymentStatus = "SUCCESS" | "PENDING" | "REJECTED";

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

  /** The token from Square's card, Google Pay or Cash App widget. */
  sourceId: string;

  // CARD | GOOGLE_PAY | CASH_APP. Square charges the order's total_amount.
  payment_mode?: string;
}

export interface CreatePaymentResponseData {
  order_id: number;
  order_number: string;
  payment_id: string | number;
  /** SUCCESS: paid. PENDING: Square is still processing, poll payment-status. REJECTED: failed. */
  payment_status: PaymentStatus;
  payment_mode: string;
  total: number;
}

// Checkout shows the error itself: Square's reason for a decline, or why the
// order can't be paid (already paid, payment in progress, cancelled).
export const CreatePaymentApi = (payload: CreatePaymentPayload) =>
  client.post<ApiResponse<CreatePaymentResponseData>>(
    PAYMENT_ENDPOINTS.CREATE_PAYMENT,
    payload,
    { skipErrorToast: true }
  );

// ─────────────────────────────────────────────────────────────
// Square Payment Status
// ─────────────────────────────────────────────────────────────

export interface SquarePaymentStatusPayload {
  order_id: number;
}

export interface SquarePaymentStatusResponseData {
  order_id: number;
  order_number: string;
  payment_status: PaymentStatus;
  order_status: string;
  payment_method: string | null;
  payment: Record<string, unknown> | null;
}

// Checkout polls this and keeps going when one check fails, so no toast.
export const GetSquarePaymentStatusApi = (payload: SquarePaymentStatusPayload) =>
  client.post<ApiResponse<SquarePaymentStatusResponseData>>(
    PAYMENT_ENDPOINTS.PAYMENT_STATUS,
    payload,
    { skipErrorToast: true }
  );

// ─────────────────────────────────────────────────────────────
// PayPal
// ─────────────────────────────────────────────────────────────

export interface CreatePaypalOrderPayload {
  order_id: number;
}

export interface CreatePaypalOrderResponseData {
  order_id: number;
  paypal_order_id: string;
  approval_url: string | null;
  status: string;
}

export const CreatePaypalOrderApi = (payload: CreatePaypalOrderPayload) =>
  client.post<ApiResponse<CreatePaypalOrderResponseData>>(
    PAYMENT_ENDPOINTS.PAYPAL_CREATE_ORDER,
    payload
  );

export interface CapturePaypalOrderPayload {
  order_id: number;
  paypal_order_id: string;
}

export interface CapturePaypalOrderResponseData {
  order_id: number;
  order_number: string;
  paypal_order_id: string;
  /** SUCCESS: paid. PENDING: PayPal is still processing, poll GET order/:id. */
  payment_status: Exclude<PaymentStatus, "REJECTED">;
}

// The return page shows the error itself.
export const CapturePaypalOrderApi = (payload: CapturePaypalOrderPayload) =>
  client.post<ApiResponse<CapturePaypalOrderResponseData>>(
    PAYMENT_ENDPOINTS.PAYPAL_CAPTURE_ORDER,
    payload,
    { skipErrorToast: true }
  );

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