import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { RepositoryFactory } from "../../src/repositories/repository.factory";
import { ChangeLogService } from "../../src/services/changelog.service";
import { ProductService } from "../../src/services/product.service";
import { CouponService } from "../../src/services/coupon.service";
import { SettingsService } from "../../src/services/settings.service";
import { InventoryService } from "../../src/services/inventory.service";
import { createAdminClient } from "../../src/lib/supabase/server";

/**
 * The undo history is only worth having if a restore genuinely puts the record
 * back. These tests make each kind of change, undo it, and read the record back
 * from the database to confirm the earlier state actually returned.
 */
describe("Integration: Change history and undo", () => {
  const productRepo = RepositoryFactory.getProductRepository();
  const stamp = Date.now();

  const createdProductIds: string[] = [];
  const createdCouponIds: string[] = [];
  let originalShipping: Record<string, any> | null = null;
  // Settings entries are labelled "Shipping", with no stamp to match on.
  const settingsEntryIds: string[] = [];

  beforeAll(async () => {
    RepositoryFactory.clearOverrides();
    // Settings are shared store-wide, so the real value is captured and put
    // back in teardown rather than left as whatever the test wrote.
    originalShipping = await SettingsService.getSettingCategory("shipping");
  });

  afterAll(async () => {
    for (const id of createdProductIds) await productRepo.delete(id).catch(() => {});
    for (const id of createdCouponIds) await CouponService.deleteCoupon(id).catch(() => {});
    if (originalShipping) {
      await SettingsService.replaceStoreSettings("shipping", originalShipping).catch(() => {});
    }

    // The change log is what the admin reads on the History screen. Entries
    // this suite wrote are fixtures, not real history, so they are removed —
    // otherwise every test run pollutes the merchant's undo list with rows
    // pointing at products that no longer exist.
    try {
      const client = createAdminClient();
      await client.from("admin_change_log").delete().like("entity_label", `%${stamp}%`);
      await client
        .from("admin_change_log")
        .delete()
        .in("id", settingsEntryIds.length > 0 ? settingsEntryIds : ["00000000-0000-0000-0000-000000000000"]);
    } catch {
      // Teardown must not fail the suite; a leftover row is visible in History.
    }
  });

  it("undoes a product edit, restoring price, images and sizes", async () => {
    const created = await productRepo.create({
      name: `undo-product-${stamp}`,
      slug: `undo-product-${stamp}`,
      sku: `UNDOP-${stamp}`,
      price: 500,
      stock_quantity: 12,
      status: "draft",
      short_description: "",
      description: "",
      images: [
        { url: `https://example.test/${stamp}-1.jpg`, alt_text: "one", display_order: 0, is_primary: true },
        { url: `https://example.test/${stamp}-2.jpg`, alt_text: "two", display_order: 1, is_primary: false },
      ],
      variants: [
        { sku: `UNDOP-${stamp}-S`, price: 500, stock: 12, is_active: true, attributes: { Size: "Small" } },
      ],
    } as any);
    createdProductIds.push(created.id);

    const before = await ProductService.getProductById(created.id);

    // A destructive edit: price changed, one image and the only size removed.
    const after = await ProductService.updateProduct(created.id, {
      name: `undo-product-${stamp}-BROKEN`,
      price: 9,
      images: [{ url: `https://example.test/${stamp}-1.jpg`, alt_text: "one", display_order: 0, is_primary: true }],
      variants: [],
    } as any);

    expect(Number(after!.price)).toBe(9);
    expect(after!.images).toHaveLength(1);
    expect(after!.variants).toHaveLength(0);

    await ChangeLogService.record({
      entityType: "product",
      entityId: created.id,
      entityLabel: created.name,
      action: "update",
      summary: `Edited the product "${created.name}"`,
      before: before as unknown as Record<string, any>,
      after: after as unknown as Record<string, any>,
    });

    const [entry] = await ChangeLogService.list(5);
    const result = await ChangeLogService.revert(entry.id);
    expect(result.success).toBe(true);

    const restored = await ProductService.getProductById(created.id);
    expect(restored!.name).toBe(`undo-product-${stamp}`);
    expect(Number(restored!.price)).toBe(500);
    expect(restored!.images).toHaveLength(2);
    expect(restored!.variants).toHaveLength(1);
    expect(restored!.variants![0].stock).toBe(12);
  });

  it("refuses to undo the same change twice", async () => {
    const entries = await ChangeLogService.list(20);
    const alreadyUndone = entries.find((e) => e.reverted_at);
    expect(alreadyUndone).toBeDefined();

    await expect(ChangeLogService.revert(alreadyUndone!.id)).rejects.toThrow(/already been undone/i);
  });

  it("records the undo itself, so the history stays complete", async () => {
    const entries = await ChangeLogService.list(20);
    const revertEntry = entries.find((e) => e.is_revert);

    expect(revertEntry).toBeDefined();
    expect(revertEntry!.summary).toMatch(/^Undid: /);
  });

  it("undoes a coupon deletion by recreating it", async () => {
    const coupon = await CouponService.createCoupon({
      code: `UNDOC${stamp}`,
      discount_type: "percentage",
      discount_value: 25,
      min_order_value: 150,
    } as any);

    await CouponService.deleteCoupon(coupon.id);
    expect((await CouponService.listCoupons()).find((c) => c.id === coupon.id)).toBeUndefined();

    await ChangeLogService.record({
      entityType: "coupon",
      entityId: coupon.id,
      entityLabel: coupon.code,
      action: "delete",
      summary: `Deleted the coupon ${coupon.code}`,
      before: coupon as unknown as Record<string, any>,
      after: null,
    });

    const [entry] = await ChangeLogService.list(1);
    await ChangeLogService.revert(entry.id);

    const restored = (await CouponService.listCoupons()).find((c) => c.code === `UNDOC${stamp}`);
    expect(restored).toBeDefined();
    expect(Number(restored!.discount_value)).toBe(25);
    expect(Number(restored!.min_order_value)).toBe(150);
    createdCouponIds.push(restored!.id);
  });

  it("undoes a settings change, removing keys the newer version added", async () => {
    const before = await SettingsService.getSettingCategory("shipping");

    await SettingsService.replaceStoreSettings("shipping", {
      ...before,
      free_shipping_threshold: 99999,
      a_key_only_the_new_version_has: true,
    });

    const after = await SettingsService.getSettingCategory("shipping");
    expect(after.free_shipping_threshold).toBe(99999);

    await ChangeLogService.record({
      entityType: "settings",
      entityId: "shipping",
      entityLabel: "Shipping",
      action: "update",
      summary: "Updated shipping rates and thresholds",
      before,
      after,
    });

    const [entry] = await ChangeLogService.list(1);
    settingsEntryIds.push(entry.id);
    await ChangeLogService.revert(entry.id);

    // The revert entry is written after the undo, so collect it too.
    const [revertEntry] = await ChangeLogService.list(1);
    settingsEntryIds.push(revertEntry.id);

    const restored = await SettingsService.getSettingCategory("shipping");
    expect(restored.free_shipping_threshold).toBe(before.free_shipping_threshold);
    // A merge-style restore would leave this behind; a replace removes it.
    expect(restored.a_key_only_the_new_version_has).toBeUndefined();
  });

  it("undoes a stock adjustment by writing a correcting adjustment", async () => {
    const productId = createdProductIds[0];
    const product = await ProductService.getProductById(productId);
    const variant = product!.variants![0];
    const originalStock = variant.stock;

    await InventoryService.adjustStock(productId, variant.id, 999, "fat-fingered restock");

    await ChangeLogService.record({
      entityType: "inventory",
      entityId: variant.id,
      entityLabel: `${product!.name} (Size: Small)`,
      action: "update",
      summary: `Set stock to 999 (was ${originalStock})`,
      before: { productId, variantId: variant.id, quantity: originalStock },
      after: { productId, variantId: variant.id, quantity: 999 },
    });

    const [entry] = await ChangeLogService.list(1);
    await ChangeLogService.revert(entry.id);

    const restored = await ProductService.getProductById(productId);
    expect(restored!.variants![0].stock).toBe(originalStock);

    // The ledger keeps both the mistake and its correction — it is never edited.
    const history = await InventoryService.getTransactionHistory(productId);
    expect(history.some((t) => t.note?.includes("fat-fingered restock"))).toBe(true);
    expect(history.some((t) => t.note?.startsWith("Undo of:"))).toBe(true);
  });
});
