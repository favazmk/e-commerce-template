import ExcelJS from "exceljs";
import { RepositoryFactory } from "@/repositories/repository.factory";
import { CategoryService } from "@/services/category.service";
import { Product } from "@/types/database";

/**
 * Bulk catalogue import from a spreadsheet.
 *
 * The import is deliberately split in two: `parseAndValidate` reads the file
 * and reports what *would* happen, and `commit` performs the writes. Nothing
 * is written until an admin has seen the preview and confirmed it — a typo in
 * a 500-row sheet is otherwise discovered halfway through the catalogue.
 */

/** One column the importer understands. */
export interface ImportColumn {
  key: string;
  header: string;
  required: boolean;
  help: string;
  example: string;
}

export const IMPORT_COLUMNS: ImportColumn[] = [
  { key: "name", header: "name", required: true, help: "Product title customers see.", example: "Cashmere Overcoat" },
  { key: "sku", header: "sku", required: true, help: "Unique stock code. A row whose SKU already exists updates that product instead of creating a new one.", example: "AUR-COAT-001" },
  { key: "price", header: "price", required: true, help: "Selling price, numbers only.", example: "1250" },
  { key: "slug", header: "slug", required: false, help: "Web address. Generated from the name when left blank.", example: "cashmere-overcoat" },
  { key: "brand", header: "brand", required: false, help: "Brand name.", example: "Aura" },
  { key: "category", header: "category", required: false, help: "Category name or slug. It must already exist.", example: "Outerwear" },
  { key: "short_description", header: "short_description", required: false, help: "One line shown on product cards.", example: "Relaxed double-faced cashmere." },
  { key: "description", header: "description", required: false, help: "Full product description.", example: "Pure Mongolian cashmere, dropped shoulders…" },
  { key: "compare_at_price", header: "compare_at_price", required: false, help: "Was-price, shown struck through when higher than the price.", example: "1600" },
  { key: "cost_price", header: "cost_price", required: false, help: "What you pay your supplier. Never shown to customers.", example: "620" },
  { key: "stock", header: "stock", required: false, help: "Units on hand. Ignored when sizes are given — the sizes are added up instead.", example: "24" },
  { key: "low_stock_threshold", header: "low_stock_threshold", required: false, help: "Low-stock warning level. Defaults to 5.", example: "5" },
  { key: "status", header: "status", required: false, help: "active, draft or archived. Defaults to draft so nothing goes on sale by accident.", example: "draft" },
  { key: "featured", header: "featured", required: false, help: "yes or no. Features the product on the homepage.", example: "no" },
  { key: "image_urls", header: "image_urls", required: false, help: "Public image addresses, separated by commas. The first becomes the main photo.", example: "https://…/a.jpg, https://…/b.jpg" },
  { key: "sizes", header: "sizes", required: false, help: "Sizes and their stock as Name:stock, optionally Name:stock:price.", example: "Small:8, Medium:10, Large:6" },
  { key: "size_attribute", header: "size_attribute", required: false, help: "What the sizes vary by. Defaults to Size.", example: "Size" },
  { key: "seo_title", header: "seo_title", required: false, help: "Custom Google title.", example: "Cashmere Overcoat | Aura" },
  { key: "seo_description", header: "seo_description", required: false, help: "Custom Google description.", example: "Handcrafted double-faced cashmere." },

  // --- Selling rules -------------------------------------------------------
  // Everything below is optional and defaults to today's behaviour, so a sheet
  // written against the old template still imports unchanged.
  { key: "product_type", header: "product_type", required: false, help: "Merchandising label beside the category, e.g. Outerwear or Gift.", example: "Outerwear" },
  { key: "barcode", header: "barcode", required: false, help: "GTIN, UPC or EAN. Required by Google Shopping for branded goods.", example: "5012345678900" },
  { key: "tags", header: "tags", required: false, help: "Search and filter keywords, separated by commas.", example: "winter, wool, gift" },
  { key: "sale_price", header: "sale_price", required: false, help: "Scheduled markdown. Must be below the price. The price itself is never overwritten.", example: "999" },
  { key: "sale_starts_at", header: "sale_starts_at", required: false, help: "When the markdown begins. Blank means immediately.", example: "2026-11-27" },
  { key: "sale_ends_at", header: "sale_ends_at", required: false, help: "When the markdown ends and the price returns on its own.", example: "2026-12-01" },
  { key: "publish_at", header: "publish_at", required: false, help: "Launch date and time. Blank publishes as soon as the status is active.", example: "2026-11-27 09:00" },
  { key: "track_inventory", header: "track_inventory", required: false, help: "no for services, downloads and made-to-order lines that never run out.", example: "yes" },
  { key: "allow_backorders", header: "allow_backorders", required: false, help: "yes keeps the product buyable at zero stock and tells the shopper it is on backorder.", example: "no" },
  { key: "requires_shipping", header: "requires_shipping", required: false, help: "no for downloads, services and gift cards — no delivery is charged for them.", example: "yes" },
  { key: "min_quantity", header: "min_quantity", required: false, help: "Smallest quantity a customer may buy. Defaults to 1.", example: "1" },
  { key: "max_quantity", header: "max_quantity", required: false, help: "Per-order limit, for protecting a small drop. Blank means no limit.", example: "5" },
  { key: "weight_grams", header: "weight_grams", required: false, help: "Shipping weight in grams.", example: "1400" },
  { key: "length_cm", header: "length_cm", required: false, help: "Packed length in centimetres.", example: "40" },
  { key: "width_cm", header: "width_cm", required: false, help: "Packed width in centimetres.", example: "30" },
  { key: "height_cm", header: "height_cm", required: false, help: "Packed height in centimetres.", example: "12" },
];

