import { MockPaymentProvider } from "./mock.provider";
import { PaymentProvider } from "./payment-provider.interface";
import { RazorpayProvider } from "./razorpay.provider";

export class PaymentFactory {
  private static providers: Map<string, PaymentProvider> = new Map();

  public static getProvider(name?: string): PaymentProvider {
    const requestedName =
      (name || process.env.DEFAULT_PAYMENT_PROVIDER || "razorpay").toLowerCase();

    if (!this.providers.has(requestedName)) {
      switch (requestedName) {
        case "razorpay":
          this.providers.set("razorpay", new RazorpayProvider());
          break;
        case "mock":
        case "manual":
        default:
          this.providers.set("mock", new MockPaymentProvider());
          break;
      }
    }

    return this.providers.get(requestedName) || new MockPaymentProvider();
  }
}
