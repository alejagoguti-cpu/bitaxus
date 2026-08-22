/**
 * PaymentsPage Component
 * Page for managing payments
 */

import { useState } from "react";
import { Payment } from "@/shared/types";
import { PaymentsTable } from "@/components/tables/PaymentsTable";
import { FormPayment } from "@/components/forms/FormPayment";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useBankAccounts } from "@/hooks";

interface PaymentsPageProps {
  tenantId: string;
}

export function PaymentsPage({ tenantId }: PaymentsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: accountsData } = useBankAccounts?.({ tenantId }) || {
    data: undefined,
  };
  const bankAccounts = accountsData?.data || [];

  const handleViewDetail = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowForm(true);
  };

  const handleProcess = (payment: Payment) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handleConfirmProcess = async () => {
    if (selectedPayment) {
      // TODO: Implement payment processing via API
      console.log("Procesando pago:", selectedPayment.id);
      setDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y controla todos tus pagos
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedPayment(null);
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
        >
          + Crear Pago
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <FormPayment
            tenantId={tenantId}
            bankAccounts={bankAccounts}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Detail Section */}
      {selectedPayment && !showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedPayment.payment_number}
              </h2>
              <p className="text-gray-600 mt-1">{selectedPayment.concept}</p>
            </div>
            <button
              onClick={() => setSelectedPayment(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-600">Monto</p>
              <p className="text-lg font-semibold text-gray-900">
                ${selectedPayment.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Estado</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedPayment.status}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Fecha Programada</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(selectedPayment.scheduled_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Beneficiario</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedPayment.beneficiary?.name}
              </p>
            </div>
          </div>

          {selectedPayment.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-1">Notas</p>
              <p className="text-sm text-gray-700">{selectedPayment.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <PaymentsTable
        tenantId={tenantId}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onProcess={handleProcess}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogOpen}
        title="Procesar Pago"
        message={`¿Estás seguro de que deseas procesar el pago ${selectedPayment?.payment_number}?`}
        confirmText="Procesar"
        variant="warning"
        onConfirm={handleConfirmProcess}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
