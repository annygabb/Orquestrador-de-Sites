begin;

-- Trigger-only function: never expose it through PostgREST RPC.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- These server-only tables intentionally deny every client role. Explicit
-- policies make that boundary visible to both reviewers and Supabase Advisor.
create policy "billing_events_server_only"
  on public.billing_events for all to public
  using (false) with check (false);

create policy "email_events_server_only"
  on public.email_events for all to public
  using (false) with check (false);

create policy "access_tokens_server_only"
  on public.access_tokens for all to public
  using (false) with check (false);

create policy "rate_limits_server_only"
  on public.rate_limits for all to public
  using (false) with check (false);

create policy "audit_logs_server_only"
  on public.audit_logs for all to public
  using (false) with check (false);

create policy "privacy_deletions_server_only"
  on public.privacy_deletions for all to public
  using (false) with check (false);

-- Cover foreign keys used during account deletion and user-scoped lookups.
create index if not exists access_tokens_user_id_idx
  on public.access_tokens(user_id);

create index if not exists email_events_user_id_idx
  on public.email_events(user_id);

create index if not exists audit_logs_actor_user_id_idx
  on public.audit_logs(actor_user_id);

commit;
