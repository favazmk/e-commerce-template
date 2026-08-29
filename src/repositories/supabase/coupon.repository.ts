import { ICouponRepository } from "../interfaces/coupon.repository.interface";
import { Coupon } from "../../types/database";
import { createAdminClient } from "../../lib/supabase/server";

export class SupabaseCouponRepository implements ICouponRepository {
  private getClient() {
    return createAdminClient();
  }

  async findAll(): Promise<Coupon[]> {
    const { data, error } = await this.getClient()
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
    const { data, error } = await this.getClient()
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) return null;
    return data as Coupon;
  }

  async findById(id: string): Promise<Coupon | null> {
    const { data, error } = await this.getClient()
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Coupon;
  }

  async recordUsage(couponId: string, userId?: string, orderId?: string): Promise<void> {
    const client = this.getClient();
    
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
    
    const { count, error } = await this.getClient()
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
