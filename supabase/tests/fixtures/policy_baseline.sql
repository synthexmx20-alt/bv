create schema if not exists auth;
create schema if not exists storage;

create or replace function auth.uid()
returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create or replace function auth.role()
returns text language sql stable
as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;

grant usage on schema auth to authenticated, service_role;
grant execute on function auth.uid(), auth.role() to authenticated, service_role;

create table public.profiles (
  id uuid primary key,
  full_name text,
  phone text,
  role text default 'customer'
);
alter table public.profiles enable row level security;

create policy "Users can view own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "Users can insert their own profile."
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile."
on public.profiles for update to authenticated
using (auth.uid() = id);

create or replace function public.is_admin()
returns boolean language plpgsql security definer
as $$
begin
  return exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')
  );
  return new;
end;
$$;

create table public.unique_visitors (
  id uuid primary key,
  visitor_id text,
  last_visit timestamptz,
  user_agent text,
  created_at timestamptz
);
alter table public.unique_visitors enable row level security;
create policy "Allow authenticated read access"
on public.unique_visitors for select to authenticated using (true);

create table storage.objects (
  id uuid primary key,
  bucket_id text,
  name text
);
grant usage on schema storage to authenticated, service_role;
alter table storage.objects enable row level security;
create policy "Admin Upload Access"
on storage.objects for insert to authenticated
with check (bucket_id = 'products' and auth.role() = 'authenticated');
create policy "Admin Update Access"
on storage.objects for update to authenticated
using (bucket_id = 'products' and auth.role() = 'authenticated');
create policy "Admin Delete Access"
on storage.objects for delete to authenticated
using (bucket_id = 'products' and auth.role() = 'authenticated');

grant all on public.profiles, public.unique_visitors, storage.objects to authenticated, service_role;

insert into public.profiles (id, full_name, role) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Customer', 'customer'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Admin', 'admin');
insert into public.unique_visitors (id, visitor_id)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'visitor-1');
