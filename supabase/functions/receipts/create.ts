import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface CreateReceiptRequest {
  tenantId: string;
  payerId: string;
  concept: string;
  amount: number;
  currency?: string;
  date: string;
  referenceId?: string;
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

    const payload: CreateReceiptRequest = await req.json();
    const {
      tenantId,
      payerId,
      concept,
      amount,
      currency = "COP",
      date,
      referenceId,
      notes,
    } = payload;

    // Generate receipt number
    const { data: lastReceipt } = await supabase
      .from("receipts")
      .select("receipt_number")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = lastReceipt
      ? `RC-${parseInt(lastReceipt.receipt_number.split("-")[1]) + 1}`
      : "RC-10001";

    // Parse date to get period
    const receiptDate = new Date(date);
    const period_year = receiptDate.getFullYear();
    const period_month = receiptDate.getMonth() + 1;

    // Create receipt
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        tenant_id: tenantId,
        receipt_number: nextNumber,
        payer_id: payerId,
        concept,
        amount,
        currency,
        date,
        status: "Pendiente",
        reference_id: referenceId,
        notes,
        period_year,
        period_month,
      })
      .select()
      .single();

    if (receiptError) {
      throw receiptError;
    }

    // Get user ID from auth header (Supabase sets it in a custom claim)
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    // Log activity
    if (userId) {
      await supabase.from("activity_logs").insert({
        tenant_id: tenantId,
        user_id: userId,
        action: "created",
        entity_type: "receipt",
        entity_id: receipt.id,
        new_values: receipt,
      });

      // Create notification
      await supabase.from("notifications").insert({
        tenant_id: tenantId,
        user_id: userId,
        title: "Recaudo creado",
        message: `Recaudo ${nextNumber} de $${amount} ${currency} registrado`,
        type: "in_app",
        channel: "receipt_created",
        related_entity_type: "receipt",
        related_entity_id: receipt.id,
      });
    }

    // Audit trail
    await supabase.from("audit_trails").insert({
      tenant_id: tenantId,
      user_id: userId,
      action: "receipt_created",
      details: {
        receipt_number: nextNumber,
        amount,
        payer_id: payerId,
      },
      status: "success",
    });

    return new Response(JSON.stringify(receipt), {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error creating receipt:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
