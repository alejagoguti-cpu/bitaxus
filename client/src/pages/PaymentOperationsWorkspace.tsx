import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  LoaderCircle,
  Plus,
  Search,
  Send,
  UsersRound,
  X,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import HorizontalScrollHint from "@/components/HorizontalScrollHint";
import ExportActions from "@/components/ExportActions";
import OperationDetailModal from "@/components/OperationDetailModal";
import { validatePaymentDraft, type PaymentMode } from "./paymentFlow";
import "./PaymentFlow.css";
import "./ReceiptSuccess.css";
import "./ReceiptSubmit.css";
import "./PaymentOperationsWorkspace.css";
import "./RecordDetail.css";

type Scope = "all" | PaymentMode;
type PaymentRecord = {
  id: string;
  payment_type: string | null;
  beneficiary: string | null;
  dispersion_name: string | null;
  account: string | null;
  amount: number | string | null;
  currency: string | null;
  concept: string | null;
  description: string | null;
  payment_date: string | null;
  monthly: boolean | null;
  status: string | null;
  created_at: string;
};
type PaymentRow = {
  id: string;
  type: PaymentMode;
  counterparty: string;
  concept: string;
  account: string;
  description: string;
  value: string;
  rawValue: number;
  currency: string;
  date: string;
  rawDate: string;
  monthly: boolean;
  status: string;
};
type PaymentPage = { rows: PaymentRecord[]; total: number };

const tabs = ["Todos", "En proceso", "Procesados", "Cancelados"];
const concepts = ["Todos", "Pago de factura", "Honorarios", "Comisiones", "Prestación de servicios", "Nómina"];

function dateRangeForFilter(filter: string, now = new Date()) {
  if (filter === "Todos") return { start: "", end: "" };
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (filter === "Este mes") {
    start.setDate(1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1, 1);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }

  if (filter === "Este trimestre") {
    const quarterStart = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(quarterStart, 1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 3, 1);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }

  start.setDate(start.getDate() - 30);
  return { start: start.toISOString().slice(0, 10), end: "" };
}

function formatPaymentAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(amount);
}

