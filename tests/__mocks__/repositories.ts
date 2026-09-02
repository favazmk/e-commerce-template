import { IProductRepository } from "../../src/repositories/interfaces/product.repository.interface";
import { ICartRepository } from "../../src/repositories/interfaces/cart.repository.interface";
import { IOrderRepository } from "../../src/repositories/interfaces/order.repository.interface";
import { IInventoryRepository } from "../../src/repositories/interfaces/inventory.repository.interface";
import { ICouponRepository } from "../../src/repositories/interfaces/coupon.repository.interface";
import { ISettingsRepository } from "../../src/repositories/interfaces/settings.repository.interface";
import { Product, ProductVariant, Cart, CartItem, Order, OrderItem, Coupon, InventoryTransaction } from "../../src/types/database";

// Seed data for tests
export const mockData = {
  products: [] as unknown as Product[],
  carts: [] as Cart[],
  cartItems: [] as CartItem[],
  orders: [] as Order[],
  orderItems: [] as OrderItem[],
  coupons: [] as Coupon[],
  users: [
    {
      id: "user-test-id",
      email: "customer@example.com",
      name: "Test Customer",
      role: "customer",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ] as any[],
  homepageSections: [] as any[],
  settings: {
    tax: {
      enabled: false,
      percentage: 0,
      is_inclusive: false,
      tax_name: "Tax"
    },
    shipping: {
      flat_rate: 15,
      free_shipping_threshold: 200,
      zones: [
        {
          id: "zone-us",
          name: "Standard Ground Shipping",
          rate: 15,
          free_threshold: 200,
        }
      ]
    }
  }
};

export function resetMockData() {
  mockData.products = [
    {
      id: "p1",
      name: "Cashmere Overcoat",
      slug: "cashmere-overcoat",
      price: 495.0,
      stock_quantity: 10,
      status: "active",
      variants: [
        { id: "v1", product_id: "p1", sku: "COAT-M", price: 495.0, price_adjustment: 0, stock: 10, is_active: true }
      ]
    },
    {
      id: "p2",
      name: "Silk Scarf",
      slug: "silk-scarf",
      price: 85.0,
      stock_quantity: 20,
      status: "active",
      variants: []
    }
  ] as unknown as Product[];
  mockData.carts = [];
  mockData.cartItems = [];
  mockData.orders = [];
  mockData.orderItems = [];
  mockData.coupons = [
    {
      id: "c1",
      code: "WELCOME10",
      discount_type: "percentage",
      discount_value: 10,
      is_active: true,
      usage_count: 0,
      per_customer_limit: 1
    },
    {
      id: "c2",
      code: "MIN100",
      discount_type: "fixed",
      discount_value: 20,
      min_order_value: 100,
      is_active: true,
      usage_count: 0,
    }
  ] as Coupon[];
}

export class MockProductRepository implements IProductRepository {
  async findById(id: string): Promise<Product | null> {
    return mockData.products.find(p => p.id === id) || null;
  }
  async findBySlug(slug: string): Promise<Product | null> {
    return mockData.products.find(p => p.slug === slug) || null;
  }
  async findAll(params: any = {}): Promise<any> {
    // Mirror the real repository: published-only unless the caller opts out.
    let items = mockData.products;
    if (params.status === undefined) {
      items = items.filter((p: any) => p.status === "active");
    } else if (params.status !== "all") {
      items = items.filter((p: any) => p.status === params.status);
    }
    return { items, total: items.length, page: 1, limit: params.limit ?? 10, totalPages: 1 };
  }
  async getFeaturedProducts(): Promise<Product[]> { return []; }
  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const p = mockData.products.find(p => p.id === productId);
    return p?.variants || [];
  }
  async create(data: Partial<Product>): Promise<Product> { throw new Error("Mock not implemented"); }
  async update(id: string, data: Partial<Product>): Promise<Product | null> { throw new Error("Mock not implemented"); }
  async delete(id: string): Promise<boolean> { return true; }
}

