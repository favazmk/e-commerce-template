import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { ProductService } from "../../src/services/product.service";

/**
 * Catalog queries run through the service-role client so that storefront pages
 * stay cacheable (reading session cookies would force every catalog route
 * dynamic). That means the "Public can view active products" RLS policy does
 * NOT apply to them, and the publish-state filter in the query is the only
 * thing keeping unpublished products off the storefront.
 *
 * This regression exists: `findAll` shipped without a status filter, so drafts
 * and archived items were listed publicly. These tests pin the boundary.
 */
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STAMP = Date.now();
const SLUGS = {
  active: `visibility-active-${STAMP}`,
  draft: `visibility-draft-${STAMP}`,
  archived: `visibility-archived-${STAMP}`,
};

async function seed(slug: string, status: string) {
  const { error } = await admin.from("products").insert([
    {
      name: `Visibility ${status} ${STAMP}`,
      slug,
      sku: slug.toUpperCase().replace(/-/g, "").slice(0, 20),
      description: "publish-state fixture",
      short_description: "publish-state fixture",
      price: 123,
      stock_quantity: 5,
      status,
    },
  ]);
  if (error) throw error;
}

describe("Integration: only published products reach the storefront", () => {
  beforeAll(async () => {
    await seed(SLUGS.active, "active");
    await seed(SLUGS.draft, "draft");
    await seed(SLUGS.archived, "archived");
  });

  afterAll(async () => {
    await admin.from("products").delete().in("slug", Object.values(SLUGS));
  });

  it("lists an active product", async () => {
    const { items } = await ProductService.getProducts({ searchQuery: `Visibility`, limit: 100 });
    const slugs = items.map((p) => p.slug);
    expect(slugs).toContain(SLUGS.active);
  });

  it("SECURITY: does not list draft products", async () => {
    const { items } = await ProductService.getProducts({ searchQuery: `Visibility`, limit: 100 });
    const slugs = items.map((p) => p.slug);
    expect(slugs).not.toContain(SLUGS.draft);
  });

  it("does not list archived products", async () => {
    const { items } = await ProductService.getProducts({ searchQuery: `Visibility`, limit: 100 });
    const slugs = items.map((p) => p.slug);
    expect(slugs).not.toContain(SLUGS.archived);
  });

  it("reports a total count that excludes unpublished products", async () => {
    // The count drives pagination, so it must match the filtered set — a
    // correct page of results with an inflated total still leaks the numbers.
    const { items, total } = await ProductService.getProducts({
      searchQuery: `Visibility`,
      limit: 100,
    });
    expect(total).toBe(items.length);
    expect(total).toBe(1);
  });

  it("admin listings still see every publish state", async () => {
    const all = await ProductService.getAllAdminProducts("Visibility");
    const slugs = all.map((p) => p.slug);
    expect(slugs).toContain(SLUGS.active);
    expect(slugs).toContain(SLUGS.draft);
    expect(slugs).toContain(SLUGS.archived);
  });
});
