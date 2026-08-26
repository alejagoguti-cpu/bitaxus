import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Download, FileDown, LoaderCircle, X } from "lucide-react";
import { exportRowsToCsv, exportRowsToPdf, type ExportColumn, type ExportOptions } from "../lib/exportData";
import "./ExportActions.css";

type Cell = string | number;
interface ExportActionsProps { title: string; rows: Record<string, Cell>[]; columns: ExportColumn<Record<string, Cell>>[]; filters?: Record<string, string>; logoUrl?: string; fetchRows?: (dateRange: { from?: string; to?: string }) => Promise<Record<string, Cell>[]>; }

export default function ExportActions({ title, rows, columns, filters = {}, logoUrl, fetchRows }: ExportActionsProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [selected, setSelected] = useState<string[]>(columns.map(column => String(column.key)));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportError, setExportError] = useState("");
  const activeColumns = useMemo(() => columns.filter(column => selected.includes(String(column.key))), [columns, selected]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, loading]);

  const startExport = async () => {
    if (!activeColumns.length || loading) return;
    setLoading(true);
    setExportError("");
    try {
      const exportRows = fetchRows ? await fetchRows({ from, to }) : rows;
      const options: ExportOptions = { filters, dateRange: { from, to }, logoUrl };
      const exportTitle = `${title}${from || to ? ` ${from || ""}-${to || ""}` : ""}`;
      await new Promise(resolve => window.setTimeout(resolve, 350));
      if (format === "csv") exportRowsToCsv(exportTitle, exportRows, activeColumns);
      else await exportRowsToPdf(exportTitle, exportRows, activeColumns, options);
      setOpen(false);
    } catch {
      setExportError("No fue posible generar el reporte. Verifica la conexión e inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return <>
    <div className="export-actions"><button className="table-export-action" onClick={() => { setFormat("csv"); setOpen(true); }} aria-label={`Configurar exportación CSV de ${title}`}><Download size={13}/> CSV</button><button className="table-export-action primary" onClick={() => { setFormat("pdf"); setOpen(true); }} aria-label={`Configurar exportación PDF de ${title}`}><FileDown size={13}/> PDF</button></div>
    {open && createPortal(<div className="modal-backdrop export-modal-backdrop" onClick={() => !loading && setOpen(false)}><div className="action-modal export-modal" role="dialog" aria-modal="true" aria-labelledby="export-modal-title" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => !loading && setOpen(false)} aria-label="Cerrar configuración de exportación"><X size={17}/></button><div className="modal-icon"><FileDown size={17}/></div><h2 id="export-modal-title">Exportar {title}</h2><p>Elige el formato, las columnas y el rango de fechas del documento.</p>{exportError && <p className="payment-form-error" role="alert">{exportError}</p>}<div className="export-format-toggle" role="group" aria-label="Formato de exportación"><button className={format === "csv" ? "selected" : ""} onClick={() => setFormat("csv")}>CSV</button><button className={format === "pdf" ? "selected" : ""} onClick={() => setFormat("pdf")}>PDF</button></div><fieldset className="export-columns"><legend>Columnas incluidas</legend>{columns.map(column => <label key={String(column.key)}><input type="checkbox" checked={selected.includes(String(column.key))} onChange={() => setSelected(current => current.includes(String(column.key)) ? current.filter(key => key !== String(column.key)) : [...current, String(column.key)])}/><span>{column.label}</span></label>)}</fieldset><div className="export-date-range"><label>Desde<input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label><label>Hasta<input type="date" value={to} onChange={event => setTo(event.target.value)} /></label></div><div className="modal-actions"><button className="secondary-action" onClick={() => setOpen(false)} disabled={loading}>Cancelar</button><button className="primary-action" onClick={startExport} disabled={loading || !activeColumns.length}>{loading ? <><LoaderCircle size={15} className="spin"/> Generando...</> : <><Check size={14}/> Exportar {format.toUpperCase()}</>}</button></div></div></div>, document.body)}
  </>;
}
