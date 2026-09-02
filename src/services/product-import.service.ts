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
      } as Partial<Product>;

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
