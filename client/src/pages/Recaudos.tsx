/* Bitaxus Recaudos: tabla operativa, filtros rápidos y formulario lateral claro. */
import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, Tag, Upload, X } from "lucide-react";
import { toast } from "sonner";

const initialReceipts = [
  { id: "RC-12984", payer: "Juan Pérez", concept: "Honorarios", amount: "$ 1.250.000", date: "29 jul. 2026", status: "Recibido" },
  { id: "RC-12985", payer: "OnTarget SAS", concept: "Prestación de servicios", amount: "$ 3.800.000", date: "31 jul. 2026", status: "Pendiente" },
  { id: "RC-12986", payer: "María Gómez", concept: "Venta de productos", amount: "$ 950.000", date: "30 jul. 2026", status: "Cancelado" },
  { id: "RC-12987", payer: "Grupo Nova", concept: "Pago de factura", amount: "$ 2.400.000", date: "01 ago. 2026", status: "Pendiente" },
];
const tabs = ["Todos", "Pendientes", "Recibidos", "Cancelados"];

export default function Recaudos({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [tab, setTab] = useState("Todos");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(true);
  const [receipts, setReceipts] = useState(initialReceipts);
  const [payer, setPayer] = useState("");
  const [amount, setAmount] = useState("3.800.000");
  const [concept, setConcept] = useState("Prestación de servicios");
  const [date, setDate] = useState("2026-07-31");

  const filtered = useMemo(() => receipts.filter(item => {
    const matchTab = tab === "Todos" || item.status.toLowerCase() === tab.slice(0, -1).toLowerCase() || (tab === "Pendientes" && item.status === "Pendiente") || (tab === "Recibidos" && item.status === "Recibido") || (tab === "Cancelados" && item.status === "Cancelado");
    const text = `${item.id} ${item.payer} ${item.concept} ${item.amount}`.toLowerCase();
    return matchTab && text.includes(query.toLowerCase());
  }), [receipts, tab, query]);

  const schedule = () => {
    if (!payer.trim() || !amount.trim() || !concept.trim()) { toast("Completa los campos obligatorios", { description: "Payer, valor esperado y concepto son requeridos." }); return; }
    const next = `RC-${12984 + receipts.length + 1}`;
    setReceipts([{ id: next, payer, concept, amount: `$ ${amount}`, date: new Date(`${date}T12:00:00`).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }), status: "Pendiente" }, ...receipts]);
    setPayer(""); setFormOpen(false); toast("Recaudo programado", { description: `${next} quedó agregado como pendiente.` });
  };

  return <section className="receipts-page">
    <header className="receipts-header"><div><h2>Recaudos</h2><p>Programa y consulta los recaudos de tu operación.</p></div><div className="receipts-header-actions"><button className="secondary-filter"><CalendarDays size={15}/> Este mes <ChevronDown size={13}/></button><button className="primary-action schedule-top" onClick={() => setFormOpen(true)}><Plus size={16}/> Programar recaudo</button></div></header>
    <div className="receipts-tabs"><div>{tabs.map(item => <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>)}</div><span>{filtered.length} de {receipts.length} recaudos</span></div>
    <div className="receipts-workspace"><div className="receipts-table-card panel"><div className="receipts-filters"><label className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por pagador, ID, concepto o descripción" /></label><button className="secondary-filter"><CalendarDays size={15}/> Fecha <ChevronDown size={13}/></button><button className="secondary-filter"><SlidersHorizontal size={15}/> Estado <ChevronDown size={13}/></button><button className="secondary-filter"><Tag size={15}/> Concepto <ChevronDown size={13}/></button></div><div className="receipts-table-wrap"><table className="receipts-table"><thead><tr><th>ID</th><th>Pagador</th><th>Concepto</th><th>Valor</th><th>Fecha del recaudo</th><th>Estado</th><th></th></tr></thead><tbody>{filtered.map(item => <tr key={item.id} onClick={() => toast(item.id, { description: `${item.payer} · ${item.concept} · ${item.amount}` })}><td>{item.id}</td><td>{item.payer}</td><td>{item.concept}</td><td className="receipt-amount">{item.amount} <small>COP</small></td><td>{item.date}</td><td><span className={`receipt-status ${item.status.toLowerCase()}`}>{item.status}</span></td><td><ChevronRight size={17}/></td></tr>)}{filtered.length === 0 && <tr><td colSpan={7} className="empty-row">No encontramos recaudos con esos criterios.</td></tr>}</tbody></table></div><div className="table-footer"><span>Mostrando {filtered.length} de {receipts.length} recaudos</span><div><button aria-label="Página anterior"><ChevronLeft size={16}/></button><b>1</b><button aria-label="Página siguiente"><ChevronRight size={16}/></button></div></div></div>
      {formOpen && <aside className="receipt-form panel"><button className="form-close" onClick={() => setFormOpen(false)} aria-label="Cerrar formulario"><X size={17}/></button><h3>Programar recaudo</h3><p>Diligencia la información básica para registrar el recaudo.</p><label>Pagador <em>*</em><div className="form-input"><Search size={15}/><input value={payer} onChange={e => setPayer(e.target.value)} placeholder="Buscar o agregar pagador"/><ChevronDown size={14}/></div></label><label>Valor esperado <em>*</em><div className="amount-input"><span>$</span><input value={amount} onChange={e => setAmount(e.target.value)} /><select><option>COP</option><option>USD</option></select></div></label><label>Concepto <em>*</em><select className="full-select" value={concept} onChange={e => setConcept(e.target.value)}><option>Prestación de servicios</option><option>Honorarios</option><option>Venta de productos</option><option>Pago de factura</option></select></label><label>Descripción<textarea placeholder="Información adicional del recaudo" /></label><label>Fecha del recaudo <em>*</em><div className="form-input"><CalendarDays size={15}/><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div></label><div className="form-actions"><button className="secondary-action" onClick={() => setFormOpen(false)}>Cancelar</button><button className="primary-action" onClick={schedule}>Programar recaudo</button></div><button className="import-link" onClick={() => toast("Importación disponible próximamente")}><Upload size={14}/> Importar desde archivo</button></aside>}
    </div>
    {!formOpen && <button className="floating-add primary-action" onClick={() => setFormOpen(true)}><Plus size={16}/> Programar recaudo</button>}
  </section>;
}
