import { IProductRepository } from "../interfaces/product.repository.interface";
import { Product, ProductVariant } from "../../types/database";
import { PaginatedResult, ProductFilterParams } from "../../types/commerce";
import { SupabaseRepository } from "./base.repository";

/**
 * Every read of a product hydrates the same graph. Repeating the string at each
 * call site is how `options` would end up attached on the product page and
 * missing on the listing, giving two different answers for the same product.
 */
const PRODUCT_SELECT =
  "*, category:categories(*), images:product_images(*), variants:product_variants(*), options:product_options(*)";

/**
 * Postgres returns child rows in no guaranteed order, so a size picker built
 * straight from them reads "XL, S, M". Sorting once, here, means no component
 * has to remember to do it.
 */
function ordered<T extends Record<string, any>>(rows: T[] | undefined | null, key: string): T[] {
  return [...(rows || [])].sort((a, b) => (Number(a[key]) || 0) - (Number(b[key]) || 0));
}

function hydrate(row: any): Product {
  if (!row) return row;
  return {
    ...row,
    images: ordered(row.images, "display_order"),
    variants: ordered(row.variants, "position"),
    options: ordered(row.options, "position"),
  } as Product;
}

export class SupabaseProductRepository extends SupabaseRepository implements IProductRepository {
  /**
   * Catalog reads render in cached/ISR routes. Reading session cookies
   * there would force every catalog page dynamic, and the public RLS policy
   * (`status = 'active'`) adds nothing a service-layer filter does not already
   * do. Draft/archived visibility is decided in ProductService.
   */
  private catalog() {
    return this.serviceClient("public-catalog-cached");
  }

  /**
   * Catalog writes. Every route reaching these is gated by requireAdmin().
   */
  private admin() {
    return this.serviceClient("admin-authorised");
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.catalog()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return hydrate(data);
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await this.catalog()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return hydrate(data);
  }

