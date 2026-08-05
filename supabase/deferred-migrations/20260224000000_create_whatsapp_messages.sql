-- Deferred: this belongs to the separate CRM project and references public.users,
-- which does not exist in the storefront database. It must not be applied here.

CREATE TABLE public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages (phone_number);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages (created_at);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated admins" ON public.whatsapp_messages
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Allow insert access for standard users (like N8N service account)" ON public.whatsapp_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
