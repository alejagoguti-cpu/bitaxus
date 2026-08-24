/**
 * Dashboard data hooks for the public GitHub Pages build.
 *
 * The connected Supabase project currently exposes receipts and payments in the
 * public schema. Keep the dashboard dependent only on those real tables and
 * let RLS provide row-level visibility for the signed-in user.
 */

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type DashboardPeriod = "Este mes" | "Últimos 30 días" | "Este trimestre";

type MetricsPeriod = "today" | "week" | "month" | "year";

interface UseDashboardMetricsOptions {
  tenantId: string;
  period?: MetricsPeriod;
}

export function getDashboardPeriodStart(period: DashboardPeriod, now = new Date()) {
  const start = new Date(now);
  if (period === "Últimos 30 días") {
    start.setDate(start.getDate() - 30);
  } else if (period === "Este trimestre") {
    const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
  } else {
    start.setDate(1);
  }
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function getMetricsPeriodStart(period: MetricsPeriod, now = new Date()) {
  const start = new Date(now);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (period === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return start.toISOString().slice(0, 10);
}

export interface PublicReceipt {
  id: string;
  payer_id: string | null;
  payer_name: string;
  concept: string;
  amount: number;
  currency: string;
  description: string | null;
  receipt_date: string;
  status: string;
  created_at: string;
}

export interface PublicPayment {
  id: string;
  payment_type: string;
  beneficiary: string | null;
  dispersion_name: string | null;
  account: string;
  amount: number;
  currency: string;
  concept: string;
  description: string | null;
  payment_date: string;
  monthly: boolean;
  status: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalReceipts: number;
  totalReceiptsAmount: number;
  totalPayments: number;
  totalPaymentsAmount: number;
  pendingReceipts: number;
  pendingPayments: number;
  balance: number;
}

export function useDashboardMetricsSupabase(options: UseDashboardMetricsOptions) {
  const periodStart = getMetricsPeriodStart(options.period || "month");

  return useQuery<DashboardMetrics>({
    queryKey: [
      "dashboard-metrics",
      options.tenantId,
      options.period || "month",
    ],
    queryFn: async () => {
      const [receipts, payments] = await Promise.all([
        supabase
          .from("receipts")
          .select("amount, currency, status")
          .gte("receipt_date", periodStart),
        supabase
          .from("payments")
          .select("amount, currency, status")
          .gte("payment_date", periodStart),
      ]);

      if (receipts.error) throw receipts.error;
      if (payments.error) throw payments.error;

      const receiptRows = receipts.data ?? [];
      const paymentRows = payments.data ?? [];
      const totalReceiptsAmount = receiptRows.reduce(
        (sum, row) => sum + (String(row.currency || "COP").toUpperCase() === "COP" ? Number(row.amount || 0) : 0),
        0
      );
      const totalPaymentsAmount = paymentRows.reduce(
        (sum, row) => sum + (String(row.currency || "COP").toUpperCase() === "COP" ? Number(row.amount || 0) : 0),
        0
      );

      return {
        totalReceipts: receiptRows.length,
        totalReceiptsAmount,
        totalPayments: paymentRows.length,
        totalPaymentsAmount,
        pendingReceipts: receiptRows.filter(row => row.status === "Pendiente")
          .length,
        pendingPayments: paymentRows.filter(row =>
          ["Pendiente", "Programado", "En proceso"].includes(row.status)
        ).length,
        balance: totalReceiptsAmount - totalPaymentsAmount,
      };
    },
    staleTime: 30000,
    retry: false,
    // RLS filters rows by auth.uid(); tenantId is presentation metadata only.
    enabled: Boolean(options.tenantId && isSupabaseConfigured),
  });
}

export function useDashboardWidgetsSupabase(
  tenantId: string,
  period: DashboardPeriod = "Este mes"
) {
  const queryClient = useQueryClient();
  const periodStart = getDashboardPeriodStart(period);

  useEffect(() => {
    if (!tenantId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`dashboard-updates:${tenantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "receipts" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["dashboard-receipts", tenantId] });
        void queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", tenantId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["dashboard-payments", tenantId] });
        void queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", tenantId] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, tenantId]);
  const receiptsQuery = useQuery<PublicReceipt[]>({
    queryKey: ["dashboard-receipts", tenantId, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select(
          "id, payer_id, payer_name, concept, amount, currency, description, receipt_date, status, created_at"
        )
        .gte("receipt_date", periodStart.slice(0, 10))
        .order("receipt_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as PublicReceipt[];
    },
    staleTime: 30000,
    retry: false,
    // RLS filters rows by auth.uid(); tenantId is presentation metadata only.
    enabled: Boolean(tenantId && isSupabaseConfigured),
  });

  const paymentsQuery = useQuery<PublicPayment[]>({
    queryKey: ["dashboard-payments", tenantId, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(
          "id, payment_type, beneficiary, dispersion_name, account, amount, currency, concept, description, payment_date, monthly, status, created_at"
        )
        .gte("payment_date", periodStart.slice(0, 10))
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as PublicPayment[];
    },
    staleTime: 30000,
    retry: false,
    // RLS filters rows by auth.uid(); tenantId is presentation metadata only.
    enabled: Boolean(tenantId && isSupabaseConfigured),
  });

  return {
    receipts: receiptsQuery,
    payments: paymentsQuery,
    dispersions: {
      data: [] as never[],
      isLoading: false,
      error: null,
    },
    isLoading: receiptsQuery.isLoading || paymentsQuery.isLoading,
    error: receiptsQuery.error || paymentsQuery.error,
  };
}

export function useDashboardRecentActivity(tenantId: string) {
  return useQuery<never[]>({
    queryKey: ["dashboard-recent-activity", tenantId],
    queryFn: async () => [],
    enabled: false,
    staleTime: Infinity,
    initialData: [],
  });
}
