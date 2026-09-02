import { describe, it, expect, beforeAll, afterAll } from "vitest";
import ExcelJS from "exceljs";
import { RepositoryFactory } from "../../src/repositories/repository.factory";
import { ReviewService } from "../../src/services/review.service";
import { ProductImportService } from "../../src/services/product-import.service";
import { SettingsService } from "../../src/services/settings.service";
import { ProductService } from "../../src/services/product.service";
import { createAdminClient } from "../../src/lib/supabase/server";

/**
 * Reviews and the spreadsheet importer, exercised against the real database.
 *
 * Both features have a moderation-style gate — a review is not public until
 * approved, and an import writes nothing until confirmed — so the tests assert
 * on what is *visible* rather than only on what was accepted.
 */
describe("Integration: Reviews and bulk import", () => {
  const productRepo = RepositoryFactory.getProductRepository();
  const stamp = Date.now();

  const createdProductIds: string[] = [];
  const createdReviewIds: string[] = [];
  let originalFeatures: Record<string, any> = {};
  let productId = "";

  /** Build an in-memory .xlsx with the given rows, as the admin would upload. */
  async function buildSheet(
    headers: string[],
    rows: string[][]
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Products");
    sheet.addRow(headers);
    for (const row of rows) sheet.addRow(row);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  beforeAll(async () => {
    RepositoryFactory.clearOverrides();

    originalFeatures = await SettingsService.getSettingCategory("features");
    await SettingsService.replaceStoreSettings("features", {
      ...originalFeatures,
      reviews_enabled: true,
    });

    const product = await productRepo.create({
      name: `review-target-${stamp}`,
      slug: `review-target-${stamp}`,
      sku: `REVTGT-${stamp}`,
      price: 300,
      stock_quantity: 5,
      status: "active",
      short_description: "",
      description: "",
    } as any);
    productId = product.id;
    createdProductIds.push(product.id);
  });

  afterAll(async () => {
    for (const id of createdReviewIds) await ReviewService.deleteReview(id).catch(() => {});
    for (const id of createdProductIds) await productRepo.delete(id).catch(() => {});

    await SettingsService.replaceStoreSettings("features", originalFeatures).catch(() => {});

    try {
      const client = createAdminClient();
      await client.from("admin_change_log").delete().like("entity_label", `%${stamp}%`);
      await client.from("admin_change_log").delete().eq("entity_id", "bulk-import");
    } catch {
      // Teardown must not fail the suite.
    }
  });

  // ------------------------------------------------------------------ reviews

  it("holds a new review back until it is approved", async () => {
    const review = await ReviewService.submitReview({
      productId,
      customerName: "Amina K",
      rating: 5,
      title: "Beautiful",
      comment: "The finish is far better than I expected for the price.",
    });
    createdReviewIds.push(review.id);

    expect(review.status).toBe("pending");

    // A pending review is invisible to customers…
    expect(await ReviewService.getPublicReviews(productId)).toHaveLength(0);
    expect((await ReviewService.getSummary(productId)).count).toBe(0);

    // …but sits in the moderation queue.
    const queue = await ReviewService.listForModeration("pending");
    expect(queue.some((r) => r.id === review.id)).toBe(true);
  });

  it("publishes an approved review and counts it in the rating", async () => {
    const reviewId = createdReviewIds[0];
    await ReviewService.setStatus(reviewId, "approved");

    const publicReviews = await ReviewService.getPublicReviews(productId);
    expect(publicReviews).toHaveLength(1);

    const summary = await ReviewService.getSummary(productId);
    expect(summary.count).toBe(1);
    expect(summary.average).toBe(5);
    expect(summary.distribution[5]).toBe(1);
  });

  it("hides a review again when it is rejected", async () => {
    const reviewId = createdReviewIds[0];
    await ReviewService.setStatus(reviewId, "rejected");

    expect(await ReviewService.getPublicReviews(productId)).toHaveLength(0);

    // Put it back so later assertions have something to work with.
    await ReviewService.setStatus(reviewId, "approved");
  });

  it("rejects invalid review submissions", async () => {
    await expect(
      ReviewService.submitReview({ productId, customerName: "A", rating: 5, comment: "Long enough comment here." })
    ).rejects.toThrow(/name/i);

    await expect(
      ReviewService.submitReview({ productId, customerName: "Valid Name", rating: 9, comment: "Long enough comment here." })
    ).rejects.toThrow(/1 to 5/i);

    await expect(
      ReviewService.submitReview({ productId, customerName: "Valid Name", rating: 4, comment: "short" })
    ).rejects.toThrow(/sentence/i);
  });

  it("refuses submissions when reviews are switched off", async () => {
    await SettingsService.replaceStoreSettings("features", {
      ...originalFeatures,
      reviews_enabled: false,
    });

    await expect(
      ReviewService.submitReview({
        productId,
        customerName: "Blocked Person",
        rating: 5,
        comment: "This should never be stored anywhere.",
      })
    ).rejects.toThrow(/not being accepted/i);

    await SettingsService.replaceStoreSettings("features", {
      ...originalFeatures,
      reviews_enabled: true,
    });
  });

  // ------------------------------------------------------------- bulk import

  it("previews a spreadsheet without writing anything", async () => {
    const sku = `IMPORT-${stamp}-A`;
    const buffer = await buildSheet(
      ["name", "sku", "price", "stock", "status", "sizes", "image_urls"],
      [[`import-a-${stamp}`, sku, "450", "20", "active", "Small:8, Medium:12", "https://example.test/a.jpg"]]
    );

    const preview = await ProductImportService.parseAndValidate(buffer, "catalogue.xlsx");

    expect(preview.missingColumns).toHaveLength(0);
    expect(preview.totals).toMatchObject({ total: 1, create: 1, update: 0, invalid: 0 });
    expect(preview.rows[0].display.sizes).toBe(2);
    // Sizes win over the stock column, and the totals are added up.
    expect(preview.rows[0].display.stock).toBe(20);

    // Preview must not have created anything.
    const found = await ProductService.getAllAdminProducts(`import-a-${stamp}`);
    expect(found).toHaveLength(0);
  });

  it("reports each bad row with its row number and reason", async () => {
    const dupSku = `IMPORT-${stamp}-DUP`;
    const buffer = await buildSheet(
      ["name", "sku", "price", "category", "status"],
      [
        ["", `IMPORT-${stamp}-B`, "100", "", ""],                        // row 2: no name
        [`bad-price-${stamp}`, `IMPORT-${stamp}-C`, "not-a-number", "", ""], // row 3: bad price
        [`ghost-cat-${stamp}`, `IMPORT-${stamp}-D`, "100", "No Such Category", ""], // row 4
        [`bad-status-${stamp}`, `IMPORT-${stamp}-E`, "100", "", "on-sale"], // row 5
        [`dup-one-${stamp}`, dupSku, "100", "", ""],                     // row 6
        [`dup-two-${stamp}`, dupSku, "100", "", ""],                     // row 7: duplicate SKU
      ]
    );

    const preview = await ProductImportService.parseAndValidate(buffer, "bad.xlsx");

    expect(preview.totals.total).toBe(6);
    expect(preview.totals.invalid).toBe(5);

    const byRow = new Map(preview.rows.map((r) => [r.rowNumber, r]));
    expect(byRow.get(2)!.errors.join(" ")).toMatch(/name is required/i);
    expect(byRow.get(3)!.errors.join(" ")).toMatch(/price must be a number/i);
    expect(byRow.get(4)!.errors.join(" ")).toMatch(/does not exist/i);
    expect(byRow.get(5)!.errors.join(" ")).toMatch(/active, draft or archived/i);
    expect(byRow.get(7)!.errors.join(" ")).toMatch(/also on row 6/i);

    // The one good row is still importable — bad rows are skipped, not fatal.
    expect(byRow.get(6)!.action).toBe("create");
  });

  it("names the missing headings when the file has the wrong columns", async () => {
    const buffer = await buildSheet(["product", "cost"], [["thing", "10"]]);
    const preview = await ProductImportService.parseAndValidate(buffer, "wrong.xlsx");

    expect(preview.missingColumns.sort()).toEqual(["name", "price", "sku"]);
    expect(preview.rows).toHaveLength(0);
  });

  it("commits confirmed rows, creating products with their images and sizes", async () => {
    const sku = `IMPORT-${stamp}-LIVE`;
    const buffer = await buildSheet(
      ["name", "sku", "price", "status", "sizes", "image_urls", "low_stock_threshold"],
      [
        [
          `import-live-${stamp}`,
          sku,
          "725",
          "active",
          "Small:4, Medium:6, Large:2",
          "https://example.test/one.jpg, https://example.test/two.jpg",
          "3",
        ],
      ]
    );

    const preview = await ProductImportService.parseAndValidate(buffer, "live.xlsx");
    expect(preview.totals.invalid).toBe(0);

    const result = await ProductImportService.commit(
      preview.rows
        .filter((r) => r.action !== "skip" && r.payload)
        .map((r) => ({
          rowNumber: r.rowNumber,
          action: r.action as "create" | "update",
          payload: r.payload!,
          existingProductId: r.existingProductId,
        }))
    );

    expect(result).toMatchObject({ created: 1, updated: 0 });
    expect(result.failed).toHaveLength(0);

    const [saved] = await ProductService.getAllAdminProducts(`import-live-${stamp}`);
    expect(saved).toBeDefined();
    createdProductIds.push(saved.id);

    expect(Number(saved.price)).toBe(725);
    expect(saved.status).toBe("active");
    expect(saved.low_stock_threshold).toBe(3);
    expect(saved.images).toHaveLength(2);
    expect(saved.images!.filter((i) => i.is_primary)).toHaveLength(1);
    expect(saved.variants).toHaveLength(3);
    expect(saved.stock_quantity).toBe(12);
  });

  it("updates an existing product when the SKU already exists", async () => {
    const sku = `IMPORT-${stamp}-LIVE`;
    const buffer = await buildSheet(
      ["name", "sku", "price", "status"],
      [[`import-live-${stamp}-renamed`, sku, "799", "draft"]]
    );

    const preview = await ProductImportService.parseAndValidate(buffer, "update.xlsx");
    expect(preview.totals).toMatchObject({ create: 0, update: 1, invalid: 0 });
    // An update row with no image or size columns warns rather than wiping them.
    expect(preview.rows[0].warnings.join(" ")).toMatch(/keeps the photos/i);

    await ProductImportService.commit(
      preview.rows.map((r) => ({
        rowNumber: r.rowNumber,
        action: r.action as "create" | "update",
        payload: r.payload!,
        existingProductId: r.existingProductId,
      }))
    );

    const [saved] = await ProductService.getAllAdminProducts(`import-live-${stamp}-renamed`);
    expect(saved).toBeDefined();
    expect(Number(saved.price)).toBe(799);
    expect(saved.status).toBe("draft");
    // The images the first import created survived an update that omitted them.
    expect(saved.images).toHaveLength(2);
    expect(saved.variants).toHaveLength(3);
  });

  it("produces a template that the importer can read back", async () => {
    const template = await ProductImportService.buildTemplate();
    const preview = await ProductImportService.parseAndValidate(template, "template.xlsx");

    // The template's own example row must be valid, or it teaches the wrong shape.
    expect(preview.missingColumns).toHaveLength(0);
    expect(preview.totals.total).toBe(1);
    expect(preview.rows[0].errors).toHaveLength(0);
  });
});
