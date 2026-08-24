import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Building2, Bell, CalendarDays, ChevronDown, CircleHelp, ArrowRight, type LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardWidgets } from "@/hooks";
import "./GlobalHeader.css";

export type HeaderPeriod = "Este mes" | "Últimos 30 días" | "Este trimestre";

type HeaderContextValue = {
  period: HeaderPeriod;
  setPeriod: (period: HeaderPeriod) => void;
};

const HeaderContext = createContext<HeaderContextValue | null>(null);

export function GlobalHeaderProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<HeaderPeriod>("Este mes");
  const value = useMemo(() => ({ period, setPeriod }), [period]);
  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}

export function useGlobalHeader() {
  const context = useContext(HeaderContext);
  if (!context) throw new Error("useGlobalHeader debe utilizarse dentro de GlobalHeaderProvider");
  return context;
}

function HeaderDropdown({
  icon: Icon,
  value,
  options,
  onChange,
  label,
}: {
  icon: LucideIcon;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeEscape);
    };
  }, []);

  return (
    <div className="global-header-dropdown" ref={dropdownRef}>
      <button type="button" className="global-header-select" onClick={() => setOpen(current => !current)} aria-label={label} aria-haspopup="listbox" aria-expanded={open}>
        <Icon size={14} strokeWidth={1.8} />
        <span>{value}</span>
        <ChevronDown size={14} strokeWidth={1.8} />
      </button>
      {open && (
        <div className="global-header-menu" role="listbox" aria-label={label}>
          {options.map(option => (
            <button type="button" role="option" aria-selected={option === value} className={option === value ? "selected" : ""} key={option} onClick={() => { onChange(option); setOpen(false); }}>
              {option}
              {option === value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GlobalHeader() {
  const { user, tenant, logout } = useAuth();
  const [, navigate] = useLocation();
  const { period, setPeriod } = useGlobalHeader();
  const toolsRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const company = tenant?.name || "Bitaxus";
  const { receipts, payments } = useDashboardWidgets(tenant?.id || "", period);
  const pendingCount = (receipts.data ?? []).filter(row => row.status === "Pendiente").length + (payments.data ?? []).filter(row => ["Pendiente", "Programado", "En proceso"].includes(row.status)).length;

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setHelpOpen(false);
        setProfileOpen(false);
      }
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setHelpOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeEscape);
    };
  }, []);

  const closeTools = () => {
    setNotificationsOpen(false);
    setHelpOpen(false);
    setProfileOpen(false);
  };

  return (
    <header className="global-dashboard-header">
      <div className="global-header-greeting">
        <h1>Hola, {user?.name || "tu cuenta"}</h1>
        <p>Este es el estado de tu operación.</p>
      </div>
      <div className="global-header-controls" ref={toolsRef}>
        <HeaderDropdown icon={Building2} value={company} options={[company]} onChange={() => undefined} label="Seleccionar empresa" />
        <HeaderDropdown icon={CalendarDays} value={period} options={["Este mes", "Últimos 30 días", "Este trimestre"]} onChange={value => setPeriod(value as HeaderPeriod)} label="Seleccionar periodo" />
        <div className="global-header-tool-wrap">
          <button type="button" className="global-header-icon-button" aria-label={`Notificaciones, ${pendingCount} pendientes`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(current => !current); setHelpOpen(false); setProfileOpen(false); }}>
            <Bell size={17} strokeWidth={1.8} />
            {pendingCount > 0 && <span>{pendingCount > 9 ? "9+" : pendingCount}</span>}
          </button>
          {notificationsOpen && <div className="global-header-popover" role="dialog" aria-label="Notificaciones"><b>Notificaciones</b><p>{pendingCount ? `${pendingCount} operación(es) requieren revisión.` : "No hay operaciones pendientes."}</p><button type="button" onClick={() => { closeTools(); navigate("/reports"); }}>Revisar operaciones <ArrowRight size={13} /></button></div>}
        </div>
        <div className="global-header-tool-wrap">
          <button type="button" className="global-header-icon-button" aria-label="Ayuda" aria-expanded={helpOpen} onClick={() => { setHelpOpen(current => !current); setNotificationsOpen(false); setProfileOpen(false); }}><CircleHelp size={17} strokeWidth={1.8} /></button>
          {helpOpen && <div className="global-header-popover" role="dialog" aria-label="Ayuda"><b>Centro de ayuda</b><p>Consulta Reportes para revisar movimientos y operaciones.</p><button type="button" onClick={() => { closeTools(); navigate("/reports"); }}>Ir a Reportes <ArrowRight size={13} /></button></div>}
        </div>
        <div className="global-header-tool-wrap">
          <button type="button" className="global-header-profile" aria-label="Abrir menú de perfil" aria-expanded={profileOpen} onClick={() => { setProfileOpen(current => !current); setNotificationsOpen(false); setHelpOpen(false); }}>
            <span>{(user?.name || "U").charAt(0).toUpperCase()}</span><ChevronDown size={14} strokeWidth={1.8} />
          </button>
          {profileOpen && <div className="global-header-popover global-header-profile-menu" role="menu"><b>{user?.name || "Tu cuenta"}</b><p>{company}</p><button type="button" onClick={() => { closeTools(); navigate("/settings"); }}>Configuración</button><button type="button" onClick={() => void logout()}>Cerrar sesión</button></div>}
        </div>
      </div>
    </header>
  );
}
