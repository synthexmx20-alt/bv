INSERT INTO site_settings (key, value, description)
VALUES 
    ('site_description', 'Florería exclusiva en Chihuahua. Envíos a domicilio de ramos buchones, rosas premium y arreglos de lujo. Calidad garantizada para San Valentín y cualquier ocasión especial.', 'Meta Descripción para SEO (Buscadores)')
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value;
