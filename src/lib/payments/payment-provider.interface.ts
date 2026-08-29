import { Order, PaymentStatus } from "@/types/database";

export interface CreatePaymentParams {
  order: Order;
  amount: number;
  currency: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentInitResult {
  provider: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  clientPayload: Record<string, any>; // Sent to frontend for checkout modal
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  providerOrderId?: string;
  signature?: string;
  payload?: Record<string, any>;
}

export interface PaymentVerificationResult {
  isSuccessful: boolean;
  transactionId: string;
  providerOrderId?: string;
  status: PaymentStatus;
  rawResponse?: any;
  error?: string;
}

export interface RefundPaymentParams {
  paymentId: string;
  amount: number;
  reason?: string;
}

export interface PaymentRefundResult {
  isSuccessful: boolean;
  refundId: string;
  amount: number;
  status: string;
}

export interface WebhookResult {
  isHandled: boolean;
  eventType: string;
  orderId?: string;
  paymentId?: string;
  status?: PaymentStatus;
  rawPayload: any;
}

export interface PaymentProvider {
  readonly name: string;

  /**
   * Create an authorized payment/order on the payment provider server
   */
  createPayment(params: CreatePaymentParams): Promise<PaymentInitResult>;

  /**
   * Verify the payment response/signature server-side securely
   */
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;

  /**
   * Issue a refund for a previously captured payment
   */
  refundPayment(params: RefundPaymentParams): Promise<PaymentRefundResult>;

  /**
   * Verify and process an incoming webhook payload
   */
  handleWebhook(rawBody: string, signature: string): Promise<WebhookResult>;
}
