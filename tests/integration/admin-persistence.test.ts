import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { RepositoryFactory } from "../../src/repositories/repository.factory";
import { InventoryService } from "../../src/services/inventory.service";
import { CouponService } from "../../src/services/coupon.service";

/**
 * Exercises the admin write paths against the real database.
 *
 * These cover the defects that made the admin panel look functional while
 * saving nothing: product images and sizes being dropped on write, and stock
 * adjustments returning success without changing a row.
 *
 * Everything created here is registered and deleted in afterAll — this suite
 * shares its database with the live storefront, so a leaked fixture becomes a
 * product a customer can see.
 */
describe("Integration: Admin persistence", () => {
  const productRepo = RepositoryFactory.getProductRepository();

  const stamp = Date.now();
  const createdProductIds: string[] = [];
  const createdCouponIds: string[] = [];

  beforeAll(() => {
    RepositoryFactory.clearOverrides();
  });

  afterAll(async () => {
    for (const id of createdProductIds) {
      await productRepo.delete(id).catch(() => {});
    }
    for (const id of createdCouponIds) {
      await CouponService.deleteCoupon(id).catch(() => {});
    }
  });

  it("saves product images and sizes on create, and reads them back", async () => {
    const created = await productRepo.create({
      name: `admin-persist-${stamp}`,
      slug: `admin-persist-${stamp}`,
      sku: `ADMPERSIST-${stamp}`,
      price: 249,
      stock_quantity: 30,
      status: "draft",
      short_description: "",
      description: "",
      images: [
        { url: `https://example.test/${stamp}-main.jpg`, alt_text: "main", display_order: 0, is_primary: true },
        { url: `https://example.test/${stamp}-alt.jpg`, alt_text: "alt", display_order: 1, is_primary: false },
      ],
      variants: [
        { sku: `ADMPERSIST-${stamp}-S`, price: 249, stock: 10, is_active: true, attributes: { Size: "Small" } },
        { sku: `ADMPERSIST-${stamp}-M`, price: 249, stock: 20, is_active: true, attributes: { Size: "Medium" } },
      ],
    } as any);

    createdProductIds.push(created.id);

    expect(created.images).toHaveLength(2);
    expect(created.images?.filter((i) => i.is_primary)).toHaveLength(1);
    expect(created.variants).toHaveLength(2);
    expect(created.variants?.map((v) => v.stock).sort((a, b) => a - b)).toEqual([10, 20]);
  });

  it("updates a product without discarding its images and sizes", async () => {
    const productId = createdProductIds[0];

    const updated = await productRepo.update(productId, {
      name: `admin-persist-${stamp}-renamed`,
      price: 275,
      images: [
        { url: `https://example.test/${stamp}-main.jpg`, alt_text: "main", display_order: 0, is_primary: true },
      ],
      variants: [
        { sku: `ADMPERSIST-${stamp}-S`, price: 275, stock: 7, is_active: true, attributes: { Size: "Small" } },
        { sku: `ADMPERSIST-${stamp}-M`, price: 275, stock: 20, is_active: true, attributes: { Size: "Medium" } },
        { sku: `ADMPERSIST-${stamp}-L`, price: 275, stock: 4, is_active: true, attributes: { Size: "Large" } },
      ],
    } as any);

    // The old repository forwarded nested keys to a flat update and returned
    // null, which the route surfaced as a misleading 404.
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe(`admin-persist-${stamp}-renamed`);
    expect(Number(updated!.price)).toBe(275);
    expect(updated!.images).toHaveLength(1);
    expect(updated!.variants).toHaveLength(3);
  });

  it("adjusts stock for a single size and records the movement", async () => {
    const productId = createdProductIds[0];
    const product = await productRepo.findById(productId);
    const small = product!.variants!.find((v) => v.attributes.Size === "Small")!;

    const before = small.stock;
    const adjusted = await InventoryService.adjustStock(productId, small.id, 33, "integration restock");
    expect(adjusted).toBe(true);

    const after = await productRepo.findById(productId);
    const smallAfter = after!.variants!.find((v) => v.id === small.id)!;
    expect(smallAfter.stock).toBe(33);

    // The product total is derived from its sizes rather than edited separately.
    const expectedTotal = after!.variants!.reduce((sum, v) => sum + v.stock, 0);
    expect(after!.stock_quantity).toBe(expectedTotal);

    const history = await InventoryService.getTransactionHistory(productId);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].quantity_change).toBe(33 - before);
    expect(history[0].transaction_type).toBe("adjustment");
  });

  it("rejects a negative stock adjustment instead of silently succeeding", async () => {
    const productId = createdProductIds[0];
    await expect(InventoryService.adjustStock(productId, null, -5, "invalid")).rejects.toThrow();
  });

  it("creates, deactivates and deletes a coupon", async () => {
    const coupon = await CouponService.createCoupon({
      code: `ADMPERSIST${stamp}`,
      discount_type: "percentage",
      discount_value: 15,
      min_order_value: 100,
    } as any);

    createdCouponIds.push(coupon.id);
    expect(coupon.is_active).toBe(true);

    const paused = await CouponService.updateCoupon(coupon.id, { is_active: false });
    expect(paused!.is_active).toBe(false);

    expect(await CouponService.deleteCoupon(coupon.id)).toBe(true);
    createdCouponIds.pop();

    const all = await CouponService.listCoupons();
    expect(all.find((c) => c.id === coupon.id)).toBeUndefined();
  });

  it("refuses an out-of-range percentage discount", async () => {
    await expect(
      CouponService.createCoupon({
        code: `ADMBAD${stamp}`,
        discount_type: "percentage",
        discount_value: 150,
      } as any)
    ).rejects.toThrow(/exceed 100/);
  });
});
