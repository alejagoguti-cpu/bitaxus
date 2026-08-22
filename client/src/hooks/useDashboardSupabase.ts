/**
 * useDashboardSupabase Hook
 * Supabase integration for dashboard metrics
 */

import { useQuery } from "@tanstack/react-query";
import { supabase, callEdgeFunction } from "@/lib/supabase";

export interface DashboardMetrics {
  totalReceipts: number;
  totalReceiptsAmount: number;
  totalPayments: number;
  totalPaymentsAmount: number;
  totalDispersions: number;
  totalDispersionsAmount: number;
  pendingPayments: number;
  completedPayments: number;
  canceledPayments: number;
  activeCounterparties: number;
}

interface UseDashboardMetricsOptions {
  tenantId: string;
  period?: "today" | "week" | "month" | "year";
}

export function useDashboardMetricsSupabase(options: UseDashboardMetricsOptions) {
  return useQuery({
    queryKey: ["dashboard-metrics", options.tenantId, options.period || "month"],
    queryFn: async () => {
      return callEdgeFunction<DashboardMetrics>("dashboard/metrics", {
        tenant_id: options.tenantId,
        period: options.period || "month",
      });
    },
    staleTime: 60000,
    retry: 2,
  });
}

export function useDashboardWidgetsSupabase(tenantId: string) {
  const receiptsQuery = useQuery({
    queryKey: ["dashboard-receipts-summary", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("status, amount", { count: "exact" })
        .eq("tenant_id", tenantId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const total = data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      return { total, count: data?.length || 0 };
    },
    staleTime: 60000,
    retry: 2,
  });

  const paymentsQuery = useQuery({
    queryKey: ["dashboard-payments-summary", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("status, amount", { count: "exact" })
        .eq("tenant_id", tenantId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const total = data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const byStatus = {
        pending: data?.filter(p => p.status === "Pendiente").length || 0,
        completed: data?.filter(p => p.status === "Completado").length || 0,
        canceled: data?.filter(p => p.status === "Cancelado").length || 0,
      };

      return { total, count: data?.length || 0, byStatus };
    },
    staleTime: 60000,
    retry: 2,
  });

  const dispersionsQuery = useQuery({
    queryKey: ["dashboard-dispersions-summary", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dispersions")
        .select("status, total_amount", { count: "exact" })
        .eq("tenant_id", tenantId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const total = data?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0;
      return { total, count: data?.length || 0 };
    },
    staleTime: 60000,
    retry: 2,
  });

  return {
    receipts: receiptsQuery,
    payments: paymentsQuery,
    dispersions: dispersionsQuery,
    isLoading: receiptsQuery.isLoading || paymentsQuery.isLoading || dispersionsQuery.isLoading,
    error: receiptsQuery.error || paymentsQuery.error || dispersionsQuery.error,
  };
}

export function useDashboardRecentActivity(tenantId: string) {
  return useQuery({
    queryKey: ["dashboard-recent-activity", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    retry: 2,
  });
}
