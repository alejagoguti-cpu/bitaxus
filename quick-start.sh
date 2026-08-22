#!/bin/bash

# Quick Start - Simplified version
# Just run: ./quick-start.sh

set -e

echo "🚀 BITAXUS Quick Start"
echo "━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env.local exists
if [ ! -f "client/.env.local" ]; then
  echo "❌ ERROR: .env.local not found in client/"
  echo "   Contact admin for credentials"
  exit 1
fi

echo "✅ Configuration found"
echo ""

# Install if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install --legacy-peer-deps 2>/dev/null || npm install
  echo "✅ Dependencies installed"
  echo ""
fi

# Start dev server
echo "🎯 Starting dev server..."
echo "   Open: http://localhost:5173"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

npm run dev
