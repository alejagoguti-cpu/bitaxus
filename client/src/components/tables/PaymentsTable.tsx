/**
 * PaymentsTable Component
 * Table for displaying and managing payments
 */

import { useState } from "react";
import { usePayments } from "@/hooks";
import { Payment, PaymentStatus } from "@shared/types";
import { formatCurrency, getPaymentStatusColor, getPaymentStatusLabel, formatDate } from "@/lib/formatting";

interface PaymentsTableProps {
  tenantId: string;
  onViewDetail?: (payment: Payment) => void;
  onEdit?: (payment: Payment) => void;
  onProcess?: (payment: Payment) => void;
}

export function PaymentsTable({
  tenantId,
  onViewDetail,
  onEdit,
  onProcess,
}: PaymentsTableProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PaymentStatus | "">("");

  const { data, isLoading, error } = usePayments({
    tenantId,
    page,
    limit: 10,
    status: status || undefined,
  });

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-red-600">Error cargando pagos: {error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d95f61]"></div>
        </div>
      </div>
    );
  }

  const payments = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header with Filter */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pagos</h2>
          <span className="text-sm text-gray-600">Total: {total}</span>
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PaymentStatus | "");
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61] text-sm"
        >
          <option value="">Todos los estados</option>
          <option value={PaymentStatus.SCHEDULED}>Programado</option>
          <option value={PaymentStatus.PROCESSED}>Procesado</option>
          <option value={PaymentStatus.IN_PROGRESS}>En proceso</option>
          <option value={PaymentStatus.CANCELED}>Cancelado</option>
          <option value={PaymentStatus.FAILED}>Fallido</option>
        </select>
      </div>

      {/* Table */}
      {payments.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500">No hay pagos para mostrar</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    # Pago
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Beneficiario
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Fecha Programada
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {payment.payment_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payment.beneficiary?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payment.concept}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(payment.scheduled_date)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          payment.status
                        )}`}
                      >
                        {getPaymentStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onViewDetail?.(payment)}
                          className="text-sm text-[#b64b4d] hover:text-[#8f3e40] font-medium"
                        >
                          Ver
                        </button>
                        {payment.status === PaymentStatus.SCHEDULED && (
                          <>
                            <button
                              onClick={() => onEdit?.(payment)}
                              className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => onProcess?.(payment)}
                              className="text-sm text-green-600 hover:text-green-800 font-medium"
                            >
                              Procesar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                ← Anterior
              </button>

              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
