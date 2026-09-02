import crypto from "crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { RazorpayProvider } from "../src/lib/payments/razorpay.provider";
import { PaymentFactory } from "../src/lib/payments/payment.factory";
import { OrderService } from "../src/services/order.service";
import { RepositoryFactory } from "../src/repositories/repository.factory";
import {
  MockProductRepository,
  MockCartRepository,
  MockCouponRepository,
  MockSettingsRepository,
  MockUserRepository,
  MockOrderRepository,
  MockInventoryRepository,
  resetMockData,
  mockData,
} from "./__mocks__/repositories";

/**
 * Regression coverage for the fail-open payment paths.
 *
 * Each of these previously approved money movement when configuration was
 * missing or when a signature was replayed against a different order.
 */
describe("Payment hardening: fail closed, never fail open", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    RepositoryFactory.setOverride("ProductRepository", new MockProductRepository());
    RepositoryFactory.setOverride("CartRepository", new MockCartRepository());
    RepositoryFactory.setOverride("CouponRepository", new MockCouponRepository());
    RepositoryFactory.setOverride("SettingsRepository", new MockSettingsRepository());
    RepositoryFactory.setOverride("UserRepository", new MockUserRepository());
    RepositoryFactory.setOverride("OrderRepository", new MockOrderRepository());
    RepositoryFactory.setOverride("InventoryRepository", new MockInventoryRepository());
    resetMockData();
    PaymentFactory.reset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    PaymentFactory.reset();
  });

  it("SECURITY: verification fails when the gateway secret is missing in production", async () => {
    delete process.env.RAZORPAY_KEY_SECRET;
    process.env.APP_MODE = "production";

    const provider = new RazorpayProvider();
    const result = await provider.verifyPayment({
      orderId: "ord-1",
      providerOrderId: "order_rzp_1",
      paymentId: "pay_rzp_1",
      signature: "anything-at-all",
    });

    expect(result.isSuccessful).toBe(false);
    expect(result.status).toBe("failed");
  });

  it("SECURITY: webhooks are rejected when no webhook secret is configured", async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    process.env.APP_MODE = "production";

    const provider = new RazorpayProvider();
    const forgedPayload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_forged", notes: { order_id: "ord-1" } } } },
    });

    await expect(provider.handleWebhook(forgedPayload, "no-signature")).rejects.toThrow(
      /WEBHOOK_SECRET/i
    );
  });

  it("SECURITY: webhooks with a wrong signature are rejected", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test_secret";
    const provider = new RazorpayProvider();
    const body = JSON.stringify({ event: "payment.captured", payload: {} });

    await expect(provider.handleWebhook(body, "deadbeef")).rejects.toThrow(
      /signature verification failed/i
    );
  });

  it("accepts a webhook carrying a correct signature", async () => {
    const secret = "whsec_test_secret";
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    const provider = new RazorpayProvider();

    const body = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_ok", notes: { order_id: "ord-1" } } } },
    });
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

    const result = await provider.handleWebhook(body, signature);
    expect(result.isHandled).toBe(true);
    expect(result.status).toBe("captured");
    expect(result.orderId).toBe("ord-1");
  });

  it("SECURITY: the simulated gateway is not selectable outside demo mode", () => {
    process.env.APP_MODE = "production";
    process.env.DEFAULT_PAYMENT_PROVIDER = "razorpay";

    // A checkout request body could ask for "mock"; the server must refuse.
    expect(() => PaymentFactory.getProvider("mock")).toThrow(/demo/i);
  });

  it("allows the simulated gateway when the deployment opts into demo mode", () => {
    process.env.APP_MODE = "demo";
    expect(PaymentFactory.getProvider("mock").name).toBe("mock");
  });

  it("SECURITY: rejects an unknown provider name instead of silently mocking it", () => {
    process.env.APP_MODE = "production";
    expect(() => PaymentFactory.getProvider("totally-made-up")).toThrow(/Unsupported/i);
  });

  it("SECURITY: a signature valid for one order cannot settle a different order", async () => {
    const victimOrder = {
      id: "ord-victim",
      order_number: "ORD-000000001",
      status: "pending",
      payment_status: "pending",
      user_id: "user-1",
      total_amount: 1500,
      payments: [
        {
          id: "pay-row-victim",
          order_id: "ord-victim",
          provider_order_id: "order_rzp_VICTIM",
          status: "pending",
        },
      ],
    } as any;
    mockData.orders.push(victimOrder);

    // The attacker holds a signature verified against their own cheap order.
    await expect(
      OrderService.confirmOrderPayment(
        "ord-victim",
        "pay_attacker",
        "razorpay",
        "sig",
        "order_rzp_ATTACKER"
      )
    ).rejects.toThrow(/does not belong to this order/i);

    expect(victimOrder.status).toBe("pending");
  });

  it("settles the order when the gateway order id matches the stored payment", async () => {
    const order = {
      id: "ord-ok",
      order_number: "ORD-000000002",
      status: "pending",
      payment_status: "pending",
      user_id: "user-1",
      total_amount: 500,
      payments: [
        {
          id: "pay-row-ok",
          order_id: "ord-ok",
          provider_order_id: "order_rzp_OK",
          status: "pending",
        },
      ],
    } as any;
    mockData.orders.push(order);

    const updated = await OrderService.confirmOrderPayment(
      "ord-ok",
      "pay_ok",
      "razorpay",
      "sig",
      "order_rzp_OK"
    );

    expect(updated).toBeTruthy();
    expect(order.status).toBe("paid");
  });
});

describe("Order numbers", () => {
  it("does not embed a client brand and is not sequential", async () => {
    process.env.APP_MODE = "demo"; // the simulated gateway is used below
    PaymentFactory.reset();
    RepositoryFactory.setOverride("ProductRepository", new MockProductRepository());
    RepositoryFactory.setOverride("SettingsRepository", new MockSettingsRepository());
    RepositoryFactory.setOverride("UserRepository", new MockUserRepository());
    RepositoryFactory.setOverride("OrderRepository", new MockOrderRepository());
    RepositoryFactory.setOverride("InventoryRepository", new MockInventoryRepository());
    RepositoryFactory.setOverride("CouponRepository", new MockCouponRepository());
    resetMockData();

    const product = mockData.products[0];
    product.stock_quantity = 100;

    const numbers = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const { order } = await OrderService.createOrder({
        guestEmail: "buyer@example.com",
        shippingAddress: {
          first_name: "A",
          last_name: "B",
          address_1: "1 Street",
          city: "Town",
          state: "ST",
          postal_code: "00000",
          country: "US",
          phone: "000",
          type: "shipping",
        },
        billingAddress: {
          first_name: "A",
          last_name: "B",
          address_1: "1 Street",
          city: "Town",
          state: "ST",
          postal_code: "00000",
          country: "US",
          phone: "000",
          type: "billing",
        },
        shippingMethodId: "zone-us",
        paymentProvider: "mock",
        cartItems: [{ productId: product.id, variantId: product.variants?.[0]?.id, quantity: 1 }],
      } as any);
      numbers.add(order.order_number);
    }

    expect(numbers.size).toBe(5);
    for (const n of numbers) {
      expect(n).not.toMatch(/AURA/i);
      expect(n).toMatch(/^[A-Z0-9]+-\d{9}$/);
    }
  });
});
