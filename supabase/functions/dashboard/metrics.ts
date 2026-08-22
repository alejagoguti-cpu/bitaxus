import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface DashboardMetricsRequest {
  tenantId: string;
  year: number;
  month: number;
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

    const payload: DashboardMetricsRequest = await req.json();
    const { tenantId, year, month } = payload;

    // Get receipts grouped by status
    const { data: receipts, error: receiptsError } = await supabase
      .from("receipts")
      .select("status, amount")
      .eq("tenant_id", tenantId)
      .eq("period_year", year)
      .eq("period_month", month);

    if (receiptsError) throw receiptsError;

    // Get payments grouped by status
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("status, amount")
      .eq("tenant_id", tenantId)
      .eq("period_year", year)
      .eq("period_month", month);

    if (paymentsError) throw paymentsError;

    // Get pending items for review
    const { data: pendingPayments } = await supabase
      .from("payments")
      .select("id, payment_number, status, amount, created_at")
      .eq("tenant_id", tenantId)
      .in("status", ["Programado", "En proceso"])
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: pendingReceipts } = await supabase
      .from("receipts")
      .select("id, receipt_number, status, amount, created_at")
      .eq("tenant_id", tenantId)
      .eq("status", "Pendiente")
      .order("created_at", { ascending: false })
      .limit(10);

    // Get recent dispersions
    const { data: recentDispersions } = await supabase
      .from("dispersions")
      .select("id, dispersion_number, status, total_amount, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Calculate metrics
    const receiptMetrics = {
      total_confirmed:
        receipts
          ?.filter((r) => ["Recibido", "Confirmado"].includes(r.status))
          .reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
      total_pending:
        receipts
          ?.filter((r) => r.status === "Pendiente")
          .reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
      count_confirmed:
        receipts?.filter((r) => ["Recibido", "Confirmado"].includes(r.status))
          .length || 0,
      count_pending: receipts?.filter((r) => r.status === "Pendiente").length || 0,
    };

    const paymentMetrics = {
      total_processed:
        payments
          ?.filter((p) => ["Procesado", "Confirmado"].includes(p.status))
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      total_pending:
        payments
          ?.filter((p) => ["Programado", "En proceso"].includes(p.status))
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      count_pending:
        payments?.filter((p) => ["Programado", "En proceso"].includes(p.status))
          .length || 0,
      count_failed:
        payments?.filter((p) => p.status === "Fallido").length || 0,
    };

    const balance = receiptMetrics.total_confirmed - paymentMetrics.total_processed;

    const metrics = {
      period: {
        year,
        month,
      },
      receipts: receiptMetrics,
      payments: paymentMetrics,
      balance,
      pending_review: {
        payments: pendingPayments || [],
        receipts: pendingReceipts || [],
        items_count: (pendingPayments?.length || 0) + (pendingReceipts?.length || 0),
      },
      recent_dispersions: recentDispersions || [],
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
