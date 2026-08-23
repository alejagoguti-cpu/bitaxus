/* Bitaxus Recaudos: flujo operativo de pagadores, validación y programación. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { canReviewReceipt } from "./receiptFlow";
import "./ReceiptSuccess.css";
import "./ReceiptSubmit.css";
import "./PayerModalFix.css";
import { validateNewPayer } from "./payerValidation";
import { ArrowDownLeft, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, Tag, X, UserRound, Building2, AlertTriangle } from "lucide-react";
import HorizontalScrollHint from "../components/HorizontalScrollHint";
import ExportActions from "../components/ExportActions";
import ModalScrollControls from "../components/ModalScrollControls";
import UnsavedChangesDialog from "../components/UnsavedChangesDialog";

type Payer = { name: string; idType: string; id: string; email?: string; phone?: string; type: "Persona natural" | "Persona jurídica" };
type ReceiptRow = { id: string; payer: string; concept: string; amount: string; date: string; status: string };

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
  const headerPeriod = "Este mes";
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [conceptFilter, setConceptFilter] = useState("Todos");
  const [formOpen, setFormOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [payers, setPayers] = useState<Payer[]>([]);
  const receiptsQuery = useQuery({ queryKey: ["public-receipts"], queryFn: async () => { const { data, error } = await supabase.from("receipts").select("id,payer_name,concept,amount,currency,receipt_date,status,created_at").order("created_at", { ascending: false }).limit(100); if (error) throw error; return data ?? []; }, staleTime: 30000, retry: false });
  const payersQuery = useQuery({ queryKey: ["public-payers"], queryFn: async () => { const { data, error } = await supabase.from("payers").select("name,id_type,id_number,email,phone,type,created_at").order("created_at", { ascending: false }).limit(100); if (error) throw error; return data ?? []; }, staleTime: 30000, retry: false });
  useEffect(() => { if (receiptsQuery.data) setReceipts(receiptsQuery.data.map(row => ({ id: row.id, payer: row.payer_name || "", concept: row.concept || "", amount: `$ ${Number(row.amount || 0).toLocaleString("es-CO")}`, date: new Date(row.receipt_date || row.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }), status: row.status || "" }))); }, [receiptsQuery.data]);
  useEffect(() => { if (payersQuery.data) setPayers(payersQuery.data.map(row => ({ name: row.name || "", idType: row.id_type || "", id: row.id_number || "", email: row.email || undefined, phone: row.phone || undefined, type: row.type === "Persona natural" ? "Persona natural" : "Persona jurídica" }))); }, [payersQuery.data]);
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
  const [payerSubmitting, setPayerSubmitting] = useState(false);
  const [payerError, setPayerError] = useState("");
  const newPayerValidation = useMemo(() => validateNewPayer({ name: newPayerName, identification: newPayerId, idType: newPayerIdType, email: newPayerEmail, phone: newPayerPhone }), [newPayerName, newPayerId, newPayerIdType, newPayerEmail, newPayerPhone]);
  const [amount, setAmount] = useState("");
  const [currency] = useState("COP");
  const [concept, setConcept] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (formOpen) void payersQuery.refetch();
  }, [formOpen]);

  useEffect(() => {
    if (!newPayerOpen || payerSubmitting) return;
    const started = Boolean(newPayerName || newPayerId || newPayerEmail || newPayerPhone);
    if (!started || newPayerValidation.isValid) { setPayerError(""); return; }
    setPayerError(newPayerValidation.name || newPayerValidation.identification || newPayerValidation.email || newPayerValidation.phone || "Revisa los campos del pagador.");
  }, [newPayerOpen, newPayerValidation, newPayerName, newPayerId, newPayerEmail, newPayerPhone, payerSubmitting]);

  const filtered = useMemo(() => receipts.filter(item => {
    const matchTab = tab === "Todos" || (tab === "Pendientes" && item.status === "Pendiente") || (tab === "Recibidos" && item.status === "Recibido") || (tab === "Cancelados" && item.status === "Cancelado");
    const matchStatus = statusFilter === "Todos" || item.status === statusFilter;
    const matchConcept = conceptFilter === "Todos" || item.concept === conceptFilter;
    const text = `${item.id} ${item.payer} ${item.concept} ${item.amount}`.toLowerCase();
    return matchTab && matchStatus && matchConcept && text.includes(query.toLowerCase());
  }), [receipts, tab, query, statusFilter, conceptFilter, dateFilter]);
  const payerResults = useMemo(() => payers.filter(p => `${p.name} ${p.id}`.toLowerCase().includes(payerQuery.toLowerCase())), [payers, payerQuery]);
  const hasUnsavedReceiptChanges = Boolean(selectedPayer || payerQuery.trim() || amount.trim() || concept.trim() || date);
  const requestReceiptClose = () => { if (hasUnsavedReceiptChanges) setDiscardPrompt(true); else setFormOpen(false); };
  const discardReceiptChanges = () => { setDiscardPrompt(false); setFormOpen(false); setSelectedPayer(null); setPayerQuery(""); setAmount(""); setConcept(""); setDate(""); setPayerPanelOpen(false); };

  const schedule = async () => {
    if (receiptSubmitting) return;
    if (!selectedPayer || !amount.trim() || !concept.trim() || !date) { setReceiptError("Completa pagador, valor, concepto y fecha antes de guardar."); return; }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { setReceiptError("Tu sesión expiró. Inicia sesión nuevamente para guardar el recaudo."); return; }
    setReceiptSubmitting(true); setReceiptError("");
    const numericAmount = Number(amount.replace(/[^0-9]/g, ""));
    const { error } = await supabase.from("receipts").insert({ payer_id: selectedPayer.id, payer_name: selectedPayer.name, concept, amount: numericAmount, currency: "COP", description: null, receipt_date: date, status: "Pendiente", created_by_open_id: authData.user.id, created_by_name: authData.user.user_metadata?.name || authData.user.email || null });
    if (error) { setReceiptError("No fue posible guardar el recaudo. Revisa tu conexión e inténtalo nuevamente."); setReceiptSubmitting(false); return; }
    await receiptsQuery.refetch();
    setSelectedPayer(null); setPayerQuery(""); setAmount(""); setConcept(""); setDate(""); setFormOpen(false); setReceiptSubmitting(false); setReceiptSuccess(true); window.setTimeout(() => setReceiptSuccess(false), 4200);
  };
  const continueToReview = () => {
    if (!canReviewReceipt(selectedPayer, amount, concept, date)) {
      setReceiptError("Completa pagador, valor, concepto y fecha antes de continuar.");
      return;
    }
    setFormStep(2);
  };
  const startNewPayer = () => { setPayerPanelOpen(false); setNewPayerOpen(true); setNewPayerName(payerQuery); setPayerError(""); };
  const savePayer = async () => {
    if (payerSubmitting) return;
    if (!newPayerValidation.isValid) { setPayerError(newPayerValidation.name || newPayerValidation.identification || newPayerValidation.email || newPayerValidation.phone || "Revisa los campos del pagador."); return; }
    const existing = payers.find(p => p.id.replace(/\D/g, "") === newPayerId.replace(/\D/g, ""));
    if (existing) { setDuplicate(existing); return; }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { setPayerError("Tu sesión expiró. Inicia sesión nuevamente para guardar el pagador."); return; }
    setPayerSubmitting(true); setPayerError("");
    const { data, error } = await supabase.from("payers").insert({ name: newPayerName.trim(), id_type: newPayerIdType === "Cédula de ciudadanía" ? "CC" : newPayerIdType, id_number: newPayerId.trim(), type: newPayerType, email: newPayerEmail.trim() || null, phone: newPayerPhone.trim() || null, created_by_open_id: authData.user.id, created_by_name: authData.user.user_metadata?.name || authData.user.email || null }).select("name,id_type,id_number,email,phone,type").single();
    if (error || !data) { setPayerError(error?.code === "23505" ? "Ya existe un pagador con esa identificación." : "No fue posible guardar el pagador. Revisa tu conexión e inténtalo nuevamente."); setPayerSubmitting(false); return; }
    const created: Payer = { name: data.name || "", idType: data.id_type || "", id: data.id_number || "", type: data.type === "Persona natural" ? "Persona natural" : "Persona jurídica", email: data.email || undefined, phone: data.phone || undefined };
    setPayers(current => [created, ...current.filter(item => item.id !== created.id)]); setSelectedPayer(created); setNewPayerOpen(false); setPayerSubmitting(false);
  };
  const useDuplicate = () => { if (duplicate) setSelectedPayer(duplicate); setDuplicate(null); setNewPayerOpen(false); void 0; };

  return <section className="receipts-page">
    <header className="receipts-header"><div><h2>Recaudos</h2><p>Programa y consulta los recaudos de tu operación.</p></div><div className="receipts-header-actions"><button type="button" className="primary-action schedule-top" onClick={() => { setFormStep(1); setFormOpen(true); }}><span className="schedule-top-icon" aria-hidden="true"><Plus size={17}/></span><span className="schedule-top-copy"><strong>Programar recaudo</strong><small>Crear nueva operación</small></span><ChevronRight size={16} className="schedule-top-arrow" aria-hidden="true"/></button></div></header>
    {receiptSuccess && <div className="receipt-success-message" role="status" aria-live="polite"><span className="receipt-success-icon"><CheckCircle2 size={18}/></span><span><b>Recaudo programado correctamente</b><small>El nuevo recaudo quedó agregado a tus operaciones pendientes.</small></span><button type="button" aria-label="Cerrar mensaje de éxito" onClick={() => setReceiptSuccess(false)}><X size={15}/></button><span className="receipt-success-progress" aria-hidden="true"/></div>}
    {receiptError && <div className="receipt-error-message" role="alert">{receiptError}<button type="button" aria-label="Cerrar error" onClick={() => setReceiptError("")}><X size={15}/></button></div>}
    <div className="receipts-tabs"><div>{tabs.map(item => <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>)}</div><span>{filtered.length} de {receipts.length} recaudos</span></div>
    <div className="receipts-workspace full-width"><div key={tab} className="receipts-table-card panel"><div className="table-export-toolbar"><ExportActions title="Recaudos" rows={filtered as unknown as Record<string, string | number>[]} columns={[{ key: "id", label: "ID" }, { key: "payer", label: "Cliente / Pagador" }, { key: "concept", label: "Concepto" }, { key: "amount", label: "Valor" }, { key: "date", label: "Fecha" }, { key: "status", label: "Estado" }]} filters={{ Periodo: headerPeriod, Estado: statusFilter, Concepto: conceptFilter }} logoUrl="/bitaxus/assets/bitaxus-logo-black.png" /></div><div className="receipts-filters"><label className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por pagador, ID, concepto o descripción" /></label><FilterMenu label="Fecha" icon={CalendarDays} value={dateFilter} options={["Todos", "Este mes", "Últimos 30 días", "Este trimestre"]} onChange={setDateFilter}/><FilterMenu label="Estado" icon={SlidersHorizontal} value={statusFilter} options={["Todos", "Pendiente", "Recibido", "Cancelado"]} onChange={setStatusFilter}/><FilterMenu label="Concepto" icon={Tag} value={conceptFilter} options={["Todos", "Honorarios", "Prestación de servicios", "Venta de productos", "Pago de factura"]} onChange={setConceptFilter}/></div><HorizontalScrollHint className="receipts-table-wrap"><table className="receipts-table"><thead><tr><th>ID</th><th>Pagador</th><th>Concepto</th><th>Valor</th><th>Fecha del recaudo</th><th>Estado</th><th></th></tr></thead><tbody>{filtered.map(item => <tr key={item.id} onClick={() => void 0}><td>{item.id}</td><td>{item.payer}</td><td>{item.concept}</td><td className="receipt-amount">{item.amount} <small>COP</small></td><td>{item.date}</td><td><span className={`receipt-status ${item.status.toLowerCase()}`}>{item.status}</span></td><td><ChevronRight size={17}/></td></tr>)}{filtered.length === 0 && <tr><td colSpan={7} className="empty-row">No encontramos recaudos con esos criterios.</td></tr>}</tbody></table></HorizontalScrollHint><div className="table-footer"><span>Mostrando {filtered.length} de {receipts.length} recaudos</span><div><button aria-label="Página anterior" onClick={() => void 0}><ChevronLeft size={16}/></button><b>1</b><button aria-label="Página siguiente" onClick={() => void 0}><ChevronRight size={16}/></button></div></div></div>
      {formOpen && <div className="modal-backdrop receipt-form-backdrop" onClick={requestReceiptClose}><aside className="receipt-form panel" data-step={formStep} onClick={event => event.stopPropagation()}><ModalScrollControls><button className="form-close" onClick={requestReceiptClose} aria-label="Cerrar formulario"><X size={17}/></button><div className="form-title-row"><span className="form-title-icon" aria-hidden="true"><ArrowDownLeft size={19}/></span><div className="form-title-copy"><span className="form-eyebrow">NUEVA OPERACIÓN</span><h3>Programar recaudo</h3><p>Registra una entrada esperada y déjala lista para seguimiento.</p></div></div><div className="receipt-flow-steps" aria-label="Progreso del recaudo"><span className={formStep === 1 ? "active" : "complete"}><i>1</i><b>Datos</b></span><span className={formStep === 2 ? "active" : ""}><i>2</i><b>Revisar y guardar</b></span></div><label>Pagador <em>*</em><div className="form-input payer-trigger" onClick={() => setPayerPanelOpen(true)}><Search size={15}/><input value={selectedPayer?.name || payerQuery} onChange={e => { setSelectedPayer(null); setPayerQuery(e.target.value); setPayerPanelOpen(true); }} onFocus={() => setPayerPanelOpen(true)} placeholder="Buscar o agregar pagador"/><ChevronDown size={14}/></div>{selectedPayer && <div className="selected-payer"><span><Check size={13}/> {selectedPayer.name}<small>{selectedPayer.idType} {selectedPayer.id}</small></span><button onClick={() => { setSelectedPayer(null); setPayerQuery(""); }}><X size={13}/></button></div>}{payerPanelOpen && !selectedPayer && <div className="payer-results"><div className="payer-results-head">Resultados <button onClick={() => setPayerPanelOpen(false)}><X size={12}/></button></div>{payerResults.slice(0, 4).map(p => <button key={p.id} className="payer-result" onClick={() => { setSelectedPayer(p); setPayerQuery(""); setPayerPanelOpen(false); }}><span><b>{p.name}</b><small>{p.idType} {p.id}</small></span><strong>Seleccionar</strong></button>)}<button className="new-payer-link" onClick={startNewPayer}><Plus size={14}/> Inscribir nuevo pagador</button></div>}</label><label>Valor esperado <em>*</em><div className="amount-input"><span>$</span><input value={amount} onChange={e => setAmount(e.target.value)} /><select><option>COP</option><option>USD</option></select></div></label><label>Concepto <em>*</em><select className="full-select" value={concept} onChange={e => setConcept(e.target.value)}><option>Prestación de servicios</option><option>Honorarios</option><option>Venta de productos</option><option>Pago de factura</option></select></label><label>Descripción<textarea placeholder="Agrega información adicional sobre el recaudo (opcional)" /></label><label>Fecha del recaudo <em>*</em><div className="form-input"><CalendarDays size={15}/><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div></label><div className="form-actions"><button className="secondary-action" onClick={requestReceiptClose}>Cancelar</button><button className="primary-action" onClick={() => void schedule()} disabled={receiptSubmitting}>{receiptSubmitting ? "Guardando..." : formStep === 1 ? "Continuar a revisión" : "Confirmar y guardar"}</button></div><div className="receipt-review-card"><span className="form-eyebrow">RESUMEN DE LA OPERACIÓN</span><strong>{selectedPayer?.name || "Pagador pendiente"}</strong><div><span>{concept || "Concepto pendiente"}</span><b>{amount ? `$ ${Number(amount.replace(/[^0-9]/g, "")).toLocaleString("es-CO")} ${currency}` : "Valor pendiente"}</b></div><small>{date ? `Fecha programada: ${date}` : "Fecha pendiente"}</small></div><div className="receipt-guide"><div className="receipt-guide-title"><Tag size={15}/> <b>Guía de recaudos</b></div><div className="receipt-guide-steps"><span><i>1</i><small>Selecciona o inscribe el cliente.</small></span><span><i>2</i><small>Define valor, concepto y aplica.</small></span><span><i>3</i><small>Activa cobro mensual si aplica.</small></span><span><i>4</i><small>Programa el recaudo y consulta su estado.</small></span></div></div></ModalScrollControls></aside></div>}{formOpen && <UnsavedChangesDialog open={discardPrompt} onContinue={() => setDiscardPrompt(false)} onDiscard={discardReceiptChanges} />}
    </div>
    {!formOpen && <button className="floating-add primary-action" onClick={() => setFormOpen(true)}><Plus size={16}/> Programar recaudo</button>}
    {newPayerOpen && <div className="modal-backdrop payer-modal-layer" onClick={() => setNewPayerOpen(false)}><div className="payer-modal action-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setNewPayerOpen(false)}><X size={17}/></button><div className="modal-icon"><UserRound size={17}/></div><h2>Inscribir nuevo pagador</h2><p>Completa los datos para inscribir un nuevo pagador.</p><div className="payer-type-toggle"><button className={newPayerType === "Persona natural" ? "active" : ""} onClick={() => setNewPayerType("Persona natural")}><UserRound size={14}/> Persona natural</button><button className={newPayerType === "Persona jurídica" ? "active" : ""} onClick={() => setNewPayerType("Persona jurídica")}><Building2 size={14}/> Persona jurídica</button></div><label>Tipo de identificación <select className="full-select" value={newPayerIdType} onChange={e => setNewPayerIdType(e.target.value)}><option>Cédula de ciudadanía</option><option>NIT</option><option>Pasaporte</option></select></label><label>Número de identificación <input className="modal-input" value={newPayerId} onChange={e => setNewPayerId(e.target.value)} placeholder="10.987.654" /></label><label>Nombres y apellidos / Razón social <input className="modal-input" value={newPayerName} onChange={e => setNewPayerName(e.target.value)} placeholder="Laura Valencia" /></label><label>Correo <input className="modal-input" value={newPayerEmail} onChange={e => setNewPayerEmail(e.target.value)} placeholder="correo@empresa.com" /></label><label>Teléfono <input className="modal-input" value={newPayerPhone} onChange={e => setNewPayerPhone(e.target.value)} placeholder="300 123 4567" /></label>{payerError && <p className="modal-error" role="alert">{payerError}</p>}<div className="modal-actions"><button className="secondary-action" onClick={() => setNewPayerOpen(false)}>Cancelar</button><button className="primary-action" onClick={() => void savePayer()} disabled={payerSubmitting}>{payerSubmitting ? "Guardando..." : "Guardar pagador"}</button></div></div></div>}
    {duplicate && <div className="modal-backdrop payer-modal-layer"><div className="duplicate-modal action-modal"><div className="duplicate-icon"><AlertTriangle size={20}/></div><h2>Este pagador ya está inscrito</h2><p>Encontramos un registro con el mismo número de identificación. Puedes usarlo para continuar.</p><div className="duplicate-card"><b>{duplicate.name}</b><span>{duplicate.idType} {duplicate.id}</span><button onClick={useDuplicate}>Ver detalles <ChevronRight size={13}/></button></div><div className="modal-actions"><button className="secondary-action" onClick={() => setDuplicate(null)}>Cancelar</button><button className="primary-action" onClick={useDuplicate}>Usar este pagador</button></div></div></div>}
  </section>;
}
