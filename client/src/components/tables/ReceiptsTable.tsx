/**
 * ReceiptsTable Component
 * Table with pagination, filters, and actions for receipts
 */

import { useState } from "react";
import { useReceipts } from "@/hooks";
import {
  formatCurrency,
  formatDateDisplay,
  getReceiptStatusColor,
  getReceiptStatusLabel,
} from "@/lib/formatting";
import { Receipt, ReceiptStatus } from "@/shared/types";

interface ReceiptsTableProps {
  tenantId: string;
  onViewDetail?: (receipt: Receipt) => void;
  onEdit?: (receipt: Receipt) => void;
}

export function ReceiptsTable({
  tenantId,
  onViewDetail,
  onEdit,
}: ReceiptsTableProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReceiptStatus | "">("");
  const limit = 10;

  const { data, isLoading, error } = useReceipts({
    tenantId,
    status: status as ReceiptStatus | undefined,
    page,
    limit,
  });

  const statusColors: Record<string, string> = {
    Pendiente: "bg-amber-100 text-amber-800",
    Recibido: "bg-emerald-100 text-emerald-800",
    Cancelado: "bg-slate-100 text-slate-800",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recaudos</h2>
          <div className="flex gap-3">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ReceiptStatus | "");
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Recibido">Recibido</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                # Recaudo
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Pagador
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Concepto
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Fecha
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
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-red-600">
                  Error: {error.message}
                </td>
              </tr>
            ) : !data?.data || data.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No hay recaudos
                </td>
              </tr>
            ) : (
              data.data.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {receipt.receipt_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {receipt.payer?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {receipt.concept}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right text-gray-900">
                    {formatCurrency(receipt.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateDisplay(receipt.date)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[receipt.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getReceiptStatusLabel(receipt.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => onViewDetail?.(receipt)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver
                      </button>
                      {receipt.status === "Pendiente" && (
                        <button
                          onClick={() => onEdit?.(receipt)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Mostrando {(page - 1) * limit + 1} a{" "}
            {Math.min(page * limit, data.total)} de {data.total} recaudos
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Anterior
            </button>
            <span className="px-3 py-2 text-sm font-medium">{page}</span>
            <button
              onClick={() => setPage(Math.min(page + 1, Math.ceil(data.total / limit)))}
              disabled={page >= Math.ceil(data.total / limit)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
