import crypto from "crypto";
import {
  CreatePaymentParams,
  PaymentInitResult,
  PaymentProvider,
  PaymentRefundResult,
  PaymentVerificationResult,
  RefundPaymentParams,
  VerifyPaymentParams,
  WebhookResult,
} from "./payment-provider.interface";

export class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay";
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentInitResult> {
    if (!this.keyId || !this.keySecret) {
      // If keys are missing, return a simulated test payload
      const mockOrderId = `order_rzp_${Date.now()}`;
      return {
        provider: this.name,
        providerOrderId: mockOrderId,
        amount: params.amount,
        currency: params.currency,
        clientPayload: {
          key: "rzp_test_placeholder",
          amount: Math.round(params.amount * 100),
          currency: params.currency,
          name: "Aura Luxury",
          description: `Order #${params.order.order_number}`,
          order_id: mockOrderId,
          prefill: {
            name: params.customer.name,
            email: params.customer.email,
            contact: params.customer.phone || "",
          },
          theme: {
            color: "#0f172a",
          },
        },
      };
    }

    try {
      const basicAuth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: Math.round(params.amount * 100), // Razorpay expects amount in smallest currency subunit (e.g. cents/paise)
          currency: params.currency.toUpperCase(),
          receipt: params.order.order_number,
          notes: {
            order_id: params.order.id,
            order_number: params.order.order_number,
            customer_email: params.customer.email,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Razorpay order creation failed: ${JSON.stringify(errorData)}`);
      }

      const rzpOrder = await response.json();

      return {
        provider: this.name,
        providerOrderId: rzpOrder.id,
        amount: params.amount,
        currency: params.currency,
        clientPayload: {
          key: this.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "Aura Luxury",
          description: `Order #${params.order.order_number}`,
          order_id: rzpOrder.id,
          prefill: {
            name: params.customer.name,
            email: params.customer.email,
            contact: params.customer.phone || "",
          },
          theme: {
            color: "#0f172a",
          },
        },
      };
    } catch (error: any) {
      console.error("[RazorpayProvider] createPayment error:", error);
      throw error;
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    const { providerOrderId, paymentId, signature } = params;

    // Sandbox / Test fallback if keys not configured
    if (!this.keySecret) {
      return {
        isSuccessful: true,
        transactionId: paymentId || `pay_rzp_mock_${Date.now()}`,
        providerOrderId,
        status: "captured",
        rawResponse: { mode: "mock_test_mode" },
      };
    }

    if (!providerOrderId || !paymentId || !signature) {
      return {
        isSuccessful: false,
        transactionId: paymentId || "",
        status: "failed",
        error: "Missing required signature verification parameters",
      };
    }

    try {
      const generatedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(`${providerOrderId}|${paymentId}`)
        .digest("hex");

      const isMatch = generatedSignature === signature;

      if (!isMatch) {
        return {
          isSuccessful: false,
          transactionId: paymentId,
          providerOrderId,
          status: "failed",
          error: "Razorpay signature verification failed. Possible tampering detected.",
        };
      }

      return {
        isSuccessful: true,
        transactionId: paymentId,
        providerOrderId,
        status: "captured",
        rawResponse: { verified: true, signature },
      };
    } catch (err: any) {
      return {
        isSuccessful: false,
        transactionId: paymentId,
        providerOrderId,
        status: "failed",
        error: err.message,
      };
    }
  }

  async refundPayment(params: RefundPaymentParams): Promise<PaymentRefundResult> {
    if (!this.keyId || !this.keySecret) {
      return {
        isSuccessful: true,
        refundId: `rfnd_${Date.now()}`,
        amount: params.amount,
        status: "processed",
      };
    }

    try {
      const basicAuth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const response = await fetch(`https://api.razorpay.com/v1/payments/${params.paymentId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: Math.round(params.amount * 100),
          notes: {
            reason: params.reason || "Customer refund request",
          },
        }),
      });

      const refundData = await response.json();
      if (!response.ok) {
        throw new Error(`Razorpay refund failed: ${JSON.stringify(refundData)}`);
      }

      return {
        isSuccessful: true,
        refundId: refundData.id,
        amount: refundData.amount / 100,
        status: refundData.status,
      };
    } catch (err: any) {
      console.error("[RazorpayProvider] refund error:", err);
      throw err;
    }
  }

  async handleWebhook(rawBody: string, signature: string): Promise<WebhookResult> {
    if (this.webhookSecret) {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        throw new Error("Razorpay Webhook signature verification failed");
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    let status: any = "pending";
    if (event === "payment.captured") status = "captured";
    if (event === "payment.failed") status = "failed";
    if (event === "refund.processed") status = "refunded";

    return {
      isHandled: true,
      eventType: event,
      orderId: orderEntity?.notes?.order_id || paymentEntity?.notes?.order_id,
      paymentId: paymentEntity?.id,
      status,
      rawPayload: payload,
    };
  }
}
