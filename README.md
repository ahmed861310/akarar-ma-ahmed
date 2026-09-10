# خدماتي V4.2 — صفحات الخدمات + كوبونات قاعدة البيانات + تحليلات النمو

## الجديد في V4.1
- 🌐 صفحات عامة مستقلة لكل خدمة بروابط `#service=...`.
- 🔎 SEO ديناميكي لعنوان ووصف صفحات الخدمات وOpen Graph.
- 📣 صفحات الخدمات قابلة للمشاركة من الهاتف.
- 🎟️ أكواد الخصم أصبحت قابلة للحفظ والإدارة من Supabase عبر جدول `coupons` ودالة آمنة `validate_coupon`.
- 📊 جدول `platform_events` لتسجيل زيارات الخدمات ومقدمي الخدمات وإنشاء الطلبات.
- 📈 إحصائيات نمو أساسية للإدارة عبر `admin_growth_stats`.
- 🧪 الوضع التجريبي ما زال يعمل بدون Supabase.

## مهم قبل الإطلاق التجاري
- الدفع الموجود في المشروع ما زال تجريبيًا، ولا يستقبل أموالًا حقيقية.
- لا تضع أي `service_role` key أو مفتاح سري داخل ملفات الموقع.
- قبل الدفع الحقيقي يجب ربط بوابة دفع عبر Backend/Webhook آمن، والتحقق من السعر والكوبون على الخادم.
- شغّل `schema.sql` كاملًا في Supabase عند الانتقال للوضع الحقيقي.

## التشغيل
1. الوضع التجريبي: افتح `index.html` واضغط «تجربة سريعة».
2. الوضع الحقيقي: نفّذ `schema.sql` في مشروع Supabase.
3. ضع Project URL وanon public key داخل `config.js`.
4. اختبر RLS والصلاحيات قبل نشر الموقع للعامة.


## V4.2 — برنامج الإحالة
تمت إضافة لوحة دعوات ومشاركة، كود ورابط إحالة، إحصائيات الدعوات والمكافآت، ومحاكاة في الوضع التجريبي. في Supabase شغّل إضافات V4.2 في `schema.sql`. قيمة المكافأة التجريبية 25 جنيه وليست دفعًا حقيقيًا.

## V5.0 — الباقات وتحقيق الدخل
- 🚀 صفحة «خدماتي للأعمال» بثلاث باقات: البداية 49، المحترف 99، الأعمال 199 جنيه شهريًا.
- ⭐ مزايا ظهور وإحصائيات وبروفايل مميز حسب الباقة.
- 🧪 التفعيل في الواجهة الحالية تجريبي ولا يخصم أموالًا حقيقية.
- 🗄️ أضيفت جداول `subscription_plans` و`provider_subscriptions` مع RLS في `schema.sql`.
- 💳 قبل البيع الحقيقي يجب ربط بوابة دفع من Backend آمن مع Webhook، وعدم الاعتماد على localStorage لتأكيد الاشتراك.

## V5.1 — الدفع الآمن الحقيقي (جاهز للربط)
- 🧾 جدول `payment_orders` لتسجيل كل جلسة دفع وحالتها.
- 🔐 إنشاء جلسة الدفع يتم من Supabase Edge Function وليس من المتصفح.
- 🔔 Webhook مستقل لتأكيد الدفع والتحقق من التوقيع ومطابقة المبلغ.
- 🔑 أسرار بوابة الدفع تبقى داخل Edge Function Secrets.
- ⚠️ المشروع لا يعلن عن استقبال أموال حقيقية قبل وضع بيانات بوابة الدفع وتنفيذ Gateway Adapter الخاص بالمزود المختار.

### إعداد V5.1
1. شغّل `schema.sql` كاملًا في Supabase.
2. انشر `supabase/functions/create-payment-session` و`payment-webhook`.
3. أضف Secrets: `PAYMENT_GATEWAY_URL`, `PAYMENT_GATEWAY_SECRET`, `PAYMENT_WEBHOOK_SECRET`, و`SUPABASE_SERVICE_ROLE_KEY` داخل Edge Functions فقط.
4. ضع رابط `create-payment-session` في `config.js` داخل `paymentFunctionUrl`.
5. اربط Adapter مع بوابة الدفع التي اخترتها، ثم اضبط عنوان الـWebhook لديها.
6. اختبر حالات success / failed / refunded ومطابقة المبلغ قبل الإطلاق.

## V5.3 — تطبيق PWA + Offline + Push
- 📱 `manifest.webmanifest` يجعل خدماتي قابلة للتثبيت كتطبيق على أندرويد والمتصفحات الداعمة.
- ⚡ `sw.js` للتخزين المؤقت والعمل بدون اتصال جزئيًا.
- 🔔 Service Worker جاهز لإظهار Push Notifications.
- 📴 صفحة Offline عند فقد الاتصال.
- 📲 شريط تثبيت داخل الموقع.
- 🖼️ أيقونات التطبيق 192/512.
- ⚠️ Push الحقيقي يحتاج VAPID public key + حفظ subscription على الخادم + مزود Push. لا تضع VAPID private key داخل الموقع.

## V5.3 — Push Notifications
1. شغّل الترحيل الإضافي الموجود في `schema.sql` لإنشاء `push_subscriptions`.
2. ولّد مفاتيح VAPID وضع المفتاح العام في `config.js` داخل `vapidPublicKey`.
3. ضع الأسرار `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, و`SUPABASE_SERVICE_ROLE_KEY` في Supabase Secrets.
4. انشر الدالة `supabase/functions/send-push`.
5. ضع رابطها في `pushFunctionUrl` إذا أردت استدعاءها من لوحة إدارة مخصصة.
6. يجب تشغيل الموقع عبر HTTPS حتى تعمل Push على الأجهزة الحقيقية.

> الوضع التجريبي لا يرسل Push حقيقية؛ زر التفعيل متاح في الوضع الحقيقي بعد تسجيل الدخول.
