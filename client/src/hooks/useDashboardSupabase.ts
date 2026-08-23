/**
 * Dashboard data hooks for the public GitHub Pages build.
 *
 * The connected Supabase project currently exposes receipts and payments in the
 * public schema. Keep the dashboard dependent only on those real tables and
 * let RLS provide row-level visibility for the signed-in user.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

interface UseDashboardMetricsOptions {
  tenantId: string;
  period?: "today" | "week" | "month" | "year";
}

export function useDashboardMetricsSupabase(
  options: UseDashboardMetricsOptions
) {
  return useQuery<DashboardMetrics>({
    queryKey: [
      "dashboard-metrics",
      options.tenantId,
      options.period || "month",
    ],
    queryFn: async () => {
      const [receipts, payments] = await Promise.all([
        supabase.from("receipts").select("amount, status"),
        supabase.from("payments").select("amount, status"),
      ]);

      if (receipts.error) throw receipts.error;
      if (payments.error) throw payments.error;

      const receiptRows = receipts.data ?? [];
      const paymentRows = payments.data ?? [];
      const totalReceiptsAmount = receiptRows.reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
      );
      const totalPaymentsAmount = paymentRows.reduce(
        (sum, row) => sum + Number(row.amount || 0),
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
          ["Programado", "En proceso"].includes(row.status)
        ).length,
        balance: totalReceiptsAmount - totalPaymentsAmount,
      };
    },
    staleTime: 60000,
    retry: false,
    // RLS filters rows by auth.uid(); tenantId is presentation metadata only.
    enabled: true,
  });
}

export function useDashboardWidgetsSupabase(tenantId: string) {
  const receiptsQuery = useQuery<PublicReceipt[]>({
    queryKey: ["dashboard-receipts", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select(
          "id, payer_id, payer_name, concept, amount, currency, description, receipt_date, status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as PublicReceipt[];
    },
    staleTime: 30000,
    retry: false,
    // RLS filters rows by auth.uid(); tenantId is presentation metadata only.
    enabled: true,
  });

  const paymentsQuery = useQuery<PublicPayment[]>({
    queryKey: ["dashboard-payments", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(
          "id, payment_type, beneficiary, dispersion_name, account, amount, currency, concept, description, payment_date, monthly, status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as PublicPayment[];
    },
    staleTime: 30000,
    retry: false,
    // RLS filters rows by auth.uid(); tenantId is presentation metadata only.
    enabled: true,
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
