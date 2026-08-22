import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create admin client using service role key for unrestricted access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { tenant_id } = await req.json();

    if (!tenant_id) {
      return new Response(
        JSON.stringify({ error: "tenant_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Seed counterparties (clients)
    const counterpartyData = [
      {
        tenant_id,
        name: "Acme Corporation",
        type: "client",
        email: "info@acme.com",
        phone: "+1-555-0100",
        id_type: "RUC",
        identification_number: "20123456789",
      },
      {
        tenant_id,
        name: "Tech Solutions Inc",
        type: "client",
        email: "contact@techsolutions.com",
        phone: "+1-555-0101",
        id_type: "RUC",
        identification_number: "20987654321",
      },
      {
        tenant_id,
        name: "Global Supplies Ltd",
        type: "supplier",
        email: "supply@globalsupplies.com",
        phone: "+1-555-0102",
        id_type: "RUC",
        identification_number: "20555555555",
      },
      {
        tenant_id,
        name: "Industrial Partners",
        type: "supplier",
        email: "partners@industrial.com",
        phone: "+1-555-0103",
        id_type: "RUC",
        identification_number: "20666666666",
      },
    ];

    const { data: counterparties, error: cpError } = await supabaseAdmin
      .from("counterparties")
      .insert(counterpartyData)
      .select();

    if (cpError) {
      console.error("Error inserting counterparties:", cpError);
      return new Response(
        JSON.stringify({ error: `Failed to seed counterparties: ${cpError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Seed bank accounts
    const bankAccountData = [
      {
        tenant_id,
        bank_name: "Banco Nacional",
        account_number: "1234567890123456",
        account_holder: "Business Account",
        account_type: "Checking",
        currency: "USD",
        balance: 50000.00,
      },
      {
        tenant_id,
        bank_name: "International Bank",
        account_number: "9876543210987654",
        account_holder: "Savings Account",
        account_type: "Savings",
        currency: "USD",
        balance: 100000.00,
      },
    ];

    const { data: bankAccounts, error: baError } = await supabaseAdmin
      .from("bank_accounts")
      .insert(bankAccountData)
      .select();

    if (baError) {
      console.error("Error inserting bank accounts:", baError);
      return new Response(
        JSON.stringify({ error: `Failed to seed bank accounts: ${baError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Seed data inserted successfully",
        counterparties_count: counterparties?.length || 0,
        bank_accounts_count: bankAccounts?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: `Seed failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
