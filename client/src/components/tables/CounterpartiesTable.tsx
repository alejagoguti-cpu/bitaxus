/**
 * CounterpartiesTable Component
 * Table for displaying and managing counterparties
 */

import { useState } from "react";
import { Counterparty } from "@shared/types";

interface CounterpartiesTableProps {
  tenantId: string;
  counterparties?: Counterparty[];
  isLoading?: boolean;
  onViewDetail?: (counterparty: Counterparty) => void;
  onEdit?: (counterparty: Counterparty) => void;
  onDelete?: (counterparty: Counterparty) => void;
}

export function CounterpartiesTable({
  tenantId,
  counterparties = [],
  isLoading = false,
  onViewDetail,
  onEdit,
  onDelete,
}: CounterpartiesTableProps) {
  const [page, setPage] = useState(1);
  const [relation, setRelation] = useState<"Cliente" | "Proveedor" | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  const itemsPerPage = 10;

  const filteredCounterparties = counterparties.filter((cp) => {
    const matchesRelation = !relation || cp.relation === relation;
    const matchesSearch = !searchTerm ||
      cp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cp.id_number.includes(searchTerm);
    return matchesRelation && matchesSearch;
  });

  const totalPages = Math.ceil(filteredCounterparties.length / itemsPerPage);
  const paginatedCounterparties = filteredCounterparties.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getRelationBadge = (relation: string) => {
    if (relation === "Cliente") {
      return "bg-blue-100 text-blue-800";
    }
    return "bg-purple-100 text-purple-800";
  };

  const getStatusBadge = (status: string) => {
    if (status === "Activa") {
      return "bg-green-100 text-green-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header with Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Contrapartes</h2>
          <span className="text-sm text-gray-600">
            Total: {filteredCounterparties.length}
          </span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />

          <select
            value={relation}
            onChange={(e) => {
              setRelation(e.target.value as "Cliente" | "Proveedor" | "");
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Todos los tipos</option>
            <option value="Cliente">Cliente</option>
            <option value="Proveedor">Proveedor</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {paginatedCounterparties.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500">No hay contrapartes para mostrar</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Relación
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Teléfono
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
                {paginatedCounterparties.map((counterparty) => (
                  <tr key={counterparty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {counterparty.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {counterparty.id_type}-{counterparty.id_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {counterparty.type}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRelationBadge(
                          counterparty.relation
                        )}`}
                      >
                        {counterparty.relation}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 truncate">
                      {counterparty.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {counterparty.phone}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                          counterparty.status
                        )}`}
                      >
                        {counterparty.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onViewDetail?.(counterparty)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => onEdit?.(counterparty)}
                          className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete?.(counterparty)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Eliminar
                        </button>
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
