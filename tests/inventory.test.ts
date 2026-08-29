import { describe, it, expect, beforeEach } from "vitest";
import { InventoryService } from "../src/services/inventory.service";
import { RepositoryFactory } from "../src/repositories/repository.factory";
import { MockProductRepository, MockInventoryRepository, resetMockData, mockData } from "./__mocks__/repositories";

describe("Commerce Core: Inventory Service & Stock Transactions", () => {
  beforeEach(() => {
    RepositoryFactory.setOverride("ProductRepository", new MockProductRepository());
    RepositoryFactory.setOverride("InventoryRepository", new MockInventoryRepository());
    resetMockData();
  });

  it("should atomically decrease variant stock and record ledger transaction", async () => {
    const product = mockData.products[0];
    const variant = product.variants![0];
    const initialStock = variant.stock || 0;

    const res = await InventoryService.decrementStock(
      product.id,
      variant.id,
      2,
      "TEST_ORD_001",
      "Unit Test Sale"
    );

    expect(res.success).toBe(true);
    expect(variant.stock).toBe(initialStock - 2);
  });

  it("should prevent stock decrement when requested quantity exceeds inventory", async () => {
    const product = mockData.products[0];
    const variant = product.variants![0];

    const res = await InventoryService.decrementStock(
      product.id,
      variant.id,
      9999, // Impossible quantity
      "TEST_ORD_FAIL"
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain("Insufficient stock");
  });

  it("should restore inventory upon order cancellation", async () => {
    const product = mockData.products[0];
    const variant = product.variants![0];
    const stockBefore = variant.stock || 0;

    // Decrease first
    await InventoryService.decrementStock(product.id, variant.id, 3, "TEST_ORD_CANCEL");
    expect(variant.stock).toBe(stockBefore - 3);

    // Restore
    await InventoryService.restoreStock(
      product.id,
      variant.id,
      3,
      "TEST_ORD_CANCEL",
      "cancellation"
    );
    expect(variant.stock).toBe(stockBefore);
  });
});
