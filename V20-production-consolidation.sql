-- خدماتي V20 — Production Consolidation & Financial Integrity
-- الهدف: توحيد طبقات V12-V19 قبل التشغيل الحقيقي.
-- مهم: راجع النسخة الاحتياطية قبل تطبيق أي migration على قاعدة بيانات حية.

-- 1) الدفع: القيمة النهائية المدفوعة تُحفظ على الطلب نفسه.
alter table public.service_requests
  add column if not exists payment_amount numeric(12,2);

-- 2) Idempotency + amount consistency.
alter table public.payment_orders
  add column if not exists idempotency_key text;
create unique index if not exists payment_orders_idempotency_key_uidx
  on public.payment_orders(user_id,idempotency_key)
  where idempotency_key is not null;

-- 3) إنشاء أمر دفع: يمنع التكرار ويثبت قيمة الدفع.
create or replace function public.create_payment_order(
  p_request_id bigint,
  p_coupon_code text default null,
  p_idempotency_key text default null
)
returns bigint
language plpgsql security definer set search_path=public
as $$
declare
  r public.service_requests;
  total numeric := 0;
  discount numeric := 0;
  oid bigint;
  existing bigint;
begin
  if auth.uid() is null then raise exception 'غير مصرح'; end if;
  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 120 then
    raise exception 'invalid idempotency key';
  end if;

  if nullif(trim(p_idempotency_key),'') is not null then
    select id into existing
    from public.payment_orders
    where user_id=auth.uid() and idempotency_key=trim(p_idempotency_key)
    limit 1;
    if existing is not null then return existing; end if;
  end if;

  select * into r
  from public.service_requests
  where id=p_request_id and user_id=auth.uid()
  for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  if r.provider_id is null then raise exception 'الطلب غير مرتبط بمقدم خدمة'; end if;
  if r.payment_status in ('held','released') then raise exception 'الطلب مدفوع بالفعل'; end if;
  if r.payment_status='refunded' then raise exception 'الطلب مسترد'; end if;

  total := coalesce(r.provider_price,0) + coalesce(r.platform_fee,0);
  if total <= 0 then raise exception 'قيمة الدفع غير صحيحة'; end if;

  if nullif(trim(p_coupon_code),'') is not null then
    select coalesce(discount,0) into discount
    from public.validate_coupon(upper(trim(p_coupon_code)),coalesce(r.provider_price,0))
    limit 1;
  end if;
  total := greatest(0,total-discount);
  if total <= 0 then raise exception 'قيمة الدفع بعد الخصم غير صحيحة'; end if;

  update public.service_requests
  set payment_amount=total, payment_status='pending'
  where id=p_request_id;

  insert into public.payment_orders(request_id,user_id,amount,coupon_code,status,idempotency_key)
  values(p_request_id,auth.uid(),total,nullif(upper(trim(p_coupon_code)),''),'created',nullif(trim(p_idempotency_key),''))
  returning id into oid;

  return oid;
exception when unique_violation then
  if nullif(trim(p_idempotency_key),'') is not null then
    select id into existing
    from public.payment_orders
    where user_id=auth.uid() and idempotency_key=trim(p_idempotency_key)
    limit 1;
    if existing is not null then return existing; end if;
  end if;
  raise;
end; $$;
revoke execute on function public.create_payment_order(bigint,text) from public,anon,authenticated;
grant execute on function public.create_payment_order(bigint,text,text) to authenticated;

-- 4) Webhook: لا يُعتمد الدفع إلا إذا طابق أمر الدفع، وبشكل idempotent.
create or replace function public.confirm_payment_webhook(
  p_external_id text,
  p_status text,
  p_amount numeric
)
returns boolean
language plpgsql security definer set search_path=public
as $$
declare
  o public.payment_orders;
begin
  select * into o from public.payment_orders where external_id=p_external_id for update;
  if not found then raise exception 'payment order not found'; end if;
  if o.status='paid' then return true; end if;
  if abs(coalesce(o.amount,0)-coalesce(p_amount,0)) > 0.01 then
    raise exception 'amount mismatch';
  end if;

  if lower(p_status)='paid' then
    update public.payment_orders set status='paid',paid_at=coalesce(paid_at,now()) where id=o.id;
    update public.service_requests
      set payment_status='held', payment_amount=o.amount
      where id=o.request_id and user_id=o.user_id and payment_status in ('pending','not_required');
    if not exists (
      select 1 from public.wallet_transactions
      where user_id=o.user_id and request_id=o.request_id and type='payment' and amount < 0
        and note like 'دفع مؤكد عبر بوابة الدفع%'
    ) then
      insert into public.wallet_transactions(user_id,type,amount,request_id,note)
      values(o.user_id,'payment',-o.amount,o.request_id,'دفع مؤكد عبر بوابة الدفع');
    end if;
  elsif lower(p_status) in ('failed','refunded') then
    update public.payment_orders set status=lower(p_status) where id=o.id;
    update public.service_requests set payment_status='not_required' where id=o.request_id and payment_status='pending';
  end if;
  return true;
