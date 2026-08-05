begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    'customer'
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.enforce_profile_role_authority()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_can_manage_roles boolean := auth.role() = 'service_role' or public.is_admin();
begin
  if tg_op = 'INSERT' and not v_can_manage_roles then
    new.role := 'customer';
  elsif tg_op = 'UPDATE'
    and new.role is distinct from old.role
    and not v_can_manage_roles then
    raise exception using
      errcode = '42501',
      message = 'PROFILE_ROLE_CHANGE_FORBIDDEN';
  end if;

  if new.role not in ('customer', 'admin') then
    raise exception using
      errcode = '23514',
      message = 'PROFILE_ROLE_INVALID';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_role_authority() from public, anon, authenticated;

drop trigger if exists enforce_profile_role_authority on public.profiles;
create trigger enforce_profile_role_authority
before insert or update of role on public.profiles
for each row execute function public.enforce_profile_role_authority();

drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id and role = 'customer');

drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admin Upload Access" on storage.objects;
drop policy if exists "Admin Update Access" on storage.objects;
drop policy if exists "Admin Delete Access" on storage.objects;

create policy "Admin Upload Access"
on storage.objects for insert to authenticated
with check (bucket_id = 'products' and public.is_admin());

create policy "Admin Update Access"
on storage.objects for update to authenticated
using (bucket_id = 'products' and public.is_admin())
with check (bucket_id = 'products' and public.is_admin());

create policy "Admin Delete Access"
on storage.objects for delete to authenticated
using (bucket_id = 'products' and public.is_admin());

drop policy if exists "Allow authenticated read access" on public.unique_visitors;
drop policy if exists "Admins can read unique visitors" on public.unique_visitors;
create policy "Admins can read unique visitors"
on public.unique_visitors for select to authenticated
using (public.is_admin());

commit;
