import { IInventoryRepository } from "../interfaces/inventory.repository.interface";
import { SupabaseRepository } from "./base.repository";

export class SupabaseInventoryRepository extends SupabaseRepository implements IInventoryRepository {
  /**
   * Stock movements happen during checkout (guests have no session) and
   * from admin adjustments. inventory_transactions has no anon policy.
   */
  private system() {
    return this.serviceClient("system-no-session");
  }

  async getStock(productId: string, variantId?: string): Promise<number> {
    if (variantId) {
      const { data, error } = await this.system()
        .from('product_variants')
        .select('stock')
        .eq('id', variantId)
        .single();
      if (error || !data) return 0;
      return data.stock;
    } else {
      const { data, error } = await this.system()
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();
      if (error || !data) return 0;
      return data.stock_quantity;
    }
  }

  async reserveStock(productId: string, quantity: number, variantId?: string, referenceId?: string): Promise<boolean> {
    // We can use decrement_product_stock_atomic with note="reservation"
    return this.decrementStockAtomic(productId, quantity, variantId, `Reservation ${referenceId}`);
  }

  async releaseStock(referenceId: string): Promise<void> {
    // A proper release would find the transaction and re-increment.
    // For now, we will assume this is handled by manually reversing it if needed,
    // or adding an increment_product_stock_atomic RPC. 
    // Wait, the user asked to "releaseStock". Let's just implement a basic release that looks up the transaction.
    const client = this.system();
    const { data: tx } = await client.from('inventory_transactions').select('*').eq('note', `Reservation ${referenceId}`).single();
    if (tx) {
        // Reverse the quantity change (which was negative)
        const amount = Math.abs(tx.quantity_change);
        
        if (tx.variant_id) {
            const { data: v } = await client.from('product_variants').select('stock').eq('id', tx.variant_id).single();
            await client.from('product_variants').update({stock: v!.stock + amount}).eq('id', tx.variant_id);
        }
        
        const { data: p } = await client.from('products').select('stock_quantity').eq('id', tx.product_id).single();
        await client.from('products').update({stock_quantity: p!.stock_quantity + amount}).eq('id', tx.product_id);
        
        await client.from('inventory_transactions').insert([{
            product_id: tx.product_id,
            variant_id: tx.variant_id,
            quantity_change: amount,
            transaction_type: 'cancellation',
            reference_id: referenceId,
            note: 'Released reservation'
        }]);
    }
  }

  async decrementStockAtomic(productId: string, quantity: number, variantId?: string, note?: string): Promise<boolean> {
    const { data, error } = await this.system().rpc('decrement_product_stock_atomic', {
      p_product_id: productId,
      p_variant_id: variantId || null,
      p_quantity: quantity,
      p_reference_id: null,
      p_note: note || 'Order Sale'
    });

    if (error) {
      console.error("Atomic stock decrement failed:", error);
      return false;
    }
    return data as boolean;
  }
}
