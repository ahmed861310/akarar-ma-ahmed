-- V27 Migration Preflight (static/runtime-safe checks)
-- Run AFTER schema.sql through V27 migrations in Supabase SQL Editor.
-- This script does not create money movements or enable live payments.

create or replace function public.v27_migration_preflight()
returns table(check_name text, status text, detail text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  return query select 'base tables',
    case when to_regclass('public.profiles') is not null
      and to_regclass('public.service_requests') is not null
      and to_regclass('public.payment_orders') is not null
      and to_regclass('public.wallet_accounts') is not null
      and to_regclass('public.withdrawal_requests') is not null
    then 'PASS' else 'FAIL' end,
    'profiles, service_requests, payment_orders, wallet_accounts, withdrawal_requests';

  return query select 'workflow tables',
    case when to_regclass('public.workflow_runs_v21') is not null
      and to_regclass('public.workflow_events_v21') is not null
      and to_regclass('public.workflow_transitions_v21') is not null
    then 'PASS' else 'FAIL' end,
    'V21 workflow objects';

  return query select 'financial controls',
    case when to_regclass('public.payment_webhook_events_v22') is not null
      and to_regclass('public.platform_finance_ledger_v22') is not null
    then 'PASS' else 'FAIL' end,
    'V22 webhook idempotency and platform ledger';

  return query select 'controlled pilot',
    case when to_regclass('public.platform_control_v24') is not null
    then 'PASS' else 'FAIL' end,
    'V24 control table exists';

  return query select 'observability',
    case when to_regclass('public.v25_canary_runs') is not null
      and to_regclass('public.v26_e2e_runs') is not null
    then 'PASS' else 'FAIL' end,
    'V25/V26 audit tables';

  return query select 'webhook RPC',
    case when to_regprocedure('public.confirm_payment_webhook_v22(text,text,numeric,text)') is not null
    then 'PASS' else 'FAIL' end,
    'V22 webhook RPC signature';

  return query select 'launch gate',
    case when to_regprocedure('public.v27_launch_gate()') is not null
    then 'PASS' else 'FAIL' end,
    'V27 launch gate function';

  return query select 'live payments',
    case when exists (
      select 1 from public.platform_control_v24
      where id = true and payments_enabled = false and withdrawals_enabled = false
    ) then 'PASS' else 'WARN' end,
    'payments_enabled=false and withdrawals_enabled=false are the safe default';
end;
$$;

revoke all on function public.v27_migration_preflight() from public, anon;
grant execute on function public.v27_migration_preflight() to authenticated;

comment on function public.v27_migration_preflight() is
'V27 admin-only post-migration preflight. Read-only checks; does not move money or enable live payments.';
