-- Migration: Add status and completed_at to products for history tracking

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'Completed', 'Removed')),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
