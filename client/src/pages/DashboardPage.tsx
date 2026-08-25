import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Globe2,
  RefreshCw,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <WalletCards size={25} />
      <span>{label}</span>
    </div>
  );
}

export function DashboardPage({ tenantId }: DashboardPageProps) {
  const [period, setPeriod] = useState<DashboardPeriod>("Este mes");
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const [reviewCollapsed, setReviewCollapsed] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const now = new Date();
  const { receipts, payments, isLoading, error } = useDashboardWidgets(tenantId, period);
  const receiptRows = receipts.data ?? [];
  const paymentRows = payments.data ?? [];

  const metrics = useMemo(() => {
    const incoming = receiptRows.reduce(
      (sum, row) => sum + (String(row.currency || "COP").toUpperCase() === "COP" ? Number(row.amount || 0) : 0),
      0
    );
    const outgoing = paymentRows.reduce(
      (sum, row) => sum + (String(row.currency || "COP").toUpperCase() === "COP" ? Number(row.amount || 0) : 0),
      0
    );
    return {
      incoming,
      outgoing,
      balance: incoming - outgoing,
      pendingReceipts: receiptRows.filter(row => row.status === "Pendiente").length,
      pendingPayments: paymentRows.filter(row => ["Pendiente", "Programado", "En proceso"].includes(row.status)).length,
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

  useEffect(() => {
    if (!selectedActivity) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedActivity(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedActivity]);

  return (
    <main className="dashboard-page dashboard-reference dashboard-reference--nested">
      {!isSupabaseConfigured ? <section className="inline-alert" role="alert">Supabase no está configurado en este entorno. Agrega las variables públicas para cargar el resumen real.</section> : error && <section className="inline-alert" role="alert">No pudimos cargar los movimientos desde Supabase. Vuelve a intentarlo.</section>}

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
        <Link to="/receipts/new"><Icon icon={ArrowDownLeft} tone="green" /><b>Programar recaudo</b><ChevronRight size={15} /></Link>
        <Link to="/payments/new"><Icon icon={ArrowUpRight} tone="coral" /><b>Programar pago</b><ChevronRight size={15} /></Link>
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
                    <button type="button" className="activity-row" key={item.id} onClick={() => setSelectedActivity(item)} aria-label={`Ver detalle de ${item.title}`}>
                      <Icon icon={item.type === "receipt" ? ArrowDownLeft : ArrowUpRight} tone={item.type === "receipt" ? "green" : "coral"} />
                      <div className="activity-main"><b>{item.title}</b><span>{item.detail}</span></div>
                      <div className="activity-ref"><span>Referencia de operación</span><span>{formatDateDisplay(item.createdAt)}</span></div>
                      <div className="activity-amount"><b className={item.type === "receipt" ? "money-green" : ""}>{formatCurrency(item.amount, item.currency)}</b><span className={`status ${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span></div>
                      <ChevronRight size={14} />
                    </button>
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

      {selectedActivity && (
        <div className="activity-detail-backdrop" role="presentation" onMouseDown={() => setSelectedActivity(null)}>
          <section className="activity-detail-modal" role="dialog" aria-modal="true" aria-labelledby="activity-detail-title" onMouseDown={event => event.stopPropagation()}>
            <button type="button" className="activity-detail-close" onClick={() => setSelectedActivity(null)} aria-label="Cerrar detalle"><X size={17} /></button>
            <span className={`activity-detail-kind ${selectedActivity.type}`}>
              {selectedActivity.type === "receipt" ? "Recaudo" : "Pago"}
            </span>
            <h2 id="activity-detail-title">{selectedActivity.title}</h2>
            <p className="activity-detail-counterparty">{selectedActivity.detail}</p>
            <div className="activity-detail-amount">
              <span>Valor de la operación</span>
              <strong className={selectedActivity.type === "receipt" ? "money-green" : ""}>{formatCurrency(selectedActivity.amount, selectedActivity.currency)}</strong>
            </div>
            <dl className="activity-detail-grid">
              <div><dt>Estado</dt><dd><span className={`status ${selectedActivity.status.toLowerCase().replaceAll(" ", "-")}`}>{selectedActivity.status}</span></dd></div>
              <div><dt>Fecha de registro</dt><dd>{formatDateDisplay(selectedActivity.createdAt)}</dd></div>
              <div><dt>Moneda</dt><dd>{selectedActivity.currency.toUpperCase()}</dd></div>
              <div><dt>Referencia</dt><dd>{selectedActivity.id.replace(/^(receipt|payment)-/, "")}</dd></div>
            </dl>
            <button type="button" className="activity-detail-done" onClick={() => setSelectedActivity(null)}>Cerrar detalle</button>
          </section>
        </div>
      )}
    </main>
  );
}
