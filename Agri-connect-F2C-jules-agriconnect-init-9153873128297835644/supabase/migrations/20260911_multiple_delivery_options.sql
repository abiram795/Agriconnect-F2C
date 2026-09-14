ALTER TABLE products DROP CONSTRAINT IF EXISTS products_delivery_preference_check;
ALTER TABLE products ALTER COLUMN delivery_preference TYPE TEXT;
