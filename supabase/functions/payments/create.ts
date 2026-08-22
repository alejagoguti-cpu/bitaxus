import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface CreatePaymentRequest {
  tenantId: string;
  sourceAccountId: string;
  beneficiaryId: string;
  concept: string;
  amount: number;
  currency?: string;
  scheduledDate: string;
  isRecurring?: boolean;
  recurrence?: "once" | "monthly" | "quarterly" | "annual";
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

    const payload: CreatePaymentRequest = await req.json();
    const {
      tenantId,
      sourceAccountId,
      beneficiaryId,
      concept,
      amount,
      currency = "COP",
      scheduledDate,
      isRecurring = false,
      recurrence = "once",
      notes,
    } = payload;

    // Generate payment number
    const { data: lastPayment } = await supabase
      .from("payments")
      .select("payment_number")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = lastPayment
      ? `PA-${parseInt(lastPayment.payment_number.split("-")[1]) + 1}`
      : "PA-50001";

    // Parse date to get period
    const paymentDate = new Date(scheduledDate);
    const period_year = paymentDate.getFullYear();
    const period_month = paymentDate.getMonth() + 1;

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        tenant_id: tenantId,
        payment_number: nextNumber,
        source_account_id: sourceAccountId,
        beneficiary_id: beneficiaryId,
        concept,
        amount,
        currency,
        scheduled_date: scheduledDate,
        status: "Programado",
        is_recurring: isRecurring,
        recurrence,
        notes,
        period_year,
        period_month,
      })
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
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
        entity_type: "payment",
        entity_id: payment.id,
        new_values: payment,
      });

      // Create notification
      await supabase.from("notifications").insert({
        tenant_id: tenantId,
        user_id: userId,
        title: "Pago programado",
        message: `Pago ${nextNumber} de $${amount} ${currency} programado para ${scheduledDate}`,
        type: "in_app",
        channel: "payment_created",
        related_entity_type: "payment",
        related_entity_id: payment.id,
      });
    }

    // Audit trail
    await supabase.from("audit_trails").insert({
      tenant_id: tenantId,
      user_id: userId,
      action: "payment_created",
      details: {
        payment_number: nextNumber,
        amount,
        scheduled_date: scheduledDate,
        beneficiary_id: beneficiaryId,
      },
      status: "success",
    });

    return new Response(JSON.stringify(payment), {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
