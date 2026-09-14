-- -----------------------------------------------------------------------------
-- AGRICONNECT CITY HUB ARCHITECTURE MIGRATION
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. City Hubs Table
CREATE TABLE IF NOT EXISTS hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    locality VARCHAR(255),
    latitude FLOAT,
    longitude FLOAT,
    operating_cost_per_kg DECIMAL(10, 2) DEFAULT 8.00,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hub Workers Table
CREATE TABLE IF NOT EXISTS hub_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hub_id VARCHAR(50) REFERENCES hubs(hub_id) ON DELETE CASCADE,
    assigned_city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Hub Stock Transfers (Farmer -> Hub)
CREATE TABLE IF NOT EXISTS hub_stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    hub_id VARCHAR(50) REFERENCES hubs(hub_id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity_sent DECIMAL(10, 2) NOT NULL,
    quantity_received DECIMAL(10, 2) DEFAULT 0.0,
    farmer_price DECIMAL(10, 2) NOT NULL,
    hub_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Awaiting Receipt', -- 'Awaiting Receipt', 'Confirmed Received', 'Rejected'
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP WITH TIME ZONE
);

-- 4. Hub Inventory Table (Received & Available at Hub)
CREATE TABLE IF NOT EXISTS hub_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id VARCHAR(50) REFERENCES hubs(hub_id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    transfer_id UUID REFERENCES hub_stock_transfers(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity_received DECIMAL(10, 2) NOT NULL,
    quantity_sold DECIMAL(10, 2) DEFAULT 0.0,
    quantity_remaining DECIMAL(10, 2) NOT NULL,
    farmer_price DECIMAL(10, 2) NOT NULL,
    operating_cost_component DECIMAL(10, 2) DEFAULT 8.00,
    hub_price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    status VARCHAR(50) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'OUT_OF_STOCK'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public Hubs Visibility" ON hubs FOR SELECT USING (true);
CREATE POLICY "Hub Workers Visibility" ON hub_workers FOR SELECT USING (true);
CREATE POLICY "Hub Transfers Visibility" ON hub_stock_transfers FOR ALL USING (true);
CREATE POLICY "Hub Inventory Visibility" ON hub_inventory FOR ALL USING (true);

-- Pre-seed Default Hubs
INSERT INTO hubs (hub_id, name, city, district, locality, latitude, longitude, operating_cost_per_kg)
VALUES 
    ('HUB-CBE-01', 'Coimbatore Central City Hub', 'Coimbatore', 'Coimbatore', 'Gandhipuram', 11.0168, 76.9558, 8.00),
    ('HUB-ANR-02', 'Annur Aggregation Hub', 'Annur', 'Coimbatore', 'Annur', 11.2333, 77.1000, 6.00),
    ('HUB-PLC-03', 'Pollachi City Hub', 'Pollachi', 'Coimbatore', 'Pollachi', 10.6609, 77.0048, 7.00)
ON CONFLICT (hub_id) DO NOTHING;
