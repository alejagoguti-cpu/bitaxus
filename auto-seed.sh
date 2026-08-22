#!/bin/bash

# Auto-seed Script
# Gets tenant_id from Supabase and seeds test data
# Usage: bash auto-seed.sh

SUPABASE_URL="https://hduqkztwwvbgmttlmsle.supabase.co"
ANON_KEY="sb_publishable_V5PJfk7ZDr2frE8o-Ry8yQ_qSbFnjYR"

echo "🌱 Bitaxus Auto-Seed"
echo "===================="
echo ""

# Step 1: Try to get tenant_id using REST API
echo "📝 Getting your tenant ID..."

TENANT_RESPONSE=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/users?select=tenant_id,email&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json")

# Try to extract tenant_id from JSON response
TENANT_ID=$(echo "$TENANT_RESPONSE" | grep -oP '"tenant_id":"\K[^"]+' | head -1)

if [ -z "$TENANT_ID" ]; then
  echo "❌ Could not fetch tenant_id automatically"
  echo ""
  echo "Please get your TENANT_ID manually:"
  echo "1. Go to Supabase Dashboard"
  echo "2. SQL Editor"
  echo "3. Run: SELECT id FROM app.users LIMIT 1;"
  echo "4. Copy the ID"
  echo "5. Run: bash auto-seed.sh YOUR_TENANT_ID"
  exit 1
fi

echo "✅ Tenant ID: $TENANT_ID"
echo ""

# Step 2: Call seed function
echo "🚀 Calling seed function..."

SEED_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/seed" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"tenant_id\": \"$TENANT_ID\"}")

echo "Response: $SEED_RESPONSE"
echo ""

# Check if successful
if echo "$SEED_RESPONSE" | grep -q "success.*true"; then
  echo "✅ Seed successful!"
  COUNTERPARTIES=$(echo "$SEED_RESPONSE" | grep -oP '"counterparties_count":\K[0-9]+')
  BANKS=$(echo "$SEED_RESPONSE" | grep -oP '"bank_accounts_count":\K[0-9]+')
  echo "   - Counterparties created: $COUNTERPARTIES"
  echo "   - Bank accounts created: $BANKS"
  echo ""
  echo "✅ Done! Your app now has test data ready."
  echo ""
  echo "Next steps:"
  echo "1. Start the app:  cd client && npm run dev"
  echo "2. Log in with your credentials"
  echo "3. Go to Counterparties - you should see 4 companies!"
  echo ""
elif echo "$SEED_RESPONSE" | grep -q "error"; then
  ERROR=$(echo "$SEED_RESPONSE" | grep -oP '"error":"\K[^"]+' | head -1)
  echo "❌ Error: $ERROR"
  echo ""
  echo "Possible solutions:"
  echo "1. Make sure the seed function is deployed: supabase functions deploy seed"
  echo "2. Check that your TENANT_ID is correct"
  echo "3. Use the SQL method instead: bash sql-seed.sh"
  exit 1
else
  echo "⚠️  Unexpected response. The seed function may not be deployed yet."
  echo ""
  echo "Deploy with: supabase functions deploy seed"
  echo "Then run this script again."
  exit 1
fi
