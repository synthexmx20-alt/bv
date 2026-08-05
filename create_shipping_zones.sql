-- Create shipping_zones table
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zip_code TEXT NOT NULL,
    colony TEXT NOT NULL,
    municipality TEXT DEFAULT 'Chihuahua',
    status TEXT CHECK (status IN ('standard', 'surcharge', 'blocked')) DEFAULT 'standard',
    surcharge NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for faster lookup by ZIP
CREATE INDEX IF NOT EXISTS idx_shipping_zones_zip ON public.shipping_zones(zip_code);

-- Enable Row Level Security (RLS)
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public can read shipping zones to validate their address
CREATE POLICY "Public read access" ON public.shipping_zones
    FOR SELECT TO public USING (true);

-- 2. Admins can manage shipping zones
CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
