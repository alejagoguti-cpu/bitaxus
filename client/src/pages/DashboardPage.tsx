import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Globe2,
  Info,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardWidgets } from "@/hooks";
import { formatCurrency, formatDateDisplay, formatMonthYear } from "@/lib/formatting";
import type { PublicPayment, PublicReceipt } from "@/hooks/useDashboardSupabase";
import "./HomeReference.css";

interface DashboardPageProps { tenantId: string; }

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

function Icon({ icon: IconComponent, tone = "slate" }: { icon: typeof WalletCards; tone?: string }) {
  return <span className={`icon-bubble ${tone}`}><IconComponent size={15} strokeWidth={2.1} /></span>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="empty-state"><WalletCards size={25} /><span>{label}</span></div>;
}

export function DashboardPage({ tenantId }: DashboardPageProps) {
  const { user } = useAuth();
  const now = new Date();
  const [period, setPeriod] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const [reviewCollapsed, setReviewCollapsed] = useState(false);
  const { receipts, payments, isLoading, error } = useDashboardWidgets(tenantId);
  const receiptRows = receipts.data ?? [];
  const paymentRows = payments.data ?? [];

  const metrics = useMemo(() => {
    const incoming = receiptRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const outgoing = paymentRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return {
      incoming,
      outgoing,
      balance: incoming - outgoing,
      pending: receiptRows.filter(row => row.status === "Pendiente").length + paymentRows.filter(row => ["Programado", "En proceso"].includes(row.status)).length,
    };
  }, [paymentRows, receiptRows]);

  const activity = useMemo<ActivityItem[]>(() => {
    const receiptItems = receiptRows.map((row: PublicReceipt): ActivityItem => ({
      id: `receipt-${row.id}`, type: "receipt", title: row.concept || "Recaudo identificado", detail: row.payer_name || "Pagador sin nombre", amount: Number(row.amount || 0), currency: row.currency || "COP", status: row.status, createdAt: row.created_at,
    }));
    const paymentItems = paymentRows.map((row: PublicPayment): ActivityItem => ({
      id: `payment-${row.id}`, type: "payment", title: row.concept || row.payment_type || "Pago programado", detail: row.beneficiary || row.account || "Beneficiario sin nombre", amount: Number(row.amount || 0), currency: row.currency || "COP", status: row.status, createdAt: row.created_at,
    }));
    return [...receiptItems, ...paymentItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  }, [paymentRows, receiptRows]);

  const movePeriod = (offset: number) => setPeriod(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const refresh = () => { void receipts.refetch(); void payments.refetch(); };

  return <main className="dashboard-page dashboard-reference">
    <header className="dashboard-heading">
      <div><p className="eyebrow">Resumen operativo</p><h1>Hola, {user?.name || "tu cuenta"}</h1><p>Este es el estado de tu operación.</p></div>
      <div className="period-controls"><button type="button" onClick={() => movePeriod(-1)} aria-label="Periodo anterior">←</button><span>{formatMonthYear(period.getFullYear(), period.getMonth() + 1)}</span><button type="button" onClick={() => movePeriod(1)} aria-label="Periodo siguiente">→</button><button type="button" onClick={refresh} aria-label="Actualizar datos" title="Actualizar datos"><RefreshCw size={15} /></button></div>
    </header>

    {error && <section className="inline-alert" role="alert">No pudimos cargar los movimientos. Vuelve a intentarlo.</section>}

    {summaryVisible ? <section className="summary-card home-summary-card panel"><div className="summary-head"><div><p className="eyebrow">Actividad del periodo</p><div className="total">{formatCurrency(metrics.balance)} <small>COP</small></div><p className="positive">Saldo neto <span>Recaudos menos pagos</span></p></div><button type="button" className="hide-button" onClick={() => setSummaryVisible(false)}><EyeOff size={12}/> Ocultar</button></div><div className="metrics"><div className="metric"><Icon icon={ArrowDownLeft} tone="green"/><div><span>Entradas</span><b>{formatCurrency(metrics.incoming)} <small>COP</small></b><em>{receiptRows.length} recaudo(s)</em></div></div><div className="metric"><Icon icon={ArrowUpRight} tone="coral"/><div><span>Salidas</span><b>{formatCurrency(metrics.outgoing)} <small>COP</small></b><em className="red">{paymentRows.length} pago(s)</em></div></div><div className="metric"><Icon icon={Clock3} tone="amber"/><div><span>En proceso</span><b>{metrics.pending} <small>OPERACIONES</small></b><p>Operaciones pendientes de confirmación</p></div></div></div></section> : <button type="button" className="show-summary" onClick={() => setSummaryVisible(true)}><Eye size={13}/> Mostrar resumen <ChevronDown size={13}/></button>}

    <section className="quick-actions home-quick-actions"><Link to="/receipts"><Icon icon={ArrowDownLeft} tone="green"/><b>Programar recaudo</b><ChevronRight size={15}/></Link><Link to="/payments"><Icon icon={ArrowUpRight} tone="coral"/><b>Programar pago</b><ChevronRight size={15}/></Link><Link to="/global"><Icon icon={Globe2} tone="purple"/><b>Consultar en Global</b><ChevronRight size={15}/></Link></section>

    <section className="lower-grid home-operations-grid"><div className={`panel activity-card home-activity-card ${activityCollapsed ? "collapsed" : ""}`}><div className="card-heading"><div><h2>Actividad reciente</h2><p>Últimos movimientos visibles para esta sesión.</p></div><button type="button" onClick={() => setActivityCollapsed(value => !value)} aria-label={activityCollapsed ? "Mostrar actividad" : "Ocultar actividad"} aria-expanded={!activityCollapsed}><ChevronDown size={15}/></button></div>{!activityCollapsed && <>{isLoading ? <div className="loading-block" aria-label="Cargando actividad" /> : activity.length === 0 ? <EmptyState label="Aún no hay movimientos registrados." /> : <div className="activity-list">{activity.map(item => <div className="activity-row" key={item.id}><Icon icon={item.type === "receipt" ? ArrowDownLeft : ArrowUpRight} tone={item.type === "receipt" ? "green" : "coral"}/><div className="activity-main"><b>{item.title}</b><span>{item.detail}</span></div><div className="activity-ref"><span>{formatDateDisplay(item.createdAt)}</span><span>{item.status}</span></div><div className="activity-amount"><b>{formatCurrency(item.amount, item.currency)}</b><ChevronRight size={14}/></div></div>)}</div>}<Link className="view-all" to="/receipts">Ver recaudos <ArrowRight size={14}/></Link></>}</div>

      <div className={`panel review-card home-review-card ${reviewCollapsed ? "collapsed" : ""}`}><div className="card-heading"><div><h2>Por revisar <span className="count">{metrics.pending}</span></h2><p>Operaciones que requieren atención.</p></div><button type="button" onClick={() => setReviewCollapsed(value => !value)} aria-label={reviewCollapsed ? "Mostrar pendientes" : "Ocultar pendientes"} aria-expanded={!reviewCollapsed}><ChevronDown size={15}/></button></div>{!reviewCollapsed && <>{metrics.pending === 0 ? <EmptyState label="No hay operaciones pendientes." /> : <div className="review-list"><Link to="/payments"><Icon icon={ArrowUpRight} tone="coral"/><div><b>Pagos pendientes</b><span>Revisa y aprueba para continuar.</span></div><strong>{metrics.pending}</strong><ChevronRight size={14}/></Link></div>}<Link className="view-all" to="/reports">Ver todas las operaciones <ArrowRight size={14}/></Link></>}</div></section>
  </main>;
}
