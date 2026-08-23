/**
 * LoginPage Component
 * User authentication login
 */

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    name: "",
    tenantName: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const { login, register } = useAuth();
  const [, navigate] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await register(
        registerData.email,
        registerData.password,
        registerData.name,
        registerData.tenantName
      );
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">💰 Bitaxus</h1>
          <p className="text-blue-100">
            Gestión de operaciones financieras B2B
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {!showRegister ? (
            <>
              {/* Login Form */}
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Iniciar Sesión
              </h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@bitaxus.test"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(visible => !visible)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={showPassword}
                      title={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} aria-hidden="true" />
                      ) : (
                        <Eye size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium mt-6"
                >
                  {isLoading ? "Iniciando..." : "Iniciar Sesión"}
                </button>
              </form>

              {/* Register Link */}
              <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm">
                  ¿No tienes cuenta?{" "}
                  <button
                    onClick={() => setShowRegister(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Regístrate
                  </button>
                </p>
              </div>

              {/* Demo Login */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2 text-center">
                  Demo: Usa cualquier email y contraseña
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("demo@bitaxus.com");
                    setPassword("demo123");
                  }}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Usar email de demo
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Register Form */}
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Crear Cuenta
              </h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={e =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      })
                    }
                    placeholder="tu@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={e =>
                      setRegisterData({ ...registerData, name: e.target.value })
                    }
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Tenant Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    value={registerData.tenantName}
                    onChange={e =>
                      setRegisterData({
                        ...registerData,
                        tenantName: e.target.value,
                      })
                    }
                    placeholder="Mi Empresa"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={e =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowRegisterPassword(visible => !visible)
                      }
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                      aria-label={
                        showRegisterPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={showRegisterPassword}
                      title={
                        showRegisterPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showRegisterPassword ? (
                        <EyeOff size={18} aria-hidden="true" />
                      ) : (
                        <Eye size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium mt-6"
                >
                  {isLoading ? "Registrando..." : "Crear Cuenta"}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm">
                  ¿Ya tienes cuenta?{" "}
                  <button
                    onClick={() => {
                      setShowRegister(false);
                      setError("");
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Inicia sesión
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-blue-100 text-sm">
          <p>© 2024 Bitaxus. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
