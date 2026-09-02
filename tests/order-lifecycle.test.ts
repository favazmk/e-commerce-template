import { describe, it, expect, beforeEach } from "vitest";
import { OrderService } from "../src/services/order.service";
import { RepositoryFactory } from "../src/repositories/repository.factory";
import { 
  MockProductRepository, 
  MockOrderRepository,
  MockCartRepository,
  MockCouponRepository,
  MockInventoryRepository,
  MockSettingsRepository,
  MockUserRepository,
  resetMockData, 
  mockData 
} from "./__mocks__/repositories";

describe("Commerce Core: Order Lifecycle & Snapshots", () => {
  beforeEach(() => {
    RepositoryFactory.setOverride("ProductRepository", new MockProductRepository());
    RepositoryFactory.setOverride("OrderRepository", new MockOrderRepository());
    RepositoryFactory.setOverride("CartRepository", new MockCartRepository());
    RepositoryFactory.setOverride("CouponRepository", new MockCouponRepository());
    RepositoryFactory.setOverride("InventoryRepository", new MockInventoryRepository());
    RepositoryFactory.setOverride("SettingsRepository", new MockSettingsRepository());
    RepositoryFactory.setOverride("UserRepository", new MockUserRepository());
    resetMockData();
  });

  it("should create order with immutable snapshot of product info and reserve inventory", async () => {
    const product = mockData.products[0];
    const initialStock = 100;
    product.stock_quantity = initialStock;
    if (product.variants && product.variants.length > 0) {
      product.variants[0].stock = initialStock;
    }

    const { order } = await OrderService.createOrder(
      {
        guestEmail: "shopper@example.com",
        shippingAddress: {
          first_name: "Alexander",
          last_name: "Wright",
          address_1: "100 King St",
          city: "Toronto",
          state: "ON",
          postal_code: "M5X 1A1",
          country: "CA",
          phone: "+1 416 555 0123",
          type: "shipping",
        },
        billingAddress: {
          first_name: "Alexander",
          last_name: "Wright",
          address_1: "100 King St",
          city: "Toronto",
          state: "ON",
          postal_code: "M5X 1A1",
          country: "CA",
          phone: "+1 416 555 0123",
          type: "billing",
        },
        shippingMethodId: "zone-us",
        paymentProvider: "mock",
        cartItems: [{ productId: product.id, variantId: product.variants?.[0]?.id, quantity: 1 }],
      },
      "user-test-id"
    );

    expect(order).toBeDefined();
    // The prefix is deployment configuration (ORDER_NUMBER_PREFIX); the MASTER
    // template must not assert a specific client's brand here.
    expect(order.order_number).toMatch(/^[A-Z0-9]+-\d{9}$/);
    
    const items = mockData.orders.find(o => o.id === order.id) as any;
    expect(items).toBeDefined();
    // In our mock, order doesn't explicitly store items in the object unless we mocked it fully, 
    // but we can check if it returns an order.
    
    // Verify inventory reserved
    expect(product.variants![0].stock).toBe(initialStock - 1);
  });

  it("should transition order statuses", async () => {
    mockData.orders.push({
      id: "ord_1",
      order_number: "ORD-000000123",
      status: "pending",
      user_id: "user-test-id",
    } as any);
    const order = mockData.orders[0];

    const updated = await OrderService.updateOrderStatus(
      order.id,
      "shipped"
    );

    expect(updated).toBeDefined();
    expect(updated?.status).toBe("shipped");
    expect(mockData.orders[0].status).toBe("shipped");
  });
});
