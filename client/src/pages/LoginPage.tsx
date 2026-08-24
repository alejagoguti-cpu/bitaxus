import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

const asset = (name: string) => `${import.meta.env.BASE_URL}${name}`;

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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
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

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
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

  const updateRegister = (field: keyof typeof registerData, value: string) => {
    setRegisterData(current => ({ ...current, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-[#141719] lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#111315] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          className="absolute -bottom-40 -right-28 h-[28rem] w-[28rem] rounded-full bg-[#e56a6a]/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 flex items-center">
          <img
            src={asset("bitaxus-logo.png")}
            alt="Bitaxus"
            className="h-12 w-auto origin-left -translate-x-10 scale-[2.4] object-contain"
          />
        </div>
        <div className="relative z-10 max-w-xl pb-10 xl:pb-24">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#e56a6a]">
            Operación financiera inteligente
          </p>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.045em] xl:text-6xl" style={{ fontFamily: "Belamor, sans-serif", fontWeight: 600 }}>
            Controla tu operación con claridad.
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-white/65">
            Una vista segura para recaudos, pagos, contrapartes y conciliación.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck size={16} /> Tus datos se gestionan con acceso protegido.
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 flex items-center lg:hidden">
            <img
              src={asset("bitaxus-logo-black.png")}
              alt="Bitaxus"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d95f61]">
              Bienvenida de nuevo
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#141719]">
              {showRegister ? "Crea tu cuenta" : "Ingresa a tu cuenta"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Accede al espacio operativo de tu organización.
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-6 shadow-[0_18px_50px_rgba(17,19,21,0.07)] sm:p-8">
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-[#efb7b7] bg-[#fff3f2] px-4 py-3 text-sm text-[#a64246]"
              >
                {error}
              </div>
            )}

            {!showRegister ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder="admin@bitaxus.test"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#d95f61] focus:ring-2 focus:ring-[#d95f61]/15"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-sm text-slate-800 outline-none transition focus:border-[#d95f61] focus:ring-2 focus:ring-[#d95f61]/15"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(visible => !visible)}
                      className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
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
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e06465] px-4 text-sm font-semibold text-white transition hover:bg-[#cc595b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Ingresando..." : "Ingresar"}{" "}
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label
                    htmlFor="register-email"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={event =>
                      updateRegister("email", event.target.value)
                    }
                    placeholder="tu@email.com"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#d95f61] focus:ring-2 focus:ring-[#d95f61]/15"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="register-name"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Nombre completo
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    value={registerData.name}
                    onChange={event =>
                      updateRegister("name", event.target.value)
                    }
                    placeholder="Tu nombre"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#d95f61] focus:ring-2 focus:ring-[#d95f61]/15"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="register-tenant"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Nombre de la empresa
                  </label>
                  <input
                    id="register-tenant"
                    type="text"
                    value={registerData.tenantName}
                    onChange={event =>
                      updateRegister("tenantName", event.target.value)
                    }
                    placeholder="Mi Empresa"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-[#d95f61] focus:ring-2 focus:ring-[#d95f61]/15"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="register-password"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={event =>
                        updateRegister("password", event.target.value)
                      }
                      placeholder="Mínimo 6 caracteres"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-12 text-sm outline-none transition focus:border-[#d95f61] focus:ring-2 focus:ring-[#d95f61]/15"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowRegisterPassword(visible => !visible)
                      }
                      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#d95f61]"
                      aria-label={
                        showRegisterPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={showRegisterPassword}
                    >
                      {showRegisterPassword ? (
                        <EyeOff size={17} aria-hidden="true" />
                      ) : (
                        <Eye size={17} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e06465] px-4 text-sm font-semibold text-white transition hover:bg-[#cc595b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}{" "}
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
              {showRegister ? "¿Ya tienes cuenta?" : "¿Necesitas acceso?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setShowRegister(value => !value);
                  setError("");
                }}
                className="font-semibold text-[#d95f61] transition hover:text-[#b64b4d] focus:outline-none focus:underline"
              >
                {showRegister ? "Inicia sesión" : "Solicita ayuda"}
              </button>
            </div>
          </div>

          <p className="mt-7 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
            <ShieldCheck size={14} /> Acceso protegido para tu organización.
          </p>
        </div>
      </section>
    </div>
  );
}
