import { IInventoryRepository } from "../interfaces/inventory.repository.interface";
import { InventoryTransaction } from "../../types/database";
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

  /**
   * Set an absolute stock level for a product or one of its variants and
   * record the difference in the audit ledger.
   *
   * The admin form thinks in absolute counts ("this size now has 12"), while
   * the ledger thinks in deltas, so the conversion happens here — reading the
   * current value and writing `new - current` as the movement.
   */
  async setStock(
    productId: string,
    variantId: string | null | undefined,
    newQuantity: number,
    reason: string
  ): Promise<boolean> {
    const client = this.system();
    const target = Math.max(0, Math.trunc(Number(newQuantity) || 0));

    const current = await this.getStock(productId, variantId || undefined);
    const delta = target - current;

    if (variantId) {
      const { error } = await client
        .from("product_variants")
        .update({ stock: target, updated_at: new Date().toISOString() })
        .eq("id", variantId);
      if (error) throw new Error(`Failed to update variant stock: ${error.message}`);

      // Keep the product-level total consistent with the sum of its variants.
      const { data: siblings } = await client
        .from("product_variants")
        .select("stock")
        .eq("product_id", productId)
        .eq("is_active", true);

      if (siblings) {
        const total = siblings.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
        await client
          .from("products")
          .update({ stock_quantity: total, updated_at: new Date().toISOString() })
          .eq("id", productId);
      }
    } else {
      const { error } = await client
        .from("products")
        .update({ stock_quantity: target, updated_at: new Date().toISOString() })
        .eq("id", productId);
      if (error) throw new Error(`Failed to update stock: ${error.message}`);
    }

    // A no-op adjustment is still worth recording: it evidences the review.
    const { error: ledgerError } = await client.from("inventory_transactions").insert([
      {
        product_id: productId,
        variant_id: variantId || null,
        quantity_change: delta,
        transaction_type: "adjustment",
        reference_id: null,
        note: reason || "Manual stock adjustment",
      },
    ]);

    if (ledgerError) throw new Error(`Stock changed but the audit entry failed: ${ledgerError.message}`);

    return true;
  }

  /**
   * Read the stock movement ledger, newest first.
   */
  async getTransactions(productId?: string, limit = 100): Promise<InventoryTransaction[]> {
    let query = this.system()
      .from("inventory_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (productId) query = query.eq("product_id", productId);

    const { data, error } = await query;
    if (error || !data) return [];
    return data as unknown as InventoryTransaction[];
  }
}
