\set ON_ERROR_STOP on

set role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', false);
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', false);

do $$
begin
  begin
    update public.profiles
    set role = 'admin'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'customer role escalation unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  if (select role from public.profiles where id = auth.uid()) <> 'customer' then
    raise exception 'customer role changed';
  end if;

  begin
    insert into storage.objects (id, bucket_id, name)
    values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'products', 'attack.webp');
    raise exception 'customer storage write unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  if (select count(*) from public.unique_visitors) <> 0 then
    raise exception 'customer can read visitor analytics';
  end if;
end;
$$;

reset role;
set role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', false);
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', false);

insert into storage.objects (id, bucket_id, name)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'products', 'admin.webp');

do $$
begin
  if (select count(*) from public.unique_visitors) <> 1 then
    raise exception 'admin cannot read visitor analytics';
  end if;
end;
$$;

reset role;

do $$
begin
  if pg_get_functiondef('public.handle_new_user()'::regprocedure)
    like '%raw_user_meta_data ->> ''role''%' then
    raise exception 'signup trigger still trusts role metadata';
  end if;

  if not exists (
    select 1 from pg_proc
    where oid = 'public.is_admin()'::regprocedure
      and prosecdef
      and proconfig @> array['search_path=pg_catalog, public']
  ) then
    raise exception 'is_admin is not hardened';
  end if;
end;
$$;

select 'policy security checks passed' as result;