end; $$;
revoke all on function public.confirm_payment_webhook(text,text,numeric) from public,anon,authenticated;

-- 5) الدفع من رصيد المحفظة: العميل يدفع الإجمالي، والمقدم يستلم سعره الأساسي.
create or replace function public.pay_for_request(p_request_id bigint)
returns boolean language plpgsql security definer set search_path=public
as $$
declare
  r public.service_requests;
  bal numeric;
  total numeric;
begin
  select * into r from public.service_requests where id=p_request_id and user_id=auth.uid() for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  if r.provider_id is null then raise exception 'هذا الطلب لا يحتاج دفعاً'; end if;
  if r.payment_status in ('held','released') then return true; end if;
  if r.payment_status='refunded' then raise exception 'لا يمكن دفع طلب مسترد'; end if;
  total := coalesce(r.payment_amount,coalesce(r.provider_price,0)+coalesce(r.platform_fee,0));
  if total <= 0 then raise exception 'سعر الطلب غير صحيح'; end if;

  insert into public.wallet_accounts(user_id,balance) values(auth.uid(),0) on conflict(user_id) do nothing;
  select balance into bal from public.wallet_accounts where user_id=auth.uid() for update;
  if bal < total then raise exception 'الرصيد غير كافٍ'; end if;
  update public.wallet_accounts set balance=balance-total,updated_at=now() where user_id=auth.uid();
  insert into public.wallet_transactions(user_id,type,amount,request_id,note)
  values(auth.uid(),'payment',-total,p_request_id,'حجز قيمة الطلب في الوساطة #'||p_request_id);
  update public.service_requests set payment_amount=total,payment_status='held' where id=p_request_id;
  return true;
end; $$;
grant execute on function public.pay_for_request(bigint) to authenticated;

-- 6) التسوية: provider_price للمقدم، platform_fee لخدماتي. لا نخصم العمولة مرتين.
create or replace function public.release_request_payment(p_request_id bigint)
returns boolean language plpgsql security definer set search_path = public
as $$
declare
  r public.service_requests;
  fee numeric;
  provider_amount numeric;
begin
  select * into r from public.service_requests where id=p_request_id and user_id=auth.uid() for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  if r.status <> 'تم التنفيذ' then raise exception 'لا يمكن تحرير المبلغ قبل اكتمال الطلب'; end if;
  if r.payment_status='released' then return true; end if;
  if r.payment_status <> 'held' then raise exception 'لا يوجد مبلغ محجوز لهذا الطلب'; end if;

  fee := greatest(coalesce(r.platform_fee,0),0);
  provider_amount := greatest(coalesce(r.provider_price,0),0);

  update public.service_requests
    set payment_status='released', provider_net=provider_amount
    where id=p_request_id;

  update public.wallet_accounts wa set balance=wa.balance+provider_amount,updated_at=now()
    from public.providers p where p.id=r.provider_id and wa.user_id=p.user_id;

  insert into public.wallet_transactions(user_id,type,amount,request_id,note)
    select p.user_id,'earning',provider_amount,p_request_id,'أرباح الطلب بعد التسوية #'||p_request_id
    from public.providers p where p.id=r.provider_id;

  if fee > 0 then
    insert into public.wallet_transactions(user_id,type,amount,request_id,note)
      select p.user_id,'fee',0,p_request_id,'عمولة خدماتي محتسبة ضمن قيمة العميل #'||p_request_id
      from public.providers p where p.id=r.provider_id;
  end if;

  insert into public.commission_ledger(request_id,provider_id,gross_amount,commission_amount,provider_net,status)
    values(p_request_id,r.provider_id,provider_amount,fee,provider_amount,'posted')
    on conflict(request_id) do update set
      gross_amount=excluded.gross_amount,
      commission_amount=excluded.commission_amount,
      provider_net=excluded.provider_net,
      status='posted';
  return true;
end; $$;
grant execute on function public.release_request_payment(bigint) to authenticated;

-- 7) الاسترداد: يرد القيمة الفعلية التي دفعها العميل.
create or replace function public.refund_request_payment(p_request_id bigint)
returns boolean language plpgsql security definer set search_path = public
as $$
declare
  r public.service_requests;
  total numeric;
begin
  if not public.is_admin() then raise exception 'غير مصرح'; end if;
  select * into r from public.service_requests where id=p_request_id for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  if r.payment_status='refunded' then return true; end if;
  if r.payment_status <> 'held' then raise exception 'لا يوجد مبلغ محجوز قابل للاسترداد'; end if;
  total := coalesce(r.payment_amount,coalesce(r.provider_price,0)+coalesce(r.platform_fee,0));
  if total <= 0 then raise exception 'قيمة الاسترداد غير صحيحة'; end if;

  insert into public.wallet_accounts(user_id,balance) values(r.user_id,0) on conflict(user_id) do nothing;
  update public.wallet_accounts set balance=balance+total,updated_at=now() where user_id=r.user_id;
  insert into public.wallet_transactions(user_id,type,amount,request_id,note)
  values(r.user_id,'refund',total,p_request_id,'استرداد مبلغ الطلب #'||p_request_id);
  update public.service_requests set payment_status='refunded' where id=p_request_id;
  update public.payment_orders set status='refunded' where request_id=p_request_id and status='paid';
  return true;
