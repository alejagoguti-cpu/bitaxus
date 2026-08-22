#!/bin/bash

# Deploy all Supabase Edge Functions
# Usage: ./deploy-functions.sh

set -e

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

FUNCTIONS=(
  "auth/register"
  "receipts/create"
  "payments/create"
  "payments/process"
  "dispersions/create"
  "dispersions/process"
  "dashboard/metrics"
)

for func in "${FUNCTIONS[@]}"; do
  echo "📦 Deploying $func..."
  supabase functions deploy "$func" --project-id hduqkztwwvbgmttlmsle
  echo "✅ $func deployed successfully"
  echo ""
done

echo "🎉 All functions deployed!"
echo ""
echo "Next steps:"
echo "1. npm run dev        # Start frontend"
echo "2. Test the app       # Login → Create receipts → Dashboard"
echo "3. Check logs         # supabase functions list"
