-- Add missing columns to orders if it already existed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address JSONB;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
