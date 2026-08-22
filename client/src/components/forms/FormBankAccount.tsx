/**
 * FormBankAccount Component
 * Form for creating and editing bank accounts
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createBankAccountSchema, CreateBankAccountInput } from "@/schemas/forms";
import { Counterparty } from "@/shared/types";

interface FormBankAccountProps {
  tenantId: string;
  counterparties?: Counterparty[];
  onSuccess?: () => void;
}

export function FormBankAccount({
  tenantId,
  counterparties = [],
  onSuccess,
}: FormBankAccountProps) {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateBankAccountInput>({
    resolver: zodResolver(createBankAccountSchema),
    defaultValues: {
      account_type: "Ahorros",
      is_primary: false,
    },
  });

  const onSubmit = async (data: CreateBankAccountInput) => {
    setSuccessMessage("");
    setErrorMessage("");
    setIsLoading(true);

    try {
      // TODO: Implement API call via hook
      // const response = await createBankAccount(data);
      setSuccessMessage("¡Cuenta bancaria creada exitosamente!");
      reset();
      setTimeout(() => {
        setSuccessMessage("");
        onSuccess?.();
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error creando la cuenta"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">
        Crear Cuenta Bancaria
      </h2>

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
        {/* Counterparty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraparte *
          </label>
          <select
            {...register("counterpartyId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una contraparte</option>
            {counterparties.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.name}
              </option>
            ))}
          </select>
          {errors.counterpartyId && (
            <p className="text-xs text-red-600 mt-1">
              {errors.counterpartyId.message}
            </p>
          )}
        </div>

        {/* Bank Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Banco *
          </label>
          <select
            {...register("bank_name")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un banco</option>
            <option value="Bancolombia">Bancolombia</option>
            <option value="BBVA">BBVA</option>
            <option value="Davivienda">Davivienda</option>
            <option value="Scotiabank">Scotiabank</option>
            <option value="Itaú">Itaú</option>
            <option value="Santander">Santander</option>
            <option value="Otro">Otro</option>
          </select>
          {errors.bank_name && (
            <p className="text-xs text-red-600 mt-1">
              {errors.bank_name.message}
            </p>
          )}
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Cuenta *
          </label>
          <select
            {...register("account_type")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Ahorros">Ahorros</option>
            <option value="Corriente">Corriente</option>
            <option value="Ahorro programado">Ahorro Programado</option>
          </select>
          {errors.account_type && (
            <p className="text-xs text-red-600 mt-1">
              {errors.account_type.message}
            </p>
          )}
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Cuenta *
          </label>
          <input
            {...register("account_number")}
            type="text"
            placeholder="Ej: 05244000153"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.account_number && (
            <p className="text-xs text-red-600 mt-1">
              {errors.account_number.message}
            </p>
          )}
        </div>

        {/* Account Holder */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titular de la Cuenta *
          </label>
          <input
            {...register("account_holder")}
            type="text"
            placeholder="Nombre del titular"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.account_holder && (
            <p className="text-xs text-red-600 mt-1">
              {errors.account_holder.message}
            </p>
          )}
        </div>

        {/* Routing Number (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Ruta (Opcional)
          </label>
          <input
            {...register("routing_number")}
            type="text"
            placeholder="Ej: 007"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Primary Account */}
        <div className="bg-gray-50 rounded-md p-4">
          <label className="flex items-center gap-2">
            <input
              {...register("is_primary")}
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Cuenta Principal
            </span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? "Creando..." : "Crear Cuenta"}
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
