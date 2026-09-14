-- Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_area VARCHAR(255),
    vehicle_type VARCHAR(50),
    driving_license_path TEXT,
    verification_status VARCHAR(50) DEFAULT 'Pending',
    is_available BOOLEAN DEFAULT true,
    current_location JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bulk Requests Table
CREATE TABLE IF NOT EXISTS bulk_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    requested_quantity DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending Verification',
    quoted_price DECIMAL(10, 2),
    farmer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update Orders to track assigned delivery partner
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_review_required BOOLEAN DEFAULT false;

-- Add RLS Policies
-- (For demo purposes, we will ensure basic row-level security if enabled, otherwise just structural consistency)
NOTIFY pgrst, 'reload schema';
