-- ==============================================================================
-- PRODUCTION E-COMMERCE STARTER - POSTGRESQL / SUPABASE INITIAL SCHEMA
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin', 'super_admin');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived', 'out_of_stock');
CREATE TYPE inventory_transaction_type AS ENUM ('purchase', 'sale', 'refund', 'adjustment', 'cancellation', 'reservation');
CREATE TYPE coupon_discount_type AS ENUM ('percentage', 'fixed');
CREATE TYPE order_status AS ENUM (
    'pending',
    'payment_pending',
    'paid',
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded',
    'failed'
);
CREATE TYPE payment_status AS ENUM (
    'pending',
    'authorized',
    'captured',
    'failed',
    'refunded',
    'partially_refunded'
);
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. USERS (Profiles synchronized with Supabase Auth or standalone)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATEGORIES (Supports Nested Hierarchy)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    short_description TEXT NOT NULL DEFAULT '',
    sku TEXT UNIQUE NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
    cost_price NUMERIC(12, 2) CHECK (cost_price IS NULL OR cost_price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 5,
    status product_status NOT NULL DEFAULT 'draft',
    featured BOOLEAN NOT NULL DEFAULT false,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    seo_title TEXT,
    seo_description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured);

-- 5. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT DEFAULT '',
    display_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- 6. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
    cost_price NUMERIC(12, 2) CHECK (cost_price IS NULL OR cost_price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    barcode TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"size": "L", "color": "Emerald"}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

-- 7. INVENTORY TRANSACTIONS
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity_change INT NOT NULL,
    transaction_type inventory_transaction_type NOT NULL,
    reference_id TEXT, -- e.g. Order ID, Manual Adjustment ID
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_variant ON inventory_transactions(variant_id);

-- 8. CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'shipping', -- 'shipping' | 'billing'
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    address_1 TEXT NOT NULL,
    address_2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- 9. CARTS & CART ITEMS
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    guest_token TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_guest ON carts(guest_token);

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, product_id, variant_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- 10. COUPONS
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type coupon_discount_type NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_value NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    usage_limit INT,
    per_customer_limit INT DEFAULT 1,
    product_ids UUID[] DEFAULT ARRAY[]::UUID[],
    category_ids UUID[] DEFAULT ARRAY[]::UUID[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);

-- 11. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_email TEXT,
    guest_phone TEXT,
    status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    shipping_method JSONB NOT NULL,
    coupon_code TEXT,
    coupon_discount NUMERIC(12, 2) DEFAULT 0,
    customer_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- 12. ORDER ITEMS (Immutable snapshot of product data)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT NOT NULL,
    price_snapshot NUMERIC(12, 2) NOT NULL,
    image_snapshot TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(12, 2) NOT NULL,
    attributes_snapshot JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- 13. ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_history_order ON order_status_history(order_id);

-- 14. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_provider VARCHAR(50) NOT NULL, -- 'razorpay' | 'stripe' | 'manual'
    provider_order_id TEXT,
    transaction_id TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'pending',
    signature TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_provider_order ON payments(provider_order_id);

-- 15. REFUNDS
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    provider_refund_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. WISHLISTS
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);

-- 17. STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. HOMEPAGE SECTIONS
CREATE TABLE IF NOT EXISTS homepage_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_type VARCHAR(50) NOT NULL, -- 'hero', 'featured_products', 'categories', 'banner', 'collection', 'testimonials', 'newsletter', 'cta', 'brand_story'
    title TEXT,
    subtitle TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_url TEXT,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    display_order INT NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_homepage_sections_order ON homepage_sections(display_order);

-- 19. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL,
    status review_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON reviews(product_id);

-- 20. ATOMIC INVENTORY REDUCTION FUNCTION (Race Condition Prevention)
CREATE OR REPLACE FUNCTION decrement_product_stock_atomic(
    p_product_id UUID,
    p_variant_id UUID,
    p_quantity INT,
    p_reference_id TEXT,
    p_note TEXT DEFAULT 'Order Sale'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_stock INT;
BEGIN
    IF p_variant_id IS NOT NULL THEN
        -- Lock variant row
        SELECT stock INTO v_current_stock
        FROM product_variants
        WHERE id = p_variant_id
        FOR UPDATE;

        IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
            RETURN FALSE;
        END IF;

        -- Update variant stock
        UPDATE product_variants
        SET stock = stock - p_quantity,
            updated_at = NOW()
        WHERE id = p_variant_id;

        -- Record transaction
        INSERT INTO inventory_transactions (product_id, variant_id, quantity_change, transaction_type, reference_id, note)
        VALUES (p_product_id, p_variant_id, -p_quantity, 'sale', p_reference_id, p_note);

        -- Also update total product stock
        UPDATE products
        SET stock_quantity = stock_quantity - p_quantity,
            updated_at = NOW()
        WHERE id = p_product_id;

        RETURN TRUE;
    ELSE
        -- Lock product row
        SELECT stock_quantity INTO v_current_stock
        FROM products
        WHERE id = p_product_id
        FOR UPDATE;

        IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
            RETURN FALSE;
        END IF;

        -- Update product stock
        UPDATE products
        SET stock_quantity = stock_quantity - p_quantity,
            updated_at = NOW()
        WHERE id = p_product_id;

        -- Record transaction
        INSERT INTO inventory_transactions (product_id, variant_id, quantity_change, transaction_type, reference_id, note)
        VALUES (p_product_id, NULL, -p_quantity, 'sale', p_reference_id, p_note);

        RETURN TRUE;
    END IF;
END;
$$;

-- 21. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Products & Categories are publicly viewable if active
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (status = 'active');
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active categories" ON categories FOR SELECT USING (is_active = true);
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product images" ON product_images FOR SELECT USING (true);
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active variants" ON product_variants FOR SELECT USING (is_active = true);
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view enabled sections" ON homepage_sections FOR SELECT USING (is_enabled = true);
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view public store settings" ON store_settings FOR SELECT USING (true);

-- User Policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Address Policies
CREATE POLICY "Users can manage their own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

-- Order Policies
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Wishlist Policies
CREATE POLICY "Users can manage their own wishlist" ON wishlists FOR ALL USING (auth.uid() = user_id);

-- Cart Policies
CREATE POLICY "Users can manage their own carts" ON carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their cart items" ON cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

-- 22. WEBHOOK IDEMPOTENCY
CREATE TABLE IF NOT EXISTS processed_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, event_id)
);

-- 23. COUPON USAGE TRACKING
CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(coupon_id, user_id) -- Assuming per_customer_limit is 1 for now, or just an index
);
CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);

-- 24. AUTO-CREATE PUBLIC USER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

