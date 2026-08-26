import { useState } from "react";
import { Building2, KeyRound, LogOut, Mail, MapPin, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import "./SettingsPage.css";

const planName = (plan?: string) => plan === "free" ? "Gratuito" : plan === "business" ? "Negocios" : "Empresarial";

export function SettingsPage() {
  const { user, tenant, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const displayName = user?.name || user?.email || "Sin información";
  const role = user?.role === "admin" ? "Administrador" : user?.role === "operator" ? "Operador" : "Visualizador";

  const handleLogout = async () => {
    setIsLoading(true);
    try { await logout(); navigate("/login"); }
    catch (err) { console.error("Logout error:", err); }
    finally { setIsLoading(false); }
  };

  return (
    <section className="settings-page-v2" aria-labelledby="settings-title">
      <header className="settings-page-v2__header">
        <div>
          <span className="settings-page-v2__eyebrow"><Sparkles size={14} /> Cuenta Bitaxus</span>
          <h1 id="settings-title">Configuración</h1>
          <p>Consulta la información de tu cuenta, empresa y seguridad de acceso.</p>
        </div>
        <span className="settings-page-v2__status"><ShieldCheck size={15} /> Sesión protegida</span>
      </header>

      <div className="settings-page-v2__summary-grid">
        <article className="settings-profile-card">
          <div className="settings-card__heading">
            <span className="settings-card__icon settings-card__icon--coral"><UserRound size={18} /></span>
            <div><p>Perfil de usuario</p><small>Tu identidad de acceso</small></div>
          </div>
          <div className="settings-profile-card__identity">
            <span className="settings-profile-card__avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>
            <div><strong>{displayName}</strong><span>{user?.email || "Sin correo registrado"}</span></div>
          </div>
          <dl className="settings-key-values settings-key-values--profile">
            <div><dt>Rol</dt><dd><span className="settings-role-chip">{role}</span></dd></div>
            <div><dt>Último acceso</dt><dd>{user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "No disponible"}</dd></div>
          </dl>
        </article>

        <article className="settings-company-card">
          <div className="settings-card__heading">
            <span className="settings-card__icon settings-card__icon--ink"><Building2 size={18} /></span>
            <div><p>Información de la empresa</p><small>Datos asociados a tu operación</small></div>
          </div>
          <strong className="settings-company-card__name">{tenant?.name || "Sin información registrada"}</strong>
          <dl className="settings-key-values settings-key-values--company">
            <div><dt>NIT</dt><dd>{tenant?.nit || "No disponible"}</dd></div>
            <div><dt>Plan</dt><dd><span className="settings-plan-chip">{planName(tenant?.plan)}</span></dd></div>
            <div><dt><Mail size={13} /> Correo</dt><dd>{tenant?.email || "No disponible"}</dd></div>
            <div><dt><MapPin size={13} /> Ubicación</dt><dd>{[tenant?.city, tenant?.country].filter(Boolean).join(", ") || "No disponible"}</dd></div>
            <div><dt><Phone size={13} /> Teléfono</dt><dd>{tenant?.phone || "No disponible"}</dd></div>
          </dl>
        </article>
      </div>

      <article className="settings-security-card">
        <div className="settings-security-card__header">
          <div>
            <span className="settings-card__icon settings-card__icon--soft"><ShieldCheck size={18} /></span>
            <div><h2>Seguridad de la cuenta</h2><p>Administra las preferencias disponibles para proteger tu acceso.</p></div>
          </div>
        </div>
        <div className="settings-security-card__rows">
          <div className="settings-security-row">
            <span className="settings-security-row__icon"><KeyRound size={17} /></span>
            <div><strong>Contraseña</strong><p>Se administra de forma segura desde Supabase Auth.</p></div>
            <span className="settings-security-note">Administrada</span>
          </div>
          <div className="settings-security-row">
            <span className="settings-security-row__icon"><ShieldCheck size={17} /></span>
            <div><strong>Autenticación de dos factores</strong><p>{user?.two_factor_enabled ? "Activada para tu cuenta." : "Desactivada. Recomendamos activarla cuando esté disponible."}</p></div>
            <span className={`settings-security-state ${user?.two_factor_enabled ? "is-active" : ""}`}>{user?.two_factor_enabled ? "Activa" : "Pendiente"}</span>
          </div>
        </div>
        <div className="settings-session-action">
          <div><strong>Sesión actual</strong><p>Salir no elimina tus datos ni modifica la configuración de tu empresa.</p></div>
          <button type="button" onClick={() => void handleLogout()} disabled={isLoading} className="settings-logout-button"><LogOut size={16} /> {isLoading ? "Cerrando…" : "Cerrar sesión"}</button>
        </div>
      </article>
    </section>
  );
}
