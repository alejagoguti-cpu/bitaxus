/**
 * CounterpartiesPage Component
 * Page for managing counterparties
 */

import { useState } from "react";
import { Counterparty } from "@shared/types";
import { CounterpartiesTable } from "@/components/tables/CounterpartiesTable";
import { FormCounterparty } from "@/components/forms/FormCounterparty";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useCounterparties } from "@/hooks";

interface CounterpartiesPageProps {
  tenantId: string;
}

export function CounterpartiesPage({ tenantId }: CounterpartiesPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: counterpartiesData, isLoading } = useCounterparties?.({
    tenantId,
  }) || {
    data: undefined,
    isLoading: false,
  };

  const counterparties = counterpartiesData?.data || [];

  const handleViewDetail = (counterparty: Counterparty) => {
    setSelectedCounterparty(counterparty);
  };

  const handleEdit = (counterparty: Counterparty) => {
    setSelectedCounterparty(counterparty);
    setShowForm(true);
  };

  const handleDelete = (counterparty: Counterparty) => {
    setSelectedCounterparty(counterparty);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedCounterparty) {
      // TODO: Implement counterparty deletion via API
      console.log("Eliminando contraparte:", selectedCounterparty.id);
      setDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contrapartes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona clientes, proveedores y otros contactos
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedCounterparty(null);
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          + Crear Contraparte
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <FormCounterparty
            tenantId={tenantId}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Detail Section */}
      {selectedCounterparty && !showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCounterparty.name}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedCounterparty.type} • {selectedCounterparty.relation}
              </p>
            </div>
            <button
              onClick={() => setSelectedCounterparty(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-600">ID</p>
                <p className="text-base font-semibold text-gray-900">
                  {selectedCounterparty.id_type} {selectedCounterparty.id_number}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Email</p>
                <p className="text-base font-semibold text-gray-900">
                  {selectedCounterparty.email}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-600">Teléfono</p>
                <p className="text-base font-semibold text-gray-900">
                  {selectedCounterparty.phone}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Estado</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedCounterparty.status === "Activa"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedCounterparty.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Accounts Section */}
          {selectedCounterparty.bank_accounts &&
            selectedCounterparty.bank_accounts.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Cuentas Bancarias
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCounterparty.bank_accounts.map((account) => (
                    <div
                      key={account.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {account.bank_name}
                        </h4>
                        {account.is_primary && (
                          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {account.account_type}
                      </p>
                      <p className="text-sm font-mono text-gray-900">
                        {account.account_number}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Titular: {account.account_holder}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => handleEdit(selectedCounterparty)}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium text-sm"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(selectedCounterparty)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <CounterpartiesTable
        tenantId={tenantId}
        counterparties={counterparties}
        isLoading={isLoading}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogOpen}
        title="Eliminar Contraparte"
        message={`¿Estás seguro de que deseas eliminar a ${selectedCounterparty?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
