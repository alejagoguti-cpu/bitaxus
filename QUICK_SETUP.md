# 🚀 Quick Setup - Seed Data in 2 Minutes

## Step 1: Get Your Tenant ID

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. **Run this query:**

```sql
SELECT id as tenant_id, email FROM app.users LIMIT 1;
```

4. **Copy** the `tenant_id` value (the UUID in the first column)

## Step 2: Seed Test Data

**Option A: Using SQL (Recommended - Simplest)**

1. Go to **SQL Editor** in Supabase
2. **Paste this SQL** (replace `YOUR_TENANT_UUID` with the value from Step 1):

```sql
-- Temporarily disable RLS
ALTER TABLE app.counterparties DISABLE ROW LEVEL SECURITY;
ALTER TABLE app.bank_accounts DISABLE ROW LEVEL SECURITY;

-- Insert test counterparties
INSERT INTO app.counterparties (tenant_id, name, type, email, phone, id_type, identification_number, created_at, updated_at)
VALUES
  ('YOUR_TENANT_UUID', 'Acme Corporation', 'client', 'info@acme.com', '+1-555-0100', 'RUC', '20123456789', NOW(), NOW()),
  ('YOUR_TENANT_UUID', 'Tech Solutions Inc', 'client', 'contact@techsolutions.com', '+1-555-0101', 'RUC', '20987654321', NOW(), NOW()),
  ('YOUR_TENANT_UUID', 'Global Supplies Ltd', 'supplier', 'supply@globalsupplies.com', '+1-555-0102', 'RUC', '20555555555', NOW(), NOW()),
  ('YOUR_TENANT_UUID', 'Industrial Partners', 'supplier', 'partners@industrial.com', '+1-555-0103', 'RUC', '20666666666', NOW(), NOW());

-- Insert test bank accounts
INSERT INTO app.bank_accounts (tenant_id, bank_name, account_number, account_holder, account_type, currency, balance, created_at, updated_at)
VALUES
  ('YOUR_TENANT_UUID', 'Banco Nacional', '1234567890123456', 'Business Account', 'Checking', 'USD', 50000.00, NOW(), NOW()),
  ('YOUR_TENANT_UUID', 'International Bank', '9876543210987654', 'Savings Account', 'Savings', 'USD', 100000.00, NOW(), NOW());

-- Re-enable RLS
ALTER TABLE app.counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'Counterparties' as table_name, COUNT(*) as count FROM app.counterparties WHERE tenant_id = 'YOUR_TENANT_UUID'
UNION ALL
SELECT 'Bank Accounts', COUNT(*) FROM app.bank_accounts WHERE tenant_id = 'YOUR_TENANT_UUID';
```

3. **Click RUN**
4. ✅ Done!

**Option B: Using Edge Function (If you want to deploy)**

```bash
# Deploy the seed function
supabase functions deploy seed

# Run the seed
bash seed-data.sh YOUR_TENANT_UUID sb_publishable_V5PJfk7ZDr2frE8o-Ry8yQ_qSbFnjYR
```

## Step 3: Start Your App

```bash
cd client
npm run dev
```

Then:
1. **Login** with your credentials
2. Go to **Counterparties**
3. 🎉 You should see the 4 companies!

## Test It Works

Try creating a new counterparty:
1. Click "New Counterparty"
2. Fill in the form
3. It should appear **immediately** in the list (thanks to real-time updates!)

---

**That's it!** Your Bitaxus app is now fully seeded and ready to test.
