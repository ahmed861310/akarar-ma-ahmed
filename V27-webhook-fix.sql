-- V27 hotfix: payment webhook must call the V22 hardened RPC.
-- The Edge Function uses confirm_payment_webhook_v22(..., p_event_id).
-- This file is intentionally read-only with respect to existing data/functions.

do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname='confirm_payment_webhook_v22'
      and pg_get_function_identity_arguments(p.oid)='p_external_id text, p_status text, p_amount numeric, p_event_id text'
  ) then
    raise exception 'Missing public.confirm_payment_webhook_v22(text,text,numeric,text). Run V22-financial-control.sql first.';
  end if;
end $$;
