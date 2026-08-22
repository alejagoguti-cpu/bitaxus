import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RegisterRequest {
  user_id: string;
  email: string;
  name: string;
  tenant_name: string;
}

export async function register(req: RegisterRequest) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  // Create tenant
  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      name: req.tenant_name,
      status: "activo",
    })
    .select()
    .single();

  if (tenantError) throw tenantError;

  // Create user record
  const { data: userData, error: userError } = await supabase
    .from("users")
    .insert({
      id: req.user_id,
      email: req.email,
      name: req.name,
      tenant_id: tenantData.id,
      role: "admin",
      status: "activo",
    })
    .select()
    .single();

  if (userError) throw userError;

  return {
    userData,
    tenantData,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body: RegisterRequest = await req.json();
    const result = await register(body);

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
