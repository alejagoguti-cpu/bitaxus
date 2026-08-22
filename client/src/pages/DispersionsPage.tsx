/**
 * DispersionsPage Component
 * Page for managing dispersions
 */

import { useState } from "react";
import { Dispersion } from "@/shared/types";
import { DispersionsTable } from "@/components/tables/DispersionsTable";
import { FormDispersion } from "@/components/forms/FormDispersion";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useBankAccounts, useCounterparties } from "@/hooks";

interface DispersionsPageProps {
  tenantId: string;
}

export function DispersionsPage({ tenantId }: DispersionsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDispersion, setSelectedDispersion] = useState<Dispersion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dispersions, setDispersions] = useState<Dispersion[]>([]);

  const { data: accountsData } = useBankAccounts?.({ tenantId }) || {
    data: undefined,
  };
  const { data: beneficiariesData } = useCounterparties?.({ tenantId }) || {
    data: undefined,
  };

  const bankAccounts = accountsData?.data || [];
  const beneficiaries = beneficiariesData?.data || [];

  const handleViewDetail = (dispersion: Dispersion) => {
    setSelectedDispersion(dispersion);
  };

  const handleEdit = (dispersion: Dispersion) => {
    setSelectedDispersion(dispersion);
    setShowForm(true);
  };

  const handleProcess = (dispersion: Dispersion) => {
    setSelectedDispersion(dispersion);
    setDialogOpen(true);
  };

  const handleConfirmProcess = async () => {
    if (selectedDispersion) {
      // TODO: Implement dispersion processing via API
      console.log("Procesando dispersión:", selectedDispersion.id);
      setDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispersiones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona distribuciones de dinero a múltiples beneficiarios
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedDispersion(null);
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
        >
          + Crear Dispersión
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <FormDispersion
            tenantId={tenantId}
            bankAccounts={bankAccounts}
            beneficiaries={beneficiaries}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Detail Section */}
      {selectedDispersion && !showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedDispersion.dispersion_number}
              </h2>
              <p className="text-gray-600 mt-1">{selectedDispersion.name}</p>
            </div>
            <button
              onClick={() => setSelectedDispersion(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs font-medium text-gray-600">Monto Total</p>
              <p className="text-lg font-semibold text-gray-900">
                ${selectedDispersion.total_amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Estado</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedDispersion.status}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Beneficiarios</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedDispersion.items?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Fecha</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(selectedDispersion.scheduled_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Beneficiaries List */}
          {selectedDispersion.items && selectedDispersion.items.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Beneficiarios</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">
                        Beneficiario
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">
                        Monto
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDispersion.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-900">
                          {item.beneficiary?.name}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-gray-900">
                          ${item.amount.toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <DispersionsTable
        tenantId={tenantId}
        dispersions={dispersions}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onProcess={handleProcess}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogOpen}
        title="Procesar Dispersión"
        message={`¿Estás seguro de que deseas procesar la dispersión ${selectedDispersion?.dispersion_number}? Se transferirá dinero a ${selectedDispersion?.items?.length || 0} beneficiarios.`}
        confirmText="Procesar"
        variant="warning"
        onConfirm={handleConfirmProcess}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