function getVisiblePages(page: number, totalPages: number) {
  const maxPages = 5;
  const first = Math.max(1, Math.min(page - 2, totalPages - maxPages + 1));
  const last = Math.min(totalPages, first + maxPages - 1);
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

function sanitizeSearchTerm(value: string) {
  return value.replace(/[%,().]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

type PaymentQueryFilters = {
  scope: Scope;
  tab: string;
  searchTerm: string;
  dateFilter: string;
  statusFilter: string;
  typeFilter: string;
  conceptFilter: string;
};

function buildPaymentRequest({ scope, tab, searchTerm, dateFilter, statusFilter, typeFilter, conceptFilter }: PaymentQueryFilters) {
  let request = supabase
    .from("payments")
    .select("id,payment_type,beneficiary,dispersion_name,account,amount,currency,concept,description,payment_date,monthly,status,created_at", { count: "exact" })
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (scope === "Dispersión") request = request.eq("payment_type", "Dispersión");
  if (tab === "En proceso") request = request.in("status", ["Pendiente", "Programado", "En proceso"]);
  if (tab === "Procesados") request = request.eq("status", "Procesado");
  if (tab === "Cancelados") request = request.eq("status", "Cancelado");
  if (statusFilter !== "Todos") request = request.eq("status", statusFilter);
  if (typeFilter !== "Todos") request = request.eq("payment_type", typeFilter);
  if (conceptFilter !== "Todos") request = request.eq("concept", conceptFilter);

  const dateRange = dateRangeForFilter(dateFilter);
  if (dateRange.start) request = request.gte("payment_date", dateRange.start);
  if (dateRange.end) request = request.lt("payment_date", dateRange.end);

  const safeSearch = sanitizeSearchTerm(searchTerm);
  if (safeSearch) {
    const filters = [
      `beneficiary.ilike.%${safeSearch}%`,
      `dispersion_name.ilike.%${safeSearch}%`,
      `concept.ilike.%${safeSearch}%`,
      `description.ilike.%${safeSearch}%`,
    ];
    if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(safeSearch)) filters.unshift(`id.eq.${safeSearch}`);
    request = request.or(filters.join(","));
  }

  return request;
}

function toPaymentRow(row: PaymentRecord): PaymentRow {
  const currency = String(row.currency || "COP").toUpperCase();
  const amountValue = Number(row.amount || 0);
  return {
    id: row.id,
    type: row.payment_type === "Dispersión" ? "Dispersión" : "Pago individual",
    counterparty: row.beneficiary || row.dispersion_name || "Sin contraparte",
    concept: row.concept || "Sin concepto",
    account: row.account || "Sin cuenta o referencia",
    description: row.description || "Sin descripción adicional",
    value: formatPaymentAmount(amountValue, currency),
    rawValue: amountValue,
    currency,
    date: row.payment_date ? new Date(`${String(row.payment_date).slice(0, 10)}T12:00:00`).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "Sin fecha",
    rawDate: String(row.payment_date || ""),
    monthly: Boolean(row.monthly),
    status: row.status || "Pendiente",
  };
}

export function PaymentOperationsWorkspace({ tenantId, scope = "all" }: { tenantId: string; scope?: Scope }) {
  const initialMode: PaymentMode = scope === "all" ? "Pago individual" : scope;
  const title = scope === "Dispersión" ? "Dispersiones" : "Pagos y dispersiones";
  const subtitle = scope === "Dispersión" ? "Programa y consulta salidas agrupadas de tu operación." : "Programa y consulta las operaciones de salida de tu operación.";
  const [tab, setTab] = useState("Todos");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState(scope === "all" ? "Todos" : scope);
  const [conceptFilter, setConceptFilter] = useState("Todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<PaymentMode>(initialMode);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [dispersionName, setDispersionName] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [monthly, setMonthly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, tab, dateFilter, statusFilter, typeFilter, conceptFilter, pageSize]);

  const paymentsQuery = useQuery<PaymentPage>({
    queryKey: [
      "public-payment-operations",
      tenantId,
      scope,
      tab,
      searchTerm,
      dateFilter,
      statusFilter,
      typeFilter,
      conceptFilter,
      page,
      pageSize,
    ],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const { data, error: queryError, count } = await buildPaymentRequest({ scope, tab, searchTerm, dateFilter, statusFilter, typeFilter, conceptFilter }).range(from, from + pageSize - 1);
      if (queryError) throw queryError;
      return { rows: (data ?? []) as PaymentRecord[], total: count ?? 0 };
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
    enabled: Boolean(tenantId && isSupabaseConfigured),
  });

  const items = useMemo<PaymentRow[]>(
    () => (paymentsQuery.data?.rows ?? []).map(toPaymentRow),
    [paymentsQuery.data?.rows]
  );
  const fetchExportRows = async (dateRange: { from?: string; to?: string }) => {
    if (!isSupabaseConfigured) throw new Error("Supabase no está configurado");
    const exportFilters = { scope, tab, searchTerm, dateFilter, statusFilter, typeFilter, conceptFilter };
    const rows: PaymentRecord[] = [];
    const batchSize = 500;
    let offset = 0;
    let expectedTotal: number | null = null;

    while (expectedTotal === null || rows.length < expectedTotal) {
      const requestFilters = { ...exportFilters, dateFilter: dateRange.from || dateRange.to ? "Todos" : dateFilter };
      let request = buildPaymentRequest(requestFilters);
      if (dateRange.from) request = request.gte("payment_date", dateRange.from);
      if (dateRange.to) {
        const end = new Date(`${dateRange.to}T00:00:00`);
        end.setDate(end.getDate() + 1);
        const endExclusive = [end.getFullYear(), String(end.getMonth() + 1).padStart(2, "0"), String(end.getDate()).padStart(2, "0")].join("-");
        request = request.lt("payment_date", endExclusive);
      }
      const { data, error: exportError, count } = await request.range(offset, offset + batchSize - 1);
      if (exportError) throw exportError;
      expectedTotal = count ?? rows.length + (data?.length ?? 0);
      rows.push(...((data ?? []) as PaymentRecord[]));
      if (!data?.length || data.length < batchSize) break;
      offset += batchSize;
    }

    return rows.map(toPaymentRow) as unknown as Record<string, string | number>[];
  };

  const total = paymentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, total);
  const visiblePages = getVisiblePages(Math.min(page, totalPages), totalPages);
  const hasChanges = Boolean(selectedBeneficiary || beneficiarySearch || dispersionName || account || amount || concept || description || date || monthly);

  const reset = () => {
    setFormStep(1);
    setMode(initialMode);
    setSelectedBeneficiary("");
    setBeneficiarySearch("");
    setDispersionName("");
    setAccount("");
    setAmount("");
    setConcept("");
    setDescription("");
    setDate("");
    setMonthly(false);
    setError("");
    setConfirmDiscard(false);
  };
  const openForm = () => { reset(); setSuccess(false); setFormOpen(true); };
  const requestClose = () => { if (hasChanges) setConfirmDiscard(true); else setFormOpen(false); };

  useEffect(() => {
    if (!formOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") requestClose(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [formOpen, hasChanges]);

  const draft = { mode, beneficiary: selectedBeneficiary, dispersionName, amount, concept, date };
  const continueToReview = () => {
    const validation = validatePaymentDraft(draft);
    if (validation) { setError(validation); return; }
    setError("");
    setFormStep(2);
  };

  const submit = async () => {
    if (submitting) return;
    const validation = validatePaymentDraft(draft);
    if (validation) { setError(validation); setFormStep(1); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setError("Tu sesión expiró. Inicia sesión nuevamente para guardar la operación."); return; }
    setSubmitting(true);
    setError("");
    const { error: insertError } = await supabase.from("payments").insert({
      payment_type: mode,
      beneficiary: selectedBeneficiary || null,
      dispersion_name: dispersionName || null,
      account: account || null,
      amount: Number(amount.replace(/[^0-9]/g, "")),
      currency: "COP",
      concept,
      description: description || null,
      payment_date: date,
      monthly,
      status: "Pendiente",
      created_by_open_id: auth.user.id,
      created_by_name: auth.user.user_metadata?.name || auth.user.email || null,
    });
    if (insertError) {
      setSubmitting(false);
      setError("No fue posible guardar la operación. Revisa la información e inténtalo nuevamente.");
      return;
    }
    await paymentsQuery.refetch();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard-payments"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }),
    ]);
    reset();
    setFormOpen(false);
    setSubmitting(false);
    setSuccess(true);
    window.setTimeout(() => setSuccess(false), 4_200);
  };

  return (
    <section className="payments-page">
      <header className="payments-header">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
        <button type="button" className="primary-action payment-top-action" onClick={() => scope === "all" ? navigate("/payments/new") : openForm()}>
          <span className="schedule-top-icon"><Plus size={17} /></span>
          <span><strong>{scope === "Dispersión" ? "Programar dispersión" : "Programar pago"}</strong><small>{scope === "Dispersión" ? "Crear salida agrupada" : "Pago individual"}</small></span>
          <ChevronRight size={16} />
        </button>
      </header>

      {!isSupabaseConfigured && <div className="payment-form-error" role="alert">Supabase no está configurado en este entorno. Agrega las variables públicas para cargar y guardar operaciones.</div>}
      {success && <div className="receipt-success-message operation-success-message" role="status" aria-live="polite"><span className="receipt-success-icon"><CheckCircle2 size={18} /></span><span><b>{mode === "Dispersión" ? "Dispersión programada correctamente" : "Pago programado correctamente"}</b><small>La operación quedó registrada y aparece en tu actividad.</small></span><button type="button" onClick={() => setSuccess(false)} aria-label="Cerrar mensaje de éxito"><X size={15} /></button><span className="receipt-success-progress" /></div>}

      <div className="payments-tabs">{tabs.map(item => <button type="button" key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>

      <div className="payments-filters">
        <label className="search-box"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por contraparte, ID o concepto" /></label>
        <label className="compact-select"><span>Fecha</span><select value={dateFilter} onChange={event => setDateFilter(event.target.value)}><option>Todos</option><option>Este mes</option><option>Últimos 30 días</option><option>Este trimestre</option></select></label>
        <label className="compact-select"><span>Estado</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option>Todos</option><option>Pendiente</option><option>Programado</option><option>En proceso</option><option>Procesado</option><option>Cancelado</option></select></label>
        {scope === "all" && <label className="compact-select"><span>Tipo</span><select value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option>Todos</option><option>Pago individual</option><option>Dispersión</option></select></label>}
        <label className="compact-select"><span>Concepto</span><select value={conceptFilter} onChange={event => setConceptFilter(event.target.value)}>{concepts.map(item => <option key={item}>{item}</option>)}</select></label>
        <button type="button" className="clear-payment-filters" onClick={() => { setQuery(""); setSearchTerm(""); setTab("Todos"); setDateFilter("Todos"); setStatusFilter("Todos"); setTypeFilter(scope === "all" ? "Todos" : scope); setConceptFilter("Todos"); setPage(1); }}>↻ Limpiar filtros</button>
      </div>

      <div className="payments-card panel">
        <div className="table-export-toolbar"><ExportActions title={title} rows={items as unknown as Record<string, string | number>[]} columns={[{ key: "id", label: "ID" }, { key: "type", label: "Tipo" }, { key: "counterparty", label: "Contraparte / grupo" }, { key: "concept", label: "Concepto" }, { key: "value", label: "Valor" }, { key: "date", label: "Fecha" }, { key: "status", label: "Estado" }]} filters={{ Pestaña: tab, Fecha: dateFilter, Estado: statusFilter, Tipo: typeFilter, Concepto: conceptFilter }} logoUrl={`${import.meta.env.BASE_URL}bitaxus-logo-black.png`} fetchRows={fetchExportRows} /></div>
        {paymentsQuery.isFetching && !paymentsQuery.isLoading && <div className="payment-refresh-indicator" role="status"><LoaderCircle size={13} className="spin" /> Actualizando resultados…</div>}
        <HorizontalScrollHint className="payments-table-wrap">
          <table className="payments-table"><thead><tr><th>ID</th><th>Tipo</th><th>Contraparte / grupo</th><th>Concepto</th><th>Valor</th><th>Fecha</th><th>Estado</th><th /></tr></thead><tbody>
            {paymentsQuery.isLoading && <tr><td colSpan={8} className="empty-row">Cargando operaciones…</td></tr>}
            {paymentsQuery.error && <tr><td colSpan={8} className="empty-row">No fue posible cargar las operaciones.</td></tr>}
            {!paymentsQuery.isLoading && !paymentsQuery.error && !items.length && <tr><td colSpan={8} className="empty-row">No hay operaciones registradas con esos filtros.</td></tr>}
            {items.map(item => <tr key={item.id} className="payment-detail-row" tabIndex={0} onClick={() => setSelectedPayment(item)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedPayment(item); } }} aria-label={`Ver detalle de ${item.counterparty}`}><td title={item.id}>{item.id.slice(0, 8)}</td><td><span className={`payment-type ${item.type === "Dispersión" ? "coral" : "ink"}`}>{item.type}</span></td><td>{item.counterparty}</td><td>{item.concept}</td><td>{item.value}</td><td>{item.date}</td><td><span className={`payment-status ${item.status.toLocaleLowerCase("es-CO").replaceAll(" ", "-")}`}>{item.status}</span></td><td><button type="button" className="row-detail-action" aria-label={`Ver detalle de ${item.counterparty}`} onClick={event => { event.stopPropagation(); setSelectedPayment(item); }}><ChevronRight size={16} /></button></td></tr>)}
          </tbody></table>
        </HorizontalScrollHint>
        <div className="payments-footer">
          <span>Mostrando {firstResult} a {lastResult} de {total} operación(es)</span>
          <div className="payments-pagination" aria-label="Paginación de pagos">
            <button type="button" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page <= 1 || paymentsQuery.isFetching} aria-label="Página anterior"><ChevronDown size={15} className="rotate-left" /></button>
            {visiblePages.map(pageNumber => <button type="button" key={pageNumber} className={pageNumber === page ? "selected" : ""} onClick={() => setPage(pageNumber)} disabled={paymentsQuery.isFetching}>{pageNumber}</button>)}
            <button type="button" onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={page >= totalPages || paymentsQuery.isFetching} aria-label="Página siguiente"><ChevronDown size={15} className="rotate-right" /></button>
          </div>
          <label className="page-size-select"><span>Por página</span><select value={pageSize} onChange={event => setPageSize(Number(event.target.value))}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label>
        </div>
      </div>

      {selectedPayment && <OperationDetailModal kind={selectedPayment.type} tone="payment" title={selectedPayment.counterparty} subtitle={selectedPayment.concept} metricLabel="Valor de la operación" metricValue={selectedPayment.value} fields={[{ label: "Estado", value: <span className={`payment-status ${selectedPayment.status.toLocaleLowerCase("es-CO").replaceAll(" ", "-")}`}>{selectedPayment.status}</span> }, { label: "Fecha de operación", value: selectedPayment.date }, { label: "Cuenta / referencia", value: selectedPayment.account }, { label: "Frecuencia", value: selectedPayment.monthly ? "Programada mensualmente" : "Única" }, { label: "Referencia", value: selectedPayment.id }, { label: "Moneda", value: selectedPayment.currency }]} note={selectedPayment.description} onClose={() => setSelectedPayment(null)} />}

      {formOpen && <div className="modal-backdrop payment-form-backdrop" onClick={requestClose}><div className="payment-drawer shared-operation-modal" role="dialog" aria-modal="true" aria-labelledby="payment-flow-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="form-close" onClick={requestClose} aria-label="Cerrar formulario"><X size={18} /></button>
        <div className="modal-icon">{mode === "Dispersión" ? <UsersRound size={17} /> : <CircleUserRound size={17} />}</div>
        <h3 id="payment-flow-title">Programar operación</h3><p>Completa los datos y revisa la información antes de guardar.</p>
        <div className="payment-flow-steps" aria-label="Progreso del formulario"><span className={formStep === 1 ? "active" : "complete"}><i>1</i>Datos</span><span className={formStep === 2 ? "active" : ""}><i>2</i>Revisar y guardar</span></div>
        {error && <p className="payment-form-error" role="alert">{error}</p>}
        {formStep === 1 ? <>
          <label>{mode === "Dispersión" ? "Nombre de la dispersión" : "Proveedor / beneficiario"} <em>*</em>{mode === "Dispersión" ? <input className="modal-input" value={dispersionName} onChange={event => setDispersionName(event.target.value)} placeholder="Ej. Nómina agosto" /> : <div className="form-input"><Search size={15} /><input value={selectedBeneficiary || beneficiarySearch} onChange={event => { setSelectedBeneficiary(""); setBeneficiarySearch(event.target.value); }} placeholder="Buscar proveedor inscrito" /><ChevronDown size={14} /></div>}</label>
          <label>Cuenta o referencia de salida <input className="modal-input" value={account} onChange={event => setAccount(event.target.value)} placeholder="Opcional" /></label>
          <label>Valor total <em>*</em><div className="amount-input"><span>$</span><input value={amount} onChange={event => setAmount(event.target.value)} inputMode="numeric" placeholder="0" /><span>COP</span></div></label>
          <label>Concepto <em>*</em><select className="full-select" value={concept} onChange={event => setConcept(event.target.value)}><option value="">Selecciona un concepto</option>{concepts.slice(1).map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Descripción<textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Información adicional (opcional)" /></label>
          <label>Fecha de la operación <em>*</em><div className="form-input"><CalendarDays size={15} /><input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={event => setDate(event.target.value)} /></div></label>
          <label className="monthly-toggle"><span>Programar mensualmente <small>Se repetirá cada mes con los mismos datos.</small></span><button type="button" className={monthly ? "on" : ""} onClick={() => setMonthly(value => !value)} aria-pressed={monthly}><i /></button></label>
        </> : <div className="payment-review-card"><span className="form-eyebrow">RESUMEN DE LA OPERACIÓN</span><strong>{mode === "Pago individual" ? selectedBeneficiary || "Beneficiario pendiente" : dispersionName || "Dispersión pendiente"}</strong><div><span>{concept || "Concepto pendiente"}</span><b>{amount ? `$ ${Number(amount.replace(/[^0-9]/g, "")).toLocaleString("es-CO")} COP` : "Valor pendiente"}</b></div><small>{date ? `Fecha programada: ${date}` : "Fecha pendiente"}</small><small>{account ? `Referencia: ${account}` : "Sin referencia de salida"}</small></div>}
        <div className="form-actions">{formStep === 2 && <button type="button" className="secondary-action" onClick={() => setFormStep(1)} disabled={submitting}>Atrás</button>}<button type="button" className="secondary-action" onClick={requestClose} disabled={submitting}>Cancelar</button><button type="button" className="primary-action" onClick={formStep === 1 ? continueToReview : () => void submit()} disabled={submitting}>{submitting ? <><LoaderCircle size={15} className="spin" /> Procesando…</> : formStep === 1 ? "Continuar a revisión" : <><Send size={15} /> Confirmar y guardar</>}</button></div>
      </div></div>}

      {confirmDiscard && <div className="modal-backdrop" onClick={() => setConfirmDiscard(false)}><div className="action-modal" onClick={event => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setConfirmDiscard(false)} aria-label="Cerrar"><X size={16} /></button><h2>¿Descartar cambios?</h2><p>Hay información sin guardar en esta operación.</p><div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setConfirmDiscard(false)}>Continuar editando</button><button type="button" className="primary-action" onClick={() => { reset(); setFormOpen(false); }}>Descartar</button></div></div></div>}
    </section>
  );
}
