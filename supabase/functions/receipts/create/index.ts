import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreateReceiptRequest {
  tenant_id: string;
  payerId: string;
  concept: string;
  amount: number;
  currency: string;
  date: string;
  referenceId?: string;
  notes?: string;
}

async function generateReceiptNumber(
  supabase: any,
  tenantId: string
): Promise<string> {
  // Get the count of receipts for this tenant to generate sequential number
  const { count } = await supabase
    .from("receipts")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const nextNumber = (count || 0) + 1;
  return `RC-${tenantId.substring(0, 4).toUpperCase()}-${String(nextNumber).padStart(6, "0")}`;
}

export async function createReceipt(req: CreateReceiptRequest) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  // Generate receipt number
  const receipt_number = await generateReceiptNumber(supabase, req.tenant_id);

  // Get current user from auth context
  const authHeader = Deno.env.get("AUTHORIZATION") || "";
  const token = authHeader.replace("Bearer ", "");

  // Create receipt
  const { data, error } = await supabase
    .from("receipts")
    .insert({
      tenant_id: req.tenant_id,
      receipt_number,
      payer_id: req.payerId,
      concept: req.concept,
      amount: req.amount,
      currency: req.currency,
      date: req.date,
      reference_id: req.referenceId,
      notes: req.notes,
      status: "Pendiente",
      created_by_id: "system", // Should be current user ID
    })
    .select(
      `
      *,
      payer:counterparties(id, name, email),
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
    const body: CreateReceiptRequest = await req.json();
    const result = await createReceipt(body);

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
