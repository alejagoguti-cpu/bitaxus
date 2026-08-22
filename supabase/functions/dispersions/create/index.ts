import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DispersionItem {
  payment_id: string;
  amount: number;
}

interface CreateDispersionRequest {
  tenant_id: string;
  items: DispersionItem[];
  notes?: string;
}

async function generateDispersionNumber(
  supabase: any,
  tenantId: string
): Promise<string> {
  const { count } = await supabase
    .from("dispersions")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const nextNumber = (count || 0) + 1;
  return `DP-${tenantId.substring(0, 4).toUpperCase()}-${String(nextNumber).padStart(6, "0")}`;
}

export async function createDispersion(req: CreateDispersionRequest) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  // Generate dispersion number
  const dispersion_number = await generateDispersionNumber(supabase, req.tenant_id);

  // Calculate total amount
  const total_amount = req.items.reduce((sum, item) => sum + item.amount, 0);

  // Create dispersion
  const { data: dispersionData, error: dispersionError } = await supabase
    .from("dispersions")
    .insert({
      tenant_id: req.tenant_id,
      dispersion_number,
      total_amount,
      notes: req.notes,
      status: "Pendiente",
      created_by_id: "system",
    })
    .select(
      `
      *,
      created_by:users(id, name)
    `
    )
    .single();

  if (dispersionError) throw dispersionError;

  // Create dispersion items
  const dispersionItems = req.items.map((item) => ({
    dispersion_id: dispersionData.id,
    payment_id: item.payment_id,
    amount: item.amount,
  }));

  const { data: itemsData, error: itemsError } = await supabase
    .from("dispersion_items")
    .insert(dispersionItems)
    .select();

  if (itemsError) throw itemsError;

  return {
    ...dispersionData,
    items: itemsData,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body: CreateDispersionRequest = await req.json();
    const result = await createDispersion(body);

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