export class MockCartRepository implements ICartRepository {
  async findById(id: string): Promise<Cart | null> {
    return mockData.carts.find(c => c.id === id) || null;
  }
  async findByUserId(userId: string): Promise<Cart | null> {
    return mockData.carts.find(c => c.user_id === userId) || null;
  }
  async findByGuestToken(token: string): Promise<Cart | null> {
    return mockData.carts.find(c => c.guest_token === token) || null;
  }
  async createCart(data: { userId?: string; guestToken?: string }): Promise<Cart> {
    const cart = { id: `cart_${Date.now()}`, user_id: data.userId, guest_token: data.guestToken } as Cart;
    mockData.carts.push(cart);
    return cart;
  }
  async addItem(cartId: string, item: Omit<CartItem, "id" | "cart_id" | "created_at" | "updated_at">): Promise<CartItem> {
    const newItem = { id: `ci_${Date.now()}`, cart_id: cartId, ...item } as CartItem;
    mockData.cartItems.push(newItem);
    return newItem;
  }
  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    const idx = mockData.cartItems.findIndex(ci => ci.id === itemId);
    if (idx !== -1) mockData.cartItems[idx].quantity = quantity;
    return mockData.cartItems[idx];
  }
  async removeItem(itemId: string): Promise<void> {
    mockData.cartItems = mockData.cartItems.filter(ci => ci.id !== itemId);
  }
  async clearCart(cartId: string): Promise<void> {
    mockData.cartItems = mockData.cartItems.filter(ci => ci.cart_id !== cartId);
  }
  async mergeGuestCartToUser(guestToken: string, userId: string): Promise<Cart> {
    const guestCart = mockData.carts.find(c => c.guest_token === guestToken);
    let userCart = mockData.carts.find(c => c.user_id === userId);
    
    if (guestCart && userCart) {
       const guestItems = mockData.cartItems.filter(ci => ci.cart_id === guestCart.id);
       for (const gItem of guestItems) {
           const existing = mockData.cartItems.find(ci => ci.cart_id === userCart!.id && ci.product_id === gItem.product_id && ci.variant_id === gItem.variant_id);
           if (existing) {
               existing.quantity += gItem.quantity;
           } else {
               mockData.cartItems.push({ ...gItem, id: `ci_${Date.now()}_${Math.random()}`, cart_id: userCart.id });
           }
       }
       // clear guest cart
       mockData.cartItems = mockData.cartItems.filter(ci => ci.cart_id !== guestCart.id);
    }
    return userCart || ({} as Cart);
  }
}

