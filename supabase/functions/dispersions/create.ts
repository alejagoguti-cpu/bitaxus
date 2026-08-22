import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface DispersionItem {
  beneficiaryId: string;
  accountId: string;
  amount: number;
}

interface CreateDispersionRequest {
  tenantId: string;
  name: string;
  concept: string;
  sourceAccountId: string;
  scheduledDate: string;
  items: DispersionItem[];
  notes?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            authorization: authHeader,
          },
        },
      }
    );

    const payload: CreateDispersionRequest = await req.json();
    const {
      tenantId,
      name,
      concept,
      sourceAccountId,
      scheduledDate,
      items,
      notes,
    } = payload;

    // Validate items
    if (!items || items.length === 0) {
      throw new Error("La dispersión debe tener al menos un item");
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    // Generate dispersion number
    const { data: lastDispersion } = await supabase
      .from("dispersions")
      .select("dispersion_number")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = lastDispersion
      ? `DP-${parseInt(lastDispersion.dispersion_number.split("-")[1]) + 1}`
      : "DP-80001";

    // Parse date to get period
    const dispersionDate = new Date(scheduledDate);
    const period_year = dispersionDate.getFullYear();
    const period_month = dispersionDate.getMonth() + 1;

    // Create dispersion
    const { data: dispersion, error: dispersionError } = await supabase
      .from("dispersions")
      .insert({
        tenant_id: tenantId,
        dispersion_number: nextNumber,
        name,
        concept,
        total_amount: totalAmount,
        currency: "COP",
        source_account_id: sourceAccountId,
        scheduled_date: scheduledDate,
        status: "Programada",
        notes,
        period_year,
        period_month,
      })
      .select()
      .single();

    if (dispersionError) {
      throw dispersionError;
    }

    // Prepare dispersion items
    const itemsToInsert = items.map((item) => ({
      dispersion_id: dispersion.id,
      beneficiary_id: item.beneficiaryId,
      account_id: item.accountId,
      amount: item.amount,
      status: "pending" as const,
    }));

    // Insert dispersion items
    const { error: itemsError } = await supabase
      .from("dispersion_items")
      .insert(itemsToInsert);

    if (itemsError) {
      throw itemsError;
    }

    // Get user ID
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    // Log activity
    if (userId) {
      await supabase.from("activity_logs").insert({
        tenant_id: tenantId,
        user_id: userId,
        action: "created",
        entity_type: "dispersion",
        entity_id: dispersion.id,
        new_values: {
          ...dispersion,
          items_count: items.length,
        },
      });

      // Create notification
      await supabase.from("notifications").insert({
        tenant_id: tenantId,
        user_id: userId,
        title: "Dispersión creada",
        message: `Dispersión ${nextNumber} con ${items.length} beneficiarios por $${totalAmount} COP creada`,
        type: "in_app",
        channel: "dispersion_created",
        related_entity_type: "dispersion",
        related_entity_id: dispersion.id,
      });
    }

    // Audit trail
    await supabase.from("audit_trails").insert({
      tenant_id: tenantId,
      user_id: userId,
      action: "dispersion_created",
      details: {
        dispersion_number: nextNumber,
        total_amount: totalAmount,
        items_count: items.length,
        scheduled_date: scheduledDate,
      },
      status: "success",
    });

    return new Response(
      JSON.stringify({
        dispersion,
        items_count: items.length,
        total_amount: totalAmount,
      }),
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error creating dispersion:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
