// Minimal typings for the parts of Square's Web Payments SDK (square.js,
// loaded at runtime by PaymentSection) that checkout uses.

export interface SquareTokenResult {
  status: string;
  token?: string;
  errors?: { message: string }[];
}

export interface SquarePaymentMethod {
  attach(selector: string): Promise<void>;
  tokenize(): Promise<SquareTokenResult>;
  destroy(): Promise<void>;
}

export interface SquareCashAppPay extends Omit<SquarePaymentMethod, "tokenize"> {
  addEventListener(
    type: "ontokenization",
    listener: (event: CustomEvent<{ tokenResult?: SquareTokenResult }>) => void
  ): void;
}

export type SquarePaymentRequest = object;

export interface SquarePayments {
  card(): Promise<SquarePaymentMethod>;
  googlePay(request: SquarePaymentRequest): Promise<SquarePaymentMethod>;
  cashAppPay(
    request: SquarePaymentRequest,
    options: { redirectURL: string; referenceId: string }
  ): Promise<SquareCashAppPay>;
  paymentRequest(options: {
    countryCode: string;
    currencyCode: string;
    total: { amount: string; label: string };
  }): SquarePaymentRequest;
}

declare global {
  interface Window {
    Square?: { payments(applicationId: string, locationId: string): SquarePayments };
  }
}
