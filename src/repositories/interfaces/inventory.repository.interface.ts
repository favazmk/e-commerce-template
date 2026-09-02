import { InventoryTransaction } from "../../types/database";

export interface IInventoryRepository {
  getStock(productId: string, variantId?: string): Promise<number>;
  reserveStock(productId: string, quantity: number, variantId?: string, referenceId?: string): Promise<boolean>;
  releaseStock(referenceId: string): Promise<void>;
  decrementStockAtomic(productId: string, quantity: number, variantId?: string, note?: string): Promise<boolean>;
  /** Set an absolute stock level and write the difference to the audit ledger. */
  setStock(
    productId: string,
    variantId: string | null | undefined,
    newQuantity: number,
    reason: string
  ): Promise<boolean>;
  /** Read the stock movement ledger, newest first. */
  getTransactions(productId?: string, limit?: number): Promise<InventoryTransaction[]>;
}
