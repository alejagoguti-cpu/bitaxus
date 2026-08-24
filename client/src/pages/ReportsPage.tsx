import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  LoaderCircle,
  PieChart as PieChartIcon,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/lib/supabase";
import HorizontalScrollHint from "@/components/HorizontalScrollHint";
import { BrandedSelect } from "@/components/BrandedSelect";
import { exportTable } from "@/lib/exportData";
import {
  summarizeReportOperations,
  type ReportOperation,
  type ReportOperationFilter,
  type ReportPeriod,
} from "./reportData";
import "./ReportCounterpartyRefinement.css";
import "./ReportsInteractiveCharts.css";

interface ReportsPageProps {
  tenantId: string;
}

type StatusSlice = {
  name: "Procesadas" | "En proceso" | "Canceladas";
  value: number;
  percent: number;
  color: string;
};

type VolumeTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
};

type StatusTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: StatusSlice }>;
};

const money = (value: number, currency = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

const compactMoney = (value: number) => {
  if (!value) return "$0";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toLocaleString("es-CO", { maximumFractionDigits: 1 })}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toLocaleString("es-CO", { maximumFractionDigits: 0 })}K`;
  return `$${Math.round(value).toLocaleString("es-CO")}`;
};

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));

function VolumeTooltip({ active, label, payload }: VolumeTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="report-chart-tooltip" role="status">
      <strong>{label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : "Periodo"}</strong>
      {payload.map(item => (
        <span key={item.name}>
          <i style={{ background: item.color }} />
          {item.name}: <b>{money(Number(item.value ?? 0))}</b>
        </span>
      ))}
    </div>
  );
}

function StatusTooltip({ active, payload }: StatusTooltipProps) {
  const slice = payload?.[0]?.payload;
  if (!active || !slice) return null;

  return (
    <div className="report-chart-tooltip" role="status">
      <strong>{slice.name}</strong>
      <span>
        <i style={{ background: slice.color }} />
        Operaciones: <b>{slice.value}</b>
      </span>
      <span>Participación: <b>{Math.round(slice.percent)}%</b></span>
    </div>
  );
}

export function ReportsPage({ tenantId }: ReportsPageProps) {
  const shouldAnimateBars = typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const [activeStatusIndex, setActiveStatusIndex] = useState<number | null>(null);
  void tenantId;

  const receiptsQuery = useQuery({
    queryKey: ["report-receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("id,payer_name,concept,amount,currency,receipt_date,status")
        .order("receipt_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
    retry: false,
  });
  const paymentsQuery = useQuery({
    queryKey: ["report-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id,payment_type,beneficiary,dispersion_name,concept,amount,currency,payment_date,status")
        .order("payment_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
    retry: false,
  });

  const operations = useMemo<ReportOperation[]>(
    () => [
      ...(receiptsQuery.data ?? []).map(row => ({
        id: row.id,
        type: "Recaudo" as const,
        date: row.receipt_date,
        amount: Number(row.amount ?? 0),
        currency: row.currency || "COP",
        status: row.status || "Pendiente",
        subject: row.payer_name || "Sin pagador",
        concept: row.concept || "Sin concepto",
      })),
      ...(paymentsQuery.data ?? []).map(row => ({
        id: row.id,
        type: "Pago" as const,
        date: row.payment_date,
        amount: Number(row.amount ?? 0),
        currency: row.currency || "COP",
        status: row.status || "Pendiente",
        subject: row.beneficiary || row.dispersion_name || "Sin contraparte",
        concept: row.concept || row.payment_type || "Sin concepto",
      })),
    ],
    [receiptsQuery.data, paymentsQuery.data],
  );
  const summary = useMemo(
    () => summarizeReportOperations(operations, period, operation),
    [operations, period, operation],
  );
  const visibleRows = useMemo(
    () =>
      summary.filtered.filter(row =>
        `${row.subject} ${row.concept} ${row.type} ${row.status}`
          .toLocaleLowerCase("es-CO")
          .includes(query.toLocaleLowerCase("es-CO")),
      ),
    [summary.filtered, query],
  );
  const loading = receiptsQuery.isLoading || paymentsQuery.isLoading;
  const error = receiptsQuery.error || paymentsQuery.error;
  const exportColumns = [
    { key: "type", label: "Operación" },
    { key: "date", label: "Fecha" },
    { key: "subject", label: "Contraparte" },
    { key: "concept", label: "Concepto" },
    { key: "amount", label: "Valor" },
    { key: "currency", label: "Moneda" },
    { key: "status", label: "Estado" },
  ] as const;

  const runExport = async (format = exportFormat, type = exportType) => {
    if (isExporting) return;
    const rows = summarizeReportOperations(operations, period, type).filtered.filter(
      row =>
        (!rangeStart || row.date >= rangeStart) &&
        (!rangeEnd || row.date <= rangeEnd) &&
        `${row.subject} ${row.concept} ${row.type} ${row.status}`
          .toLocaleLowerCase("es-CO")
          .includes(query.toLocaleLowerCase("es-CO")),
    );
    if (!rows.length) {
      setFeedback("No hay operaciones reales que exportar con estos filtros.");
      return;
    }
    setIsExporting(true);
    try {
      await Promise.resolve(
        exportTable(format, `Reporte Bitaxus ${type} ${period}`, rows, exportColumns, {
          filters: { Operación: type, Periodo: period },
          dateRange: { from: rangeStart, to: rangeEnd },
          logoUrl: "/bitaxus/assets/bitaxus-logo-black.png",
        }),
      );
      setFeedback("Reporte generado con los filtros activos.");
      setModalOpen(false);
    } catch {
      setFeedback("No fue posible generar el reporte. Inténtalo nuevamente.");
    } finally {
      setIsExporting(false);
      window.setTimeout(() => setFeedback(""), 4_200);
    }
  };

  const statusTotal = Math.max(1, summary.filtered.length);
  const processedPercent = (summary.completed / statusTotal) * 100;
  const pendingPercent = (summary.pending / statusTotal) * 100;
  const cancelledPercent = (summary.cancelled / statusTotal) * 100;
  const volumeData = summary.months.map(month => ({
    label: month.label,
    incoming: month.incoming,
    outgoing: month.outgoing,
  }));
  const statusData: StatusSlice[] = [
    { name: "Procesadas", value: summary.completed, percent: processedPercent, color: "#25292e" },
    { name: "En proceso", value: summary.pending, percent: pendingPercent, color: "#d9dde2" },
    { name: "Canceladas", value: summary.cancelled, percent: cancelledPercent, color: "#ef5b59" },
  ];
  const activeStatus = activeStatusIndex === null ? null : statusData[activeStatusIndex];

  return (
    <section className="reports-page">
      <header className="reports-header">
        <div>
          <div className="reports-title"><h2>Reportes</h2></div>
          <p>Analiza el comportamiento financiero y operativo de tu organización.</p>
        </div>
        <button type="button" className="primary-action" onClick={() => setModalOpen(true)}>
          <FileText size={15} /> Generar reporte
        </button>
      </header>

      {feedback && (
        <div className="report-feedback" role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback("")} aria-label="Cerrar mensaje"><X size={14} /></button>
        </div>
      )}

      <div className="reports-filters" aria-label="Filtros de reportes">
        <label><span>Periodo</span><BrandedSelect className="report-filter-select" value={period} onChange={value => setPeriod(value as ReportPeriod)} aria-label="Periodo" options={[{ value: "Este mes", label: "Este mes" }, { value: "Últimos 3 meses", label: "Últimos 3 meses" }, { value: "Últimos 6 meses", label: "Últimos 6 meses" }, { value: "Este año", label: "Este año" }]} /></label>
        <label><span>Tipo de operación</span><BrandedSelect className="report-filter-select" value={operation} onChange={value => setOperation(value as ReportOperationFilter)} aria-label="Tipo de operación" options={[{ value: "Todas", label: "Todas" }, { value: "Recaudos", label: "Recaudos" }, { value: "Pagos", label: "Pagos" }]} /></label>
        <button type="button" className="clear-report-filters" onClick={() => { setPeriod("Últimos 6 meses"); setOperation("Todas"); setQuery(""); }}>↻ Limpiar filtros</button>
      </div>

      <div className="report-kpis" key={`${period}-${operation}`}>
        <article className="report-kpi"><span className="kpi-icon ink"><TrendingUp size={18} /></span><div><small>Volumen total</small><strong>{money(summary.total)}</strong><em>{summary.filtered.length ? `${summary.filtered.length} operaciones` : "Sin datos"}<i>en el periodo</i></em></div></article>
        <article className="report-kpi"><span className="kpi-icon neutral"><ArrowDownLeft size={18} /></span><div><small>Entradas</small><strong>{money(summary.incoming)}</strong><em>{summary.incoming ? "Recaudos registrados" : "Sin datos"}<i>en el periodo</i></em></div></article>
        <article className="report-kpi"><span className="kpi-icon coral"><ArrowUpRight size={18} /></span><div><small>Salidas</small><strong>{money(summary.outgoing)}</strong><em className="negative">{summary.outgoing ? "Pagos registrados" : "Sin datos"}<i>en el periodo</i></em></div></article>
        <article className="report-kpi"><span className="kpi-icon ink"><CheckCircle2 size={18} /></span><div><small>Operaciones completadas</small><strong>{summary.completed}</strong><em>{summary.filtered.length ? `${Math.round(processedPercent)}% de éxito` : "Sin datos"}<i>en el periodo</i></em></div></article>
      </div>

      <div className="reports-main-grid">
        <article className="report-chart panel">
          <div className="chart-head"><div><h3>Entradas vs. salidas</h3><p>Volumen operado por mes · COP</p></div><div className="chart-legend"><span><i className="legend-in" /> Entradas</span><span><i className="legend-out" /> Salidas</span></div></div>
          {summary.filtered.length ? (
            <div className="report-bar-chart-plot" role="img" aria-label="Gráfico de barras de entradas y salidas mensuales en pesos colombianos">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 12, right: 12, left: 8, bottom: 30 }} barGap={5}>
                  <CartesianGrid vertical={false} stroke="#f2d8d7" strokeDasharray="3 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#e5a5a3" }} tick={{ fill: "#626973", fontSize: 11 }} label={{ value: "Eje X · Mes", position: "insideBottom", offset: -17, fill: "#cf4d4b", fontSize: 10, fontWeight: 700 }} />
                  <YAxis width={68} tickLine={false} axisLine={{ stroke: "#e5a5a3" }} tick={{ fill: "#626973", fontSize: 10 }} tickFormatter={compactMoney} label={{ value: "Eje Y · COP", angle: -90, position: "insideLeft", offset: 5, fill: "#cf4d4b", fontSize: 10, fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: "rgba(239, 91, 89, 0.06)" }} content={props => <VolumeTooltip {...(props as unknown as VolumeTooltipProps)} />} />
                  <Bar name="Entradas" dataKey="incoming" fill="#ef5b59" radius={[5, 5, 0, 0]} maxBarSize={30} isAnimationActive={shouldAnimateBars} animationBegin={80} animationDuration={680} animationEasing="ease-out" />
                  <Bar name="Salidas" dataKey="outgoing" fill="#25292e" radius={[5, 5, 0, 0]} maxBarSize={30} isAnimationActive={shouldAnimateBars} animationBegin={150} animationDuration={680} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="report-empty-chart"><strong>Sin movimientos en el periodo</strong><span>Cuando existan recaudos o pagos, aparecerán aquí por mes.</span></div>
          )}
        </article>

        <article className="status-report panel">
          <div className="chart-head"><div><h3>Estado de operaciones</h3><p>Distribución del periodo</p></div><PieChartIcon size={19} /></div>
          {summary.filtered.length ? (
            <div className="status-chart-layout">
              <div className="report-status-chart" role="img" aria-label="Gráfico circular de estados de operaciones">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="58%" outerRadius="82%" paddingAngle={2} stroke="none" isAnimationActive={false} onMouseEnter={(_, index) => setActiveStatusIndex(index)} onMouseLeave={() => setActiveStatusIndex(null)}>
                      {statusData.map(slice => <Cell key={slice.name} fill={slice.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="status-chart-center" aria-hidden="true"><strong>{summary.filtered.length}</strong><small>operaciones</small></div>
                {activeStatus && <div className="status-hover-tooltip"><StatusTooltip active payload={[{ payload: activeStatus }]} /></div>}
              </div>
              <div className="status-legend" aria-label="Detalle de estados">
                {statusData.map(slice => <span key={slice.name} title={`${slice.name}: ${slice.value} operaciones (${Math.round(slice.percent)}%)`}><i style={{ background: slice.color }} /> {slice.name} <b>{Math.round(slice.percent)}%</b></span>)}
              </div>
            </div>
          ) : (
            <div className="report-empty-chart report-empty-donut"><strong>Sin operaciones</strong><span>No hay estados para distribuir.</span></div>
          )}
        </article>
      </div>

      <div className="reports-table panel">
        <div className="table-head"><div><h3>Operaciones del periodo</h3><p>Consulta y exporta la actividad que respalda tus reportes.</p></div><div className="report-table-actions"><button type="button" className="table-export-action" disabled={isExporting || !visibleRows.length} onClick={() => void runExport("csv", operation)}>{isExporting ? <LoaderCircle size={13} className="spin" /> : <Download size={13} />} CSV</button><button type="button" className="table-export-action primary" disabled={isExporting || !visibleRows.length} onClick={() => void runExport("pdf", operation)}>{isExporting ? <LoaderCircle size={13} className="spin" /> : <Download size={13} />} PDF</button><label className="report-search"><Search size={14} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar operación" /></label></div></div>
        <HorizontalScrollHint className="report-table-wrap"><table><thead><tr><th>Operación</th><th>Contraparte</th><th>Concepto</th><th>Fecha</th><th>Valor</th><th>Estado</th></tr></thead><tbody>{loading && <tr><td colSpan={6} className="empty-row">Cargando operaciones…</td></tr>}{error && <tr><td colSpan={6} className="empty-row">No fue posible cargar los datos de Reportes.</td></tr>}{!loading && !error && !visibleRows.length && <tr><td colSpan={6} className="empty-row">No hay operaciones reales para los filtros seleccionados.</td></tr>}{visibleRows.map(row => <tr key={`${row.type}-${row.id}`}><td><span className="file-icon"><FileText size={15} /></span><b>{row.type}</b></td><td>{row.subject}</td><td>{row.concept}</td><td>{dateLabel(row.date)}</td><td><b>{money(row.amount, row.currency)}</b></td><td><span className={`report-status ${row.status.toLocaleLowerCase("es-CO").includes("pendiente") ? "procesando" : "listo"}`}>{row.status}</span></td></tr>)}</tbody></table></HorizontalScrollHint>
      </div>

      {modalOpen && <div className="modal-backdrop" onClick={() => setModalOpen(false)}><div className="action-modal report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title" onClick={event => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="Cerrar"><X size={17} /></button><div className="modal-icon"><FileText size={17} /></div><h2 id="report-modal-title">Generar reporte</h2><p>Descarga únicamente la información real que coincide con tus filtros.</p><label>Tipo de operación<BrandedSelect value={exportType} onChange={value => setExportType(value as ReportOperationFilter)} aria-label="Tipo de operación para exportar" options={[{ value: "Todas", label: "Todas" }, { value: "Recaudos", label: "Recaudos" }, { value: "Pagos", label: "Pagos" }]} /></label><label>Formato<BrandedSelect value={exportFormat} onChange={value => setExportFormat(value as "csv" | "pdf")} aria-label="Formato de exportación" options={[{ value: "pdf", label: "PDF" }, { value: "csv", label: "CSV" }]} /></label><div className="report-date-grid"><label>Desde<input type="date" value={rangeStart} onChange={event => setRangeStart(event.target.value)} /></label><label>Hasta<input type="date" value={rangeEnd} onChange={event => setRangeEnd(event.target.value)} /></label></div><div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setModalOpen(false)}>Cancelar</button><button type="button" className="primary-action" onClick={() => void runExport()} disabled={isExporting}>{isExporting ? <><LoaderCircle size={15} className="spin" /> Generando…</> : <><Download size={15} /> Generar y descargar</>}</button></div></div></div>}
    </section>
  );
}
