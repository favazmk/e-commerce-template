import {
  CreatePaymentParams,
  PaymentInitResult,
  PaymentProvider,
  PaymentRefundResult,
  PaymentVerificationResult,
  RefundPaymentParams,
  WebhookResult,
} from "./payment-provider.interface";

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(params: CreatePaymentParams): Promise<PaymentInitResult> {
    const mockId = `mock_ord_${Date.now()}`;
    return {
      provider: this.name,
      providerOrderId: mockId,
      amount: params.amount,
      currency: params.currency,
      clientPayload: {
        orderId: mockId,
        amount: params.amount,
        currency: params.currency,
        testMode: true,
        message: "Test Payment Gateway Active",
      },
    };
  }

  async verifyPayment(params: any): Promise<PaymentVerificationResult> {
    return {
      isSuccessful: true,
      transactionId: `mock_tx_${Date.now()}`,
      providerOrderId: params.providerOrderId || `mock_ord_${Date.now()}`,
      status: "captured",
      rawResponse: { mode: "sandbox_simulated" },
    };
  }

  async refundPayment(params: RefundPaymentParams): Promise<PaymentRefundResult> {
    return {
      isSuccessful: true,
      refundId: `mock_ref_${Date.now()}`,
      amount: params.amount,
      status: "refunded",
    };
  }

  async handleWebhook(rawBody: string, signature: string): Promise<WebhookResult> {
    return {
      isHandled: true,
      eventType: "mock.payment.captured",
      status: "captured",
      rawPayload: {},
    };
  }
}
