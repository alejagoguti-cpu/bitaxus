/**
 * FormCounterparty Component
 * Form for creating and editing counterparties
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createCounterpartySchema, CreateCounterpartyInput } from "@/schemas/forms";
import { useReceipts } from "@/hooks";

interface FormCounterpartyProps {
  tenantId: string;
  onSuccess?: () => void;
}

export function FormCounterparty({ tenantId, onSuccess }: FormCounterpartyProps) {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCounterpartyInput>({
    resolver: zodResolver(createCounterpartySchema),
    defaultValues: {
      type: "Persona natural",
      relation: "Cliente",
      id_type: "CC",
    },
  });

  const onSubmit = async (data: CreateCounterpartyInput) => {
    setSuccessMessage("");
    setErrorMessage("");
    setIsLoading(true);

    try {
      // TODO: Implement API call via hook
      // const response = await createCounterparty(data);
      setSuccessMessage("¡Contraparte creada exitosamente!");
      reset();
      setTimeout(() => {
        setSuccessMessage("");
        onSuccess?.();
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Error creando la contraparte"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Crear Contraparte</h2>

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
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="Nombre completo o razón social"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* ID Type and Number */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo ID *
            </label>
            <select
              {...register("id_type")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
            >
              <option value="CC">Cédula</option>
              <option value="NIT">NIT</option>
              <option value="CE">Cédula Extranjería</option>
              <option value="PP">Pasaporte</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número ID *
            </label>
            <input
              {...register("id_number")}
              type="text"
              placeholder="Número de identificación"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
            />
            {errors.id_number && (
              <p className="text-xs text-red-600 mt-1">
                {errors.id_number.message}
              </p>
            )}
          </div>
        </div>

        {/* Type and Relation */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Persona *
            </label>
            <select
              {...register("type")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
            >
              <option value="Persona natural">Persona Natural</option>
              <option value="Persona jurídica">Persona Jurídica</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relación *
            </label>
            <select
              {...register("relation")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
            >
              <option value="Cliente">Cliente</option>
              <option value="Proveedor">Proveedor</option>
            </select>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="correo@ejemplo.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="+57 300 1234567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#d95f61] text-white rounded-md hover:bg-[#b64b4d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? "Creando..." : "Crear Contraparte"}
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
