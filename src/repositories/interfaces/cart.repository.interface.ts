import { Cart, CartItem } from "../../types/database";

export interface ICartRepository {
  findById(id: string): Promise<Cart | null>;
  findByUserId(userId: string): Promise<Cart | null>;
  findByGuestToken(token: string): Promise<Cart | null>;
  createCart(data: { userId?: string; guestToken?: string }): Promise<Cart>;
  addItem(cartId: string, item: Omit<CartItem, "id" | "cart_id" | "created_at" | "updated_at">): Promise<CartItem>;
  updateItemQuantity(itemId: string, quantity: number): Promise<CartItem>;
  removeItem(itemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  mergeGuestCartToUser(guestToken: string, userId: string): Promise<Cart>;
}
