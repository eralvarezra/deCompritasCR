-- =============================================
-- DECOMPRITAS DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CATEGORIES TABLE (must be first due to foreign key)
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(50),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    discount_percentage INTEGER DEFAULT 0,
    category VARCHAR(50) DEFAULT 'other',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- =============================================
-- PRODUCT VARIANTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_default ON product_variants(product_id, is_default);

-- =============================================
-- PRODUCT IMAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);

-- =============================================
-- WEEK CYCLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS week_cycles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    report_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_week_cycles_status ON week_cycles(status);
CREATE INDEX IF NOT EXISTS idx_week_cycles_dates ON week_cycles(start_date, end_date);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(20),
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    items JSONB NOT NULL DEFAULT '[]',
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_with_shipping DECIMAL(10, 2),
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    advance_payment DECIMAL(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    week_cycle_id UUID REFERENCES week_cycles(id),
    province VARCHAR(100),
    canton VARCHAR(100),
    district VARCHAR(100),
    exact_address TEXT,
    shipping_method VARCHAR(50) DEFAULT 'pickup',
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    payment_method VARCHAR(100),
    payment_details JSONB,
    payment_proof_url TEXT,
    billing_same_as_shipping BOOLEAN DEFAULT TRUE,
    billing_name VARCHAR(255),
    billing_province VARCHAR(100),
    billing_canton VARCHAR(100),
    billing_district VARCHAR(100),
    billing_exact_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- =============================================
-- PAYMENT METHODS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    account_info TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- SHIPPING METHODS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS shipping_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shipping_methods_key ON shipping_methods(key);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_sort_order ON shipping_methods(sort_order);

-- =============================================
-- SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

-- Products: Allow public read access
CREATE POLICY "Allow public read access on products"
    ON products FOR SELECT
    TO anon, authenticated
    USING (true);

-- Products: Allow service role full access
CREATE POLICY "Allow service role full access on products"
    ON products FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Orders: Allow public insert
CREATE POLICY "Allow public insert on orders"
    ON orders FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Orders: Allow service role full access
CREATE POLICY "Allow service role full access on orders"
    ON orders FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Settings: Allow service role full access
CREATE POLICY "Allow service role full access on settings"
    ON settings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Week Cycles: Allow service role full access
CREATE POLICY "Allow service role full access on week_cycles"
    ON week_cycles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Week Cycles: Allow public read access
CREATE POLICY "Allow public read access on week_cycles"
    ON week_cycles FOR SELECT
    TO anon, authenticated
    USING (true);

-- Categories: Allow public read access
CREATE POLICY "Allow public read access on categories"
    ON categories FOR SELECT
    TO anon, authenticated
    USING (true);

-- Categories: Allow service role full access
CREATE POLICY "Allow service role full access on categories"
    ON categories FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Payment Methods: Allow public read access on active methods
CREATE POLICY "Allow public read active payment methods"
    ON payment_methods FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Payment Methods: Allow service role full access
CREATE POLICY "Allow service role full access on payment_methods"
    ON payment_methods FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Shipping Methods: Allow public read access on active methods
CREATE POLICY "Allow public read active shipping methods"
    ON shipping_methods FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Shipping Methods: Allow service role full access
CREATE POLICY "Allow service role full access on shipping_methods"
    ON shipping_methods FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Product Variants: Allow public read access
CREATE POLICY "Allow public read access on product_variants"
    ON product_variants FOR SELECT
    TO anon, authenticated
    USING (true);

-- Product Variants: Allow service role full access
CREATE POLICY "Allow service role full access on product_variants"
    ON product_variants FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Product Images: Allow public read access
CREATE POLICY "Allow public read access on product_images"
    ON product_images FOR SELECT
    TO anon, authenticated
    USING (true);

-- Product Images: Allow service role full access
CREATE POLICY "Allow service role full access on product_images"
    ON product_images FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER week_cycles_updated_at
    BEFORE UPDATE ON week_cycles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shipping_methods_updated_at
    BEFORE UPDATE ON shipping_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- SEED DATA (Optional)
-- =============================================

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('telegram_bot_token', ''),
    ('telegram_chat_id', '')
ON CONFLICT (key) DO NOTHING;

-- Insert default payment methods
INSERT INTO payment_methods (name, description, instructions, account_info, is_active, sort_order) VALUES
    ('Sinpe Móvil', 'Pago rápido mediante Sinpe Móvil', 'Envía el monto exacto al número:', '8888-8888', true, 1),
    ('Transferencia Bancaria', 'Transferencia a cuenta bancaria', 'Realiza la transferencia a:', 'Banco Nacional - Cuenta: 1234-5678-90', true, 2)
ON CONFLICT DO NOTHING;

-- Insert default shipping methods
INSERT INTO shipping_methods (key, name, description, price, is_active, sort_order) VALUES
    ('pickup', 'Recoger en tienda', 'Recoge tu pedido sin costo adicional', 0, true, 1),
    ('gam', 'Correos de Costa Rica - Dentro del GAM', 'Entrega en 2-3 días hábiles dentro del Gran Área Metropolitana', 2500, true, 2),
    ('outside_gam', 'Correos de Costa Rica - Fuera del GAM', 'Entrega en 3-5 días hábiles fuera del Gran Área Metropolitana', 3500, true, 3)
ON CONFLICT (key) DO NOTHING;