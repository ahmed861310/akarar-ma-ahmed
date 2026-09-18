-- V27 Production Launch Gate: read-only checks where possible.
create or replace function public.v27_launch_gate()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r jsonb := '[]'::jsonb;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  r := r || jsonb_build_array(jsonb_build_object('id','service_requests','status',case when to_regclass('public.service_requests') is not null then 'PASS' else 'FAIL' end));
  r := r || jsonb_build_array(jsonb_build_object('payment_orders','status',case when to_regclass('public.payment_orders') is not null then 'PASS' else 'FAIL' end));
  r := r || jsonb_build_array(jsonb_build_object('commission_ledger','status',case when to_regclass('public.commission_ledger') is not null then 'PASS' else 'WARN' end));
  r := r || jsonb_build_array(jsonb_build_object('workflow_runs','status',case when to_regclass('public.workflow_runs') is not null then 'PASS' else 'WARN' end));
  r := r || jsonb_build_array(jsonb_build_object('withdrawal_statuses','status',case when to_regclass('public.withdrawal_requests') is not null then 'PASS' else 'FAIL' end));
  return jsonb_build_object('ok', not exists (select 1 from jsonb_array_elements(r) x where x->>'status'='FAIL'), 'checks', r, 'generated_at', now());
end $$;
revoke all on function public.v27_launch_gate() from public;
grant execute on function public.v27_launch_gate() to authenticated;