  async findAll(params: ProductFilterParams): Promise<PaginatedResult<Product>> {
    const limit = params.limit || 12;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    let query = this.catalog()
      .from('products')
      .select(PRODUCT_SELECT, { count: 'exact' });

    // Publish state. Without this the storefront lists drafts and archived
    // products, because catalog reads bypass RLS by design (see catalog()).
    if (params.status === undefined) {
      query = query.eq('status', 'active');
      // Scheduled availability: a product approved for a Friday launch is
      // active from the moment it is saved, and must stay invisible until then.
      // Rows predating scheduling have a null date and are treated as live.
      query = query.or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`);
    } else if (params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    if (params.categorySlug) {
      const { data: cat } = await this.catalog().from('categories').select('id').eq('slug', params.categorySlug).single();
      if (cat) {
        query = query.eq('category_id', cat.id);
      } else {
        // If category not found, return empty
        return { items: [], total: 0, page, limit, totalPages: 0 };
      }
    }

    if (params.searchQuery) {
      query = query.ilike('name', `%${params.searchQuery}%`);
    }

    if (params.featuredOnly) {
      query = query.eq('featured', true);
    }

    if (params.inStockOnly) {
      query = query.gt('stock_quantity', 0);
    }

    if (params.brand) {
      query = query.eq('brand', params.brand);
    }

    // Price bounds were part of ProductFilterParams from the start but were
    // never applied, so every "under X" link in the storefront returned the
    // unfiltered catalog. Coerced to finite numbers because they arrive from
    // the query string.
    if (Number.isFinite(Number(params.minPrice))) {
      query = query.gte('price', Number(params.minPrice));
    }
    if (Number.isFinite(Number(params.maxPrice))) {
      query = query.lte('price', Number(params.maxPrice));
    }

    // Apply sorting
    if (params.sortBy) {
      switch (params.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'name_asc':
          query = query.order('name', { ascending: true });
          break;
        case 'featured':
          // Merchant-picked items first, then newest within each group.
          query = query
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }

    return {
      items: (data || []).map(hydrate),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getFeaturedProducts(limit = 4): Promise<Product[]> {
    const { data, error } = await this.catalog()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('featured', true)
      .eq('status', 'active')
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data || []).map(hydrate);
  }

  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const { data, error } = await this.catalog()
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true);

    if (error) return [];
    return data as unknown as ProductVariant[];
  }

  /**
   * Columns that live on `products` itself. Anything else in an admin payload
   * (images, variants, the joined category) belongs to a child table and must
   * never be forwarded to a `products` insert/update — doing so makes the
   * whole write fail, which is how product imagery silently stopped saving.
   */
  private static readonly PRODUCT_COLUMNS = [
    "name",
    "slug",
    "brand",
    "category_id",
    "short_description",
    "description",
    "price",
    "compare_at_price",
    "cost_price",
    "sku",
    "stock_quantity",
    "low_stock_threshold",
    "status",
    "featured",
    "badge_label",
    "badge_tone",
    "product_type",
    "barcode",
    "track_inventory",
    "inventory_policy",
    "requires_shipping",
    "min_purchase_quantity",
    "max_purchase_quantity",
    "sale_price",
    "sale_starts_at",
    "sale_ends_at",
    "published_at",
    "weight_grams",
    "length_cm",
    "width_cm",
    "height_cm",
    "seo_title",
    "seo_description",
    "tags",
    "currency",
    "metadata",
  ] as const;

  private pickProductColumns(data: Record<string, any>): Record<string, any> {
    const row: Record<string, any> = {};
    for (const column of SupabaseProductRepository.PRODUCT_COLUMNS) {
      if (data[column] !== undefined) row[column] = data[column];
    }
    return row;
  }

  /**
   * Replace a product's image rows with the supplied set.
   *
   * Images are edited as a whole list in the admin form, so the simplest
   * correct persistence is delete-then-insert inside one product.
   */
  private async replaceImages(productId: string, images: any[]): Promise<void> {
    const client = this.admin();
    await client.from("product_images").delete().eq("product_id", productId);

    const rows = (images || [])
      .filter((img) => img && typeof img.url === "string" && img.url.trim())
      .map((img, index) => ({
        product_id: productId,
        url: img.url.trim(),
        alt_text: img.alt_text || "",
        display_order: Number.isFinite(Number(img.display_order)) ? Number(img.display_order) : index,
        // Exactly one primary: honour an explicit flag, else promote the first.
        is_primary: images.some((i: any) => i?.is_primary) ? Boolean(img.is_primary) : index === 0,
      }));

    if (rows.length === 0) return;

    const { error } = await client.from("product_images").insert(rows);
    if (error) throw new Error(`Failed to save product images: ${error.message}`);
  }

  /**
   * Replace a product's variant rows with the supplied set.
   *
   * Variant ids generated client-side (e.g. "var-new-1") are not database ids,
   * so they are dropped and the row is inserted fresh. Real UUIDs are kept so
   * that stock ledger references survive an edit.
   */
  private async replaceVariants(productId: string, variants: any[]): Promise<void> {
    const client = this.admin();

    const incoming = (variants || []).filter((v) => v && v.sku);
    const isUuid = (value: unknown) =>
      typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    const keptIds = incoming.map((v) => v.id).filter(isUuid);

    // Remove variants the admin deleted in the form.
    let deleteQuery = client.from("product_variants").delete().eq("product_id", productId);
    if (keptIds.length > 0) {
      deleteQuery = deleteQuery.not("id", "in", `(${keptIds.join(",")})`);
    }
    await deleteQuery;

    if (incoming.length === 0) return;

    const rows = incoming.map((v, index) => {
      const row: Record<string, any> = {
        product_id: productId,
        sku: String(v.sku),
        price: Number(v.price) || 0,
        compare_at_price: v.compare_at_price != null ? Number(v.compare_at_price) : null,
        cost_price: v.cost_price != null ? Number(v.cost_price) : null,
        stock: Math.max(0, Number(v.stock) || 0),
        // Previously dropped on every save, so a GTIN typed into the form never
        // survived — which quietly broke the Google Shopping feed.
        barcode: v.barcode || null,
        sale_price: v.sale_price != null && v.sale_price !== "" ? Number(v.sale_price) : null,
        position: Number.isFinite(Number(v.position)) ? Number(v.position) : index,
        image_url: v.image_url || null,
        is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
        swatch_hex: typeof v.swatch_hex === "string" && /^#[0-9a-f]{6}$/i.test(v.swatch_hex)
          ? v.swatch_hex
          : null,
        is_default: Boolean(v.is_default),
        attributes: v.attributes || {},
        updated_at: new Date().toISOString(),
      };
      if (isUuid(v.id)) row.id = v.id;
      return row;
    });

    const { error } = await client
      .from("product_variants")
      .upsert(rows, { onConflict: "id" });

    if (error) throw new Error(`Failed to save product variants: ${error.message}`);
  }

  /**
   * Replace a product's option sets.
   *
   * Whole-list replacement, like images and variants: the admin edits the set
   * as one thing, and a diffing algorithm here would be more code with more
   * ways to be wrong. Options carry no foreign keys, so nothing is orphaned.
   */
  private async replaceOptions(productId: string, options: any[]): Promise<void> {
    const client = this.admin();
    await client.from("product_options").delete().eq("product_id", productId);

    const rows = (options || [])
      .filter((o) => o && typeof o.name === "string" && o.name.trim())
      // Three is the ceiling the database enforces; refusing the fourth here
      // turns a transaction abort into something the merchant can act on.
      .slice(0, 3)
      .map((o, index) => ({
        product_id: productId,
        name: String(o.name).trim(),
        values: Array.isArray(o.values)
          ? Array.from(
              new Set(
                o.values
                  .map((v: unknown) => String(v).trim())
                  .filter((v: string) => v.length > 0)
              )
            )
          : [],
        position: Number.isFinite(Number(o.position)) ? Number(o.position) : index,
      }))
      .filter((o) => o.values.length > 0);

    if (rows.length === 0) return;

    const { error } = await client.from("product_options").insert(rows);
    if (error) throw new Error(`Failed to save product options: ${error.message}`);
  }

  /**
   * Replace the merchant-curated relations shown as "you may also like" and
   * "upgrade to". These are the cold-start fallback for the recommendation
   * engine, which otherwise has nothing to show a store on its first day.
   */
  private async replaceRelations(productId: string, relations: any[]): Promise<void> {
    const client = this.admin();
    await client.from("product_bundles").delete().eq("product_id", productId);

    const seen = new Set<string>();
    const rows = (relations || [])
      .filter((r) => r && typeof r.related_product_id === "string")
      // A product related to itself is a rendering loop, and the database
      // rejects it anyway; drop it before the round trip.
      .filter((r) => r.related_product_id !== productId)
      .map((r, index) => ({
        product_id: productId,
        related_product_id: r.related_product_id,
        relation_type: ["bundle", "similar", "upsell"].includes(r.relation_type)
          ? r.relation_type
          : "similar",
        display_order: Number.isFinite(Number(r.display_order)) ? Number(r.display_order) : index,
      }))
      .filter((r) => {
        const key = `${r.related_product_id}:${r.relation_type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    if (rows.length === 0) return;

    const { error } = await client.from("product_bundles").insert(rows);
    if (error) throw new Error(`Failed to save related products: ${error.message}`);
  }

  /** The curated relations of one product, for the admin editor. */
  async getRelations(
    productId: string
  ): Promise<Array<{ related_product_id: string; relation_type: string; display_order: number }>> {
    const { data, error } = await this.admin()
      .from("product_bundles")
      .select("related_product_id, relation_type, display_order")
      .eq("product_id", productId)
      .order("display_order", { ascending: true });

    if (error) return [];
    return (data || []) as any[];
  }

  async create(data: Partial<Product>): Promise<Product> {
    const { images, variants, options, relations } = data as any;

    const { data: created, error } = await this.admin()
      .from('products')
      .insert([this.pickProductColumns(data as Record<string, any>)])
      .select()
      .single();

    if (error || !created) {
      throw new Error(`Failed to create product${error ? `: ${error.message}` : ""}`);
    }

    const productId = (created as any).id as string;

    if (Array.isArray(images)) await this.replaceImages(productId, images);
    // Options before variants: the variant rows are the cartesian product of
    // the options, so persisting them in the other order can briefly describe a
    // product whose variants reference an axis that does not exist.
    if (Array.isArray(options)) await this.replaceOptions(productId, options);
    if (Array.isArray(variants)) await this.replaceVariants(productId, variants);
    if (Array.isArray(relations)) await this.replaceRelations(productId, relations);

    // Return the product as it now reads, with its children attached.
    return (await this.findById(productId)) as Product;
  }

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    const { images, variants, options, relations } = data as any;
    const row = this.pickProductColumns(data as Record<string, any>);

    if (Object.keys(row).length > 0) {
      const { error } = await this.admin()
        .from('products')
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw new Error(`Failed to update product: ${error.message}`);
    }

    if (Array.isArray(images)) await this.replaceImages(id, images);
    if (Array.isArray(options)) await this.replaceOptions(id, options);
    if (Array.isArray(variants)) await this.replaceVariants(id, variants);
    if (Array.isArray(relations)) await this.replaceRelations(id, relations);

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    // product_images, product_variants and inventory_transactions all cascade.
    const { error } = await this.admin()
      .from('products')
      .delete()
      .eq('id', id);
    return !error;
  }

  /**
   * Duplicate a product, the way Shopify's "Duplicate" does.
   *
   * This is the single most-used action in a real merchandising day: a new
   * colourway of an existing style shares its copy, its images, its option
   * sets and its shipping properties, and differs in three fields. Rebuilding
   * it from the blank form is ten minutes of retyping and a chance to get the
   * shipping weight wrong.
   *
   * The copy always lands as a draft. Duplicating straight into the live
   * catalogue would publish a product named "... (Copy)" with a placeholder
   * SKU, and the merchant would find out from a customer.
   */
  async duplicate(id: string, overrides: { name?: string; sku?: string } = {}): Promise<Product | null> {
    const source = await this.findById(id);
    if (!source) return null;

    const name = overrides.name?.trim() || `${source.name} (Copy)`;
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Slug and SKU are unique. A collision here is normal — duplicating the
    // same product twice — so the suffix is resolved before the insert rather
    // than discovered as a constraint violation.
    const slug = await this.nextAvailable("slug", baseSlug);
    const sku = await this.nextAvailable("sku", overrides.sku?.trim() || `${source.sku}-COPY`);

    const payload: Record<string, any> = {
      ...this.pickProductColumns(source as unknown as Record<string, any>),
      name,
      slug,
      sku,
      // A duplicate is unreviewed by definition: never live, never featured,
      // and never carrying the original's launch schedule.
      status: "draft",
      featured: false,
      published_at: null,
    };

    const { data: created, error } = await this.admin()
      .from("products")
      .insert([payload])
      .select()
      .single();

    if (error || !created) {
      throw new Error(`Failed to duplicate product${error ? `: ${error.message}` : ""}`);
    }

    const newId = (created as any).id as string;

    await this.replaceImages(newId, source.images || []);
    await this.replaceOptions(newId, source.options || []);
    // Variant ids and SKUs must not be carried over: the ids belong to the
    // original's stock ledger, and the SKUs are unique.
    await this.replaceVariants(
      newId,
      (source.variants || []).map((v, index) => ({
        ...v,
        id: undefined,
        sku: `${sku}-${index + 1}`,
        // Stock belongs to the original's warehouse count, not to a draft copy.
        stock: 0,
      }))
    );
    await this.replaceRelations(newId, await this.getRelations(id));

    return await this.findById(newId);
  }

  /** First free value of a unique text column, appending -2, -3, ... */
  private async nextAvailable(column: "slug" | "sku", candidate: string): Promise<string> {
    const { data } = await this.admin()
      .from("products")
      .select(column)
      .like(column, `${candidate}%`);

    const taken = new Set((data || []).map((row: any) => String(row[column])));
    if (!taken.has(candidate)) return candidate;

    for (let n = 2; n < 500; n += 1) {
      const next = `${candidate}-${n}`;
      if (!taken.has(next)) return next;
    }
    // Practically unreachable; a timestamp is still better than a failed write.
    return `${candidate}-${Date.now()}`;
  }

  /**
   * Apply one change to many products at once — the bulk editor every catalogue
   * tool has, because seasonal work is "archive these 40" and "mark these 12
   * featured", not forty visits to a detail page.
   *
   * Price changes are expressed as a percentage and applied per row in SQL
   * order, which is why they are read-modify-write rather than a single
   * statement: each product's new price depends on its own current one.
   */
  async bulkUpdate(
    ids: string[],
    changes: {
      status?: Product["status"];
      featured?: boolean;
      category_id?: string | null;
      price_change_percent?: number;
    }
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const row: Record<string, any> = { updated_at: new Date().toISOString() };
    if (changes.status !== undefined) row.status = changes.status;
    if (changes.featured !== undefined) row.featured = changes.featured;
    if (changes.category_id !== undefined) row.category_id = changes.category_id;

    // Publishing in bulk has to set the launch date too, or the products stay
    // invisible behind the scheduling gate they were never given a date for.
    if (changes.status === "active") row.published_at = new Date().toISOString();

    if (Object.keys(row).length > 1) {
      const { error } = await this.admin().from("products").update(row).in("id", ids);
      if (error) throw new Error(`Bulk update failed: ${error.message}`);
    }

    const percent = Number(changes.price_change_percent);
    if (Number.isFinite(percent) && percent !== 0) {
      const { data: rows, error } = await this.admin()
        .from("products")
        .select("id, price, sale_price")
        .in("id", ids);

      if (error) throw new Error(`Bulk price read failed: ${error.message}`);

      for (const product of rows || []) {
        const nextPrice = Math.max(0, Math.round(Number(product.price) * (1 + percent / 100) * 100) / 100);
        const patch: Record<string, any> = { price: nextPrice, updated_at: new Date().toISOString() };

        // A sale price that is no longer below the regular price violates the
        // table's own check constraint, so a repriced product would fail to
        // save. Clearing the stale markdown is the only correct resolution.
        if (product.sale_price != null && Number(product.sale_price) >= nextPrice) {
          patch.sale_price = null;
        }

        await this.admin().from("products").update(patch).eq("id", product.id);
      }
    }

    return ids.length;
  }
}
