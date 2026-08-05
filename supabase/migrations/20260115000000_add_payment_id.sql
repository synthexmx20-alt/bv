-- Add payment_id column to orders table
-- This is required for the MercadoPago Webhook to link the transaction ID

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_id') THEN
        ALTER TABLE public.orders ADD COLUMN payment_id text;
    END IF;
END $$;
