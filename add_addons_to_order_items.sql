ALTER TABLE order_items ADD COLUMN addons jsonb DEFAULT '[]'::jsonb;