export interface ParsedVariant {
  sku: string;
  attributes: Record<string, string>;
  stock: number;
  price: number;
  is_active: true;
}

export interface ImportRow {
  /** 1-based row number in the sheet, counting the header — what the admin sees. */
  rowNumber: number;
  /** "create" or "update", decided by whether the SKU already exists. */
  action: "create" | "update" | "skip";
  /** Blocking problems. A row with any of these is not imported. */
  errors: string[];
  /** Things worth knowing that do not stop the import. */
  warnings: string[];
  /** The product payload, ready for the repository. Null when the row is invalid. */
  payload: Partial<Product> | null;
  /** Existing product id when this row updates one. */
  existingProductId?: string;
  /** For the preview table. */
  display: {
    name: string;
    sku: string;
    price: string;
    stock: number;
    category: string;
    images: number;
    sizes: number;
    status: string;
  };
}

export interface ImportPreview {
  rows: ImportRow[];
  totals: { total: number; create: number; update: number; invalid: number };
  /** Headers found in the file that the importer does not recognise. */
  unknownColumns: string[];
  /** Required headers the file is missing entirely. */
  missingColumns: string[];
}

const KNOWN_HEADERS = new Set(IMPORT_COLUMNS.map((c) => c.header));
const VALID_STATUSES = new Set(["active", "draft", "archived"]);

function normaliseHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/** Excel cells arrive as strings, numbers, dates, formula results or rich text. */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();

  const obj = value as Record<string, any>;
  // A formula cell carries its computed result alongside the formula.
  if (obj.result !== undefined) return cellToString(obj.result);
  // A hyperlink cell keeps the visible text separately from the target.
  if (obj.text !== undefined) return cellToString(obj.text);
  // Rich text is an array of runs.
  if (Array.isArray(obj.richText)) return obj.richText.map((r: any) => r.text).join("").trim();
  if (obj.hyperlink !== undefined) return cellToString(obj.hyperlink);

  return String(value).trim();
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function parseBoolean(value: string): boolean {
  return ["yes", "y", "true", "1", "featured"].includes(value.trim().toLowerCase());
}

/**
 * A three-state boolean: yes, no, or "the sheet did not say".
 *
 * The distinction matters on an update row. `parseBoolean` reads a blank cell
 * as false, which is correct for `featured` (blank means not featured) and
 * wrong for `requires_shipping` (blank means leave it alone) — reading it as
 * false there would turn every physical product in the catalogue into a
 * download that ships for free.
 */
function parseOptionalBoolean(value: string): boolean | null {
  const trimmed = (value || "").trim().toLowerCase();
  if (!trimmed) return null;
  if (["yes", "y", "true", "1"].includes(trimmed)) return true;
  if (["no", "n", "false", "0"].includes(trimmed)) return false;
  return null;
}

/**
 * Read a date cell into an ISO timestamp.
 *
 * Spreadsheet dates arrive as real Date objects, as "2026-11-27", or as
 * whatever the merchant's locale produced. An unparseable value is an error
 * rather than a silent null: a sale that quietly never starts is worse than a
 * row the merchant is asked to fix.
 */
