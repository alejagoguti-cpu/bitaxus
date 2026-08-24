import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  Globe2,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardWidgets } from "@/hooks";
import { formatCurrency, formatDateDisplay } from "@/lib/formatting";
import type { DashboardPeriod, PublicPayment, PublicReceipt } from "@/hooks/useDashboardSupabase";
import "./HomeReference.css";

interface DashboardPageProps {
  tenantId: string;
}

type ActivityItem = {
  id: string;
  type: "receipt" | "payment";
  title: string;
  detail: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

function Icon({ icon: IconComponent, tone = "slate" }: { icon: LucideIcon; tone?: string }) {
  return (
    <span className={`icon-bubble ${tone}`}>
      <IconComponent size={15} strokeWidth={2.1} />
    </span>
  );
}

function DashboardDropdown({
  icon: IconComponent,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  icon: LucideIcon;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className={`dashboard-dropdown ${open ? "open" : ""}`} ref={containerRef}>
      <button
        type="button"
        className="dashboard-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(current => !current)}
      >
        <IconComponent size={13} strokeWidth={1.8} />
        <span>{value}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="dashboard-dropdown-menu" role="listbox" aria-label={ariaLabel}>
          {options.map(option => (
            <button
              type="button"
              role="option"
              aria-selected={option === value}
              className={option === value ? "selected" : ""}
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <span>{option}</span>
              {option === value && <span className="selected-mark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <WalletCards size={25} />
      <span>{label}</span>
    </div>
  );
}

export function DashboardPage({ tenantId }: DashboardPageProps) {
  const { user, tenant } = useAuth();
  const [company, setCompany] = useState(tenant?.name || "OnTarget SAS");
  const [period, setPeriod] = useState<DashboardPeriod>("Este mes");
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const [reviewCollapsed, setReviewCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const now = new Date();
  const { receipts, payments, isLoading, error } = useDashboardWidgets(tenantId, period);
  const receiptRows = receipts.data ?? [];
  const paymentRows = payments.data ?? [];

  const metrics = useMemo(() => {
    const incoming = receiptRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const outgoing = paymentRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return {
      incoming,
      outgoing,
      balance: incoming - outgoing,
      pendingReceipts: receiptRows.filter(row => row.status === "Pendiente").length,
      pendingPayments: paymentRows.filter(row => ["Programado", "En proceso"].includes(row.status)).length,
    };
  }, [paymentRows, receiptRows]);

  const activity = useMemo<ActivityItem[]>(() => {
    const receiptItems = receiptRows.map((row: PublicReceipt): ActivityItem => ({
      id: `receipt-${row.id}`,
      type: "receipt",
      title: row.concept || "Recaudo identificado",
      detail: row.payer_name || "Pagador sin nombre",
      amount: Number(row.amount || 0),
      currency: row.currency || "COP",
      status: row.status,
      createdAt: row.created_at,
    }));
    const paymentItems = paymentRows.map((row: PublicPayment): ActivityItem => ({
      id: `payment-${row.id}`,
      type: "payment",
      title: row.concept || row.payment_type || "Pago programado",
      detail: row.beneficiary || row.account || "Beneficiario sin nombre",
      amount: Number(row.amount || 0),
      currency: row.currency || "COP",
      status: row.status,
      createdAt: row.created_at,
    }));
    return [...receiptItems, ...paymentItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [paymentRows, receiptRows]);

  const pendingTotal = metrics.pendingReceipts + metrics.pendingPayments;
  const monthLabel = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(now);
  const refresh = () => {
    void receipts.refetch();
    void payments.refetch();
  };

  return (
    <main className="dashboard-page dashboard-reference">
      <header className="dashboard-heading">
        <div className="dashboard-greeting">
          <h1>Hola, {user?.name || "tu cuenta"}</h1>
          <p>Este es el estado de tu operación.</p>
        </div>
        <div className="dashboard-controls">
          <DashboardDropdown
            icon={Building2}
            value={company}
            options={["OnTarget SAS", "Andina Corp.", "Beta Holdings"]}
            onChange={setCompany}
            ariaLabel="Seleccionar empresa"
          />
          <DashboardDropdown
            icon={CalendarDays}
            value={period}
            options={["Este mes", "Últimos 30 días", "Este trimestre"]}
            onChange={value => setPeriod(value as DashboardPeriod)}
            ariaLabel="Seleccionar periodo"
          />
          <button type="button" className="dashboard-icon-button notification-button" aria-label="Notificaciones, 3 nuevas">
            <Bell size={15} strokeWidth={1.8} />
            <span>3</span>
          </button>
          <button type="button" className="dashboard-icon-button" aria-label="Ayuda">
            <CircleHelp size={15} strokeWidth={1.8} />
          </button>
          <div className="dashboard-profile-wrap">
            <button
              type="button"
              className="dashboard-avatar"
              aria-label="Abrir menú de perfil"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen(current => !current)}
            >
              {(user?.name || "Alejandra").charAt(0).toUpperCase()}
            </button>
            {profileOpen && (
              <div className="dashboard-profile-menu">
                <b>{user?.name || "Alejandra"}</b>
                <span>{tenant?.name || company}</span>
                <Link to="/settings" onClick={() => setProfileOpen(false)}>Configuración</Link>
              </div>
            )}
          </div>
          <ChevronDown size={12} className="dashboard-avatar-chevron" />
        </div>
      </header>

      {error && <section className="inline-alert" role="alert">No pudimos cargar los movimientos. Vuelve a intentarlo.</section>}

      {summaryVisible ? (
        <section className="summary-card home-summary-card panel">
          <div className="summary-head">
            <div>
              <p className="eyebrow">Actividad del periodo</p>
              <div className="total">
                {formatCurrency(metrics.balance)} <small>COP</small>
              </div>
              <p className="positive" aria-label="Saldo neto: Recaudos menos pagos">
                <ArrowUpRight size={13} /> Saldo neto <span>Recaudos menos pagos</span>
              </p>
            </div>
            <button type="button" className="hide-button" onClick={() => setSummaryVisible(false)}>
              <EyeOff size={12} /> Ocultar
            </button>
          </div>
          <div className="metrics">
            <div className="metric">
              <Icon icon={ArrowDownLeft} tone="green" />
              <div>
                <span>Entradas</span>
                <b>{formatCurrency(metrics.incoming)} <small>COP</small></b>
                <em>{receiptRows.length} recaudo(s)</em>
              </div>
            </div>
            <div className="metric">
              <Icon icon={ArrowUpRight} tone="coral" />
              <div>
                <span>Salidas</span>
                <b>{formatCurrency(metrics.outgoing)} <small>COP</small></b>
                <em className="red">{paymentRows.length} pago(s)</em>
              </div>
            </div>
            <div className="metric">
              <Icon icon={Clock3} tone="amber" />
              <div>
                <span>En proceso</span>
                <b>{pendingTotal} <small>OPERACIONES</small></b>
                <p>Operaciones pendientes de confirmación</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <button type="button" className="show-summary" onClick={() => setSummaryVisible(true)}>
          <Eye size={13} /> Mostrar resumen <ChevronDown size={13} />
        </button>
      )}

      <section className="quick-actions home-quick-actions">
        <Link to="/receipts"><Icon icon={ArrowDownLeft} tone="green" /><b>Programar recaudo</b><ChevronRight size={15} /></Link>
        <Link to="/payments"><Icon icon={ArrowUpRight} tone="blue" /><b>Programar pago</b><ChevronRight size={15} /></Link>
        <Link to="/global"><Icon icon={Globe2} tone="purple" /><b>Consultar en Global</b><ChevronRight size={15} /></Link>
      </section>

      <section className="lower-grid home-operations-grid">
        <div className={`panel activity-card home-activity-card ${activityCollapsed ? "collapsed" : ""}`}>
          <div className="card-heading">
            <h2>Actividad reciente</h2>
            <button type="button" onClick={() => setActivityCollapsed(value => !value)} aria-label={activityCollapsed ? "Mostrar actividad" : "Ocultar actividad"} aria-expanded={!activityCollapsed}>
              <ChevronDown size={15} />
            </button>
          </div>
          {!activityCollapsed && (
            <>
              {isLoading ? <div className="loading-block" aria-label="Cargando actividad" /> : activity.length === 0 ? <EmptyState label="Aún no hay movimientos registrados." /> : (
                <div className="activity-list">
                  {activity.map(item => (
                    <div className="activity-row" key={item.id}>
                      <Icon icon={item.type === "receipt" ? ArrowDownLeft : ArrowUpRight} tone={item.type === "receipt" ? "green" : "coral"} />
                      <div className="activity-main"><b>{item.title}</b><span>{item.detail}</span></div>
                      <div className="activity-ref"><span>Referencia de operación</span><span>{formatDateDisplay(item.createdAt)}</span></div>
                      <div className="activity-amount"><b className={item.type === "receipt" ? "money-green" : ""}>{formatCurrency(item.amount, item.currency)}</b><span className={`status ${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span></div>
                      <ChevronRight size={14} />
                    </div>
                  ))}
                </div>
              )}
              <Link className="view-all" to="/reports">Ver todas las operaciones <ArrowRight size={14} /></Link>
            </>
          )}
        </div>

        <div className={`panel review-card home-review-card ${reviewCollapsed ? "collapsed" : ""}`}>
          <div className="card-heading">
            <h2>Por revisar <span className="count">{pendingTotal}</span></h2>
            <button type="button" onClick={() => setReviewCollapsed(value => !value)} aria-label={reviewCollapsed ? "Mostrar pendientes" : "Ocultar pendientes"} aria-expanded={!reviewCollapsed}>
              <ChevronDown size={15} />
            </button>
          </div>
          {!reviewCollapsed && (
            <>
              {pendingTotal === 0 ? <EmptyState label="No hay operaciones pendientes." /> : (
                <div className="review-list">
                  {metrics.pendingPayments > 0 && (
                    <Link to="/payments"><Icon icon={ArrowUpRight} tone="coral" /><div><b>{metrics.pendingPayments} pago(s) pendiente(s)</b><span>Espera tu aprobación para continuar.</span></div><strong>{metrics.pendingPayments}</strong><ChevronRight size={14} /></Link>
                  )}
                  {metrics.pendingReceipts > 0 && (
                    <Link to="/receipts"><Icon icon={Clock3} tone="amber" /><div><b>{metrics.pendingReceipts} recaudo(s) pendiente(s)</b><span>Confirma la información para continuar.</span></div><strong className="amber-text">{metrics.pendingReceipts}</strong><ChevronRight size={14} /></Link>
                  )}
                </div>
              )}
              <Link className="view-all" to="/reports">Ver todas las operaciones <ArrowRight size={14} /></Link>
            </>
          )}
        </div>
      </section>

      <button type="button" className="dashboard-refresh" onClick={refresh} aria-label="Actualizar datos" title={`Actualizar datos · ${monthLabel}`}>
        <RefreshCw size={13} />
      </button>
    </main>
  );
}
