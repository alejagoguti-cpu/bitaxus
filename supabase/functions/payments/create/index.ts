import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreatePaymentRequest {
  tenant_id: string;
  beneficiary_id: string;
  source_account_id: string;
  amount: number;
  currency: string;
  concept: string;
  reference_id?: string;
  notes?: string;
  scheduled_date?: string;
}

async function generatePaymentNumber(
  supabase: any,
  tenantId: string
): Promise<string> {
  const { count } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const nextNumber = (count || 0) + 1;
  return `PA-${tenantId.substring(0, 4).toUpperCase()}-${String(nextNumber).padStart(6, "0")}`;
}

export async function createPayment(req: CreatePaymentRequest) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  // Generate payment number
  const payment_number = await generatePaymentNumber(supabase, req.tenant_id);

  // Create payment
  const { data, error } = await supabase
    .from("payments")
    .insert({
      tenant_id: req.tenant_id,
      payment_number,
      beneficiary_id: req.beneficiary_id,
      source_account_id: req.source_account_id,
      amount: req.amount,
      currency: req.currency,
      concept: req.concept,
      reference_id: req.reference_id,
      notes: req.notes,
      scheduled_date: req.scheduled_date || new Date().toISOString(),
      status: "Pendiente",
      created_by_id: "system",
    })
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
    const body: CreatePaymentRequest = await req.json();
    const result = await createPayment(body);

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