function parseDateCell(value: string, label: string, errors: string[]): string | null {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    errors.push(`${label} is not a date I can read: "${trimmed}". Use YYYY-MM-DD.`);
    return null;
  }
  return parsed.toISOString();
}

/**
 * Parse "Small:8, Medium:10:1350" into variants.
 * The third part, when present, overrides the product price for that size.
 */
function parseSizes(
  raw: string,
  attributeName: string,
  baseSku: string,
  basePrice: number
): { variants: ParsedVariant[]; errors: string[] } {
  const errors: string[] = [];
  const variants: ParsedVariant[] = [];
  if (!raw.trim()) return { variants, errors };

  const seen = new Set<string>();

  for (const chunk of raw.split(/[,\n;]/)) {
    const part = chunk.trim();
    if (!part) continue;

    const bits = part.split(":").map((b) => b.trim());
    const label = bits[0];

    if (!label) {
      errors.push(`Could not read the size "${part}".`);
      continue;
    }
    if (seen.has(label.toLowerCase())) {
      errors.push(`Size "${label}" appears more than once.`);
      continue;
    }
    seen.add(label.toLowerCase());

    const stockRaw = bits[1] ?? "0";
    const stock = Number(stockRaw);
    if (!Number.isFinite(stock) || stock < 0) {
      errors.push(`Stock for size "${label}" must be zero or more, got "${stockRaw}".`);
      continue;
    }

    let price = basePrice;
    if (bits[2] !== undefined && bits[2] !== "") {
      const parsed = Number(bits[2]);
      if (!Number.isFinite(parsed) || parsed < 0) {
        errors.push(`Price for size "${label}" must be a number, got "${bits[2]}".`);
        continue;
      }
      price = parsed;
    }

    variants.push({
      sku: `${baseSku}-${label.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)}`,
      attributes: { [attributeName]: label },
      stock: Math.trunc(stock),
      price,
      is_active: true,
    });
  }

  return { variants, errors };
}

export class ProductImportService {
  /** The maximum rows one upload may contain. */
  static readonly MAX_ROWS = 2000;

