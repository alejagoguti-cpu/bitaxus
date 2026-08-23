import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Download, FileText, LoaderCircle, PieChart, Search, TrendingUp, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import HorizontalScrollHint from "@/components/HorizontalScrollHint";
import { exportTable } from "@/lib/exportData";
import { summarizeReportOperations, type ReportOperation, type ReportOperationFilter, type ReportPeriod } from "./reportData";
import "./ReportCounterpartyRefinement.css";

interface ReportsPageProps { tenantId: string; }

const money = (value: number, currency = "COP") => new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
const dateLabel = (value: string) => new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));

export function ReportsPage({ tenantId }: ReportsPageProps) {
  const [period, setPeriod] = useState<ReportPeriod>("Últimos 6 meses");
  const [operation, setOperation] = useState<ReportOperationFilter>("Todas");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("pdf");
  const [exportType, setExportType] = useState<ReportOperationFilter>("Todas");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState("");
  void tenantId;

  const receiptsQuery = useQuery({ queryKey: ["report-receipts"], queryFn: async () => { const { data, error } = await supabase.from("receipts").select("id,payer_name,concept,amount,currency,receipt_date,status").order("receipt_date", { ascending: false }).limit(200); if (error) throw error; return data ?? []; }, staleTime: 30_000, retry: false });
  const paymentsQuery = useQuery({ queryKey: ["report-payments"], queryFn: async () => { const { data, error } = await supabase.from("payments").select("id,payment_type,beneficiary,dispersion_name,concept,amount,currency,payment_date,status").order("payment_date", { ascending: false }).limit(200); if (error) throw error; return data ?? []; }, staleTime: 30_000, retry: false });

  const operations = useMemo<ReportOperation[]>(() => [
    ...(receiptsQuery.data ?? []).map(row => ({ id: row.id, type: "Recaudo" as const, date: row.receipt_date, amount: Number(row.amount ?? 0), currency: row.currency || "COP", status: row.status || "Pendiente", subject: row.payer_name || "Sin pagador", concept: row.concept || "Sin concepto" })),
    ...(paymentsQuery.data ?? []).map(row => ({ id: row.id, type: "Pago" as const, date: row.payment_date, amount: Number(row.amount ?? 0), currency: row.currency || "COP", status: row.status || "Pendiente", subject: row.beneficiary || row.dispersion_name || "Sin contraparte", concept: row.concept || row.payment_type || "Sin concepto" })),
  ], [receiptsQuery.data, paymentsQuery.data]);
  const summary = useMemo(() => summarizeReportOperations(operations, period, operation), [operations, period, operation]);
  const visibleRows = useMemo(() => summary.filtered.filter(row => `${row.subject} ${row.concept} ${row.type} ${row.status}`.toLocaleLowerCase("es-CO").includes(query.toLocaleLowerCase("es-CO"))), [summary.filtered, query]);
  const loading = receiptsQuery.isLoading || paymentsQuery.isLoading;
  const error = receiptsQuery.error || paymentsQuery.error;
  const exportColumns = [{ key: "type", label: "Operación" }, { key: "date", label: "Fecha" }, { key: "subject", label: "Contraparte" }, { key: "concept", label: "Concepto" }, { key: "amount", label: "Valor" }, { key: "currency", label: "Moneda" }, { key: "status", label: "Estado" }] as const;

  const runExport = async (format = exportFormat, type = exportType) => {
    if (isExporting) return;
    const rows = summarizeReportOperations(operations, period, type).filtered.filter(row => (!rangeStart || row.date >= rangeStart) && (!rangeEnd || row.date <= rangeEnd) && `${row.subject} ${row.concept} ${row.type} ${row.status}`.toLocaleLowerCase("es-CO").includes(query.toLocaleLowerCase("es-CO")));
    if (!rows.length) { setFeedback("No hay operaciones reales que exportar con estos filtros."); return; }
    setIsExporting(true);
    try {
      await Promise.resolve(exportTable(format, `Reporte Bitaxus ${type} ${period}`, rows, exportColumns, { filters: { Operación: type, Periodo: period }, dateRange: { from: rangeStart, to: rangeEnd }, logoUrl: "/bitaxus/assets/bitaxus-logo-black.png" }));
      setFeedback("Reporte generado con los filtros activos."); setModalOpen(false);
    } catch { setFeedback("No fue posible generar el reporte. Inténtalo nuevamente."); }
    finally { setIsExporting(false); window.setTimeout(() => setFeedback(""), 4_200); }
  };

  const statusTotal = Math.max(1, summary.filtered.length);
  const processedPercent = (summary.completed / statusTotal) * 100;
  const pendingPercent = (summary.pending / statusTotal) * 100;
  const donutStyle = { background: `conic-gradient(#25292e 0 ${processedPercent}%, #d9dde2 ${processedPercent}% ${processedPercent + pendingPercent}%, #ef5b59 ${processedPercent + pendingPercent}% 100%)` };

  return <section className="reports-page">
    <header className="reports-header"><div><div className="reports-title"><h2>Reportes</h2></div><p>Analiza el comportamiento financiero y operativo de tu organización.</p></div><button type="button" className="primary-action" onClick={() => setModalOpen(true)}><FileText size={15} /> Generar reporte</button></header>
    {feedback && <div className="report-feedback" role="status" aria-live="polite"><CheckCircle2 size={16} /><span>{feedback}</span><button type="button" onClick={() => setFeedback("")} aria-label="Cerrar mensaje"><X size={14} /></button></div>}
    <div className="reports-filters" aria-label="Filtros de reportes"><label><span>Periodo</span><select value={period} onChange={event => setPeriod(event.target.value as ReportPeriod)}><option>Este mes</option><option>Últimos 3 meses</option><option>Últimos 6 meses</option><option>Este año</option></select></label><label><span>Tipo de operación</span><select value={operation} onChange={event => setOperation(event.target.value as ReportOperationFilter)}><option>Todas</option><option>Recaudos</option><option>Pagos</option></select></label><button type="button" className="clear-report-filters" onClick={() => { setPeriod("Últimos 6 meses"); setOperation("Todas"); setQuery(""); }}>↻ Limpiar filtros</button></div>
    <div className="report-kpis" key={`${period}-${operation}`}><article className="report-kpi"><span className="kpi-icon ink"><TrendingUp size={18} /></span><div><small>Volumen total</small><strong>{money(summary.total)}</strong><em>{summary.filtered.length ? `${summary.filtered.length} operaciones` : "Sin datos"}<i>en el periodo</i></em></div></article><article className="report-kpi"><span className="kpi-icon neutral"><ArrowDownLeft size={18} /></span><div><small>Entradas</small><strong>{money(summary.incoming)}</strong><em>{summary.incoming ? "Recaudos registrados" : "Sin datos"}<i>en el periodo</i></em></div></article><article className="report-kpi"><span className="kpi-icon coral"><ArrowUpRight size={18} /></span><div><small>Salidas</small><strong>{money(summary.outgoing)}</strong><em className="negative">{summary.outgoing ? "Pagos registrados" : "Sin datos"}<i>en el periodo</i></em></div></article><article className="report-kpi"><span className="kpi-icon ink"><CheckCircle2 size={18} /></span><div><small>Operaciones completadas</small><strong>{summary.completed}</strong><em>{summary.filtered.length ? `${Math.round(processedPercent)}% de éxito` : "Sin datos"}<i>en el periodo</i></em></div></article></div>
    <div className="reports-main-grid"><article className="report-chart panel"><div className="chart-head"><div><h3>Entradas vs. salidas</h3><p>Volumen operado por mes · COP</p></div><div className="chart-legend"><span><i className="legend-in" /> Entradas</span><span><i className="legend-out" /> Salidas</span></div></div>{summary.filtered.length ? <div className="bar-chart">{summary.months.map(month => <div className="bar-group" key={month.key}><div className="bars"><span className="bar bar-in" style={{ height: `${Math.max(5, (month.incoming / summary.maxMonthlyValue) * 100)}%` }} title={money(month.incoming)} /><span className="bar bar-out" style={{ height: `${Math.max(5, (month.outgoing / summary.maxMonthlyValue) * 100)}%` }} title={money(month.outgoing)} /></div><small>{month.label}</small></div>)}</div> : <div className="report-empty-chart"><strong>Sin movimientos en el periodo</strong><span>Cuando existan recaudos o pagos, aparecerán aquí por mes.</span></div>}</article><article className="status-report panel"><div className="chart-head"><div><h3>Estado de operaciones</h3><p>Distribución del periodo</p></div><PieChart size={19} /></div>{summary.filtered.length ? <div className="donut-wrap"><div className="donut" style={donutStyle}><strong>{summary.filtered.length}</strong><small>operaciones</small></div><div className="status-legend"><span><i className="dot-ink" /> Procesadas <b>{Math.round(processedPercent)}%</b></span><span><i className="dot-neutral" /> En proceso <b>{Math.round(pendingPercent)}%</b></span><span><i className="dot-coral" /> Canceladas <b>{Math.round((summary.cancelled / statusTotal) * 100)}%</b></span></div></div> : <div className="report-empty-chart report-empty-donut"><strong>Sin operaciones</strong><span>No hay estados para distribuir.</span></div>}</article></div>
    <div className="reports-table panel"><div className="table-head"><div><h3>Operaciones del periodo</h3><p>Consulta y exporta la actividad que respalda tus reportes.</p></div><div className="report-table-actions"><button type="button" className="table-export-action" disabled={isExporting || !visibleRows.length} onClick={() => void runExport("csv", operation)}>{isExporting ? <LoaderCircle size={13} className="spin" /> : <Download size={13} />} CSV</button><button type="button" className="table-export-action primary" disabled={isExporting || !visibleRows.length} onClick={() => void runExport("pdf", operation)}>{isExporting ? <LoaderCircle size={13} className="spin" /> : <Download size={13} />} PDF</button><label className="report-search"><Search size={14} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar operación" /></label></div></div><HorizontalScrollHint className="report-table-wrap"><table><thead><tr><th>Operación</th><th>Contraparte</th><th>Concepto</th><th>Fecha</th><th>Valor</th><th>Estado</th></tr></thead><tbody>{loading && <tr><td colSpan={6} className="empty-row">Cargando operaciones…</td></tr>}{error && <tr><td colSpan={6} className="empty-row">No fue posible cargar los datos de Reportes.</td></tr>}{!loading && !error && !visibleRows.length && <tr><td colSpan={6} className="empty-row">No hay operaciones reales para los filtros seleccionados.</td></tr>}{visibleRows.map(row => <tr key={`${row.type}-${row.id}`}><td><span className="file-icon"><FileText size={15} /></span><b>{row.type}</b></td><td>{row.subject}</td><td>{row.concept}</td><td>{dateLabel(row.date)}</td><td><b>{money(row.amount, row.currency)}</b></td><td><span className={`report-status ${row.status.toLocaleLowerCase("es-CO").includes("pendiente") ? "procesando" : "listo"}`}>{row.status}</span></td></tr>)}</tbody></table></HorizontalScrollHint></div>
    {modalOpen && <div className="modal-backdrop" onClick={() => setModalOpen(false)}><div className="action-modal report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title" onClick={event => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="Cerrar"><X size={17} /></button><div className="modal-icon"><FileText size={17} /></div><h2 id="report-modal-title">Generar reporte</h2><p>Descarga únicamente la información real que coincide con tus filtros.</p><label>Tipo de operación<select value={exportType} onChange={event => setExportType(event.target.value as ReportOperationFilter)}><option>Todas</option><option>Recaudos</option><option>Pagos</option></select></label><label>Formato<select value={exportFormat} onChange={event => setExportFormat(event.target.value as "csv" | "pdf")}><option value="pdf">PDF</option><option value="csv">CSV</option></select></label><div className="report-date-grid"><label>Desde<input type="date" value={rangeStart} onChange={event => setRangeStart(event.target.value)} /></label><label>Hasta<input type="date" value={rangeEnd} onChange={event => setRangeEnd(event.target.value)} /></label></div><div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setModalOpen(false)}>Cancelar</button><button type="button" className="primary-action" onClick={() => void runExport()} disabled={isExporting}>{isExporting ? <><LoaderCircle size={15} className="spin" /> Generando…</> : <><Download size={15} /> Generar y descargar</>}</button></div></div></div>}
  </section>;
}
