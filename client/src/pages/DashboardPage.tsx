/**
 * DashboardPage Component
 * Main dashboard with metrics, recent activity, and quick actions
 */

import { useState } from "react";
import { useDashboardWidgets, usePaymentOperations, useReceiptOperations } from "@/hooks";
import { MetricCard, DashboardGrid } from "@/components/dashboard/MetricCard";
import { ReceiptsTable } from "@/components/tables/ReceiptsTable";
import { formatMonthYear } from "@/lib/formatting";
import { Receipt, Payment } from "@/shared/types";

interface DashboardPageProps {
  tenantId: string;
}

export function DashboardPage({ tenantId }: DashboardPageProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { widgets, isLoading, error } = useDashboardWidgets({
    tenantId,
    year,
    month,
  });

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
        <p className="text-red-700">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Período: {formatMonthYear(year, month)}
          </p>
        </div>

        {/* Period Navigation */}
        <div className="flex gap-2 items-center">
          <button
            onClick={handlePreviousMonth}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
          >
            ← Anterior
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Hoy
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Main Metrics */}
      {!isLoading && widgets && (
        <>
          <DashboardGrid columns={4}>
            {/* Balance */}
            <MetricCard
              title={widgets.balance.title}
              value={widgets.balance.value}
              status={widgets.balance.status === "positive" ? "success" : "error"}
              currency
              icon={
                widgets.balance.status === "positive" ? "💰" : "⚠️"
              }
            />

            {/* Recaudos Confirmados */}
            <MetricCard
              title={widgets.receipts_confirmed.title}
              value={widgets.receipts_confirmed.value}
              subtitle={widgets.receipts_confirmed.subtitle}
              currency
              status="success"
              icon="✓"
            />

            {/* Recaudos Pendientes */}
            <MetricCard
              title={widgets.receipts_pending.title}
              value={widgets.receipts_pending.value}
              subtitle={widgets.receipts_pending.subtitle}
              currency
              status="warning"
              icon="⏳"
            />

            {/* Pagos Pendientes */}
            <MetricCard
              title={widgets.payments_pending.title}
              value={widgets.payments_pending.count}
              status="warning"
              icon="🔄"
              compact
            />
          </DashboardGrid>

          {/* Secondary Metrics */}
          <DashboardGrid columns={3}>
            {/* Pagos Procesados */}
            <MetricCard
              title={widgets.payments_processed.title}
              value={widgets.payments_processed.value}
              currency
              status="success"
              variant="default"
              icon="✓"
            />

            {/* Items por Revisar */}
            <MetricCard
              title={widgets.pending_review.title}
              value={widgets.pending_review.count}
              status={
                widgets.pending_review.status === "warning"
                  ? "warning"
                  : "success"
              }
              icon="📋"
            />

            {/* Dispersiones Recientes */}
            <MetricCard
              title={widgets.recent_dispersions.title}
              value={widgets.recent_dispersions.count}
              status="info"
              icon="💸"
            />
          </DashboardGrid>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <button className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                + Crear Recaudo
              </button>
              <button className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium">
                + Crear Pago
              </button>
              <button className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium">
                + Crear Dispersión
              </button>
              <button className="px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium">
                📊 Exportar
              </button>
            </div>
          </div>

          {/* Pending Review Section */}
          {widgets.pending_review.count > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-amber-900 mb-4">
                ⚠️ {widgets.pending_review.count} item(s) por revisar
              </h2>

              {widgets.pending_review.items.payments &&
                widgets.pending_review.items.payments.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-amber-800 mb-2">
                      Pagos por procesar ({widgets.pending_review.items.payments.length})
                    </h3>
                    <div className="space-y-2">
                      {widgets.pending_review.items.payments.slice(0, 3).map((payment: Payment) => (
                        <div
                          key={payment.id}
                          className="flex justify-between items-center p-3 bg-white rounded border border-amber-100"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {payment.payment_number}
                            </p>
                            <p className="text-sm text-gray-600">
                              {payment.concept}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ${payment.amount.toLocaleString()}
                            </p>
                            <button className="text-sm text-green-600 hover:text-green-800 mt-1">
                              Procesar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {widgets.pending_review.items.receipts &&
                widgets.pending_review.items.receipts.length > 0 && (
                  <div>
                    <h3 className="font-medium text-amber-800 mb-2">
                      Recaudos por confirmar ({widgets.pending_review.items.receipts.length})
                    </h3>
                    <div className="space-y-2">
                      {widgets.pending_review.items.receipts.slice(0, 3).map((receipt: Receipt) => (
                        <div
                          key={receipt.id}
                          className="flex justify-between items-center p-3 bg-white rounded border border-amber-100"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {receipt.receipt_number}
                            </p>
                            <p className="text-sm text-gray-600">
                              De: {receipt.payer?.name || "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ${receipt.amount.toLocaleString()}
                            </p>
                            <button className="text-sm text-green-600 hover:text-green-800 mt-1">
                              Confirmar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Recent Dispersions */}
          {widgets.recent_dispersions.data &&
            widgets.recent_dispersions.data.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Dispersiones Recientes</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          # Dispersión
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                          Monto Total
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {widgets.recent_dispersions.data.map((disp) => (
                        <tr key={disp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {disp.dispersion_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {disp.name}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-right text-gray-900">
                            ${disp.total_amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {disp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}
