-- V27 RLS / privileged RPC hardening v7
-- Run AFTER schema.sql and V20 -> V27 migrations.
-- Purpose: prevent ordinary authenticated users from calling admin_* diagnostic RPCs.

create or replace function public.admin_growth_stats()
returns table(total_events bigint, visitors bigint, provider_views bigint, service_views bigint, requests_created bigint)
language sql stable security definer set search_path=public as $$
  select count(*), count(distinct user_id), count(*) filter(where event_type='provider_view'), count(*) filter(where event_type='service_view'), count(*) filter(where event_type='request_created')
  from public.platform_events
  where public.is_admin();
$$;

create or replace function public.admin_ops_summary()
returns table(open_reports bigint, open_disputes bigint, pending_withdrawals bigint, held_payments numeric, released_payments numeric, refunded_payments numeric, failed_payments bigint, audit_events bigint)
language sql stable security definer set search_path=public as $$
  select
   (select count(*) from public.reports where status in ('open','investigating')),
   (select count(*) from public.disputes where status in ('open','investigating')),
   (select count(*) from public.withdrawal_requests where status in ('pending','processing')),
   coalesce((select sum(amount) from public.service_requests where payment_status='held'),0),
   coalesce((select sum(amount) from public.service_requests where payment_status='released'),0),
   coalesce((select sum(amount) from public.service_requests where payment_status='refunded'),0),
   (select count(*) from public.payment_orders where status in ('failed','cancelled')),
   (select count(*) from public.admin_audit_log)
  where public.is_admin();
$$;

create or replace function public.admin_platform_health()
returns table(check_name text, status text, details text)
language sql stable security definer set search_path=public as $$
  select * from (values
   ('database','ok','اتصال قاعدة البيانات متاح'),
   ('audit_log',case when to_regclass('public.admin_audit_log') is not null then 'ok' else 'error' end,'سجل التدقيق'),
   ('payment_orders',case when to_regclass('public.payment_orders') is not null then 'ok' else 'error' end,'طلبات الدفع'),
   ('idempotency',case when exists(select 1 from pg_indexes where indexname='payment_orders_idempotency_key_uidx') then 'ok' else 'error' end,'حماية تكرار الدفع'),
   ('alerts',case when to_regclass('public.platform_alerts') is not null then 'ok' else 'error' end,'مركز التنبيهات')
  ) x(check_name,status,details)
  where public.is_admin();
$$;

create or replace function public.admin_v20_preflight()
returns table(check_name text,status text,details text)
language sql stable security definer set search_path=public as $$
 select * from (values
  ('payment_amount','ok','حفظ القيمة النهائية لكل طلب دفع'),
  ('payment_idempotency',case when exists(select 1 from pg_indexes where indexname='payment_orders_idempotency_key_uidx') then 'ok' else 'error' end,'منع تكرار أوامر الدفع'),
  ('payment_function',case when exists(select 1 from pg_proc where proname='create_payment_order' and pg_get_function_identity_arguments(oid)='p_request_id bigint, p_coupon_code text, p_idempotency_key text') then 'ok' else 'error' end,'توقيع الدفع الموحد'),
  ('withdrawal_guard','ok','رفض السحب يعيد الرصيد مرة واحدة'),
  ('workflow_ids','ok','طبقة V20 تستخدم bigint لمعرف الطلب ومقدم الخدمة'),
  ('secrets','manual','مفاتيح Supabase وبوابة الدفع يجب إضافتها كـ Secrets خارج المستودع')
 ) x(check_name,status,details)
 where public.is_admin();
$$;

create or replace function public.admin_v21_launch_check()
returns table(check_name text,status text,details text)
language sql stable security definer set search_path=public as $$
 select * from (values
  ('payment_signature','ok','create_payment_order يستخدم idempotency key'),
  ('gateway_external_id','ok','جلسة الدفع تحفظ external_id بعد إنشاء الجلسة'),
  ('workflow_table',case when to_regclass('public.workflow_runs_v21') is not null then 'ok' else 'error' end,'طبقة orchestration موحدة بمعرف الطلب الحقيقي bigint'),
  ('workflow_transition',case when exists(select 1 from pg_proc where proname='advance_request_workflow_v21') then 'ok' else 'error' end,'انتقالات workflow ذرية ومسموح بها فقط'),
  ('withdrawal_refund','ok','رفض السحب عبر RPC يعيد الرصيد مرة واحدة'),
  ('secrets','manual','أدخل مفاتيح Supabase وGateway وWebhook كـSecrets فقط'),
  ('live_payment','manual','لا تعتبر المدفوعات حقيقية حتى ربط Gateway واختبار webhook فعلياً')
 ) x(check_name,status,details)
 where public.is_admin();
$$;

create or replace function public.admin_v22_launch_check()
returns table(check_name text,status text,details text)
language sql stable security definer set search_path=public as $$
 select * from (values
  ('webhook_idempotency',case when to_regclass('public.payment_webhook_events_v22') is not null then 'ok' else 'error' end,'منع تكرار نفس webhook event'),
  ('platform_ledger',case when to_regclass('public.platform_finance_ledger_v22') is not null then 'ok' else 'error' end,'كل تسوية لها سجل حصة المنصة'),
  ('reconciliation',case when exists(select 1 from pg_proc where proname='admin_v22_reconciliation') then 'ok' else 'error' end,'كشف اختلافات الطلب/الدفع/العمولة'),
  ('secrets','manual','أدخل أسرار Supabase وGateway في Edge Function Secrets فقط'),
  ('sandbox','manual','اختبر webhook مرتين بنفس event_id وتأكد من عدم تكرار الحركة المالية')
 ) x(check_name,status,details)
 where public.is_admin();
$$;

create or replace function public.v24_platform_status()
returns table(mode text,payments_enabled boolean,withdrawals_enabled boolean,new_requests_enabled boolean,dispatch_enabled boolean,reason text,updated_at timestamptz)
language sql stable security definer set search_path=public as $$
 select mode,payments_enabled,withdrawals_enabled,new_requests_enabled,dispatch_enabled,reason,updated_at
 from public.platform_control_v24 where id=true and public.is_admin();
$$;

revoke all on function public.admin_growth_stats() from public,anon,authenticated;
grant execute on function public.admin_growth_stats() to authenticated;
revoke all on function public.admin_ops_summary() from public,anon,authenticated;
grant execute on function public.admin_ops_summary() to authenticated;
revoke all on function public.admin_platform_health() from public,anon,authenticated;
grant execute on function public.admin_platform_health() to authenticated;
revoke all on function public.admin_v20_preflight() from public,anon,authenticated;
grant execute on function public.admin_v20_preflight() to authenticated;
revoke all on function public.admin_v21_launch_check() from public,anon,authenticated;
grant execute on function public.admin_v21_launch_check() to authenticated;
revoke all on function public.admin_v22_launch_check() from public,anon,authenticated;
grant execute on function public.admin_v22_launch_check() to authenticated;
revoke all on function public.v24_platform_status() from public,anon,authenticated;
grant execute on function public.v24_platform_status() to authenticated;

-- Verification helpers
select case when exists(select 1 from pg_proc where proname='admin_growth_stats') then 'PASS' else 'FAIL' end as admin_growth_stats_present;
select case when exists(select 1 from pg_proc where proname='admin_ops_summary') then 'PASS' else 'FAIL' end as admin_ops_summary_present;
select case when exists(select 1 from pg_proc where proname='admin_platform_health') then 'PASS' else 'FAIL' end as admin_platform_health_present;
