-- Drop the old constraint that points to consumers
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_consumer_id_fkey;

-- Add the correct constraint pointing to users table
ALTER TABLE orders ADD CONSTRAINT orders_consumer_id_fkey FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE SET NULL;

-- Alternatively, if there IS a consumers table and it's required, we can insert the missing consumer:
INSERT INTO consumers (id) 
SELECT id FROM users WHERE id = '9aedb64f-77bf-43c3-a33c-c101403c1225'
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
