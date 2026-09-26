-- MSSP Catalogue Builder: per-user catalogues, auth rate limiting and self-service account deletion.
-- Apply with the Supabase SQL editor or `npx supabase db push` (see README).

-- ---------------------------------------------------------------------------
-- Catalogues: one row per catalogue, the full catalogue stored as JSONB.
-- ---------------------------------------------------------------------------
create table if not exists public.catalogues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalogues_owner_id_idx on public.catalogues (owner_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists catalogues_set_updated_at on public.catalogues;
create trigger catalogues_set_updated_at
  before update on public.catalogues
  for each row execute function public.set_updated_at();

-- Row Level Security: people can only see and change their own catalogues.
alter table public.catalogues enable row level security;
alter table public.catalogues force row level security;

drop policy if exists "Users can read their own catalogues" on public.catalogues;
create policy "Users can read their own catalogues"
  on public.catalogues for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Users can create their own catalogues" on public.catalogues;
create policy "Users can create their own catalogues"
  on public.catalogues for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Users can update their own catalogues" on public.catalogues;
create policy "Users can update their own catalogues"
  on public.catalogues for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Users can delete their own catalogues" on public.catalogues;
create policy "Users can delete their own catalogues"
  on public.catalogues for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Signed-out visitors get no access at all.
revoke all on public.catalogues from anon;
grant select, insert, update, delete on public.catalogues to authenticated;

-- ---------------------------------------------------------------------------
-- Auth rate limiting. Supabase sees every auth request as coming from the app
-- server, so its per-IP limits can't tell visitors apart. The app records
-- hashed (visitor, email, action) keys here. The table lives in a schema the
-- API doesn't expose; the only way in is the function below.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.auth_attempts (
  id bigint generated always as identity primary key,
  key text not null check (char_length(key) = 64),
  attempted_at timestamptz not null default now()
);
create index if not exists auth_attempts_key_time_idx on private.auth_attempts (key, attempted_at);
alter table private.auth_attempts enable row level security;

-- Records an attempt; returns true while the key is within p_limit attempts per window.
create or replace function public.auth_rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent integer;
begin
  if p_key !~ '^[0-9a-f]{64}$' or p_limit not between 1 and 1000 or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid rate limit arguments';
  end if;

  -- Housekeeping: forget attempts older than a day.
  delete from private.auth_attempts where attempted_at < now() - interval '1 day';

  select count(*) into recent
    from private.auth_attempts
    where key = p_key and attempted_at > now() - make_interval(secs => p_window_seconds);

  if recent >= p_limit then
    return false;
  end if;

  insert into private.auth_attempts (key) values (p_key);
  return true;
end;
$$;

revoke all on function public.auth_rate_limit_hit(text, integer, integer) from public;
grant execute on function public.auth_rate_limit_hit(text, integer, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Self-service account deletion without the service-role key: a signed-in
-- user can delete only their own account. Their catalogues go with it
-- (on delete cascade).
-- ---------------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
