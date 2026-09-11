# خدماتي V22 — Financial Control Plane

أقوى قفزة بعد V21: تحويل طبقة الدفع والتسوية إلى منظومة قابلة للمطابقة والمراجعة.

## الجديد
- Webhook idempotency حقيقي عبر `payment_webhook_events_v22`.
- منع إعادة تنفيذ نفس حدث الدفع مرتين.
- `platform_finance_ledger_v22` لتسجيل إجمالي العميل وحصة مقدم الخدمة وعمولة خدماتي.
- مطابقة مالية عبر `admin_v22_reconciliation()` لكشف أي فرق.
- تسجيل إيراد المنصة تلقائياً عند التسوية.
- `admin_v22_launch_check()` لفحص جاهزية الطبقة الجديدة.

## التشغيل
1. Backup لقاعدة Supabase.
2. نفّذ `V20-production-consolidation.sql` ثم `V21-production-launch.sql` ثم `V22-financial-control.sql`.
3. انشر Edge Function الجديدة `payment-webhook`.
4. اختبر Sandbox بإرسال نفس `event_id` مرتين؛ يجب أن تكون الحركة المالية مرة واحدة فقط.
5. شغّل `admin_v22_reconciliation()` وتأكد أن النتيجة فارغة قبل الإنتاج.

## مهم
هذه النسخة لا تحتوي أسرار دفع أو Supabase. لا تضعها في `config.js` أو داخل JavaScript المتصفح.
