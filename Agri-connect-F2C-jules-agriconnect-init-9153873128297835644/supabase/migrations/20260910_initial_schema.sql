-- Initial Schema for AgriConnect F2C

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Base Users Table (authentication managed by Supabase Auth, this stores role data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE, -- Link to auth.users
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'consumer', 'delivery_partner', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Farmers Profile
CREATE TABLE farmers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state VARCHAR(255),
    district VARCHAR(255),
    village VARCHAR(255),
    location JSONB, -- For generic location data, lat/lng
    farm_size VARCHAR(50),
    languages VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Mobile Verified', 'Admin Verified', 'Rejected')),
    is_ivr_user BOOLEAN DEFAULT FALSE,
    farmer_delivery_enabled BOOLEAN DEFAULT FALSE,
    delivery_radius_km INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consumers Profile
CREATE TABLE consumers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    address TEXT,
    location JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Partners Profile
CREATE TABLE delivery_partners (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    service_radius_km INTEGER,
    vehicle_type VARCHAR(100),
    verification_status VARCHAR(50) DEFAULT 'Pending',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admins Profile
CREATE TABLE admins (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Basic RLS Policies (Draft for now)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read roles, but only specific modifications. (simplified for mock)
CREATE POLICY "Users can read all basic user info" ON users FOR SELECT USING (true);
CREATE POLICY "Farmers can read farmers" ON farmers FOR SELECT USING (true);
CREATE POLICY "Consumers can read consumers" ON consumers FOR SELECT USING (true);
CREATE POLICY "Delivery Partners can read" ON delivery_partners FOR SELECT USING (true);
CREATE POLICY "Admins can read" ON admins FOR SELECT USING (true);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Products (Listings)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(user_id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity_available DECIMAL(10, 2) NOT NULL,
    delivery_preference VARCHAR(50) CHECK (delivery_preference IN ('Self Pickup', 'Farmer Delivery', 'Delivery Partner')),
    verification_state VARCHAR(50) DEFAULT 'Pending Review',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Image Analysis Results
CREATE TABLE image_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(user_id),
    image_url TEXT NOT NULL,
    analysis_result JSONB NOT NULL,
    confidence DECIMAL(5, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Farmer Inventory (Historical Tracking & aggregation for IVR etc)
CREATE TABLE farmer_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(user_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    source VARCHAR(50) DEFAULT 'App', -- 'App' or 'IVR'
    quantity_added DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Farmers can read their analysis" ON image_analysis FOR SELECT USING (true);
CREATE POLICY "Farmers can read their inventory" ON farmer_inventory FOR SELECT USING (true);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_id UUID REFERENCES consumers(user_id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Order Placed' CHECK (status IN ('Order Placed', 'Farmer Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled')),
    delivery_method VARCHAR(50), -- 'Self Pickup', 'Farmer Delivery', 'Delivery Partner'
    delivery_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    farmer_id UUID REFERENCES farmers(user_id),
    quantity DECIMAL(10, 2) NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deliveries
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    delivery_partner_id UUID REFERENCES delivery_partners(user_id),
    status VARCHAR(50) DEFAULT 'Pending Assignment' CHECK (status IN ('Pending Assignment', 'Accepted', 'Picked Up', 'In Transit', 'Delivered', 'Failed')),
    pickup_location JSONB,
    delivery_location JSONB,
    fee DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE REFERENCES orders(id),
    consumer_id UUID REFERENCES consumers(user_id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Farmer Payouts
CREATE TABLE farmer_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    farmer_id UUID REFERENCES farmers(user_id),
    customer_amount DECIMAL(10, 2) NOT NULL,
    delivery_charge DECIMAL(10, 2) DEFAULT 0,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    final_payout DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Settled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bulk / Community Order Requests
CREATE TABLE bulk_order_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_id UUID REFERENCES consumers(user_id),
    reason TEXT NOT NULL,
    required_quantity DECIMAL(10, 2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    required_date DATE NOT NULL,
    delivery_location TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform Settings (Configurable limits etc.)
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default daily limit
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES ('DAILY_CONSUMER_LIMIT_KG', '10', 'Maximum kg per product category per consumer per day');

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_order_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can see their order items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Delivery visibility" ON deliveries FOR SELECT USING (true);
CREATE POLICY "Payment visibility" ON payments FOR SELECT USING (true);
CREATE POLICY "Farmer payout visibility" ON farmer_payouts FOR SELECT USING (true);
CREATE POLICY "Bulk requests visibility" ON bulk_order_requests FOR SELECT USING (true);
CREATE POLICY "Public platform settings" ON platform_settings FOR SELECT USING (true);

-- IVR Registered Farmers (Pre-registered via center before full account)
CREATE TABLE ivr_farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    village VARCHAR(255),
    preferred_language VARCHAR(50) DEFAULT 'Tamil',
    is_registered_in_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- IVR Call Logs
CREATE TABLE ivr_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_sid VARCHAR(255) UNIQUE NOT NULL,
    caller_phone VARCHAR(20) NOT NULL,
    farmer_id UUID REFERENCES farmers(user_id),
    status VARCHAR(50),
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- IVR Interactions (Specific actions taken during a call)
CREATE TABLE ivr_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID REFERENCES ivr_calls(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50), -- e.g., 'Add Product', 'Check Orders'
    extracted_data JSONB, -- Product name, qty, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Recommendations (Price/Demand)
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_category_id UUID REFERENCES categories(id),
    location_zone VARCHAR(100),
    recommendation_type VARCHAR(50) CHECK (recommendation_type IN ('Price', 'Demand', 'FoodWastage')),
    suggested_value JSONB,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Verification Logs (Admin auditing)
CREATE TABLE verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(user_id),
    target_type VARCHAR(50) CHECK (target_type IN ('Farmer', 'Product', 'BulkOrder', 'DeliveryPartner')),
    target_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'Approved', 'Rejected', 'Requested Info'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ivr_farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivr_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivr_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IVR farmers visibility" ON ivr_farmers FOR SELECT USING (true);
CREATE POLICY "IVR calls visibility" ON ivr_calls FOR SELECT USING (true);
CREATE POLICY "IVR interactions visibility" ON ivr_interactions FOR SELECT USING (true);
CREATE POLICY "Public AI recommendations" ON ai_recommendations FOR SELECT USING (true);
CREATE POLICY "Admin logs visibility" ON verification_logs FOR SELECT USING (true);
