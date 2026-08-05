-- Create table for tracking unique visitors
create table if not exists public.unique_visitors (
  id uuid default gen_random_uuid() primary key,
  visitor_id text not null,
  last_visit timestamp with time zone default timezone('utc'::text, now()) not null,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_visitor_id unique(visitor_id)
);

-- Enable RLS
alter table public.unique_visitors enable row level security;

-- Policy: Allow anonymous users to insert/upsert their own visit
-- We use a relaxed policy here: valid visitor_id allows insert/update.
-- Since we want anyone to be able to increment, we allow public insert.
create policy "Allow public insert and update to unique_visitors"
  on public.unique_visitors
  for all
  using (true)
  with check (true);

-- Policy: Allow admins to view all data
-- Assuming admins are authenticated users or specific role.
-- For now, we'll allow authenticated read to make it simple for the admin panel.
create policy "Allow authenticated read access"
  on public.unique_visitors
  for select
  to authenticated
  using (true);
