import { ICartRepository } from "../interfaces/cart.repository.interface";
import { Cart, CartItem } from "../../types/database";
import { SupabaseRepository } from "./base.repository";

export class SupabaseCartRepository extends SupabaseRepository implements ICartRepository {
  /**
   * Guest carts are keyed by an unguessable guest_token, which RLS cannot
   * express (auth.uid() is null for guests). The merge-on-login path also has
   * to read the guest cart before the session owns it.
   */
  private guest() {
    return this.serviceClient("guest-capability-token");
  }

  async findById(id: string): Promise<Cart | null> {
    const { data, error } = await this.guest()
      .from('carts')
      .select('*, items:cart_items(*, product:products(*), variant:product_variants(*))')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as unknown as Cart;
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const { data, error } = await this.guest()
      .from('carts')
      .select('*, items:cart_items(*, product:products(*), variant:product_variants(*))')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data as unknown as Cart;
  }

  async findByGuestToken(token: string): Promise<Cart | null> {
    const { data, error } = await this.guest()
      .from('carts')
      .select('*, items:cart_items(*, product:products(*), variant:product_variants(*))')
      .eq('guest_token', token)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data as unknown as Cart;
  }

  async createCart(data: { userId?: string; guestToken?: string }): Promise<Cart> {
    const { data: newCart, error } = await this.guest()
      .from('carts')
      .insert([
        {
          user_id: data.userId || null,
          guest_token: data.guestToken || null,
        }
      ])
      .select()
      .single();

    if (error || !newCart) {
      console.error("Cart creation error:", error);
      throw new Error("Failed to create cart");
    }
    return { ...newCart, items: [] } as unknown as Cart;
  }

  async addItem(cartId: string, item: Omit<CartItem, "id" | "cart_id" | "created_at" | "updated_at">): Promise<CartItem> {
    const { data, error } = await this.guest()
      .from('cart_items')
      .insert([
        {
          cart_id: cartId,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity
        }
      ])
      .select()
      .single();

    if (error || !data) throw new Error("Failed to add item to cart");
    
    // Update cart timestamp
    await this.guest().from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartId);
    
    return data as unknown as CartItem;
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    const { data, error } = await this.guest()
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();

    if (error || !data) throw new Error("Failed to update cart item");
    
    // Update cart timestamp (we need cart_id)
    await this.guest().from('carts').update({ updated_at: new Date().toISOString() }).eq('id', data.cart_id);

    return data as unknown as CartItem;
  }

  async removeItem(itemId: string): Promise<void> {
    // get cart_id first to update the timestamp
    const { data } = await this.guest().from('cart_items').select('cart_id').eq('id', itemId).single();
    
    const { error } = await this.guest()
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) throw new Error("Failed to remove item");
    
    if (data?.cart_id) {
      await this.guest().from('carts').update({ updated_at: new Date().toISOString() }).eq('id', data.cart_id);
    }
  }

  async clearCart(cartId: string): Promise<void> {
    const { error } = await this.guest()
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) throw new Error("Failed to clear cart");
    await this.guest().from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartId);
  }

  async mergeGuestCartToUser(guestToken: string, userId: string): Promise<Cart> {
    const client = this.guest();
    
    // 1. Get guest cart
    const guestCart = await this.findByGuestToken(guestToken);
    if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
      // Nothing to merge, just return user's cart or create one
      const userCart = await this.findByUserId(userId);
      return userCart || await this.createCart({ userId });
    }

    // 2. Get user cart
    let userCart = await this.findByUserId(userId);
    if (!userCart) {
      userCart = await this.createCart({ userId });
    }

    // 3. Move items from guest to user cart
    for (const item of guestCart.items) {
      // Check if item already exists in user cart
      const existingItem = userCart.items?.find(
        i => i.product_id === item.product_id && i.variant_id === item.variant_id
      );

      if (existingItem) {
        // Update quantity
        await this.updateItemQuantity(existingItem.id, existingItem.quantity + item.quantity);
      } else {
        // Add new item
        await this.addItem(userCart.id, {
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        } as Omit<CartItem, "id" | "cart_id" | "created_at" | "updated_at">);
      }
    }

    // 4. Delete guest cart
    await client.from('carts').delete().eq('id', guestCart.id);

    // 5. Return updated user cart
    const updatedUserCart = await this.findByUserId(userId);
    return updatedUserCart!;
  }
}
