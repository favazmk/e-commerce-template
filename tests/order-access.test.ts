import { describe, it, expect, beforeEach } from "vitest";
import { OrderService } from "../src/services/order.service";
import { RepositoryFactory } from "../src/repositories/repository.factory";
import { MockOrderRepository, resetMockData, mockData } from "./__mocks__/repositories";

/**
 * `/checkout/success/[orderNumber]` renders a receipt containing the
 * customer's address, email and phone.
 *
 * Row Level Security cannot protect it on its own: a guest order has
 * `user_id = null`, so `auth.uid() = user_id` is never true and no policy can
 * identify the person who placed it. The order number is the capability for
 * guests, and ownership is enforced in the service layer for orders that do
 * belong to an account. These tests pin that boundary.
 */
describe("Order access control: who may read a receipt", () => {
  const OWNER = { id: "user-owner", role: "customer" };
  const STRANGER = { id: "user-stranger", role: "customer" };
  const ADMIN = { id: "user-admin", role: "admin" };

  beforeEach(() => {
    RepositoryFactory.setOverride("OrderRepository", new MockOrderRepository());
    resetMockData();

    mockData.orders.push({
      id: "ord-guest",
      order_number: "ORD-000000001",
      user_id: null,
      status: "paid",
      guest_email: "guest@example.com",
    } as any);

    mockData.orders.push({
      id: "ord-owned",
      order_number: "ORD-000000002",
      user_id: OWNER.id,
      status: "paid",
      guest_email: null,
    } as any);
  });

  it("lets a guest open their own receipt via the order number", async () => {
    const order = await OrderService.getOrderForViewer("ORD-000000001", null);
    expect(order).toBeTruthy();
    expect(order?.id).toBe("ord-guest");
  });

  it("lets the owner open their own receipt", async () => {
    const order = await OrderService.getOrderForViewer("ORD-000000002", OWNER);
    expect(order).toBeTruthy();
    expect(order?.id).toBe("ord-owned");
  });

  it("SECURITY: a signed-in stranger cannot read someone else's receipt", async () => {
    const order = await OrderService.getOrderForViewer("ORD-000000002", STRANGER);
    expect(order).toBeNull();
  });

  it("SECURITY: an anonymous visitor cannot read an account-owned receipt", async () => {
    // Knowing the order number must not be enough once an order has an owner.
    const order = await OrderService.getOrderForViewer("ORD-000000002", null);
    expect(order).toBeNull();
  });

  it("lets an admin open any receipt", async () => {
    const order = await OrderService.getOrderForViewer("ORD-000000002", ADMIN);
    expect(order).toBeTruthy();
  });

  it("returns null for an order number that does not exist", async () => {
    const order = await OrderService.getOrderForViewer("ORD-999999999", ADMIN);
    expect(order).toBeNull();
  });

  it("does not treat a customer role named like an admin as privileged", async () => {
    const impostor = { id: "user-x", role: "administrator" };
    const order = await OrderService.getOrderForViewer("ORD-000000002", impostor);
    expect(order).toBeNull();
  });
});
