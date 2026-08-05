-- Create addons table
CREATE TABLE IF NOT EXISTS public.addons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    type TEXT NOT NULL, -- 'mariposa', 'corona', 'banda', 'extra'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.addons
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for authenticated users" ON public.addons
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default data
INSERT INTO public.addons (name, price, type) VALUES
    ('1 Mariposa', 20, 'mariposa'),
    ('3 Mariposas', 50, 'mariposa'),
    ('Corona Chica', 50, 'corona'),
    ('Corona Mediana', 100, 'corona'),
    ('Corona Grande', 150, 'corona'),
    ('Banda Personalizada', 80, 'banda');
