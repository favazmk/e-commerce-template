export interface IInventoryRepository {
  getStock(productId: string, variantId?: string): Promise<number>;
  reserveStock(productId: string, quantity: number, variantId?: string, referenceId?: string): Promise<boolean>;
  releaseStock(referenceId: string): Promise<void>;
  decrementStockAtomic(productId: string, quantity: number, variantId?: string, note?: string): Promise<boolean>;
}
