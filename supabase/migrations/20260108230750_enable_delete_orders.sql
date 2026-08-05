-- Enable delete access for authenticated users on orders table
CREATE POLICY "Enable delete access for authenticated users" ON public.orders
    FOR DELETE USING (auth.role() = 'authenticated');
