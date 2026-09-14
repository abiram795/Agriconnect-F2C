-- Create consumer_addresses table
CREATE TABLE IF NOT EXISTS consumer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL, -- e.g., 'Home', 'College', 'Other'
    full_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    address_line TEXT NOT NULL,
    locality VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20) NOT NULL,
    landmark VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure max 3 addresses per consumer via Trigger
CREATE OR REPLACE FUNCTION check_max_addresses()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM consumer_addresses WHERE consumer_id = NEW.consumer_id) >= 3 THEN
        RAISE EXCEPTION 'Maximum 3 addresses allowed per consumer';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_addresses
BEFORE INSERT ON consumer_addresses
FOR EACH ROW EXECUTE FUNCTION check_max_addresses();
