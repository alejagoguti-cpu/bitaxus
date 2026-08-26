import { useEffect, useMemo, useState } from "react";
import { Bell, Building2, Check, KeyRound, LogOut, Mail, MapPin, Pencil, Phone, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import "./SettingsPage.css";

type Dialog = "profile" | "company" | "logout" | null;
type PreferenceKey = "email" | "push" | "activity";

const planName = (plan?: string) => plan === "free" ? "Gratuito" : plan === "business" ? "Negocios" : "Empresarial";
const ignorableTableError = (error: unknown) => typeof error === "object" && error !== null && "code" in error && ["42P01", "PGRST205"].includes(String(error.code));

export function SettingsPage() {
  const { user, tenant, logout } = useAuth();
  const [, navigate] = useLocation();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [profile, setProfile] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const [company, setCompany] = useState({ name: tenant?.name ?? "", nit: tenant?.nit ?? "", city: tenant?.city ?? "", country: tenant?.country ?? "", phone: tenant?.phone ?? "" });
  const [preferences, setPreferences] = useState({ email: true, push: false, activity: true });
  const displayName = profile.name || user?.email || "Sin información";
  const role = user?.role === "admin" ? "Administrador" : user?.role === "operator" ? "Operador" : "Visualizador";

  useEffect(() => { setProfile({ name: user?.name ?? "", phone: user?.phone ?? "" }); }, [user?.name, user?.phone]);
  useEffect(() => { setCompany({ name: tenant?.name ?? "", nit: tenant?.nit ?? "", city: tenant?.city ?? "", country: tenant?.country ?? "", phone: tenant?.phone ?? "" }); }, [tenant?.name, tenant?.nit, tenant?.city, tenant?.country, tenant?.phone]);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const metadata = data.user?.user_metadata ?? {};
      setPreferences({ email: metadata.email_alerts !== false, push: Boolean(metadata.push_alerts), activity: metadata.activity_alerts !== false });
    });
  }, []);
  useEffect(() => {
    if (!dialog) return;
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !isSaving) setDialog(null); };
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [dialog, isSaving]);

  const updateMetadata = async (changes: Record<string, unknown>) => {
    const { data: sessionData, error: readError } = await supabase.auth.getUser();
    if (readError) throw readError;
    const { error } = await supabase.auth.updateUser({ data: { ...(sessionData.user?.user_metadata ?? {}), ...changes } });
    if (error) throw error;
  };

  const showFeedback = (message: string) => { setFeedback(message); window.setTimeout(() => setFeedback(""), 3200); };

  const saveProfile = async () => {
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      const { error: tableError } = await supabase.from("users").update({ name: profile.name.trim(), phone: profile.phone.trim() || null }).eq("id", user.id);
      if (tableError && !ignorableTableError(tableError)) throw tableError;
      await updateMetadata({ name: profile.name.trim(), phone: profile.phone.trim() });
      setDialog(null); showFeedback("Perfil actualizado correctamente.");
    } catch { showFeedback("No fue posible guardar el perfil. Inténtalo nuevamente."); }
    finally { setIsSaving(false); }
  };

  const saveCompany = async () => {
    if (!tenant || isSaving) return;
    setIsSaving(true);
    try {
      const values = { name: company.name.trim(), nit: company.nit.trim(), city: company.city.trim(), country: company.country.trim(), phone: company.phone.trim() || null };
      const { error: tableError } = await supabase.from("tenants").update(values).eq("id", tenant.id);
      if (tableError && !ignorableTableError(tableError)) throw tableError;
      await updateMetadata({ tenant_name: values.name, nit: values.nit, city: values.city, country: values.country, tenant_phone: company.phone.trim() });
      setDialog(null); showFeedback("Información de empresa actualizada.");
    } catch { showFeedback("No fue posible guardar la empresa. Inténtalo nuevamente."); }
    finally { setIsSaving(false); }
  };

  const updatePreference = async (key: PreferenceKey) => {
    if (isSaving) return;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    try {
      await updateMetadata({ email_alerts: next.email, push_alerts: next.push, activity_alerts: next.activity });
      showFeedback("Preferencias de notificaciones actualizadas.");
    } catch { setPreferences(preferences); showFeedback("No fue posible actualizar las notificaciones."); }
  };

  const confirmLogout = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try { await logout(); navigate("/login"); }
    catch { setIsSaving(false); showFeedback("No fue posible cerrar la sesión. Inténtalo nuevamente."); }
  };

  const dialogTitle = useMemo(() => dialog === "profile" ? "Editar perfil" : dialog === "company" ? "Editar información de empresa" : "Cerrar sesión", [dialog]);

  return (
    <section className="settings-page-v2" aria-labelledby="settings-title">
      <header className="settings-page-v2__header"><div><span className="settings-page-v2__eyebrow"><Sparkles size={14} /> Cuenta Bitaxus</span><h1 id="settings-title">Configuración</h1><p>Consulta la información de tu cuenta, empresa y seguridad de acceso.</p></div><span className="settings-page-v2__status"><ShieldCheck size={15} /> Sesión protegida</span></header>
      {feedback && <div className="settings-feedback" role="status"><Check size={15} /> {feedback}</div>}

      <div className="settings-page-v2__summary-grid">
        <article className="settings-profile-card"><div className="settings-card__heading"><span className="settings-card__icon settings-card__icon--coral"><UserRound size={18} /></span><div><p>Perfil de usuario</p><small>Tu identidad de acceso</small></div><button type="button" className="settings-card-edit" onClick={() => setDialog("profile")}><Pencil size={13} /> Editar</button></div><div className="settings-profile-card__identity"><span className="settings-profile-card__avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span><div><strong>{displayName}</strong><span>{user?.email || "Sin correo registrado"}</span></div></div><dl className="settings-key-values settings-key-values--profile"><div><dt>Rol</dt><dd><span className="settings-role-chip">{role}</span></dd></div><div><dt>Último acceso</dt><dd>{user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "No disponible"}</dd></div></dl></article>
        <article className="settings-company-card"><div className="settings-card__heading"><span className="settings-card__icon settings-card__icon--ink"><Building2 size={18} /></span><div><p>Información de la empresa</p><small>Datos asociados a tu operación</small></div><button type="button" className="settings-card-edit" onClick={() => setDialog("company")}><Pencil size={13} /> Editar</button></div><strong className="settings-company-card__name">{company.name || "Sin información registrada"}</strong><dl className="settings-key-values settings-key-values--company"><div><dt>NIT</dt><dd>{company.nit || "No disponible"}</dd></div><div><dt>Plan</dt><dd><span className="settings-plan-chip">{planName(tenant?.plan)}</span></dd></div><div><dt><Mail size={13} /> Correo</dt><dd>{tenant?.email || "No disponible"}</dd></div><div><dt><MapPin size={13} /> Ubicación</dt><dd>{[company.city, company.country].filter(Boolean).join(", ") || "No disponible"}</dd></div><div><dt><Phone size={13} /> Teléfono</dt><dd>{company.phone || "No disponible"}</dd></div></dl></article>
      </div>

      <article className="settings-security-card"><div className="settings-security-card__header"><div><span className="settings-card__icon settings-card__icon--soft"><ShieldCheck size={18} /></span><div><h2>Seguridad de la cuenta</h2><p>Administra las preferencias disponibles para proteger tu acceso.</p></div></div></div><div className="settings-security-card__rows"><div className="settings-security-row"><span className="settings-security-row__icon"><KeyRound size={17} /></span><div><strong>Contraseña</strong><p>Se administra de forma segura desde Supabase Auth.</p></div><span className="settings-security-note">Administrada</span></div><div className="settings-security-row"><span className="settings-security-row__icon"><ShieldCheck size={17} /></span><div><strong>Autenticación de dos factores</strong><p>{user?.two_factor_enabled ? "Activada para tu cuenta." : "Desactivada. Recomendamos activarla cuando esté disponible."}</p></div><span className={`settings-security-state ${user?.two_factor_enabled ? "is-active" : ""}`}>{user?.two_factor_enabled ? "Activa" : "Pendiente"}</span></div></div><div className="settings-session-action"><div><strong>Sesión actual</strong><p>Salir no elimina tus datos ni modifica la configuración de tu empresa.</p></div><button type="button" onClick={() => setDialog("logout")} className="settings-logout-button"><LogOut size={16} /> Cerrar sesión</button></div></article>

      <article className="settings-notifications-card"><div className="settings-notifications-card__heading"><span className="settings-card__icon settings-card__icon--coral"><Bell size={18} /></span><div><h2>Preferencias de notificaciones</h2><p>Elige cómo quieres enterarte de los eventos importantes de tu operación.</p></div></div><div className="settings-notification-options"><button type="button" className="settings-notification-option" onClick={() => void updatePreference("email")} aria-pressed={preferences.email}><span><Mail size={16} /></span><div><strong>Alertas por correo</strong><small>Recibe confirmaciones y avisos relevantes.</small></div><i className={preferences.email ? "is-on" : ""} aria-hidden="true" /></button><button type="button" className="settings-notification-option" onClick={() => void updatePreference("push")} aria-pressed={preferences.push}><span><Bell size={16} /></span><div><strong>Notificaciones push</strong><small>Recibe avisos mientras usas Bitaxus.</small></div><i className={preferences.push ? "is-on" : ""} aria-hidden="true" /></button><button type="button" className="settings-notification-option" onClick={() => void updatePreference("activity")} aria-pressed={preferences.activity}><span><Sparkles size={16} /></span><div><strong>Actividad operativa</strong><small>Incluye recaudos, pagos y cambios de estado.</small></div><i className={preferences.activity ? "is-on" : ""} aria-hidden="true" /></button></div></article>

      {dialog && <div className="settings-dialog-backdrop" onClick={() => !isSaving && setDialog(null)}><div className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title" onClick={event => event.stopPropagation()}><button className="settings-dialog__close" type="button" onClick={() => !isSaving && setDialog(null)} aria-label="Cerrar"><X size={17} /></button>{dialog !== "logout" && <span className="settings-dialog__icon">{dialog === "profile" ? <UserRound size={18} /> : <Building2 size={18} />}</span>}<h2 id="settings-dialog-title">{dialogTitle}</h2>{dialog === "profile" && <><p>Actualiza los datos que identifican tu sesión.</p><div className="settings-dialog__fields"><label>Nombre completo<input value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} autoComplete="name" /></label><label>Teléfono<input value={profile.phone} onChange={event => setProfile({ ...profile, phone: event.target.value })} autoComplete="tel" /></label></div><div className="settings-dialog__actions"><button type="button" onClick={() => setDialog(null)} disabled={isSaving}>Cancelar</button><button type="button" onClick={() => void saveProfile()} disabled={isSaving || !profile.name.trim()}>{isSaving ? "Guardando…" : "Guardar perfil"}</button></div></>}{dialog === "company" && <><p>Actualiza la información operativa que se muestra en tu cuenta.</p><div className="settings-dialog__fields settings-dialog__fields--company"><label>Nombre de la empresa<input value={company.name} onChange={event => setCompany({ ...company, name: event.target.value })} /></label><label>NIT<input value={company.nit} onChange={event => setCompany({ ...company, nit: event.target.value })} /></label><label>Ciudad<input value={company.city} onChange={event => setCompany({ ...company, city: event.target.value })} /></label><label>País<input value={company.country} onChange={event => setCompany({ ...company, country: event.target.value })} /></label><label>Teléfono de contacto<input value={company.phone} onChange={event => setCompany({ ...company, phone: event.target.value })} autoComplete="tel" /></label></div><div className="settings-dialog__actions"><button type="button" onClick={() => setDialog(null)} disabled={isSaving}>Cancelar</button><button type="button" onClick={() => void saveCompany()} disabled={isSaving || !company.name.trim()}>{isSaving ? "Guardando…" : "Guardar empresa"}</button></div></>}{dialog === "logout" && <><span className="settings-dialog__icon settings-dialog__icon--logout"><LogOut size={18} /></span><p>¿Quieres cerrar la sesión actual? Podrás volver a ingresar con tus credenciales cuando lo necesites.</p><div className="settings-dialog__actions"><button type="button" onClick={() => setDialog(null)} disabled={isSaving}>Cancelar</button><button type="button" className="settings-dialog__logout" onClick={() => void confirmLogout()} disabled={isSaving}>{isSaving ? "Cerrando…" : "Sí, cerrar sesión"}</button></div></>}</div></div>}
    </section>
  );
}
