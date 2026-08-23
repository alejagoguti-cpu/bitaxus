/**
 * SettingsPage Component
 * User and tenant settings
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export function SettingsPage() {
  const { user, tenant, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">
          Perfil de Usuario
        </h2>

        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ff8a86] to-[#d95f61] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-600">Nombre</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Rol</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#fde8e7] text-[#a64246]">
                      {user?.role === "admin"
                        ? "Administrador"
                        : user?.role === "operator"
                        ? "Operador"
                        : "Visualizador"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Último acceso
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">
          Información de la Empresa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-600">Nombre</p>
            <p className="text-lg font-semibold text-gray-900">{tenant?.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600">NIT</p>
            <p className="text-lg font-semibold text-gray-900">{tenant?.nit}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600">Email</p>
            <p className="text-lg font-semibold text-gray-900">
              {tenant?.email}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600">Plan</p>
            <div className="mt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#f3f3f1] text-[#141719]">
                {tenant?.plan === "free"
                  ? "Gratuito"
                  : tenant?.plan === "business"
                  ? "Negocios"
                  : "Empresarial"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600">Ubicación</p>
            <p className="text-lg font-semibold text-gray-900">
              {tenant?.city}, {tenant?.country}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600">Teléfono</p>
            <p className="text-lg font-semibold text-gray-900">
              {tenant?.phone || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">Seguridad</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Cambiar Contraseña</p>
              <p className="text-sm text-gray-600">
                Actualiza tu contraseña regularmente
              </p>
            </div>
            <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium">
              Cambiar
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Autenticación de dos factores</p>
              <p className="text-sm text-gray-600">
                {user?.two_factor_enabled
                  ? "Activada"
                  : "Desactivada - Recomendado"}
              </p>
            </div>
            <button className="px-4 py-2 bg-[#d95f61] text-white rounded-md hover:bg-[#b84b50] text-sm font-medium">
              {user?.two_factor_enabled ? "Desactivar" : "Activar"}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#fff3f2] border border-[#efb7b7] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-[#8f3c40]">Zona de Peligro</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#8f3c40]">Cerrar Sesión</p>
              <p className="text-sm text-[#a64246]">
                Cierra tu sesión en todos los dispositivos
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="px-4 py-2 bg-[#b84b50] text-white rounded-md hover:bg-[#8f3c40] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? "Cerrando..." : "Cerrar Sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
