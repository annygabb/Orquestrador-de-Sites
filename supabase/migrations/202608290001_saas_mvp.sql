begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  asaas_customer_id text unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider_subscription_id text unique,
  status text not null default 'inactive' check (status in ('inactive','pending','active','overdue','canceled')),
  activation_amount_cents integer not null default 5990 check (activation_amount_cents >= 0),
  renewal_amount_cents integer not null default 2990 check (renewal_amount_cents >= 0),
  paid_until timestamptz,
  next_due_date date,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('activation','renewal')),
  provider_payment_id text not null unique,
  provider_subscription_id text,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null,
  due_date date,
  paid_at timestamptz,
  invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  provider_payment_id text,
  event_type text not null,
  status text not null check (status in ('processing','processed','failed')),
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  dedupe_key text not null unique,
  status text not null check (status in ('sent','failed')),
  provider_id text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  token_prefix text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  destination_url text,
  selected_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  bucket text not null,
  identity_hash text not null,
  window_started_at timestamptz not null,
  attempts integer not null default 1,
  primary key (bucket, identity_hash)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  outcome text not null check (outcome in ('success','denied','failed')),
  request_id text not null,
  ip_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.privacy_deletions (
  user_hash text primary key,
  requested_at timestamptz not null,
  completed_at timestamptz,
  backup_purge_after timestamptz not null
);

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_identity_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_attempts integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then return false; end if;
  insert into public.rate_limits (bucket, identity_hash, window_started_at, attempts)
  values (p_bucket, p_identity_hash, now(), 1)
  on conflict (bucket, identity_hash) do update
  set attempts = case
      when public.rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
      else public.rate_limits.attempts + 1
    end,
    window_started_at = case
      when public.rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
      else public.rate_limits.window_started_at
    end
  returning attempts into current_attempts;
  return current_attempts <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

create index if not exists payments_user_created_idx on public.payments(user_id, created_at desc);
create index if not exists subscriptions_due_idx on public.subscriptions(status, next_due_date);
create index if not exists projects_user_updated_idx on public.projects(user_id, updated_at desc);
create index if not exists access_tokens_active_idx on public.access_tokens(token_hash, expires_at) where revoked_at is null;

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id, status) values (new.id, 'inactive') on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.set_updated_at();
drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments for each row execute procedure public.set_updated_at();
drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.billing_events enable row level security;
alter table public.email_events enable row level security;
alter table public.access_tokens enable row level security;
alter table public.projects enable row level security;
alter table public.rate_limits enable row level security;
alter table public.audit_logs enable row level security;
alter table public.privacy_deletions enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id and is_admin = false);
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy "payments_select_own" on public.payments for select to authenticated using ((select auth.uid()) = user_id);
create policy "projects_select_own" on public.projects for select to authenticated using ((select auth.uid()) = user_id);
create policy "projects_insert_own" on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "projects_update_own" on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "projects_delete_own" on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.billing_events, public.email_events, public.access_tokens, public.rate_limits from anon, authenticated;
revoke all on public.audit_logs, public.privacy_deletions from anon, authenticated;
grant select on public.profiles, public.subscriptions, public.payments, public.projects to authenticated;
grant insert, update, delete on public.projects to authenticated;

commit;
