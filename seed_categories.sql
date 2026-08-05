INSERT INTO public.categories (name) VALUES
('Baúles o Cofres'),
('Cajas Circulares'),
('Cajas Corazón'),
('Cajas Cuadradas'),
('Cajas Octagonal'),
('Cajas Ovaladas'),
('Canastas'),
('Cerámica y Concreto'),
('Condolencias'),
('Esculturas'),
('Floreros'),
('Graduación'),
('Ramos o Bouquets')
ON CONFLICT (name) DO NOTHING;
