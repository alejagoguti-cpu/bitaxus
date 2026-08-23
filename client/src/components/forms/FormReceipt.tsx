// @ts-nocheck
/**
 * FormReceipt Component
 * Form for creating and editing receipts
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createReceiptSchema,
  type CreateReceiptInput,
} from "@/schemas/forms";
import { useReceiptOperations } from "@/hooks";
import { Counterparty, ReceiptStatus } from "@shared/types";

interface FormReceiptProps {
  tenantId: string;
  counterparties: Counterparty[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
  initialData?: {
    id: string;
    concept: string;
    amount: number;
    payerId: string;
    date: string;
    notes?: string;
  };
}

export function FormReceipt({
  tenantId,
  counterparties,
  onSuccess,
  onError,
  initialData,
}: FormReceiptProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<CreateReceiptInput>({
    resolver: zodResolver(createReceiptSchema),
  });

  const { handleCreateReceipt, isLoading, errorMessage, successMessage } =
    useReceiptOperations(tenantId);

  const [localError, setLocalError] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setValue("payerId", initialData.payerId);
      setValue("concept", initialData.concept);
      setValue("amount", initialData.amount);
      setValue("date", initialData.date);
      setValue("notes", initialData.notes);
    }
  }, [initialData, setValue]);

  const onSubmit = async (data: CreateReceiptInput) => {
    try {
      setLocalError("");
      await handleCreateReceipt({
        tenantId,
        payerId: data.payerId,
        concept: data.concept,
        amount: data.amount,
        currency: data.currency || "COP",
        date: data.date,
        notes: data.notes,
      });

      if (successMessage) {
        reset();
        onSuccess?.();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setLocalError(message);
      onError?.(message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-6">
        {initialData ? "Editar Recaudo" : "Crear Recaudo"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Payer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pagador *
          </label>
          <select
            {...register("payerId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar pagador...</option>
            {counterparties.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.name} ({cp.id_number})
              </option>
            ))}
          </select>
          {errors.payerId && (
            <span className="text-sm text-red-600">{errors.payerId.message}</span>
          )}
        </div>

        {/* Concept */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Concepto *
          </label>
          <input
            {...register("concept")}
            type="text"
            placeholder="Honorarios, Prestación, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.concept && (
            <span className="text-sm text-red-600">{errors.concept.message}</span>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto *
          </label>
          <input
            {...register("amount", { valueAsNumber: true })}
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.amount && (
            <span className="text-sm text-red-600">{errors.amount.message}</span>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha *
          </label>
          <input
            {...register("date")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.date && (
            <span className="text-sm text-red-600">{errors.date.message}</span>
          )}
        </div>

        {/* Reference ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID de Referencia (Opcional)
          </label>
          <input
            {...register("referenceId")}
            type="text"
            placeholder="Número de referencia del banco"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas (Opcional)
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Notas adicionales..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error Messages */}
        {(errorMessage || localError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              {errorMessage || localError}
            </p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting || isLoading ? "Procesando..." : "Crear Recaudo"}
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}
