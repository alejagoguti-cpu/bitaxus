-- Bitaxus Test Data Seeding Script
--
-- ⚠️ IMPORTANT: Before running this script:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy all the SQL below
-- 3. Replace 'YOUR_TENANT_UUID' with your actual tenant UUID
--    (Get it from: Table Editor → users → copy the id from your login)
-- 4. Paste and execute
--
-- The seed function temporarily disables RLS checks to insert test data.

-- Step 1: Get your tenant ID (run this first to see your tenant)
-- SELECT id, email FROM app.users LIMIT 1;
-- Copy the 'id' value and use it below

-- For this example, replace 'YOUR_TENANT_UUID' with the actual UUID from the query above

-- Temporarily disable RLS to allow inserts
ALTER TABLE app.counterparties DISABLE ROW LEVEL SECURITY;
ALTER TABLE app.bank_accounts DISABLE ROW LEVEL SECURITY;

-- Insert test counterparties
INSERT INTO app.counterparties (tenant_id, name, type, email, phone, id_type, identification_number, created_at, updated_at)
VALUES
  ('YOUR_TENANT_UUID', 'Acme Corporation', 'client', 'info@acme.com', '+1-555-0100', 'RUC', '20123456789', NOW(), NOW()),
  ('YOUR_TENANT_UUID', 'Tech Solutions Inc', 'client', 'contact@techsolutions.com', '+1-555-0101', 'RUC', '20987654321', NOW(), NOW()),
  ('YOUR_TENANT_UUID', 'Global Supplies Ltd', 'supplier', 'supply@globalsupplies.com', '+1-555-0102', 'RUC', '20555555555', NOW(), NOW()),
  ('YOUR_TENANT_UUID', 'Industrial Partners', 'supplier', 'partners@industrial.com', '+1-555-0103', 'RUC', '20666666666', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert test bank accounts
INSERT INTO app.bank_accounts (tenant_id, bank_name, account_number, account_holder, account_type, currency, balance, created_at, updated_at)
VALUES
  ('YOUR_TENANT_UUID', 'Banco Nacional', '1234567890123456', 'Business Account', 'Checking', 'USD', 50000.00, NOW(), NOW()),
  ('YOUR_TENANT_UUID', 'International Bank', '9876543210987654', 'Savings Account', 'Savings', 'USD', 100000.00, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Re-enable RLS
ALTER TABLE app.counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Verify the data was inserted
SELECT 'Counterparties' as table_name, COUNT(*) as count FROM app.counterparties WHERE tenant_id = 'YOUR_TENANT_UUID'
UNION ALL
SELECT 'Bank Accounts' as table_name, COUNT(*) as count FROM app.bank_accounts WHERE tenant_id = 'YOUR_TENANT_UUID';
