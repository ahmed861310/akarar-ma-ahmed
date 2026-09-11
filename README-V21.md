# خدماتي V21 — Production Launch Control

V21 هي قفزة الدمج قبل التشغيل الحقيقي، وليست مجرد ميزة جديدة.

## أهم ما تغير
- حفظ `external_id` الناتج من بوابة الدفع في `payment_orders` حتى يستطيع الـwebhook العثور على أمر الدفع.
- لوحة الإدارة تستخدم `admin_update_withdrawal_status` بدلاً من تعديل السحب مباشرة، وبالتالي رفض السحب يعيد الرصيد عبر المسار الآمن.
- Workflow موحد على `service_requests.id` الحقيقي (`bigint`) مع انتقالات مسموحة فقط.
- مزامنة حالة الدفع مع الـworkflow.
- فحص إطلاق `admin_v21_launch_check()` وفحص مالي سريع `admin_financial_integrity_v21()`.

## التشغيل
1. خذ Backup لقاعدة Supabase.
2. نفّذ `V20-production-consolidation.sql` إذا لم يكن منفذاً.
3. نفّذ `V21-production-launch.sql`.
4. انشر Edge Functions.
5. ضع الأسرار في Supabase Edge Function Secrets، وليس `config.js`.
6. اختبر الدفع في Sandbox: إنشاء طلب → جلسة دفع → callback/webhook → held → تنفيذ → released/settled أو refund.

## ملاحظة مهمة
النسخة لا تعتبر بوابة الدفع حية تلقائياً. `config.js` ما زال بدون أسرار، والـGateway Adapter يحتاج بيانات البوابة الفعلية.