export class MockCouponRepository implements ICouponRepository {
  async findAll(): Promise<Coupon[]> {
    return mockData.coupons;
  }
  async findByCode(code: string): Promise<Coupon | null> {
    return mockData.coupons.find(c => c.code.toLowerCase() === code.toLowerCase()) || null;
  }
  async findById(id: string): Promise<Coupon | null> {
    return mockData.coupons.find(c => c.id === id) || null;
  }
  async create(data: Partial<Coupon>): Promise<Coupon> {
    const coupon = {
      id: `coup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      usage_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    } as Coupon;
    mockData.coupons.push(coupon);
    return coupon;
  }
  async update(id: string, data: Partial<Coupon>): Promise<Coupon | null> {
    const coupon = mockData.coupons.find(c => c.id === id);
    if (!coupon) return null;
    Object.assign(coupon, data, { updated_at: new Date().toISOString() });
    return coupon;
  }
  async delete(id: string): Promise<boolean> {
    const before = mockData.coupons.length;
    mockData.coupons = mockData.coupons.filter(c => c.id !== id);
    return mockData.coupons.length < before;
  }
  async recordUsage(couponId: string, userId?: string, orderId?: string): Promise<void> {
    const coupon = mockData.coupons.find(c => c.id === couponId);
    if (coupon) coupon.usage_count = (coupon.usage_count || 0) + 1;
  }
  async validateCouponForUser(couponId: string, userId?: string): Promise<boolean> {
    const coupon = mockData.coupons.find(c => c.id === couponId);
    if (!coupon) return false;
    return (coupon.usage_count || 0) < (coupon.per_customer_limit || 999);
  }
}

export class MockSettingsRepository implements ISettingsRepository {
  async getByKey(key: string): Promise<any> {
    if (key === "tax") return { value: mockData.settings.tax };
    if (key === "shipping") return { value: mockData.settings.shipping };
    return null;
  }
  async getAll(): Promise<any> { return []; }
  async updateSetting(key: string, value: any): Promise<void> {}
  async getTaxSettings(): Promise<any> {
    return mockData.settings.tax;
  }
  async getShippingSettings(): Promise<any> {
    return mockData.settings.shipping;
  }
  async getStoreSettings(): Promise<any> { return {}; }
  async getHomepageSections(): Promise<any[]> { return mockData.homepageSections ?? []; }
  async updateHomepageSection(id: string, data: any): Promise<any> {
    const sections = mockData.homepageSections ?? [];
    const existing = sections.find((s: any) => s.id === id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing;
  }
  async reorderHomepageSections(orderedIds: string[]): Promise<void> {
    const sections = mockData.homepageSections ?? [];
    orderedIds.forEach((id, index) => {
      const section = sections.find((s: any) => s.id === id);
      if (section) section.display_order = index;
    });
  }
}

const mockReservations: Record<string, any> = {};

export class MockInventoryRepository implements IInventoryRepository {
  private transactions: any[] = [];

  async setStock(
    productId: string,
    variantId: string | null | undefined,
    newQuantity: number,
    reason: string
  ): Promise<boolean> {
    const p = mockData.products.find(p => p.id === productId);
    if (!p) return false;

    const target = Math.max(0, Math.trunc(newQuantity));
    const current = await this.getStock(productId, variantId || undefined);

    if (variantId) {
      const v = p.variants?.find(v => v.id === variantId);
      if (!v) return false;
      v.stock = target;
      p.stock_quantity = (p.variants || []).reduce((sum, x) => sum + (x.stock || 0), 0);
    } else {
      p.stock_quantity = target;
    }

    this.transactions.unshift({
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      product_id: productId,
      variant_id: variantId || null,
      quantity_change: target - current,
      transaction_type: "adjustment",
      reference_id: null,
      note: reason,
      created_at: new Date().toISOString(),
    });

    return true;
  }

  async getTransactions(productId?: string, limit = 100): Promise<any[]> {
    const rows = productId
      ? this.transactions.filter(t => t.product_id === productId)
      : this.transactions;
    return rows.slice(0, limit);
  }

  async getStock(productId: string, variantId?: string): Promise<number> {
    const p = mockData.products.find(p => p.id === productId);
    if (!p) return 0;
    if (variantId) {
      const v = p.variants?.find(v => v.id === variantId);
      return v?.stock || 0;
    }
    return p.stock_quantity || 0;
  }
  async reserveStock(productId: string, quantity: number, variantId?: string | null, referenceId?: string, transactionType?: string): Promise<boolean> {
    const p = mockData.products.find(p => p.id === productId);
    if (!p) return false;
    if (variantId) {
      const v = p.variants?.find(v => v.id === variantId);
      if (!v || (v.stock || 0) < quantity) return false;
      v.stock = (v.stock || 0) - quantity;
      if (referenceId) {
          mockReservations[referenceId] = { productId, variantId, quantity };
      }
      return true;
    } else {
      if ((p.stock_quantity || 0) < quantity) return false;
      p.stock_quantity = (p.stock_quantity || 0) - quantity;
      if (referenceId) {
          mockReservations[referenceId] = { productId, variantId: null, quantity };
      }
      return true;
    }
  }
  async decrementStockAtomic(productId: string, quantity: number, variantId?: string, note?: string): Promise<boolean> {
    return this.reserveStock(productId, quantity, variantId);
  }
  async incrementStockAtomic(productId: string, variantId: string | null, quantity: number): Promise<boolean> {
    const p = mockData.products.find(p => p.id === productId);
    if (!p) return false;
    if (variantId) {
      const v = p.variants?.find(v => v.id === variantId);
      if (v) v.stock = (v.stock || 0) + quantity;
      return true;
    } else {
      p.stock_quantity = (p.stock_quantity || 0) + quantity;
      return true;
    }
  }
  async releaseStock(referenceId: string): Promise<void> {
    const res = mockReservations[referenceId];
    if (res) {
        await this.incrementStockAtomic(res.productId, res.variantId, res.quantity);
        delete mockReservations[referenceId];
    }
  }
  async getTransactionHistory(productId: string): Promise<InventoryTransaction[]> {
    return [];
  }
}

export class MockOrderRepository implements IOrderRepository {
  async findById(id: string): Promise<Order | null> {
    return mockData.orders.find(o => o.id === id) || null;
  }
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return mockData.orders.find(o => o.order_number === orderNumber) || null;
  }
  async findByUserId(userId: string): Promise<Order[]> {
    return mockData.orders.filter(o => o.user_id === userId);
  }
  async createOrder(orderData: Partial<Order>, items: Partial<OrderItem>[]): Promise<Order> {
    const order = { id: `ord_${Date.now()}`, ...orderData } as Order;
    mockData.orders.push(order);
    return order;
  }
  async updateStatus(id: string, status: string): Promise<boolean> {
    const idx = mockData.orders.findIndex(o => o.id === id);
    if (idx === -1) return false;
    mockData.orders[idx].status = status as any;
    return true;
  }
  async updateOrderStatus(orderId: string, status: string, notes?: string, changedBy?: string): Promise<void> {
    await this.updateStatus(orderId, status);
  }
  async addPayment(payment: any): Promise<any> {
    return payment;
  }
  async getOrderPayments(orderId: string): Promise<any[]> {
    return [];
  }
  async updatePaymentInfo(id: string, paymentStatus: string, transactionId?: string): Promise<boolean> {
    const idx = mockData.orders.findIndex(o => o.id === id);
    if (idx === -1) return false;
    mockData.orders[idx].payment_status = paymentStatus as any;
    return true;
  }
  async updatePaymentStatus(paymentId: string, status: string, providerOrderId?: string, transactionId?: string): Promise<void> {
    // mock
  }
  async createRefund(refund: any): Promise<any> {
    return refund;
  }
  async findAllAdmin(searchQuery?: string, status?: string): Promise<any> {
    return { items: mockData.orders, total: mockData.orders.length, page: 1, limit: 10, totalPages: 1 };
  }
}

export class MockUserRepository {
  async findById(id: string): Promise<any> {
    return mockData.users.find((u: any) => u.id === id) || null;
  }
  async findByIdAsService(id: string): Promise<any> {
    return this.findById(id);
  }
  async findByEmail(email: string): Promise<any> {
    return mockData.users.find((u: any) => u.email === email) || null;
  }
  async create(user: any): Promise<any> {
    const created = { id: `user-${mockData.users.length + 1}`, ...user };
    mockData.users.push(created);
    return created;
  }
  async updateRole(userId: string, role: string): Promise<void> {
    const user = mockData.users.find((u: any) => u.id === userId);
    if (user) user.role = role;
  }
}
