import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface ProcessPaymentRequest {
  paymentId: string;
  tenantId: string;
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

    const payload: ProcessPaymentRequest = await req.json();
    const { paymentId, tenantId } = payload;

    // Get payment details
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("*, source_account:bank_accounts(*), beneficiary:counterparties(*)")
      .eq("id", paymentId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError || !payment) {
      throw new Error("Pago no encontrado");
    }

    if (payment.status !== "Programado") {
      throw new Error("El pago no puede procesarse. Estado actual: " + payment.status);
    }

    // In a real implementation, here you would call external bank APIs
    // to process the actual payment

    const today = new Date().toISOString().split("T")[0];

    // Update payment status
    const { data: updatedPayment, error: updateError } = await supabase
      .from("payments")
      .update({
        status: "Procesado",
        executed_date: today,
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Get user ID
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    // Log activity
    if (userId) {
      await supabase.from("activity_logs").insert({
        tenant_id: tenantId,
        user_id: userId,
        action: "updated",
        entity_type: "payment",
        entity_id: paymentId,
        old_values: payment,
        new_values: updatedPayment,
        changes: {
          status: { from: "Programado", to: "Procesado" },
          executed_date: { from: null, to: today },
        },
      });

      // Create notification for user
      await supabase.from("notifications").insert({
        tenant_id: tenantId,
        user_id: userId,
        title: `Pago procesado: ${payment.payment_number}`,
        message: `Pago de $${payment.amount} ${payment.currency} fue procesado exitosamente`,
        type: "in_app",
        channel: "payment_processed",
        related_entity_type: "payment",
        related_entity_id: paymentId,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    }

    // Audit trail
    await supabase.from("audit_trails").insert({
      tenant_id: tenantId,
      user_id: userId,
      action: "payment_processed",
      details: {
        payment_number: payment.payment_number,
        amount: payment.amount,
        executed_date: today,
      },
      status: "success",
    });

    return new Response(JSON.stringify(updatedPayment), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error processing payment:", error);

    // Log the error in audit trail
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: userData } = await supabase.auth.getUser().catch(() => ({}));

    await supabase
      .from("audit_trails")
      .insert({
        tenant_id: Deno.env.get("TENANT_ID"),
        user_id: userData?.user?.id,
        action: "payment_process_failed",
        status: "failure",
        error_message: error.message,
      })
      .catch(console.error);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
