/**
 * FormPayment Component
 * Form for creating and editing payments
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createPaymentSchema, CreatePaymentInput } from "@/schemas/forms";
import { BankAccount, Counterparty } from "@/shared/types";
import { usePaymentOperations } from "@/hooks";

interface FormPaymentProps {
  tenantId: string;
  bankAccounts?: BankAccount[];
  beneficiaries?: Counterparty[];
  onSuccess?: () => void;
}

export function FormPayment({
  tenantId,
  bankAccounts = [],
  beneficiaries = [],
  onSuccess,
}: FormPaymentProps) {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { createPayment, isLoading } = usePaymentOperations({ tenantId });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      currency: "COP",
      isRecurring: false,
      recurrence: "once",
    },
  });

  const isRecurring = watch("isRecurring");

  const onSubmit = async (data: CreatePaymentInput) => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await createPayment(data);
      setSuccessMessage("¡Pago creado exitosamente!");
      reset();
      setTimeout(() => {
        setSuccessMessage("");
        onSuccess?.();
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error creando el pago"
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Crear Pago</h2>

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Source Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuenta Origen
          </label>
          <select
            {...register("sourceAccountId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una cuenta</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bank_name} - {account.account_number}
              </option>
            ))}
          </select>
          {errors.sourceAccountId && (
            <p className="text-xs text-red-600 mt-1">
              {errors.sourceAccountId.message}
            </p>
          )}
        </div>

        {/* Beneficiary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beneficiario
          </label>
          <select
            {...register("beneficiaryId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un beneficiario</option>
            {beneficiaries.map((beneficiary) => (
              <option key={beneficiary.id} value={beneficiary.id}>
                {beneficiary.name}
              </option>
            ))}
          </select>
          {errors.beneficiaryId && (
            <p className="text-xs text-red-600 mt-1">
              {errors.beneficiaryId.message}
            </p>
          )}
        </div>

        {/* Concept */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Concepto
          </label>
          <input
            {...register("concept")}
            type="text"
            placeholder="Ej: Pago nómina, Compra materiales"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.concept && (
            <p className="text-xs text-red-600 mt-1">{errors.concept.message}</p>
          )}
        </div>

        {/* Amount and Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto
            </label>
            <input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.amount && (
              <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda
            </label>
            <select
              {...register("currency")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="COP">COP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Scheduled Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Programada
          </label>
          <input
            {...register("scheduledDate")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.scheduledDate && (
            <p className="text-xs text-red-600 mt-1">
              {errors.scheduledDate.message}
            </p>
          )}
        </div>

        {/* Recurring */}
        <div className="bg-gray-50 rounded-md p-4">
          <label className="flex items-center gap-2 mb-3">
            <input
              {...register("isRecurring")}
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Pago Recurrente
            </span>
          </label>

          {isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frecuencia
              </label>
              <select
                {...register("recurrence")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="once">Una sola vez</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="annual">Anual</option>
              </select>
              {errors.recurrence && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.recurrence.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas (Opcional)
          </label>
          <textarea
            {...register("notes")}
            placeholder="Añade notas o comentarios"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? "Creando..." : "Crear Pago"}
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}
