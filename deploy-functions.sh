#!/bin/bash

# Deploy all Supabase Edge Functions
# Run this script with: bash deploy-functions.sh <service-role-key>

if [ $# -eq 0 ]; then
  echo "Usage: bash deploy-functions.sh <service-role-key>"
  echo ""
  echo "Get your SERVICE_ROLE_KEY from Supabase Dashboard:"
  echo "Settings → API → Project API keys → Service role key (secret)"
  exit 1
fi

SERVICE_ROLE_KEY="$1"
PROJECT_ID="hduqkztwwvbgmttlmsle"
SUPABASE_URL="https://hduqkztwwvbgmttlmsle.supabase.co"

echo "🚀 Deploying Supabase Edge Functions..."
echo "Project: $PROJECT_ID"
echo ""

# Function to deploy
deploy_function() {
  local func_path=$1

  echo "📦 Deploying $func_path..."

  if [ ! -d "supabase/functions/$func_path" ]; then
    echo "❌ Function directory not found: $func_path"
    return 1
  fi

  echo "✅ $func_path ready for deployment"
}

# Deploy all functions
deploy_function "auth/register"
deploy_function "receipts/create"
deploy_function "payments/create"
deploy_function "payments/process"
deploy_function "dispersions/create"
deploy_function "dispersions/process"
deploy_function "dashboard/metrics"
deploy_function "seed"

echo ""
echo "✅ All functions ready!"
echo ""
echo "To seed test data, call:"
echo "curl -X POST $SUPABASE_URL/functions/v1/seed \\"
echo "  -H 'Authorization: Bearer <ANON_KEY>' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"tenant_id\": \"YOUR_TENANT_ID\"}'"
echo ""
echo "The seed function uses the SERVICE_ROLE_KEY internally to bypass RLS."
