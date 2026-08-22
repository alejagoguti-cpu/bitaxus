# Quick Start: Seeding Test Data

## The Problem
The Supabase Table Editor can't add data because RLS policies block manual inserts without proper session context.

## The Solution (Pick One)

### ⚡ FASTEST: SQL Editor (5 minutes)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file `/seed.sql` from this repo
3. Find your tenant UUID:
   - Go to **Table Editor** → **users**
   - Copy the `id` value from your user row
4. In `seed.sql`, replace `'YOUR_TENANT_UUID'` with your actual UUID
5. **Copy and paste** the entire SQL script into the SQL Editor
6. Click **RUN**
7. Done! Your test data is ready.

**Result**: 4 counterparties + 2 bank accounts added

### 🚀 RECOMMENDED: Edge Function (10 minutes)

**If you want a reusable function:**

```bash
# 1. Deploy the seed function
supabase functions deploy seed

# 2. Get your ANON_KEY from client/.env.local
# Get your TENANT_ID from Supabase users table

# 3. Run the seed script
bash seed-data.sh <TENANT_ID> <ANON_KEY>

# Example:
bash seed-data.sh "550e8400-e29b-41d4-a716-446655440000" "sb_publishable_V5PJfk7ZDr2frE8o-Ry8yQ_qSbFnjYR"
```

**Result**: Reusable function you can call anytime

## Verify the Data

1. Go to **Supabase Dashboard** → **Table Editor**
2. Click **counterparties** → You should see 4 companies
3. Click **bank_accounts** → You should see 2 accounts

## Now Test the App

```bash
cd client
npm run dev
```

**Login** and navigate to:
- ✅ **Counterparties** - See the 4 companies
- ✅ **Bank Accounts** - See the 2 accounts
- ✅ **Try creating a new record** - It should appear immediately!

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Syntax error in SQL" | Check that you replaced `YOUR_TENANT_UUID` with the actual UUID |
| Still seeing empty tables | Hard refresh browser (Ctrl+Shift+R) and clear cache |
| "permission denied" in SQL | Make sure RLS tables are in the `app` schema |
| Seed function returns error | Deploy the function first: `supabase functions deploy seed` |

## What Gets Seeded

### Counterparties
- Acme Corporation (Client)
- Tech Solutions Inc (Client)
- Global Supplies Ltd (Supplier)
- Industrial Partners (Supplier)

### Bank Accounts
- Banco Nacional (Checking, $50,000)
- International Bank (Savings, $100,000)

## Next Steps

Once you have test data:
1. Test creating payments
2. Test creating dispersions
3. Test real-time updates (open in 2 browser tabs)
4. Test mobile responsiveness

---

For more details, see `SEEDING_GUIDE.md`
