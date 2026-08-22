#!/bin/bash

# Seed Data Script using curl
#
# Usage:
# 1. Deploy the seed function: supabase functions deploy seed
# 2. Run: bash seed-data.sh <TENANT_ID> <ANON_KEY>
#
# Example:
# bash seed-data.sh "550e8400-e29b-41d4-a716-446655440000" "sb_publishable_..."

if [ $# -lt 2 ]; then
  echo "Usage: bash seed-data.sh <TENANT_ID> <ANON_KEY>"
  echo ""
  echo "Arguments:"
  echo "  TENANT_ID  - Your tenant UUID (from users table)"
  echo "  ANON_KEY   - Supabase anonymous key (from .env.local)"
  echo ""
  echo "Example:"
  echo "  bash seed-data.sh '550e8400-e29b-41d4-a716-446655440000' 'sb_publishable_...'"
  exit 1
fi

TENANT_ID="$1"
ANON_KEY="$2"
SUPABASE_URL="https://hduqkztwwvbgmttlmsle.supabase.co"

echo "🌱 Seeding test data for tenant: $TENANT_ID"
echo ""

# Call the seed Edge Function
curl -X POST "$SUPABASE_URL/functions/v1/seed" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"tenant_id\": \"$TENANT_ID\"}"

echo ""
echo ""
echo "✅ Seed request sent!"
echo ""
echo "If you see an error like 'RLS policy preventing insert':"
echo "1. Make sure you deployed the seed function: supabase functions deploy seed"
echo "2. Verify your ANON_KEY and TENANT_ID are correct"
echo "3. Check that the function has access to SERVICE_ROLE_KEY"
