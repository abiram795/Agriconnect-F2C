-- -----------------------------------------------------------------------------
-- AGRICONNECT CITY HUB RECEIPT AND BILLING SYSTEM MIGRATION
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Incoming Product Receipts Table
CREATE TABLE IF NOT EXISTS hub_incoming_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    hub_id VARCHAR(50) REFERENCES hubs(hub_id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    farmer_price DECIMAL(10, 2) NOT NULL,
    operating_cost_component DECIMAL(10, 2) DEFAULT 8.00,
    hub_price DECIMAL(10, 2) NOT NULL,
    source_reference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'RECEIVED & VERIFIED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hub Sales Receipts Table (with mandatory Farmer Attribution)
CREATE TABLE IF NOT EXISTS hub_sales_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    hub_id VARCHAR(50) REFERENCES hubs(hub_id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    hub_inventory_id UUID REFERENCES hub_inventory(id) ON DELETE SET NULL,
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE, -- FARMER ATTRIBUTION LINK
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    consumer_reference VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'PAID',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Receipt Counters Table (for robust unique sequential receipt numbers)
CREATE TABLE IF NOT EXISTS hub_receipt_counters (
    counter_type VARCHAR(20) PRIMARY KEY, -- 'INCOMING' or 'SALE'
    year INT NOT NULL,
    last_seq INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE hub_incoming_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_sales_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_receipt_counters ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Incoming Receipts Visibility" ON hub_incoming_receipts FOR ALL USING (true);
CREATE POLICY "Sales Receipts Visibility" ON hub_sales_receipts FOR ALL USING (true);
CREATE POLICY "Receipt Counters Access" ON hub_receipt_counters FOR ALL USING (true);
