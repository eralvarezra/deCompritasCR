-- =============================================
-- SHIPPING METHODS TABLE - MIGRATION
-- =============================================
-- Run this only if you already have the base schema installed

-- Create shipping_methods table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipping_methods_key ON shipping_methods(key);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_sort_order ON shipping_methods(sort_order);

-- Enable RLS
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read active shipping methods"
    ON shipping_methods FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Allow service role full access on shipping_methods"
    ON shipping_methods FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER shipping_methods_updated_at
    BEFORE UPDATE ON shipping_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Seed default data
INSERT INTO shipping_methods (key, name, description, price, is_active, sort_order) VALUES
    ('pickup', 'Recoger en tienda', 'Recoge tu pedido sin costo adicional', 0, true, 1),
    ('gam', 'Correos de Costa Rica - Dentro del GAM', 'Entrega en 2-3 días hábiles dentro del Gran Área Metropolitana', 2500, true, 2),
    ('outside_gam', 'Correos de Costa Rica - Fuera del GAM', 'Entrega en 3-5 días hábiles fuera del Gran Área Metropolitana', 3500, true, 3)
ON CONFLICT (key) DO NOTHING;

-- Insert default preorder delivery time setting
INSERT INTO settings (key, value) VALUES
    ('preorder_delivery_time', '1.5 semanas')
ON CONFLICT (key) DO NOTHING;