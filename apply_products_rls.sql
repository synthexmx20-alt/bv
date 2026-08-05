-- Enable RLS on products table
alter table public.products enable row level security;

-- Policy to allow EVERYONE to view products (Catalog needs this)
create policy "Public Read Access"
  on public.products for select
  using ( true );

-- Policy to allow ADMINS to insert products
create policy "Admin Insert Access"
  on public.products for insert
  with check ( 
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Policy to allow ADMINS to update products
create policy "Admin Update Access"
  on public.products for update
  using ( 
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Policy to allow ADMINS to delete products
create policy "Admin Delete Access"
  on public.products for delete
  using ( 
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
