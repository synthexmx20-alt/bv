-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key text PRIMARY KEY,
    value text,
    description text
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.site_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for authenticated users" ON public.site_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default values
INSERT INTO public.site_settings (key, value, description)
VALUES 
    ('whatsapp_number', '526141234567', 'Número de WhatsApp para contacto'),
    ('facebook_url', 'https://facebook.com', 'URL de Facebook'),
    ('instagram_url', 'https://instagram.com', 'URL de Instagram')
ON CONFLICT (key) DO NOTHING;
