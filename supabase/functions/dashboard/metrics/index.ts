import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface MetricsRequest {
  tenant_id: string;
  period?: "today" | "week" | "month" | "year";
}

function getPeriodDateRange(period: string = "month"): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();

  let start;
  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      start = weekStart;
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "month":
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    start: start.toISOString(),
    end,
  };
}

export async function getMetrics(req: MetricsRequest) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  const { start, end } = getPeriodDateRange(req.period);

  // Get receipts metrics
  const { data: receipts, error: receiptsError } = await supabase
    .from("receipts")
    .select("amount, status")
    .eq("tenant_id", req.tenant_id)
    .gte("created_at", start)
    .lte("created_at", end);

  if (receiptsError) throw receiptsError;

  const totalReceipts = receipts?.length || 0;
  const totalReceiptsAmount = receipts?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

  // Get payments metrics
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount, status")
    .eq("tenant_id", req.tenant_id)
    .gte("created_at", start)
    .lte("created_at", end);

  if (paymentsError) throw paymentsError;

  const totalPayments = payments?.length || 0;
  const totalPaymentsAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const pendingPayments = payments?.filter((p) => p.status === "Pendiente").length || 0;
  const completedPayments = payments?.filter((p) => p.status === "Completado").length || 0;
  const canceledPayments = payments?.filter((p) => p.status === "Cancelado").length || 0;

  // Get dispersions metrics
  const { data: dispersions, error: dispersionsError } = await supabase
    .from("dispersions")
    .select("total_amount")
    .eq("tenant_id", req.tenant_id)
    .gte("created_at", start)
    .lte("created_at", end);

  if (dispersionsError) throw dispersionsError;

  const totalDispersions = dispersions?.length || 0;
  const totalDispersionsAmount = dispersions?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0;

  // Get counterparties metrics
  const { count: activeCounterparties, error: counterpartiesError } = await supabase
    .from("counterparties")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", req.tenant_id);

  if (counterpartiesError) throw counterpartiesError;

  return {
    totalReceipts,
    totalReceiptsAmount,
    totalPayments,
    totalPaymentsAmount,
    totalDispersions,
    totalDispersionsAmount,
    pendingPayments,
    completedPayments,
    canceledPayments,
    activeCounterparties: activeCounterparties || 0,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body: MetricsRequest = await req.json();
    const result = await getMetrics(body);

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
