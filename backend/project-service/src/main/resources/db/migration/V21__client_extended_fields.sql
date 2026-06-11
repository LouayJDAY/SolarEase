-- Client profile extended fields (city, postal code, type, notes)
ALTER TABLE items_client ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE items_client ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE items_client ADD COLUMN IF NOT EXISTS client_type VARCHAR(50);
ALTER TABLE items_client ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);