  /**
   * Read a spreadsheet and work out what importing it would do, without
   * writing anything.
   */
  static async parseAndValidate(fileBuffer: Buffer, fileName: string): Promise<ImportPreview> {
    const workbook = new ExcelJS.Workbook();

    if (fileName.toLowerCase().endsWith(".csv")) {
      const { Readable } = await import("node:stream");
      await workbook.csv.read(Readable.from(fileBuffer.toString("utf8")));
    } else {
      await workbook.xlsx.load(fileBuffer as any);
    }

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("That file has no sheets in it.");

    // ---- headers -----------------------------------------------------------
    const headerRow = sheet.getRow(1);
    const headerByColumn = new Map<number, string>();
    const foundHeaders: string[] = [];

    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = normaliseHeader(cellToString(cell.value));
      if (!header) return;
      headerByColumn.set(colNumber, header);
      foundHeaders.push(header);
    });

    const unknownColumns = foundHeaders.filter((h) => !KNOWN_HEADERS.has(h));
    const missingColumns = IMPORT_COLUMNS.filter(
      (c) => c.required && !foundHeaders.includes(c.header)
    ).map((c) => c.header);

    if (missingColumns.length > 0) {
      return {
        rows: [],
        totals: { total: 0, create: 0, update: 0, invalid: 0 },
        unknownColumns,
        missingColumns,
      };
    }

    // ---- reference data, fetched once --------------------------------------
    const categories = await CategoryService.getCategories(false);
    const categoryByKey = new Map<string, string>();
    for (const category of categories) {
      categoryByKey.set(category.name.trim().toLowerCase(), category.id);
      categoryByKey.set(category.slug.trim().toLowerCase(), category.id);
    }

    const productRepo = RepositoryFactory.getProductRepository();
    const existing = await productRepo.findAll({ limit: 5000, status: "all" } as any);
    const productBySku = new Map<string, { id: string; slug: string }>();
    const productBySlug = new Map<string, string>();
    for (const product of existing.items) {
      if (product.sku) productBySku.set(product.sku.trim().toLowerCase(), { id: product.id, slug: product.slug });
      if (product.slug) productBySlug.set(product.slug.trim().toLowerCase(), product.id);
    }

    // ---- rows --------------------------------------------------------------
    const rows: ImportRow[] = [];
    const skusInFile = new Map<string, number>();
    const slugsInFile = new Map<string, number>();

    const lastRow = sheet.actualRowCount || sheet.rowCount;

    for (let rowNumber = 2; rowNumber <= lastRow; rowNumber += 1) {
      const sheetRow = sheet.getRow(rowNumber);

      const values: Record<string, string> = {};
      for (const [colNumber, header] of headerByColumn.entries()) {
        values[header] = cellToString(sheetRow.getCell(colNumber).value);
      }

      // Trailing blank rows are common in hand-edited sheets; skip silently.
      const isBlank = Object.values(values).every((v) => v === "");
      if (isBlank) continue;

      if (rows.length >= ProductImportService.MAX_ROWS) {
        rows.push({
          rowNumber,
          action: "skip",
          errors: [
            `This file has more than ${ProductImportService.MAX_ROWS} rows. Split it and import in batches.`,
          ],
          warnings: [],
          payload: null,
          display: { name: "", sku: "", price: "", stock: 0, category: "", images: 0, sizes: 0, status: "" },
        });
        break;
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // -- required fields
      const name = values.name || "";
      if (!name) errors.push("A product name is required.");

      const sku = (values.sku || "").trim();
      if (!sku) errors.push("A SKU is required.");

      const priceRaw = values.price || "";
      const price = Number(priceRaw);
      if (!priceRaw) errors.push("A price is required.");
      else if (!Number.isFinite(price) || price < 0) {
        errors.push(`Price must be a number of zero or more, got "${priceRaw}".`);
      }

      // -- duplicates within the file
      const skuKey = sku.toLowerCase();
      if (sku) {
        const firstSeen = skusInFile.get(skuKey);
        if (firstSeen) errors.push(`SKU "${sku}" is also on row ${firstSeen} of this file.`);
        else skusInFile.set(skuKey, rowNumber);
      }

      const slug = toSlug(values.slug || name);
      if (!slug) errors.push("Could not build a web address from that name — add a slug column.");

      const slugKey = slug.toLowerCase();
      if (slug) {
        const firstSeen = slugsInFile.get(slugKey);
        if (firstSeen) errors.push(`Web address "${slug}" is also on row ${firstSeen} of this file.`);
        else slugsInFile.set(slugKey, rowNumber);
      }

      // -- create or update, decided by SKU
      const match = sku ? productBySku.get(skuKey) : undefined;
      const action: ImportRow["action"] = match ? "update" : "create";

      // A slug already used by a *different* product would collide on write.
      const slugOwner = productBySlug.get(slugKey);
      if (slugOwner && (!match || slugOwner !== match.id)) {
        errors.push(`Web address "${slug}" already belongs to another product.`);
      }

      // -- optional fields
      let categoryId: string | null = null;
      const categoryRaw = (values.category || "").trim();
      if (categoryRaw) {
        categoryId = categoryByKey.get(categoryRaw.toLowerCase()) ?? null;
        if (!categoryId) {
          errors.push(`Category "${categoryRaw}" does not exist. Create it first, or clear the cell.`);
        }
      }

      const statusRaw = (values.status || "").trim().toLowerCase();
      let status: Product["status"] = "draft";
      if (statusRaw) {
        if (!VALID_STATUSES.has(statusRaw)) {
          errors.push(`Status must be active, draft or archived, got "${statusRaw}".`);
        } else {
          status = statusRaw as Product["status"];
        }
      } else if (action === "create") {
        warnings.push("No status given — importing as a draft, hidden from customers.");
      }

      const numberOrNull = (raw: string, label: string): number | null => {
        const trimmed = (raw || "").trim();
        if (!trimmed) return null;
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed) || parsed < 0) {
          errors.push(`${label} must be a number of zero or more, got "${trimmed}".`);
          return null;
        }
        return parsed;
      };

      const compareAtPrice = numberOrNull(values.compare_at_price, "Compare price");
      const costPrice = numberOrNull(values.cost_price, "Cost price");
      const lowStockThreshold = numberOrNull(values.low_stock_threshold, "Low stock threshold");
      const stockColumn = numberOrNull(values.stock, "Stock");

      if (compareAtPrice !== null && Number.isFinite(price) && compareAtPrice <= price) {
        warnings.push("Compare price is not above the price, so no discount will be shown.");
      }

      // -- images
      const imageUrls = (values.image_urls || "")
        .split(/[,\n]/)
        .map((u) => u.trim())
        .filter(Boolean);

      for (const url of imageUrls) {
        if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
          errors.push(`Image address "${url}" must start with http://, https:// or /.`);
        }
      }

      // -- sizes
      const attributeName = (values.size_attribute || "Size").trim() || "Size";
      const { variants, errors: sizeErrors } = parseSizes(
        values.sizes || "",
        attributeName,
        sku || "SKU",
        Number.isFinite(price) ? price : 0
      );
      errors.push(...sizeErrors);

      const variantStock = variants.reduce((sum, v) => sum + v.stock, 0);
      const stock = variants.length > 0 ? variantStock : stockColumn ?? 0;

      if (variants.length > 0 && stockColumn !== null && stockColumn !== variantStock) {
        warnings.push(
          `Stock column says ${stockColumn} but the sizes add up to ${variantStock}. Using ${variantStock}.`
        );
      }

      if (action === "update" && imageUrls.length === 0) {
        warnings.push("No images in this row — the product keeps the photos it already has.");
      }

      // -- selling rules
      const salePrice = numberOrNull(values.sale_price, "Sale price");
      if (salePrice !== null && Number.isFinite(price) && salePrice >= price) {
        errors.push(
          `Sale price ${salePrice} must be below the price ${price}, or the shopper is shown a saving of nothing.`
        );
      }

      const saleStartsAt = parseDateCell(values.sale_starts_at, "Sale start", errors);
      const saleEndsAt = parseDateCell(values.sale_ends_at, "Sale end", errors);
      if (saleStartsAt && saleEndsAt && new Date(saleEndsAt) <= new Date(saleStartsAt)) {
        errors.push("The sale must end after it starts.");
      }
      if ((saleStartsAt || saleEndsAt) && salePrice === null) {
        errors.push("Sale dates were given with no sale_price, so nothing would be discounted.");
      }

      const publishAt = parseDateCell(values.publish_at, "Publish date", errors);
      if (publishAt && status !== "active") {
        warnings.push("A publish date only takes effect once the status is active.");
      }

      const minQuantity = numberOrNull(values.min_quantity, "Minimum quantity");
      const maxQuantity = numberOrNull(values.max_quantity, "Maximum quantity");
      if (minQuantity !== null && minQuantity < 1) {
        errors.push("Minimum quantity must be at least 1.");
      }
      if (maxQuantity !== null && maxQuantity < (minQuantity ?? 1)) {
        errors.push("Maximum quantity must be at least the minimum quantity.");
      }

      const trackInventory = parseOptionalBoolean(values.track_inventory);
      const allowBackorders = parseOptionalBoolean(values.allow_backorders);
      const requiresShipping = parseOptionalBoolean(values.requires_shipping);

      if (trackInventory === false && (stockColumn ?? 0) > 0) {
        warnings.push("Stock is ignored because track_inventory is no — this product never runs out.");
      }

      const weightGrams = numberOrNull(values.weight_grams, "Weight");
      const lengthCm = numberOrNull(values.length_cm, "Length");
      const widthCm = numberOrNull(values.width_cm, "Width");
      const heightCm = numberOrNull(values.height_cm, "Height");

      const tags = (values.tags || "")
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean);

      const display = {
        name: name || "(no name)",
        sku: sku || "(no SKU)",
        price: priceRaw,
        stock,
        category: categoryRaw || "Unassigned",
        images: imageUrls.length,
        sizes: variants.length,
        status,
      };

      if (errors.length > 0) {
        rows.push({ rowNumber, action: "skip", errors, warnings, payload: null, display });
        continue;
      }

      const payload: Partial<Product> = {
        name,
        slug,
        sku,
        price,
        compare_at_price: compareAtPrice,
        cost_price: costPrice,
        category_id: categoryId,
        brand: values.brand || null,
        short_description: values.short_description || "",
        description: values.description || "",
        stock_quantity: Math.trunc(stock),
        low_stock_threshold: lowStockThreshold === null ? 5 : Math.trunc(lowStockThreshold),
        status,
        featured: parseBoolean(values.featured || ""),
        seo_title: values.seo_title || name,
        seo_description: values.seo_description || values.short_description || "",
        product_type: values.product_type || null,
        barcode: values.barcode || null,
        sale_price: salePrice,
        sale_starts_at: saleStartsAt,
        sale_ends_at: saleEndsAt,
        published_at: publishAt,
        min_purchase_quantity: minQuantity === null ? 1 : Math.trunc(minQuantity),
        max_purchase_quantity: maxQuantity === null ? null : Math.trunc(maxQuantity),
        weight_grams: weightGrams === null ? null : Math.trunc(weightGrams),
        length_cm: lengthCm,
        width_cm: widthCm,
        height_cm: heightCm,
      } as Partial<Product>;

      // Booleans and tags are only sent when the sheet actually says something.
      // An update row that leaves these blank must keep what the product has,
      // rather than silently resetting it to the column default.
      if (trackInventory !== null) (payload as any).track_inventory = trackInventory;
      if (allowBackorders !== null) {
        (payload as any).inventory_policy = allowBackorders ? "continue" : "deny";
      }
      if (requiresShipping !== null) (payload as any).requires_shipping = requiresShipping;
      if (tags.length > 0) (payload as any).tags = tags;

      // Images and sizes are only sent when the row supplies them, so an update
      // row that leaves those columns blank does not wipe what is already there.
      if (imageUrls.length > 0) {
        (payload as any).images = imageUrls.map((url, index) => ({
          url,
          alt_text: name,
          display_order: index,
          is_primary: index === 0,
        }));
      }
      if (variants.length > 0) {
        (payload as any).variants = variants;
      }

      rows.push({
        rowNumber,
        action,
        errors,
        warnings,
        payload,
        existingProductId: match?.id,
        display,
      });
    }

    const totals = {
      total: rows.length,
      create: rows.filter((r) => r.action === "create").length,
      update: rows.filter((r) => r.action === "update").length,
      invalid: rows.filter((r) => r.errors.length > 0).length,
    };

    return { rows, totals, unknownColumns, missingColumns };
  }

  /**
   * Write the rows the admin confirmed.
   *
   * Rows are applied one at a time and each result is reported: a row that
   * fails at write time (a SKU claimed by a concurrent import, say) does not
   * take the rest of the batch with it.
   */
  static async commit(
    rows: Array<{ rowNumber: number; action: "create" | "update"; payload: Partial<Product>; existingProductId?: string }>
  ): Promise<{
    created: number;
    updated: number;
    failed: Array<{ rowNumber: number; sku: string; message: string }>;
  }> {
    const productRepo = RepositoryFactory.getProductRepository();

    let created = 0;
    let updated = 0;
    const failed: Array<{ rowNumber: number; sku: string; message: string }> = [];

    for (const row of rows) {
      try {
        if (row.action === "update" && row.existingProductId) {
          const result = await productRepo.update(row.existingProductId, row.payload);
          if (!result) throw new Error("That product no longer exists.");
          updated += 1;
        } else {
          await productRepo.create(row.payload);
          created += 1;
        }
      } catch (error: any) {
        failed.push({
          rowNumber: row.rowNumber,
          sku: String(row.payload.sku ?? ""),
          message: error?.message || "Could not save this row.",
        });
      }
    }

    return { created, updated, failed };
  }

  /**
   * Build a starter workbook: a header row, one worked example, and a second
   * sheet explaining every column.
   *
   * The example row is filled with a category that actually exists in this
   * store, so downloading the template and uploading it straight back is a
   * valid import rather than an error. A template whose own example the
   * importer rejects teaches the wrong shape.
   */
  /**
   * Export the catalogue as a spreadsheet in the *import* format.
   *
   * The round trip is the whole point, and it is the half WooCommerce and
   * Shopify both get right: export, edit 400 prices in Excel, re-import. An
   * export whose columns do not match the importer is a report, not a tool —
   * it can be read but never fed back.
   *
   * Every value is therefore written in the form the parser above accepts:
   * booleans as yes/no, sizes as "Name:stock:price", dates as ISO.
   */
  static async buildExport(products: Product[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Store Admin";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Products");
    sheet.columns = IMPORT_COLUMNS.map((column) => ({
      header: column.header,
      key: column.key,
      width: Math.min(38, Math.max(14, column.header.length + 6)),
    }));
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F0EC" },
    };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const yesNo = (value: boolean | null | undefined, fallback: boolean): string =>
      (value ?? fallback) ? "yes" : "no";
    const date = (value: string | null | undefined): string =>
      value ? new Date(value).toISOString().slice(0, 16).replace("T", " ") : "";

    for (const product of products) {
      // Variants are flattened back into the same "Name:stock:price" grammar
      // the importer reads. Only the first option axis survives that format,
      // which is why a multi-option product is flagged in the notes column.
      const variants = product.variants || [];
      const firstAxis = Object.keys(variants[0]?.attributes || {})[0] || "Size";
      const sizes = variants
        .filter((v) => v.attributes?.[firstAxis])
        .map((v) => `${v.attributes[firstAxis]}:${v.stock}:${v.price}`)
        .join(", ");

      sheet.addRow({
        name: product.name,
        sku: product.sku,
        price: product.price,
        slug: product.slug,
        brand: product.brand || "",
        category: product.category?.name || "",
        short_description: product.short_description || "",
        description: product.description || "",
        compare_at_price: product.compare_at_price ?? "",
        cost_price: product.cost_price ?? "",
        stock: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
        status: product.status,
        featured: product.featured ? "yes" : "no",
        image_urls: (product.images || []).map((i) => i.url).join(", "),
        sizes,
        size_attribute: sizes ? firstAxis : "",
        seo_title: product.seo_title || "",
        seo_description: product.seo_description || "",
        product_type: product.product_type || "",
        barcode: product.barcode || "",
        tags: (product.tags || []).join(", "),
        sale_price: product.sale_price ?? "",
        sale_starts_at: date(product.sale_starts_at),
        sale_ends_at: date(product.sale_ends_at),
        publish_at: date(product.published_at),
        track_inventory: yesNo(product.track_inventory, true),
        allow_backorders: product.inventory_policy === "continue" ? "yes" : "no",
        requires_shipping: yesNo(product.requires_shipping, true),
        min_quantity: product.min_purchase_quantity ?? 1,
        max_quantity: product.max_purchase_quantity ?? "",
        weight_grams: product.weight_grams ?? "",
        length_cm: product.length_cm ?? "",
        width_cm: product.width_cm ?? "",
        height_cm: product.height_cm ?? "",
      });
    }

    const notes = workbook.addWorksheet("Read me first");
    notes.columns = [{ header: "Note", key: "note", width: 110 }];
    notes.getRow(1).font = { bold: true };
    [
      "Edit this file and upload it under Products > Import to apply your changes.",
      "Rows are matched by SKU: an existing SKU updates that product, a new one creates it.",
      "Delete rows you do not want to touch. Nothing is deleted from the store by removing a row here.",
      "The sizes column carries only the first option axis (for example Size). A product with Size AND Colour keeps its other options untouched by an import, but re-importing its sizes column will not recreate the second axis - edit those products in the admin instead.",
      "Prices are in the store currency, with no symbol. Dates are YYYY-MM-DD HH:MM.",
    ].forEach((note) => notes.addRow({ note }));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  static async buildTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Store Admin";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Products");
    sheet.columns = IMPORT_COLUMNS.map((column) => ({
      header: column.header,
      key: column.key,
      width: Math.min(38, Math.max(14, column.header.length + 6)),
    }));

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F0EC" },
    };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    // Use a real category when the store has one; otherwise leave the cell
    // blank, which imports as "Unassigned" rather than failing.
    let exampleCategory = "";
    try {
      const categories = await CategoryService.getCategories(false);
      exampleCategory = categories[0]?.name ?? "";
    } catch {
      exampleCategory = "";
    }

    const example: Record<string, string> = {};
    for (const column of IMPORT_COLUMNS) {
      example[column.key] = column.key === "category" ? exampleCategory : column.example;
    }
    sheet.addRow(example);

    const guide = workbook.addWorksheet("How to fill this in");
    guide.columns = [
      { header: "Column", key: "header", width: 24 },
      { header: "Required", key: "required", width: 12 },
      { header: "What it means", key: "help", width: 80 },
      { header: "Example", key: "example", width: 36 },
    ];
    guide.getRow(1).font = { bold: true };

    for (const column of IMPORT_COLUMNS) {
      guide.addRow({
        header: column.header,
        required: column.required ? "Yes" : "Optional",
        help: column.help,
        example: column.example,
      });
    }

    guide.addRow({});
    guide.addRow({
      header: "Matching",
      required: "",
      help: "A row whose SKU already exists updates that product. A new SKU creates one. Leave image_urls or sizes blank on an update and the product keeps what it already has.",
      example: "",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
