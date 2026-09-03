begin;

create extension if not exists pgcrypto;

alter table public.access_tokens
  add column if not exists expires_at timestamptz not null default (now() + interval '30 days');

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

alter table public.rate_limits enable row level security;
alter table public.audit_logs enable row level security;
alter table public.privacy_deletions enable row level security;

revoke all on public.access_tokens, public.rate_limits, public.audit_logs, public.privacy_deletions from anon, authenticated;

create index if not exists access_tokens_active_idx
  on public.access_tokens(token_hash, expires_at)
  where revoked_at is null;

commit;
