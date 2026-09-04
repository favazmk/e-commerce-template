import { IProductRepository } from "../interfaces/product.repository.interface";
import { Product, ProductVariant } from "../../types/database";
import { PaginatedResult, ProductFilterParams } from "../../types/commerce";
import { SupabaseRepository } from "./base.repository";

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
      .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as unknown as Product;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await this.catalog()
      .from('products')
      .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return data as unknown as Product;
  }

  async findAll(params: ProductFilterParams): Promise<PaginatedResult<Product>> {
    const limit = params.limit || 12;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    let query = this.catalog()
      .from('products')
      .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)', { count: 'exact' });

    // Publish state. Without this the storefront lists drafts and archived
    // products, because catalog reads bypass RLS by design (see catalog()).
    if (params.status === undefined) {
      query = query.eq('status', 'active');
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
      items: (data || []) as unknown as Product[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getFeaturedProducts(limit = 4): Promise<Product[]> {
    const { data, error } = await this.catalog()
      .from('products')
      .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)')
      .eq('featured', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data as unknown as Product[];
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

    const rows = incoming.map((v) => {
      const row: Record<string, any> = {
        product_id: productId,
        sku: String(v.sku),
        price: Number(v.price) || 0,
        compare_at_price: v.compare_at_price != null ? Number(v.compare_at_price) : null,
        cost_price: v.cost_price != null ? Number(v.cost_price) : null,
        stock: Math.max(0, Number(v.stock) || 0),
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

  async create(data: Partial<Product>): Promise<Product> {
    const { images, variants } = data as any;

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
    if (Array.isArray(variants)) await this.replaceVariants(productId, variants);

    // Return the product as it now reads, with its children attached.
    return (await this.findById(productId)) as Product;
  }

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    const { images, variants } = data as any;
    const row = this.pickProductColumns(data as Record<string, any>);

    if (Object.keys(row).length > 0) {
      const { error } = await this.admin()
        .from('products')
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw new Error(`Failed to update product: ${error.message}`);
    }

    if (Array.isArray(images)) await this.replaceImages(id, images);
    if (Array.isArray(variants)) await this.replaceVariants(id, variants);

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
}
