import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ProcessPaymentRequest {
  payment_id: string;
  tenant_id: string;
}

export async function processPayment(req: ProcessPaymentRequest) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  // Update payment status
  const { data, error } = await supabase
    .from("payments")
    .update({
      status: "Completado",
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.payment_id)
    .eq("tenant_id", req.tenant_id)
    .select(
      `
      *,
      beneficiary:counterparties(id, name, email),
      source_account:bank_accounts(id, bank_name, account_number),
      created_by:users(id, name)
    `
    )
    .single();

  if (error) throw error;

  return data;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body: ProcessPaymentRequest = await req.json();
    const result = await processPayment(body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
