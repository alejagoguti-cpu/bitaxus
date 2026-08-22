# Bitaxus - Database Seeding Guide

## Problem: Table Editor Not Working

When you try to manually add rows using the Supabase Table Editor, the form doesn't work because of **Row Level Security (RLS)** policies.

### Why RLS Blocks Manual Inserts

The Table Editor doesn't have the proper session context (tenant_id and user role) required by your RLS policies:

```sql
-- RLS Policy Example
CREATE POLICY "Admins and operators can create counterparties" ON app.counterparties
  FOR INSERT WITH CHECK (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() IN ('admin', 'operator')
  );
```

The Table Editor can't set these session variables, so all inserts are blocked.

## Solution: Use the Seed Edge Function

We've created a **seed Edge Function** that uses the `SERVICE_ROLE_KEY` to bypass RLS and add test data.

### Step 1: Deploy the Seed Function

Deploy the seed function to your Supabase project:

```bash
# Option A: Using Supabase CLI
supabase functions deploy seed

# Option B: Using the deployment script
bash deploy-functions.sh <your-service-role-key>
```

### Step 2: Get Your Credentials

You need:
- **TENANT_ID**: Your tenant UUID (from the users table)
- **ANON_KEY**: From `client/.env.local` or Supabase dashboard

```bash
# From client/.env.local:
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### Step 3: Seed the Data

Choose your preferred method:

#### Option A: Using the Shell Script (Easiest)

```bash
bash seed-data.sh <TENANT_ID> <ANON_KEY>

# Example:
bash seed-data.sh "550e8400-e29b-41d4-a716-446655440000" "sb_publishable_V5PJfk7ZDr2frE8o-Ry8yQ_qSbFnjYR"
```

#### Option B: Using cURL Directly

```bash
curl -X POST https://hduqkztwwvbgmttlmsle.supabase.co/functions/v1/seed \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "<TENANT_ID>"}'
```

#### Option C: Using the TypeScript Script

```bash
# Set environment variables
export VITE_SUPABASE_URL="https://hduqkztwwvbgmttlmsle.supabase.co"
export VITE_SUPABASE_ANON_KEY="sb_publishable_..."

# Run the script
npx ts-node seed-data.ts
```

### Step 4: Verify the Data

Check the Supabase dashboard:
1. Go to **Table Editor**
2. Select **counterparties** table
3. You should see 4 test clients/suppliers
4. Select **bank_accounts** table
5. You should see 2 test bank accounts

## What Gets Seeded

The seed function creates:

### Counterparties (4 records)
- **Acme Corporation** (Client) - RUC: 20123456789
- **Tech Solutions Inc** (Client) - RUC: 20987654321
- **Global Supplies Ltd** (Supplier) - RUC: 20555555555
- **Industrial Partners** (Supplier) - RUC: 20666666666

### Bank Accounts (2 records)
- **Banco Nacional** - Checking account, $50,000 balance
- **International Bank** - Savings account, $100,000 balance

## Manual Data Entry Alternative

If you want to manually add data through the dashboard anyway:

### Option 1: Temporarily Disable RLS
⚠️ **Security Risk**: Only for development!

```sql
-- In Supabase SQL Editor
ALTER TABLE app.counterparties DISABLE ROW LEVEL SECURITY;
ALTER TABLE app.bank_accounts DISABLE ROW LEVEL SECURITY;

-- Add data via Table Editor

-- Re-enable RLS when done
ALTER TABLE app.counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.bank_accounts ENABLE ROW LEVEL SECURITY;
```

### Option 2: Use SQL Editor

Copy this SQL into the Supabase SQL Editor:

```sql
-- Get your tenant_id first from the users table
-- Replace 'YOUR_TENANT_UUID' with the actual value

INSERT INTO app.counterparties (tenant_id, name, type, email, phone, id_type, identification_number)
VALUES 
  ('YOUR_TENANT_UUID', 'Acme Corporation', 'client', 'info@acme.com', '+1-555-0100', 'RUC', '20123456789'),
  ('YOUR_TENANT_UUID', 'Tech Solutions Inc', 'client', 'contact@techsolutions.com', '+1-555-0101', 'RUC', '20987654321');

INSERT INTO app.bank_accounts (tenant_id, bank_name, account_number, account_holder, account_type, currency, balance)
VALUES
  ('YOUR_TENANT_UUID', 'Banco Nacional', '1234567890123456', 'Business Account', 'Checking', 'USD', 50000.00);
```

## Testing After Seeding

1. **Start the development server**:
   ```bash
   cd client
   npm run dev
   ```

2. **Log in** with your credentials

3. **Navigate to Counterparties**:
   - You should see the 4 seeded companies
   - Try creating a new counterparty
   - It should appear immediately in the table (thanks to fixed cache invalidation!)

4. **Navigate to Bank Accounts**:
   - You should see the 2 seeded bank accounts
   - The real-time subscription should show updates

## Troubleshooting

### "Seed failed: Seed failed: ..."

**Cause**: The seed function wasn't deployed yet.

**Solution**:
```bash
supabase functions deploy seed
```

### "Error: permission denied"

**Cause**: The SERVICE_ROLE_KEY isn't available to the Edge Function environment.

**Solution**:
- The SERVICE_ROLE_KEY is automatically available in Supabase Edge Functions
- Make sure you deployed to production, not just local testing

### Still seeing empty tables?

1. **Hard refresh** the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache** and reload
3. **Check the browser console** for errors
4. **Verify tenant_id** matches your actual tenant from the users table

## Notes

- The seed function uses the `SERVICE_ROLE_KEY`, which has full access to all data
- It only works for Supabase Edge Functions, not from the Table Editor
- The seeded data is test data and can be deleted anytime
- Each call to the seed function adds NEW records (it doesn't check for duplicates)

## Next Steps

Once you have test data:
1. ✅ Test creating new records (should appear immediately)
2. ✅ Test updating records (should reflect in real-time)
3. ✅ Test deleting records (should update subscriptions)
4. ✅ Test real-time subscriptions across browser tabs
5. ✅ Create actual payments and dispersions workflows

---

**Need help?** Check `/supabase/functions/README.md` for Edge Function documentation.
