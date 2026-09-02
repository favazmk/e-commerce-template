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
   * Admin manual stock adjustment.
   *
   * `newQuantity` is the absolute level the admin typed, not a delta. Pass a
   * `variantId` to adjust one size/variant; omit it to set the product total.
   */
  static async adjustStock(
    productId: string,
    variantId: string | null | undefined,
    newQuantity: number,
    reason: string
  ): Promise<boolean> {
    if (!productId) throw new Error("A product is required to adjust stock.");

    const quantity = Number(newQuantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new Error("Stock quantity must be zero or a positive whole number.");
    }

    const repo = RepositoryFactory.getInventoryRepository();
    return await repo.setStock(productId, variantId, Math.trunc(quantity), reason);
  }

  /**
   * Get inventory transaction audit log
   */
  static async getTransactionHistory(productId?: string): Promise<InventoryTransaction[]> {
    const repo = RepositoryFactory.getInventoryRepository();
    return await repo.getTransactions(productId);
  }
}
