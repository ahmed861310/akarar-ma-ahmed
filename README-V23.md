# خدماتي V23 — Control Tower

V23 تضيف مركز تشغيل موحد للإدارة بدل متابعة الأنظمة في شاشات منفصلة.

## الجديد
- `V23-control-tower.sql`
- `platform_incidents_v23` للحوادث التشغيلية.
- `admin_v23_control_tower()` لمؤشرات الطلبات، الماليات، الحالات، والمطابقة.
- `admin_v23_recent_incidents()` لسجل الحوادث.
- `admin_v23_launch_gate()` كبوابة قبل التوسع.
- `admin_v23_refresh_incident()` و `admin_v23_resolve_incident()` لإدارة الحوادث بصلاحيات الإدارة.
- لوحة Control Tower داخل لوحة الإدارة.

## التشغيل
1. خذ Backup لقاعدة البيانات.
2. نفّذ `V23-control-tower.sql` بعد V22.
3. تأكد من Supabase credentials وRLS.
4. افتح لوحة الإدارة ثم تبويب `control`.

V23 لا تحتوي أي أسرار أو مفاتيح دفع حقيقية، ولا تعتبر المنصة Live بمجرد تثبيت الملفات.
