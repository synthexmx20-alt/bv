-- Migration to create the whatsapp_messages table for live chat

CREATE TABLE public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'document', etc.
    content TEXT, -- For text messages or media URLs
    media_url TEXT, -- Explicit column for media, if preferred
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- For storing raw Meta Webhook data if needed
);

-- Index for faster querying by phone number (since we'll filter by chat)
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages (phone_number);

-- Index for ordering by time
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages (created_at);

-- RLS Policies (assuming admin access only for now)
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated admins" ON public.whatsapp_messages
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Allow insert access for standard users (like N8N service account)" ON public.whatsapp_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
