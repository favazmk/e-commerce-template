import { ICouponRepository } from "../interfaces/coupon.repository.interface";
import { Coupon } from "../../types/database";
import { SupabaseRepository } from "./base.repository";

export class SupabaseCouponRepository extends SupabaseRepository implements ICouponRepository {
  /**
   * The coupons and coupon_usages tables carry no anon policy on purpose:
   * the discount catalogue and per-customer usage counts must not be
   * enumerable with the public key. All access is server-side only.
   */
  private locked() {
    return this.serviceClient("no-anon-policy-by-design");
  }

  async findAll(): Promise<Coupon[]> {
    const { data, error } = await this.locked()
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching coupons:", error);
      return [];
    }
    return data as unknown as Coupon[];
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await this.locked()
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) return null;
    return data as Coupon;
  }

  async findById(id: string): Promise<Coupon | null> {
    const { data, error } = await this.locked()
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Coupon;
  }

  /**
   * Columns a caller may set. `usage_count` is deliberately excluded: it is
   * owned by recordUsage() and must never be rewritten from an admin form.
   */
  private static readonly WRITABLE = [
    "code",
    "discount_type",
    "discount_value",
    "min_order_value",
    "max_discount_amount",
    "start_date",
    "end_date",
    "usage_limit",
    "per_customer_limit",
    "product_ids",
    "category_ids",
    "is_active",
  ] as const;

  private pickWritable(data: Record<string, any>): Record<string, any> {
    const row: Record<string, any> = {};
    for (const column of SupabaseCouponRepository.WRITABLE) {
      if (data[column] !== undefined) row[column] = data[column];
    }
    if (typeof row.code === "string") row.code = row.code.trim().toUpperCase();
    return row;
  }

  async create(data: Partial<Coupon>): Promise<Coupon> {
    const { data: created, error } = await this.locked()
      .from('coupons')
      .insert([this.pickWritable(data as Record<string, any>)])
      .select()
      .single();

    if (error || !created) {
      // 23505 is a unique-violation on `code`; say so rather than "failed".
      if (error?.code === "23505") throw new Error("A coupon with that code already exists.");
      throw new Error(`Failed to create coupon${error ? `: ${error.message}` : ""}`);
    }
    return created as Coupon;
  }

  async update(id: string, data: Partial<Coupon>): Promise<Coupon | null> {
    const { data: updated, error } = await this.locked()
      .from('coupons')
      .update({ ...this.pickWritable(data as Record<string, any>), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error?.code === "23505") throw new Error("A coupon with that code already exists.");
    if (error || !updated) return null;
    return updated as Coupon;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.locked()
      .from('coupons')
      .delete()
      .eq('id', id);
    return !error;
  }

  async recordUsage(couponId: string, userId?: string, orderId?: string): Promise<void> {
    const client = this.locked();
    
    // Attempt to insert into coupon_usages to enforce per-user limits
    const { error: usageError } = await client.from('coupon_usages').insert([{
      coupon_id: couponId,
      user_id: userId || null,
      order_id: orderId || null
    }]);

    if (usageError) {
      if (usageError.code === '23505') { // Unique constraint violation
        throw new Error("Coupon already used by this customer");
      }
      throw new Error("Failed to record coupon usage");
    }

    // Increment usage_count safely
    const { error: rpcError } = await client.rpc('increment_coupon_usage', { p_coupon_id: couponId });
    if (rpcError) {
       // Fallback if RPC doesn't exist
       const { data } = await client.from('coupons').select('usage_count').eq('id', couponId).single();
       if (data) {
           await client.from('coupons').update({ usage_count: data.usage_count + 1 }).eq('id', couponId);
       }
    }
  }

  async validateCouponForUser(couponId: string, userId?: string): Promise<boolean> {
    if (!userId) return true; // Guest users bypass per_customer_limit if we don't track by email
    
    const { count, error } = await this.locked()
      .from('coupon_usages')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', couponId)
      .eq('user_id', userId);
      
    if (error) return false;
    
    // Could check the coupon's per_customer_limit, for now assume 1
    const coupon = await this.findById(couponId);
    if (!coupon) return false;
    
    return (count || 0) < (coupon.per_customer_limit || 1);
  }
}
