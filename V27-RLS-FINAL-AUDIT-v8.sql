-- V27 RLS FINAL AUDIT v8
-- Run AFTER schema.sql and V20 -> V27 migrations.
-- Read-only audit: reports RLS/policies on critical tables and privilege exposure.
DO $$
DECLARE
  t text;
  rls boolean;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','service_requests','wallet_accounts','wallet_transactions','withdrawal_requests','payment_orders'] LOOP
    SELECT c.relrowsecurity INTO rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=t;
    IF NOT coalesce(rls,false) THEN RAISE EXCEPTION 'RLS missing on critical table: %', t; END IF;
  END LOOP;
END $$;

-- Critical invariant: direct authenticated writes to wallet transactions must not be granted.
DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM information_schema.role_table_grants
  WHERE table_schema='public' AND table_name='wallet_transactions' AND grantee='authenticated'
    AND privilege_type IN ('INSERT','UPDATE','DELETE');
  IF n > 0 THEN RAISE EXCEPTION 'Authenticated direct write privilege exists on wallet_transactions'; END IF;
END $$;

-- Critical invariant: direct authenticated writes to payment orders must not be granted.
DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM information_schema.role_table_grants
  WHERE table_schema='public' AND table_name='payment_orders' AND grantee='authenticated'
    AND privilege_type IN ('INSERT','UPDATE','DELETE');
  IF n > 0 THEN RAISE EXCEPTION 'Authenticated direct write privilege exists on payment_orders'; END IF;
END $$;
