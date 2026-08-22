import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ProcessDispersionRequest {
  dispersion_id: string;
  tenant_id: string;
}

export async function processDispersion(req: ProcessDispersionRequest) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  // Update dispersion status
  const { data, error } = await supabase
    .from("dispersions")
    .update({
      status: "Completado",
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.dispersion_id)
    .eq("tenant_id", req.tenant_id)
    .select(
      `
      *,
      items:dispersion_items(*),
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
    const body: ProcessDispersionRequest = await req.json();
    const result = await processDispersion(body);

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
