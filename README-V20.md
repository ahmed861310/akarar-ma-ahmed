# خدماتي V20 — Production Consolidation

V20 ليست ميزة منفصلة؛ هي مرحلة دمج وتصحيح قبل التشغيل الحقيقي.

## أهم ما تم إصلاحه
- توحيد إنشاء الدفع مع `idempotency_key`.
- إرسال مبلغ الدفع الحقيقي إلى Edge Function بدلاً من `undefined`.
- حفظ `payment_amount` على الطلب لتثبيت القيمة التي دفعها العميل.
- توحيد المحاسبة: `provider_price` للمقدم و`platform_fee` لخدماتي دون خصم العمولة مرتين.
- الاسترداد يرد القيمة الفعلية المدفوعة.
- رفض السحب يعيد الرصيد تلقائياً مرة واحدة.
- طبقات Workflow / Matching / Dispatch تستخدم `bigint` لمعرفات الطلبات ومقدمي الخدمة بما يتوافق مع المخطط الأساسي.
- إضافة `admin_v20_preflight()` لفحص جاهزية قواعد الإنتاج.

## مهم جداً
هذه النسخة لا تجعل المشروع Live تلقائياً.
يجب ربط Supabase، تشغيل SQL بعد مراجعة النسخة الاحتياطية، وضبط أسرار بوابة الدفع داخل Edge Function Secrets.

### ترتيب التشغيل المقترح
1. Backup لقاعدة البيانات.
2. تطبيق `V20-production-consolidation.sql`.
3. نشر Edge Function `create-payment-session` الجديدة.
4. ضبط `PAYMENT_GATEWAY_URL` و`PAYMENT_GATEWAY_SECRET` و`PAYMENT_WEBHOOK_SECRET` كـ Secrets.
5. تشغيل `admin_v20_preflight()`.
6. تنفيذ اختبار دفع صغير في بيئة اختبار قبل أي أموال حقيقية.
