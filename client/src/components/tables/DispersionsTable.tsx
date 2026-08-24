/**
 * DispersionsTable Component
 * Table for displaying and managing dispersions
 */

import { useState } from "react";
import { Dispersion, DispersionStatus } from "@shared/types";
import { formatCurrency, formatDate } from "@/lib/formatting";

interface DispersionsTableProps {
  tenantId: string;
  dispersions?: Dispersion[];
  isLoading?: boolean;
  onViewDetail?: (dispersion: Dispersion) => void;
  onEdit?: (dispersion: Dispersion) => void;
  onProcess?: (dispersion: Dispersion) => void;
}

export function DispersionsTable({
  tenantId,
  dispersions = [],
  isLoading = false,
  onViewDetail,
  onEdit,
  onProcess,
}: DispersionsTableProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<DispersionStatus | "">("");

  const itemsPerPage = 10;
  const filteredDispersions = dispersions.filter((d) =>
    !status || d.status === status
  );
  const totalPages = Math.ceil(filteredDispersions.length / itemsPerPage);
  const paginatedDispersions = filteredDispersions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getStatusColor = (status: DispersionStatus) => {
    switch (status) {
      case "Programada":
        return "bg-yellow-100 text-yellow-800";
      case "Procesada":
        return "bg-green-100 text-green-800";
      case "En proceso":
        return "bg-[#fff0ef] text-[#b64b4d]";
      case "Cancelada":
        return "bg-gray-100 text-gray-800";
      case "Fallida":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d95f61]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header with Filter */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Dispersiones</h2>
          <span className="text-sm text-gray-600">Total: {filteredDispersions.length}</span>
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as DispersionStatus | "");
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61] text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="Programada">Programada</option>
          <option value="Procesada">Procesada</option>
          <option value="En proceso">En proceso</option>
          <option value="Cancelada">Cancelada</option>
          <option value="Fallida">Fallida</option>
        </select>
      </div>

      {/* Table */}
      {paginatedDispersions.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500">No hay dispersiones para mostrar</p>
        </div>
      ) : (
        <>
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
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                    Monto Total
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Beneficiarios
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
                {paginatedDispersions.map((dispersion) => (
                  <tr key={dispersion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {dispersion.dispersion_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dispersion.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dispersion.concept}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900">
                      {formatCurrency(dispersion.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dispersion.items?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(dispersion.scheduled_date)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          dispersion.status
                        )}`}
                      >
                        {dispersion.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onViewDetail?.(dispersion)}
                          className="text-sm text-[#b64b4d] hover:text-[#8f3e40] font-medium"
                        >
                          Ver
                        </button>
                        {dispersion.status === "Programada" && (
                          <>
                            <button
                              onClick={() => onEdit?.(dispersion)}
                              className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => onProcess?.(dispersion)}
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
