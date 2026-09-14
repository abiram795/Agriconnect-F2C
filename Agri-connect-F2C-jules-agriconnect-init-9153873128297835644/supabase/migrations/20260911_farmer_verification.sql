-- Migration: Farmer Verification & Logs
-- Note: Requires the previous 20260910_initial_schema.sql to be applied first.

-- 1. Add new columns to farmers table
ALTER TABLE farmers
ADD COLUMN IF NOT EXISTS land_area VARCHAR(100),
ADD COLUMN IF NOT EXISTS acreage NUMERIC,
ADD COLUMN IF NOT EXISTS ownership_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS document_path TEXT,
ADD COLUMN IF NOT EXISTS admin_remarks TEXT,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- 2. Update the verification_status check constraint
-- We drop the old constraint if it exists (assuming it was named farmers_verification_status_check or similar)
-- In Postgres, it's safer to just alter the type or drop the constraint by name. 
-- Since we don't know the exact generated name, we can bypass strict check for the hackathon or attempt to drop it.
-- Let's just create a new one. To be safe, we will just use a generic text column or ensure the frontend handles the new statuses.
-- Actually, a better way is to update the domain or constraint, but let's just leave the column as is if it's a VARCHAR(50).
-- The previous schema was: verification_status VARCHAR(50) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Mobile Verified', 'Admin Verified', 'Rejected')).
-- We'll add 'Correction Required' and 'Approved'. Since dropping an unnamed constraint is hard in a simple script, 
-- we'll alter the column type to drop the constraint, then re-add it.
ALTER TABLE farmers DROP CONSTRAINT IF EXISTS farmers_verification_status_check;
ALTER TABLE farmers ADD CONSTRAINT farmers_verification_status_check CHECK (verification_status IN ('Pending', 'Mobile Verified', 'Admin Verified', 'Approved', 'Rejected', 'Correction Required', 'Under Verification'));

-- 3. Create verification_logs table
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. RLS Policies for farmer_documents bucket (Note: Buckets must be created via the UI or seed.sql)
-- We will instruct the user to create the bucket manually as requested.
