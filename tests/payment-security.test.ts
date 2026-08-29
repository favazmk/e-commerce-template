import crypto from "crypto";
import { describe, it, expect, beforeEach } from "vitest";
import { RazorpayProvider } from "../src/lib/payments/razorpay.provider";
import { CartService } from "../src/services/cart.service";
import { RepositoryFactory } from "../src/repositories/repository.factory";
import { MockProductRepository, MockCartRepository, MockCouponRepository, MockSettingsRepository, resetMockData, mockData } from "./__mocks__/repositories";

describe("Payment & Commerce Security: Anti-Tampering & Signature Verification", () => {
  beforeEach(() => {
    RepositoryFactory.setOverride("ProductRepository", new MockProductRepository());
    RepositoryFactory.setOverride("CartRepository", new MockCartRepository());
    RepositoryFactory.setOverride("CouponRepository", new MockCouponRepository());
    RepositoryFactory.setOverride("SettingsRepository", new MockSettingsRepository());
    resetMockData();
  });

  it("SECURITY: Server recalculates prices and ignores manipulated client prices", async () => {
    const product = mockData.products[0]; // Real Price: $495.00
    product.stock_quantity = 100; // ensure stock

    // Malicious frontend attempts to send manipulated price of $1.00
    const maliciousPayload = [
      {
        productId: product.id,
        variantId: product.variants?.[0]?.id,
        quantity: 1,
        // Even if client injects manipulated price or fake total, CartService only reads from DB
        unitPrice: 1.0,
        totalPrice: 1.0,
      } as any,
    ];

    const result = await CartService.calculateCart(maliciousPayload);

    expect(result.items[0].unitPrice).toBe(495.0);
    expect(result.subtotal).toBe(495.0);
    expect(result.subtotal).not.toBe(1.0);
  });

  it("SECURITY: Verifies valid Razorpay HMAC-SHA256 signatures", async () => {
    const secret = "test_razorpay_secret_key_123";
    process.env.RAZORPAY_KEY_SECRET = secret;

    const provider = new RazorpayProvider();
    const orderId = "order_rzp_test_101";
    const paymentId = "pay_rzp_test_101";

    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const result = await provider.verifyPayment({
      orderId: "ord-internal-1",
      providerOrderId: orderId,
      paymentId,
      signature: validSignature,
    });

    expect(result.isSuccessful).toBe(true);
    expect(result.status).toBe("captured");
  });

  it("SECURITY: Rejects forged/spoofed Razorpay signatures", async () => {
    const secret = "test_razorpay_secret_key_123";
    process.env.RAZORPAY_KEY_SECRET = secret;

    const provider = new RazorpayProvider();
    const forgedSignature = "forged_malicious_signature_string";

    const result = await provider.verifyPayment({
      orderId: "ord-internal-1",
      providerOrderId: "order_rzp_test_101",
      paymentId: "pay_rzp_test_101",
      signature: forgedSignature,
    });

    expect(result.isSuccessful).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.error).toContain("signature verification failed");
  });
});
