-- Remise et sous-total sur les factures
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

UPDATE invoices
SET subtotal = amount,
    discount_percent = COALESCE(discount_percent, 0),
    discount_amount = COALESCE(discount_amount, 0)
WHERE subtotal IS NULL;
