import { isDemoMode } from "@/lib/config/store.config";
import { MockPaymentProvider } from "./mock.provider";
import { PaymentProvider } from "./payment-provider.interface";
import { RazorpayProvider } from "./razorpay.provider";

const SUPPORTED_PROVIDERS = ["razorpay", "mock", "manual"] as const;

export class PaymentFactory {
  private static providers: Map<string, PaymentProvider> = new Map();

  /**
   * Resolve a payment provider by name.
   *
   * The name may originate from a checkout request body, so the mock provider
   * — which approves every payment — is only selectable when the deployment
   * has explicitly opted into demo mode (AGENTS.md sections 5 and 6).
   */
  public static getProvider(name?: string): PaymentProvider {
    const configuredDefault = (process.env.DEFAULT_PAYMENT_PROVIDER || "razorpay").toLowerCase();
    let requested = (name || configuredDefault).toLowerCase();

    if (!SUPPORTED_PROVIDERS.includes(requested as (typeof SUPPORTED_PROVIDERS)[number])) {
      throw new Error(`Unsupported payment provider: ${requested}`);
    }

    const wantsMock = requested === "mock" || requested === "manual";
    if (wantsMock && !isDemoMode() && configuredDefault !== "mock" && configuredDefault !== "manual") {
      throw new Error(
        "The simulated payment gateway is disabled. Set APP_MODE=demo to enable it for previews."
      );
    }

    // Normalise the cache key so unknown/aliased names cannot bypass the cache.
    const key = wantsMock ? "mock" : requested;

    if (!this.providers.has(key)) {
      switch (key) {
        case "razorpay":
          this.providers.set(key, new RazorpayProvider());
          break;
        default:
          this.providers.set("mock", new MockPaymentProvider());
          break;
      }
    }

    return this.providers.get(key)!;
  }

  /** Test helper: drop cached provider instances. */
  public static reset(): void {
    this.providers.clear();
  }
}
