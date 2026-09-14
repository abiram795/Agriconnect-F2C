-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    farmer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Order Placed' CHECK (status IN ('Order Placed', 'Farmer Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled')),
    fulfillment_method VARCHAR(50) CHECK (fulfillment_method IN ('Self Pickup', 'Farmer Delivery', 'Delivery Partner')),
    delivery_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create deliveries table for Delivery Partners
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    delivery_partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Delivery Requested' CHECK (status IN ('Delivery Requested', 'Partner Accepted', 'Pickup Assigned', 'Picked Up', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled')),
    pickup_location JSONB,
    delivery_location JSONB,
    distance_km DECIMAL(10, 2),
    delivery_fee DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add IVR support mapping to farmers (assuming users table stores roles)
CREATE TABLE IF NOT EXISTS farmer_ivr (
    farmer_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    registered_mobile VARCHAR(20) UNIQUE NOT NULL,
    ivr_identifier VARCHAR(50) UNIQUE NOT NULL,
    ivr_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at trigger for orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_modtime
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_modtime
BEFORE UPDATE ON deliveries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
