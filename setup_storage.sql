-- Create a storage bucket for products
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Set up access policies for the storage bucket
-- Policy to allow public access to view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'products' );

-- Policy to allow authenticated users (admin) to upload images
create policy "Admin Upload Access"
  on storage.objects for insert
  with check ( bucket_id = 'products' AND auth.role() = 'authenticated' );

-- Policy to allow admins to update/delete images
create policy "Admin Update Access"
  on storage.objects for update
  using ( bucket_id = 'products' AND auth.role() = 'authenticated' );

create policy "Admin Delete Access"
  on storage.objects for delete
  using ( bucket_id = 'products' AND auth.role() = 'authenticated' );
