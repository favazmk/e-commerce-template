import { RepositoryFactory } from "@/repositories/repository.factory";
import { InventoryTransaction, InventoryTransactionType } from "@/types/database";

export class InventoryService {
  /**
   * Atomically verify and decrease inventory for an order item
   * Prevents race conditions and purchases of out-of-stock inventory
   */
  static async decrementStock(
    productId: string,
    variantId: string | null | undefined,
    quantity: number,
    referenceId: string,
    note: string = "Customer Order Sale"
  ): Promise<{ success: boolean; error?: string }> {
    const repo = RepositoryFactory.getInventoryRepository();
    const success = await repo.reserveStock(productId, quantity, variantId || undefined, referenceId);
    
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: "Insufficient stock or concurrency conflict." };
    }
  }

  /**
   * Restore inventory (e.g. on order cancellation, refund, or checkout timeout)
   */
  static async restoreStock(
    productId: string, // Kept for signature compatibility, but referenceId is primary now
    variantId: string | null | undefined,
    quantity: number,
    referenceId: string,
    type: InventoryTransactionType = "cancellation",
    note: string = "Restocked"
  ): Promise<boolean> {
    const repo = RepositoryFactory.getInventoryRepository();
    await repo.releaseStock(referenceId);
    return true; // Simple true for now, repo throws on error
  }

  /**
   * Admin manual stock adjustment
   */
  static async adjustStock(
    productId: string,
    variantId: string | null | undefined,
    newQuantity: number,
    reason: string
  ): Promise<boolean> {
    const repo = RepositoryFactory.getInventoryRepository();
    // For now we will overwrite the absolute quantity via decrement/increment, 
    // though the DB repo is designed for atomic deltas.
    // A robust impl requires reading current and sending delta.
    return true;
  }

  /**
   * Get inventory transaction audit log
   */
  static async getTransactionHistory(productId?: string): Promise<InventoryTransaction[]> {
    return [];
  }
}
