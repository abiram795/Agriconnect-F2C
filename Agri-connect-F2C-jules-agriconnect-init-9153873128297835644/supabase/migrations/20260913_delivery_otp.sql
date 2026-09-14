-- Add Delivery OTP fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_otp_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS delivery_otp_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_otp_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_otp_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_otp_verified_by UUID;
