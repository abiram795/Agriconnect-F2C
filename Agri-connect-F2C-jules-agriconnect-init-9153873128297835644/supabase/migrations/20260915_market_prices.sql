-- Migration: Create market_prices table for Agmarknet real data caching

CREATE TABLE IF NOT EXISTS market_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commodity VARCHAR(255) NOT NULL,
    variety VARCHAR(255),
    grade VARCHAR(100),
    market_name VARCHAR(255) NOT NULL,
    district VARCHAR(255),
    state VARCHAR(255),
    min_price DECIMAL(10, 2),          -- Converted price in ₹/kg
    max_price DECIMAL(10, 2),          -- Converted price in ₹/kg
    modal_price DECIMAL(10, 2),        -- Converted price in ₹/kg
    min_price_quintal DECIMAL(10, 2), -- Raw price in ₹/quintal
    max_price_quintal DECIMAL(10, 2), -- Raw price in ₹/quintal
    modal_price_quintal DECIMAL(10, 2),-- Raw price in ₹/quintal
    unit VARCHAR(50) DEFAULT 'kg',
    market_date DATE NOT NULL,
    source_name VARCHAR(255) DEFAULT 'Agmarknet (Ministry of Agriculture & Farmers Welfare, Govt of India)',
    source_reference TEXT,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_market_commodity_date UNIQUE (market_name, commodity, variety, market_date)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_market_prices_lookup ON market_prices(commodity, state, district);
CREATE INDEX IF NOT EXISTS idx_market_prices_date ON market_prices(market_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_commodity_market ON market_prices(commodity, market_name);

-- RLS Policies
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read market_prices" ON market_prices 
    FOR SELECT USING (true);

CREATE POLICY "Service role write market_prices" ON market_prices 
    FOR ALL USING (true);