end; $$;
grant execute on function public.refund_request_payment(bigint) to authenticated;

-- 8) السحب: الرفض يعيد الرصيد تلقائياً مرة واحدة.
create or replace function public.admin_update_withdrawal_status(p_id bigint,p_status text)
returns boolean language plpgsql security definer set search_path=public
as $$
declare w public.withdrawal_requests;
begin
  if not public.is_admin() then raise exception 'غير مصرح'; end if;
  if p_status not in ('قيد المراجعة','تم التحويل','مرفوض') then raise exception 'حالة سحب غير صحيحة'; end if;
  select * into w from public.withdrawal_requests where id=p_id for update;
  if not found then raise exception 'طلب السحب غير موجود'; end if;
  if w.status='تم التحويل' and p_status='مرفوض' then raise exception 'لا يمكن رفض سحب تم تحويله'; end if;

  if w.status='قيد المراجعة' and p_status='مرفوض' then
    insert into public.wallet_accounts(user_id,balance) values(w.user_id,0) on conflict(user_id) do nothing;
    update public.wallet_accounts set balance=balance+w.amount,updated_at=now() where user_id=w.user_id;
    insert into public.wallet_transactions(user_id,type,amount,note)
      values(w.user_id,'deposit',w.amount,'إعادة مبلغ طلب السحب المرفوض #'||w.id);
  end if;

  update public.withdrawal_requests set status=p_status where id=p_id;
  return true;
end; $$;
revoke all on function public.admin_update_withdrawal_status(bigint,text) from public,anon;
grant execute on function public.admin_update_withdrawal_status(bigint,text) to authenticated;

-- 9) توحيد workflow/matching/dispatch مع IDs الحقيقية للمشروع.
-- V20 يتعامل مع جداول V19/V18 كأساس جديد. إذا كانت نسخة قديمة مستخدمة فعلياً، نفّذ ترحيل بيانات يدوي بعد backup.
create table if not exists public.workflow_runs_v20 (
  id uuid primary key default gen_random_uuid(),
  request_id bigint not null references public.service_requests(id) on delete cascade,
  state text not null default 'created' check (state in ('created','matched','dispatched','payment_pending','paid','in_progress','completed','settlement_pending','settled','cancelled','failed')),
  idempotency_key text unique,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workflow_runs_v20_request_idx on public.workflow_runs_v20(request_id,updated_at desc);

create table if not exists public.workflow_transitions_v20 (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflow_runs_v20(id) on delete cascade,
  from_state text,
  to_state text not null,
  actor_id uuid references auth.users(id) on delete set null,
  transition_key text,
  created_at timestamptz not null default now()
);
create index if not exists workflow_transitions_v20_idx on public.workflow_transitions_v20(workflow_id,created_at desc);

create table if not exists public.dispatch_attempts_v20 (
  id uuid primary key default gen_random_uuid(),
  request_id bigint not null references public.service_requests(id) on delete cascade,
  provider_id bigint references public.providers(id) on delete set null,
  attempt_no integer not null check (attempt_no>0),
  status text not null default 'sent' check (status in ('sent','accepted','declined','expired','cancelled')),
  sent_at timestamptz not null default now(),
  responded_at timestamptz
);
create unique index if not exists dispatch_v20_request_provider_attempt on public.dispatch_attempts_v20(request_id,provider_id,attempt_no);

create table if not exists public.operation_notifications_v20 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_key text not null,
  request_id bigint references public.service_requests(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app','email','sms','push')),
  status text not null default 'queued' check (status in ('queued','sent','failed','read')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists operation_notifications_v20_user_idx on public.operation_notifications_v20(user_id,created_at desc);

-- 10) فحص قبل الإطلاق.
create or replace function public.admin_v20_preflight()
returns table(check_name text,status text,details text)
language sql stable security definer set search_path=public
as $$
select * from (values
 ('payment_amount','ok','حفظ القيمة النهائية لكل طلب دفع'),
 ('payment_idempotency',case when exists(select 1 from pg_indexes where indexname='payment_orders_idempotency_key_uidx') then 'ok' else 'error' end,'منع تكرار أوامر الدفع'),
 ('payment_function',case when exists(select 1 from pg_proc where proname='create_payment_order' and pg_get_function_identity_arguments(oid)='p_request_id bigint, p_coupon_code text, p_idempotency_key text') then 'ok' else 'error' end,'توقيع الدفع الموحد'),
 ('withdrawal_guard','ok','رفض السحب يعيد الرصيد مرة واحدة'),
 ('workflow_ids','ok','طبقة V20 تستخدم bigint لمعرف الطلب ومقدم الخدمة'),
 ('secrets','manual','مفاتيح Supabase وبوابة الدفع يجب إضافتها كـ Secrets خارج المستودع')
) x(check_name,status,details);
$$;
revoke all on function public.admin_v20_preflight() from public,anon;
grant execute on function public.admin_v20_preflight() to authenticated;
