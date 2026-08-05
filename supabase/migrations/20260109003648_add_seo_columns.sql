-- Add meta_title and meta_description columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT;
