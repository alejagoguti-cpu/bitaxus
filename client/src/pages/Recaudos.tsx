/* Bitaxus Recaudos: flujo operativo de pagadores, validación y programación. */
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, Tag, Upload, X, UserRound, Building2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Payer = { name: string; idType: string; id: string; email?: string; phone?: string; type: "Persona natural" | "Persona jurídica" };
const initialPayers: Payer[] = [
  { name: "Empresa Nova S.A.S.", idType: "NIT", id: "900.123.456-7", type: "Persona jurídica" },
  { name: "Nova Soluciones S.A.S.", idType: "NIT", id: "901.234.567-1", type: "Persona jurídica" },
  { name: "Juan Pérez", idType: "CC", id: "10.234.567", type: "Persona natural" },
  { name: "María Gómez", idType: "CC", id: "43.678.901", type: "Persona natural" },
];
const initialReceipts = [
  { id: "RC-12984", payer: "Juan Pérez", concept: "Honorarios", amount: "$ 1.250.000", date: "29 jul. 2026", status: "Recibido" },
  { id: "RC-12985", payer: "OnTarget SAS", concept: "Prestación de servicios", amount: "$ 3.800.000", date: "31 jul. 2026", status: "Pendiente" },
  { id: "RC-12986", payer: "María Gómez", concept: "Venta de productos", amount: "$ 950.000", date: "30 jul. 2026", status: "Cancelado" },
  { id: "RC-12987", payer: "Grupo Nova", concept: "Pago de factura", amount: "$ 2.400.000", date: "01 ago. 2026", status: "Pendiente" },
];
const tabs = ["Todos", "Pendientes", "Recibidos", "Cancelados"];
function FilterMenu({ label, icon: IconComp, value, options, onChange }: { label: string; icon: any; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  return <div className={`receipt-filter-menu ${open ? "open" : ""}`} ref={ref}><button type="button" className="secondary-filter" onClick={() => setOpen(!open)} aria-expanded={open}><IconComp size={15}/><span>{value === "Todos" ? label : value}</span><ChevronDown size={13}/></button>{open && <div className="receipt-filter-options" role="listbox">{options.map(option => <button type="button" key={option} className={option === value ? "selected" : ""} onClick={() => { onChange(option); setOpen(false); }}>{option}{option === value && <Check size={13}/>}</button>)}</div>}</div>;
}

export default function Recaudos({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [tab, setTab] = useState("Todos");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("Todos");
  const [headerPeriod, setHeaderPeriod] = useState("Este mes");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [conceptFilter, setConceptFilter] = useState("Todos");
  const [formOpen, setFormOpen] = useState(false);
  const [receipts, setReceipts] = useState(initialReceipts);
  const [payers, setPayers] = useState(initialPayers);
  const [selectedPayer, setSelectedPayer] = useState<Payer | null>(null);
  const [payerQuery, setPayerQuery] = useState("");
  const [payerPanelOpen, setPayerPanelOpen] = useState(false);
  const [newPayerOpen, setNewPayerOpen] = useState(false);
  const [duplicate, setDuplicate] = useState<Payer | null>(null);
  const [newPayerType, setNewPayerType] = useState<"Persona natural" | "Persona jurídica">("Persona natural");
  const [newPayerIdType, setNewPayerIdType] = useState("Cédula de ciudadanía");
  const [newPayerId, setNewPayerId] = useState("");
  const [newPayerName, setNewPayerName] = useState("");
  const [newPayerEmail, setNewPayerEmail] = useState("");
  const [newPayerPhone, setNewPayerPhone] = useState("");
  const [amount, setAmount] = useState("3.800.000");
  const [concept, setConcept] = useState("Prestación de servicios");
  const [date, setDate] = useState("2026-07-31");

  const filtered = useMemo(() => receipts.filter(item => {
    const matchTab = tab === "Todos" || (tab === "Pendientes" && item.status === "Pendiente") || (tab === "Recibidos" && item.status === "Recibido") || (tab === "Cancelados" && item.status === "Cancelado");
    const matchStatus = statusFilter === "Todos" || item.status === statusFilter;
    const matchConcept = conceptFilter === "Todos" || item.concept === conceptFilter;
    const text = `${item.id} ${item.payer} ${item.concept} ${item.amount}`.toLowerCase();
    return matchTab && matchStatus && matchConcept && text.includes(query.toLowerCase());
  }), [receipts, tab, query, statusFilter, conceptFilter, dateFilter]);
  const payerResults = useMemo(() => payers.filter(p => `${p.name} ${p.id}`.toLowerCase().includes(payerQuery.toLowerCase())), [payers, payerQuery]);

  const schedule = () => {
    if (!selectedPayer || !amount.trim() || !concept.trim()) { toast("Completa los campos obligatorios", { description: "Selecciona o registra un pagador antes de continuar." }); return; }
    const next = `RC-${12984 + receipts.length + 1}`;
    setReceipts([{ id: next, payer: selectedPayer.name, concept, amount: `$ ${amount}`, date: new Date(`${date}T12:00:00`).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }), status: "Pendiente" }, ...receipts]);
    setSelectedPayer(null); setPayerQuery(""); setFormOpen(false); toast("Recaudo programado", { description: `${next} quedó agregado como pendiente.` });
  };
  const startNewPayer = () => { setPayerPanelOpen(false); setNewPayerOpen(true); setNewPayerName(payerQuery); };
  const savePayer = () => {
    if (!newPayerName.trim() || !newPayerId.trim()) { toast("Completa los datos del pagador"); return; }
    const existing = payers.find(p => p.id.replace(/\D/g, "") === newPayerId.replace(/\D/g, ""));
    if (existing) { setDuplicate(existing); return; }
    const created: Payer = { name: newPayerName, idType: newPayerIdType === "Cédula de ciudadanía" ? "CC" : "NIT", id: newPayerId, type: newPayerType, email: newPayerEmail, phone: newPayerPhone };
    setPayers([created, ...payers]); setSelectedPayer(created); setNewPayerOpen(false); toast("Pagador inscrito", { description: "Ya puedes continuar con el recaudo." });
  };
  const useDuplicate = () => { if (duplicate) setSelectedPayer(duplicate); setDuplicate(null); setNewPayerOpen(false); toast("Pagador existente seleccionado"); };

  return <section className="receipts-page">
    <header className="receipts-header"><div><h2>Recaudos</h2><p>Programa y consulta los recaudos de tu operación.</p></div><div className="receipts-header-actions"><FilterMenu label="Este mes" icon={CalendarDays} value={headerPeriod} options={["Este mes", "Últimos 30 días", "Este trimestre"]} onChange={setHeaderPeriod}/><button className="primary-action schedule-top" onClick={() => setFormOpen(true)}><Plus size={16}/> Programar recaudo</button></div></header>
    <div className="receipts-tabs"><div>{tabs.map(item => <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>)}</div><span>{filtered.length} de {receipts.length} recaudos</span></div>
    <div className={`receipts-workspace ${formOpen ? "with-form" : "full-width"}`}><div className="receipts-table-card panel"><div className="receipts-filters"><label className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por pagador, ID, concepto o descripción" /></label><FilterMenu label="Fecha" icon={CalendarDays} value={dateFilter} options={["Todos", "Este mes", "Últimos 30 días", "Este trimestre"]} onChange={setDateFilter}/><FilterMenu label="Estado" icon={SlidersHorizontal} value={statusFilter} options={["Todos", "Pendiente", "Recibido", "Cancelado"]} onChange={setStatusFilter}/><FilterMenu label="Concepto" icon={Tag} value={conceptFilter} options={["Todos", "Honorarios", "Prestación de servicios", "Venta de productos", "Pago de factura"]} onChange={setConceptFilter}/></div><div className="receipts-table-wrap"><table className="receipts-table"><thead><tr><th>ID</th><th>Pagador</th><th>Concepto</th><th>Valor</th><th>Fecha del recaudo</th><th>Estado</th><th></th></tr></thead><tbody>{filtered.map(item => <tr key={item.id} onClick={() => toast(item.id, { description: `${item.payer} · ${item.concept} · ${item.amount}` })}><td>{item.id}</td><td>{item.payer}</td><td>{item.concept}</td><td className="receipt-amount">{item.amount} <small>COP</small></td><td>{item.date}</td><td><span className={`receipt-status ${item.status.toLowerCase()}`}>{item.status}</span></td><td><ChevronRight size={17}/></td></tr>)}{filtered.length === 0 && <tr><td colSpan={7} className="empty-row">No encontramos recaudos con esos criterios.</td></tr>}</tbody></table></div><div className="table-footer"><span>Mostrando {filtered.length} de {receipts.length} recaudos</span><div><button aria-label="Página anterior" onClick={() => toast("Ya estás en la primera página")}><ChevronLeft size={16}/></button><b>1</b><button aria-label="Página siguiente" onClick={() => toast("No hay más páginas en esta vista")}><ChevronRight size={16}/></button></div></div></div>
      {formOpen && <aside className="receipt-form panel"><button className="form-close" onClick={() => setFormOpen(false)} aria-label="Cerrar formulario"><X size={17}/></button><h3>Programar recaudo</h3><p>Completa la información para programar un nuevo recaudo.</p><label>Pagador <em>*</em><div className="form-input payer-trigger" onClick={() => setPayerPanelOpen(true)}><Search size={15}/><input value={selectedPayer?.name || payerQuery} onChange={e => { setSelectedPayer(null); setPayerQuery(e.target.value); setPayerPanelOpen(true); }} onFocus={() => setPayerPanelOpen(true)} placeholder="Buscar o agregar pagador"/><ChevronDown size={14}/></div>{selectedPayer && <div className="selected-payer"><span><Check size={13}/> {selectedPayer.name}<small>{selectedPayer.idType} {selectedPayer.id}</small></span><button onClick={() => { setSelectedPayer(null); setPayerQuery(""); }}><X size={13}/></button></div>}{payerPanelOpen && !selectedPayer && <div className="payer-results"><div className="payer-results-head">Resultados <button onClick={() => setPayerPanelOpen(false)}><X size={12}/></button></div>{payerResults.slice(0, 4).map(p => <button key={p.id} className="payer-result" onClick={() => { setSelectedPayer(p); setPayerQuery(""); setPayerPanelOpen(false); }}><span><b>{p.name}</b><small>{p.idType} {p.id}</small></span><strong>Seleccionar</strong></button>)}<button className="new-payer-link" onClick={startNewPayer}><Plus size={14}/> Inscribir nuevo pagador</button></div>}</label><label>Valor esperado <em>*</em><div className="amount-input"><span>$</span><input value={amount} onChange={e => setAmount(e.target.value)} /><select><option>COP</option><option>USD</option></select></div></label><label>Concepto <em>*</em><select className="full-select" value={concept} onChange={e => setConcept(e.target.value)}><option>Prestación de servicios</option><option>Honorarios</option><option>Venta de productos</option><option>Pago de factura</option></select></label><label>Descripción<textarea placeholder="Agrega información adicional sobre el recaudo (opcional)" /></label><label>Fecha del recaudo <em>*</em><div className="form-input"><CalendarDays size={15}/><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div></label><div className="form-actions"><button className="secondary-action" onClick={() => setFormOpen(false)}>Cancelar</button><button className="primary-action" onClick={schedule}>Programar recaudo</button></div><button className="import-link" onClick={() => toast("Importación de archivo", { description: "La plantilla de importación estará disponible al conectar el backend." })}><Upload size={14}/> Importar desde archivo</button></aside>}
    </div>
    {!formOpen && <button className="floating-add primary-action" onClick={() => setFormOpen(true)}><Plus size={16}/> Programar recaudo</button>}
    {newPayerOpen && <div className="modal-backdrop payer-modal-layer" onClick={() => setNewPayerOpen(false)}><div className="payer-modal action-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setNewPayerOpen(false)}><X size={17}/></button><div className="modal-icon"><UserRound size={17}/></div><h2>Inscribir nuevo pagador</h2><p>Completa los datos para inscribir un nuevo pagador.</p><div className="payer-type-toggle"><button className={newPayerType === "Persona natural" ? "active" : ""} onClick={() => setNewPayerType("Persona natural")}><UserRound size={14}/> Persona natural</button><button className={newPayerType === "Persona jurídica" ? "active" : ""} onClick={() => setNewPayerType("Persona jurídica")}><Building2 size={14}/> Persona jurídica</button></div><label>Tipo de identificación <select className="full-select" value={newPayerIdType} onChange={e => setNewPayerIdType(e.target.value)}><option>Cédula de ciudadanía</option><option>NIT</option><option>Pasaporte</option></select></label><label>Número de identificación <input className="modal-input" value={newPayerId} onChange={e => setNewPayerId(e.target.value)} placeholder="10.987.654" /></label><label>Nombres y apellidos / Razón social <input className="modal-input" value={newPayerName} onChange={e => setNewPayerName(e.target.value)} placeholder="Laura Valencia" /></label><label>Correo <input className="modal-input" value={newPayerEmail} onChange={e => setNewPayerEmail(e.target.value)} placeholder="correo@empresa.com" /></label><label>Teléfono <input className="modal-input" value={newPayerPhone} onChange={e => setNewPayerPhone(e.target.value)} placeholder="300 123 4567" /></label><div className="modal-actions"><button className="secondary-action" onClick={() => setNewPayerOpen(false)}>Cancelar</button><button className="primary-action" onClick={savePayer}>Guardar pagador</button></div></div></div>}
    {duplicate && <div className="modal-backdrop payer-modal-layer"><div className="duplicate-modal action-modal"><div className="duplicate-icon"><AlertTriangle size={20}/></div><h2>Este pagador ya está inscrito</h2><p>Encontramos un registro con el mismo número de identificación. Puedes usarlo para continuar.</p><div className="duplicate-card"><b>{duplicate.name}</b><span>{duplicate.idType} {duplicate.id}</span><button onClick={useDuplicate}>Ver detalles <ChevronRight size={13}/></button></div><div className="modal-actions"><button className="secondary-action" onClick={() => setDuplicate(null)}>Cancelar</button><button className="primary-action" onClick={useDuplicate}>Usar este pagador</button></div></div></div>}
  </section>;
}
