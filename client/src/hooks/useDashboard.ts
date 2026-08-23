/**
 * useDashboard Hook
 * React hook for dashboard metrics and data
 */

import { useQuery } from "@tanstack/react-query";
import { getAPI } from "@/services/api";
import { DashboardMetrics } from "@shared/types";

interface UseDashboardOptions {
  tenantId: string;
  year: number;
  month: number;
}

/**
 * Hook to fetch dashboard metrics for a period
 */
export function useDashboardMetrics(options: UseDashboardOptions) {
  const api = getAPI();

  return useQuery({
    queryKey: ["dashboard-metrics", options.tenantId, options.year, options.month],
    queryFn: () =>
      api.getDashboardMetrics({
        tenantId: options.tenantId,
        year: options.year,
        month: options.month,
      }),
    staleTime: 60000, // 1 minute - dashboard updates every minute
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for dashboard state and calculations
 */
export function useDashboardState(options: UseDashboardOptions) {
  const { data: metrics, isLoading, error } = useDashboardMetrics(options);

  if (!metrics) {
    return {
      metrics: null,
      isLoading,
      error,
      stats: null,
    };
  }

  // Calculate summary stats
  const stats = {
    // Receipt stats
    receipts: {
      total_income:
        metrics.receipts.total_confirmed + metrics.receipts.total_pending,
      confirmed: metrics.receipts.total_confirmed,
      pending: metrics.receipts.total_pending,
      confirmed_count: metrics.receipts.count_confirmed,
      pending_count: metrics.receipts.count_pending,
      percentage_confirmed:
        metrics.receipts.total_confirmed > 0
          ? Math.round(
              (metrics.receipts.total_confirmed /
                (metrics.receipts.total_confirmed +
                  metrics.receipts.total_pending)) *
                100
            )
          : 0,
    },

    // Payment stats
    payments: {
      total_expenses:
        metrics.payments.total_processed + metrics.payments.total_pending,
      processed: metrics.payments.total_processed,
      pending: metrics.payments.total_pending,
      pending_count: metrics.payments.count_pending,
      failed_count: metrics.payments.count_failed,
      percentage_pending:
        metrics.payments.total_pending > 0
          ? Math.round(
              (metrics.payments.total_pending /
                (metrics.payments.total_processed +
                  metrics.payments.total_pending)) *
                100
            )
          : 0,
    },

    // Balance
    balance: metrics.balance,
    cash_position: metrics.balance > 0 ? "positive" : "negative",

    // Pending review
    pending_review_count: metrics.pending_review.items_count,
    has_pending_review: metrics.pending_review.items_count > 0,

    // Recent activity
    recent_dispersions: metrics.recent_dispersions.length,
  };

  return { metrics, stats, isLoading, error };
}

/**
 * Hook for getting previous period metrics (for comparison)
 */
export function useDashboardComparison(
  tenantId: string,
  year: number,
  month: number
) {
  // Calculate previous month
  let prevMonth = month - 1;
  let prevYear = year;

  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }

  const currentMetrics = useDashboardMetrics({
    tenantId,
    year,
    month,
  });

  const previousMetrics = useDashboardMetrics({
    tenantId,
    year: prevYear,
    month: prevMonth,
  });

  if (!currentMetrics.data || !previousMetrics.data) {
    return {
      current: null,
      previous: null,
      isLoading: currentMetrics.isLoading || previousMetrics.isLoading,
      comparison: null,
    };
  }

  const comparison = {
    receipts: {
      confirmed_change:
        currentMetrics.data.receipts.total_confirmed -
        previousMetrics.data.receipts.total_confirmed,
      pending_change:
        currentMetrics.data.receipts.total_pending -
        previousMetrics.data.receipts.total_pending,
    },
    payments: {
      processed_change:
        currentMetrics.data.payments.total_processed -
        previousMetrics.data.payments.total_processed,
      pending_change:
        currentMetrics.data.payments.total_pending -
        previousMetrics.data.payments.total_pending,
    },
    balance_change:
      currentMetrics.data.balance - previousMetrics.data.balance,
  };

  return {
    current: currentMetrics.data,
    previous: previousMetrics.data,
    isLoading: currentMetrics.isLoading || previousMetrics.isLoading,
    comparison,
  };
}

/**
 * Hook for dashboard widgets data
 */
export function useDashboardWidgets(options: UseDashboardOptions) {
  const { metrics, stats, isLoading, error } = useDashboardState(options);

  if (!metrics || !stats) {
    return {
      widgets: null,
      isLoading,
      error,
    };
  }

  const widgets = {
    balance: {
      title: "Saldo Operativo",
      value: stats.balance,
      status: stats.cash_position,
      currency: "COP",
    },

    receipts_confirmed: {
      title: "Recaudos Confirmados",
      value: metrics.receipts.total_confirmed,
      subtitle: `${stats.receipts.confirmed_count} transacciones`,
      percentage: stats.receipts.percentage_confirmed,
    },

    receipts_pending: {
      title: "Recaudos por Recibir",
      value: metrics.receipts.total_pending,
      subtitle: `${stats.receipts.pending_count} transacciones`,
      status: "warning",
    },

    payments_processed: {
      title: "Pagos Procesados",
      value: metrics.payments.total_processed,
      subtitle: "Del período actual",
    },

    payments_pending: {
      title: "Pagos por Procesar",
      value: metrics.payments.total_pending,
      count: stats.payments.pending_count,
      status: "pending",
    },

    pending_review: {
      title: "Items por Revisar",
      count: stats.pending_review_count,
      status: stats.has_pending_review ? "warning" : "success",
      items: metrics.pending_review,
    },

    recent_dispersions: {
      title: "Dispersiones Recientes",
      count: stats.recent_dispersions,
      data: metrics.recent_dispersions,
    },
  };

  return { widgets, isLoading, error };
}
