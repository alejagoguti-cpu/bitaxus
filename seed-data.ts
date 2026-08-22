/**
 * Seed Data Script
 *
 * This script populates test data to the Bitaxus database.
 * It bypasses RLS restrictions by using an Edge Function.
 *
 * Usage:
 * 1. Deploy the seed function: supabase functions deploy seed
 * 2. Run this script: npx ts-node seed-data.ts
 *
 * Requirements:
 * - VITE_SUPABASE_URL in client/.env.local
 * - VITE_SUPABASE_ANON_KEY in client/.env.local
 * - A valid tenant_id from your Supabase database
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://hduqkztwwvbgmttlmsle.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

async function seedData() {
  if (!SUPABASE_KEY) {
    console.error("❌ Missing VITE_SUPABASE_ANON_KEY in environment");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Get the current user and their tenant
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("❌ Not authenticated. Please log in first.");
      process.exit(1);
    }

    // Get the user's tenant_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("❌ Failed to get tenant_id:", userError.message);
      process.exit(1);
    }

    const tenantId = userData?.tenant_id;
    console.log(`🌱 Seeding data for tenant: ${tenantId}`);

    // Call the seed Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/seed`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Seed failed:", error.error);
      process.exit(1);
    }

    const result = await response.json();
    console.log("✅ Seed successful!");
    console.log(`   - Counterparties created: ${result.counterparties_count}`);
    console.log(`   - Bank accounts created: ${result.bank_accounts_count}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedData();
