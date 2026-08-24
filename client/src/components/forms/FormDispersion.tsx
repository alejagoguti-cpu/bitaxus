// @ts-nocheck
/**
 * FormDispersion Component
 * Form for creating dispersions with multiple beneficiaries
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createDispersionSchema, CreateDispersionInput, DispersionItemInput } from "@/schemas/forms";
import { BankAccount, Counterparty } from "@shared/types";

interface FormDispersionProps {
  tenantId: string;
  bankAccounts?: BankAccount[];
  beneficiaries?: Counterparty[];
  onSuccess?: () => void;
}

export function FormDispersion({
  tenantId,
  bankAccounts = [],
  beneficiaries = [],
  onSuccess,
}: FormDispersionProps) {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<DispersionItemInput[]>([]);
  const [itemForm, setItemForm] = useState<DispersionItemInput>({
    beneficiaryId: "",
    accountId: "",
    amount: 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDispersionInput>({
    resolver: zodResolver(createDispersionSchema),
  });

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const addItem = () => {
    if (!itemForm.beneficiaryId || !itemForm.accountId || itemForm.amount <= 0) {
      setErrorMessage("Completa todos los campos del beneficiario");
      return;
    }

    setItems([...items, { ...itemForm }]);
    setItemForm({ beneficiaryId: "", accountId: "", amount: 0 });
    setErrorMessage("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateDispersionInput) => {
    setSuccessMessage("");
    setErrorMessage("");
    setIsLoading(true);

    try {
      if (items.length === 0) {
        throw new Error("Debe agregar al menos un beneficiario");
      }

      // TODO: Implement API call via hook
      // const response = await createDispersion({
      //   ...data,
      //   items,
      // });

      setSuccessMessage("¡Dispersión creada exitosamente!");
      reset();
      setItems([]);
      setTimeout(() => {
        setSuccessMessage("");
        onSuccess?.();
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error creando la dispersión"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Crear Dispersión</h2>

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dispersión Details */}
        <div className="border-b pb-6">
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Dispersión *
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Ej: Nómina Mensual"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Concept */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concepto *
            </label>
            <input
              {...register("concept")}
              type="text"
              placeholder="Ej: Nómina de agosto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
            />
            {errors.concept && (
              <p className="text-xs text-red-600 mt-1">{errors.concept.message}</p>
            )}
          </div>

          {/* Source Account */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta Origen *
            </label>
            <select
              {...register("sourceAccountId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
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

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Programada *
            </label>
            <input
              {...register("scheduledDate")}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
            />
            {errors.scheduledDate && (
              <p className="text-xs text-red-600 mt-1">
                {errors.scheduledDate.message}
              </p>
            )}
          </div>
        </div>

        {/* Add Items */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Beneficiarios ({items.length})
          </h3>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            {/* Beneficiary Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beneficiario
              </label>
              <select
                value={itemForm.beneficiaryId}
                onChange={(e) =>
                  setItemForm({ ...itemForm, beneficiaryId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
              >
                <option value="">Selecciona beneficiario</option>
                {beneficiaries.map((ben) => (
                  <option key={ben.id} value={ben.id}>
                    {ben.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuenta Destino
              </label>
              <select
                value={itemForm.accountId}
                onChange={(e) =>
                  setItemForm({ ...itemForm, accountId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
              >
                <option value="">Selecciona cuenta</option>
                {beneficiaries
                  .find((b) => b.id === itemForm.beneficiaryId)
                  ?.bank_accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_number}
                    </option>
                  ))}
              </select>
            </div>

            {/* Amount */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.amount || ""}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full px-4 py-2 bg-[#d95f61] text-white rounded-md hover:bg-[#b64b4d] transition-colors font-medium text-sm"
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                      Beneficiario
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const ben = beneficiaries.find((b) => b.id === item.beneficiaryId);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {ben?.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                          ${item.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Total */}
              <div className="mt-4 p-4 bg-[#fff0ef] rounded-md border border-[#f1bfbd]">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Monto Total:</span>
                  <span className="text-lg font-semibold text-[#b64b4d]">
                    ${totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61] resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading || items.length === 0}
            className="flex-1 px-4 py-2 bg-[#d95f61] text-white rounded-md hover:bg-[#b64b4d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? "Creando..." : "Crear Dispersión"}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setItems([]);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}
