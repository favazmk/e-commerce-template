import { IProductRepository } from "../interfaces/product.repository.interface";
import { Product, ProductVariant } from "../../types/database";
import { PaginatedResult, ProductFilterParams } from "../../types/commerce";
import { createAdminClient } from "../../lib/supabase/server";

export class SupabaseProductRepository implements IProductRepository {
  private getClient() {
    return createAdminClient();
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.getClient()
      .from('products')
      .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as unknown as Product;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await this.getClient()
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

    let query = this.getClient()
      .from('products')
      .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)', { count: 'exact' });

    if (params.categorySlug) {
      const { data: cat } = await this.getClient().from('categories').select('id').eq('slug', params.categorySlug).single();
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
    const { data, error } = await this.getClient()
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
    const { data, error } = await this.getClient()
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true);

    if (error) return [];
    return data as unknown as ProductVariant[];
  }

  async create(data: Partial<Product>): Promise<Product> {
    const { images, variants, category, ...productData } = data as any;
    
    const { data: created, error } = await this.getClient()
      .from('products')
      .insert([productData])
      .select()
      .single();
    if (error || !created) throw new Error("Failed to create product");
    return created as unknown as Product;
  }

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    const { data: updated, error } = await this.getClient()
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error || !updated) return null;
    return updated as unknown as Product;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('products')
      .delete()
      .eq('id', id);
    return !error;
  }
}
