# V27 Launch Runbook

1. خذ نسخة احتياطية من قاعدة Supabase.
2. نفّذ migrations الأساسية بالترتيب، ثم `V27-production-launch-gate.sql`.
3. ضع `supabaseUrl` و`supabaseAnonKey` فقط في `config.js`.
4. اربط بوابة الدفع في **Sandbox** أولًا.
5. اترك السحب والدفع الحقيقيين مغلقين.
6. نفّذ V25 Canary ثم V26 E2E.
7. نفّذ طلب Sandbox كاملًا وسجّل النتيجة.
8. راجع الأموال/العمولة/الاسترداد يدويًا.
9. لا تفتح Live إلا بعد PASS لكل بوابات الإطلاق.
