import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Info,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { BrandedSelect } from "@/components/BrandedSelect";
import { validateNewPayer } from "./payerValidation";
import "./ProgramarRecaudoPage.css";

type Payer = {
  recordId: string;
  name: string;
  idType: string;
  id: string;
  email?: string;
  phone?: string;
  type: "Persona natural" | "Persona jurídica";
};

type PayerRecord = {
  id: string;
  name: string | null;
  id_type: string | null;
  identification_number: string | null;
  payer_type: string | null;
  email: string | null;
  phone: string | null;
};

const concepts = [
  { value: "", label: "Selecciona un concepto" },
  { value: "Prestación de servicios", label: "Prestación de servicios" },
  { value: "Honorarios", label: "Honorarios" },
  { value: "Venta de productos", label: "Venta de productos" },
  { value: "Pago de factura", label: "Pago de factura" },
];

const idTypes = ["Cédula de ciudadanía", "NIT", "Pasaporte"];

function todayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function parseAmount(value: string, currency: string) {
  const clean = value.replace(/[^0-9.,]/g, "");
  if (!clean) return 0;
  if (currency === "COP") return Number(clean.replace(/[.,]/g, ""));
  return Number(clean.replace(/,/g, "."));
}

function formatAmount(value: number, currency: string) {
  if (!value) return "Valor pendiente";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "Fecha pendiente";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function mapPayer(row: PayerRecord): Payer {
  return {
    recordId: row.id,
    name: row.name || "Sin nombre",
    idType: row.id_type || "ID",
    id: row.identification_number || "Sin identificación",
    email: row.email || undefined,
    phone: row.phone || undefined,
    type: row.payer_type === "Persona natural" ? "Persona natural" : "Persona jurídica",
  };
}

function getAuthErrorMessage(error: unknown, fallback: string) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "23505") return "Ya existe un registro con esa identificación.";
  return fallback;
}

type ProgramarRecaudoPageProps = {
  tenantId?: string;
  presentation?: "page" | "modal";
  onClose?: () => void;
  onSuccess?: () => void;
};

export function ProgramarRecaudoPage({ tenantId, presentation = "page", onClose, onSuccess }: ProgramarRecaudoPageProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const payerMenuRef = useRef<HTMLDivElement>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [selectedPayer, setSelectedPayer] = useState<Payer | null>(null);
  const [payerSearch, setPayerSearch] = useState("");
  const [payerMenuOpen, setPayerMenuOpen] = useState(false);
  const [newPayerOpen, setNewPayerOpen] = useState(false);
  const [newPayerType, setNewPayerType] = useState<"Persona natural" | "Persona jurídica">("Persona natural");
  const [newPayerIdType, setNewPayerIdType] = useState(idTypes[0]);
  const [newPayerId, setNewPayerId] = useState("");
  const [newPayerName, setNewPayerName] = useState("");
  const [newPayerEmail, setNewPayerEmail] = useState("");
  const [newPayerPhone, setNewPayerPhone] = useState("");
  const [payerError, setPayerError] = useState("");
  const [payerSubmitting, setPayerSubmitting] = useState(false);
  const [payers, setPayers] = useState<Payer[]>([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("COP");
  const [concept, setConcept] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const payersQuery = useQuery<PayerRecord[]>({
    queryKey: ["recaudo-payers", tenantId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("payers")
        .select("id,name,id_type,identification_number,payer_type,email,phone")
        .order("name", { ascending: true })
        .limit(150);
      if (queryError) throw queryError;
      return (data ?? []) as PayerRecord[];
    },
    staleTime: 30_000,
    retry: false,
    enabled: Boolean(tenantId && isSupabaseConfigured),
  });

  useEffect(() => {
    if (payersQuery.data) setPayers(payersQuery.data.map(mapPayer));
  }, [payersQuery.data]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (payerMenuRef.current && !payerMenuRef.current.contains(event.target as Node)) {
        setPayerMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (newPayerOpen) {
        setNewPayerOpen(false);
      } else if (payerMenuOpen) {
        setPayerMenuOpen(false);
      } else {
        requestExit();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  });

  const filteredPayers = useMemo(() => {
    const normalized = payerSearch.trim().toLocaleLowerCase("es-CO");
    if (!normalized) return payers.slice(0, 6);
    return payers
      .filter(payer => `${payer.name} ${payer.id}`.toLocaleLowerCase("es-CO").includes(normalized))
      .slice(0, 6);
  }, [payers, payerSearch]);

  const payerValidation = useMemo(
    () => validateNewPayer({
      name: newPayerName,
      identification: newPayerId,
      idType: newPayerIdType,
      email: newPayerEmail,
      phone: newPayerPhone,
    }),
    [newPayerName, newPayerId, newPayerIdType, newPayerEmail, newPayerPhone]
  );

  const numericAmount = parseAmount(amount, currency);
  const selectedConcept = concepts.find(item => item.value === concept)?.label || "Concepto pendiente";
  const hasChanges = Boolean(selectedPayer || payerSearch || amount || concept || description || date);

  function closeEditor() {
    if (onClose) onClose();
    else navigate("/receipts");
  }

  function requestExit() {
    if (hasChanges) setConfirmExit(true);
    else closeEditor();
  }

  function resetDraft() {
    setFormStep(1);
    setSelectedPayer(null);
    setPayerSearch("");
    setPayerMenuOpen(false);
    setAmount("");
    setCurrency("COP");
    setConcept("");
    setDescription("");
    setDate("");
    setError("");
  }

  function validateDraft() {
    if (!selectedPayer) return "Selecciona un pagador para continuar.";
    if (!amount.trim() || numericAmount <= 0 || !Number.isFinite(numericAmount)) return "Ingresa un valor esperado mayor que cero.";
    if (!concept) return "Selecciona el concepto del recaudo.";
    if (!date) return "Selecciona la fecha en la que esperas recibir el recaudo.";
    return "";
  }

  function continueToReview() {
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setFormStep(2);
  }

  async function submitReceipt() {
    if (submitting) return;
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      setFormStep(1);
      return;
    }
    if (!user) {
      setError("Tu sesión expiró. Inicia sesión nuevamente para guardar el recaudo.");
      return;
    }
    const payer = selectedPayer;
    if (!payer) {
      setError("Selecciona un pagador para continuar.");
      setFormStep(1);
      return;
    }

    setSubmitting(true);
    setError("");
    const { error: insertError } = await supabase.from("receipts").insert({
      payer_id: payer.recordId,
      payer_name: payer.name,
      concept,
      amount: numericAmount,
      currency,
      description: description.trim() || null,
      receipt_date: date,
      status: "Pendiente",
      created_by_open_id: user.id,
      created_by_name: user.name || user.email || null,
    });

    if (insertError) {
      setSubmitting(false);
      setError(getAuthErrorMessage(insertError, "No fue posible guardar el recaudo. Revisa la información e inténtalo nuevamente."));
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard-receipts"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }),
      queryClient.invalidateQueries({ queryKey: ["receipts"] }),
    ]);
    setSubmitting(false);
    if (presentation === "modal") {
      onSuccess?.();
      return;
    }
    setSuccess(true);
  }

  function openNewPayer() {
    setNewPayerName(payerSearch.trim());
    setPayerMenuOpen(false);
    setNewPayerOpen(true);
    setPayerError("");
  }

  async function savePayer() {
    if (payerSubmitting) return;
    if (!payerValidation.isValid) {
      setPayerError(payerValidation.name || payerValidation.identification || payerValidation.email || payerValidation.phone || "Revisa los datos del pagador.");
      return;
    }
    const normalizedId = newPayerId.replace(/\D/g, "");
    const duplicate = payers.find(payer => payer.id.replace(/\D/g, "") === normalizedId);
    if (duplicate) {
      setPayerError(`Ya existe el pagador ${duplicate.name} con esa identificación.`);
      return;
    }
    if (!user) {
      setPayerError("Tu sesión expiró. Inicia sesión nuevamente para guardar el pagador.");
      return;
    }

    setPayerSubmitting(true);
    setPayerError("");
    const { data, error: insertError } = await supabase
      .from("payers")
      .insert({
        name: newPayerName.trim(),
        id_type: newPayerIdType === "Cédula de ciudadanía" ? "CC" : newPayerIdType,
        identification_number: newPayerId.trim(),
        payer_type: newPayerType,
        email: newPayerEmail.trim() || null,
        phone: newPayerPhone.trim() || null,
        created_by_open_id: user.id,
        created_by_name: user.name || user.email || null,
      })
      .select("id,name,id_type,identification_number,payer_type,email,phone")
      .single();

    if (insertError || !data) {
      setPayerSubmitting(false);
      setPayerError(getAuthErrorMessage(insertError, "No fue posible guardar el pagador. Revisa la información e inténtalo nuevamente."));
      return;
    }

    const created = mapPayer(data as PayerRecord);
    setPayers(current => [created, ...current]);
    setSelectedPayer(created);
    setPayerSearch("");
    setNewPayerOpen(false);
    setPayerSubmitting(false);
  }

  if (success) {
    return (
      <section className="receipt-detail-page receipt-detail-success-page">
        <div className="receipt-created-card">
          <div className="receipt-created-icon"><CheckCircle2 size={28} /></div>
          <span className="detail-eyebrow">OPERACIÓN CREADA</span>
          <h1>Recaudo programado correctamente</h1>
          <p>La entrada quedó registrada en Supabase con estado pendiente y ya puedes consultarla desde Recaudos.</p>
          <div className="created-summary">
            <div><span>Pagador</span><strong>{selectedPayer?.name}</strong></div>
            <div><span>Valor esperado</span><strong>{formatAmount(numericAmount, currency)}</strong></div>
            <div><span>Fecha programada</span><strong>{formatDate(date)}</strong></div>
          </div>
          <div className="created-actions">
            <button type="button" className="secondary-detail-action" onClick={() => { setSuccess(false); resetDraft(); }}>Programar otro recaudo</button>
            <button type="button" className="primary-detail-action" onClick={() => navigate("/receipts")}>Ver Recaudos <ArrowRight size={15} /></button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="receipt-detail-page">
      <header className="receipt-detail-header">
        <button type="button" className="detail-back-action" onClick={requestExit}><ArrowLeft size={15} /> Recaudos</button>
        <div className="detail-header-copy">
          <span className="detail-eyebrow">NUEVA OPERACIÓN</span>
          <h1>Programar recaudo</h1>
          <p>Registra una entrada esperada y déjala lista para seguimiento.</p>
        </div>
        <div className="detail-trust-note"><ShieldCheck size={16} /><span><strong>Guardado protegido</strong><small>Tu sesión y las reglas de acceso de Supabase protegen esta operación.</small></span></div>
      </header>

      <div className="receipt-detail-grid">
        <form className="receipt-detail-form panel" onSubmit={event => { event.preventDefault(); formStep === 1 ? continueToReview() : void submitReceipt(); }}>
          <div className="detail-form-topline">
            <div><span className="detail-eyebrow">DATOS DEL RECAUDO</span><h2>Completa la operación</h2><p>Los campos marcados con <b>*</b> son obligatorios.</p></div>
            <span className="detail-step-count">Paso {formStep} de 2</span>
          </div>

          <div className="detail-stepper" aria-label="Progreso del recaudo">
            <button type="button" className={formStep === 1 ? "active" : "complete"} onClick={() => setFormStep(1)}><span>{formStep === 1 ? "1" : <Check size={14} />}</span><strong>Datos</strong><small>Información básica</small></button>
            <span className="detail-stepper-line" />
            <button type="button" className={formStep === 2 ? "active" : ""} disabled={formStep === 1} onClick={() => setFormStep(2)}><span>2</span><strong>Revisar y guardar</strong><small>Confirma la información</small></button>
          </div>

          {error && <div className="detail-form-error" role="alert"><Info size={16} /><span>{error}</span><button type="button" aria-label="Cerrar error" onClick={() => setError("")}><X size={14} /></button></div>}

          {formStep === 1 ? (
            <>
              <div className="detail-section-block">
                <div className="detail-section-heading"><span className="detail-section-number">01</span><div><h3>Pagador</h3><p>Selecciona el cliente o empresa que realizará el pago.</p></div></div>
                <div className="payer-detail-field" ref={payerMenuRef}>
                  <label htmlFor="receipt-payer-search">Pagador <em>*</em></label>
                  <div className={`detail-combobox ${payerMenuOpen ? "is-open" : ""} ${selectedPayer ? "has-value" : ""}`}>
                    <Search size={16} />
                    <input id="receipt-payer-search" value={selectedPayer?.name || payerSearch} onChange={event => { setSelectedPayer(null); setPayerSearch(event.target.value); setPayerMenuOpen(true); }} onFocus={() => setPayerMenuOpen(true)} placeholder="Buscar por nombre o identificación" readOnly={Boolean(selectedPayer)} autoComplete="off" />
                    {selectedPayer ? <button type="button" className="detail-clear-field" aria-label="Quitar pagador" onClick={() => { setSelectedPayer(null); setPayerSearch(""); setPayerMenuOpen(true); }}><X size={14} /></button> : <ChevronDown size={15} />}
                  </div>
                  {selectedPayer && <div className="detail-selected-payer"><span className="detail-payer-avatar">{selectedPayer.name.slice(0, 1).toUpperCase()}</span><span><strong>{selectedPayer.name}</strong><small>{selectedPayer.idType} {selectedPayer.id} · {selectedPayer.type}</small></span><Check size={16} /></div>}
                  {payerMenuOpen && !selectedPayer && <div className="detail-payer-menu" role="listbox">
                    <div className="detail-payer-menu-header"><span>{payerSearch ? "Coincidencias" : "Pagadores recientes"}</span><small>{payersQuery.isLoading ? "Cargando…" : `${filteredPayers.length} disponibles`}</small></div>
                    {payersQuery.error && <div className="detail-payer-state"><Info size={15} /> No pudimos cargar los pagadores. Revisa la conexión e inténtalo de nuevo.</div>}
                    {!payersQuery.error && payersQuery.isLoading && <div className="detail-payer-state"><LoaderCircle size={15} className="spin" /> Cargando pagadores…</div>}
                    {!payersQuery.error && !payersQuery.isLoading && filteredPayers.map(payer => <button type="button" className="detail-payer-option" key={payer.recordId} onClick={() => { setSelectedPayer(payer); setPayerSearch(""); setPayerMenuOpen(false); setError(""); }}><span className="detail-payer-avatar small">{payer.name.slice(0, 1).toUpperCase()}</span><span><strong>{payer.name}</strong><small>{payer.idType} {payer.id}</small></span><ChevronRight size={14} /></button>)}
                    {!payersQuery.isLoading && !payersQuery.error && !filteredPayers.length && <div className="detail-payer-state">No encontramos un pagador con ese criterio.</div>}
                    <button type="button" className="detail-new-payer-option" onClick={openNewPayer}><Plus size={15} /><span><strong>Inscribir nuevo pagador</strong><small>Agrega una persona o empresa a tu directorio.</small></span><ArrowRight size={14} /></button>
                  </div>}
                  <small className="detail-field-help">Puedes buscar por nombre, cédula o NIT. Si aún no existe, inscríbelo sin salir de este flujo.</small>
                </div>
              </div>

              <div className="detail-section-block detail-section-two-column">
                <div className="detail-section-heading"><span className="detail-section-number">02</span><div><h3>Detalles del recaudo</h3><p>Define cuánto esperas recibir y a qué corresponde.</p></div></div>
                <div className="detail-fields-grid">
                  <label className="detail-field wide-field" htmlFor="receipt-amount">Valor esperado <em>*</em><div className="detail-money-input"><span>$</span><input id="receipt-amount" value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="0" autoComplete="off" /><BrandedSelect value={currency} onChange={setCurrency} aria-label="Moneda" options={[{ value: "COP", label: "COP" }, { value: "USD", label: "USD" }]} /></div><small>Ingresa el valor sin símbolos ni espacios.</small></label>
                  <label className="detail-field" htmlFor="receipt-date">Fecha del recaudo <em>*</em><div className="detail-input-with-icon"><CalendarDays size={16} /><input id="receipt-date" type="date" min={todayInputValue()} value={date} onChange={event => setDate(event.target.value)} /></div><small>Selecciona cuándo esperas recibirlo.</small></label>
                  <label className="detail-field" htmlFor="receipt-concept">Concepto <em>*</em><BrandedSelect value={concept} onChange={setConcept} aria-label="Concepto" placeholder="Selecciona un concepto" options={concepts.filter(item => item.value).map(item => ({ value: item.value, label: item.label }))} /><small>Ayuda a clasificar la operación en reportes.</small></label>
                  <label className="detail-field detail-description-field" htmlFor="receipt-description">Descripción <span className="optional-label">Opcional</span><textarea id="receipt-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Agrega una nota, referencia o información adicional" maxLength={240} /><small>{description.length}/240 caracteres</small></label>
                </div>
              </div>
            </>
          ) : (
            <div className="detail-review-step">
              <div className="detail-review-intro"><span className="detail-review-icon"><CheckCircle2 size={20} /></span><div><h3>Revisa antes de guardar</h3><p>Confirma que la información sea correcta. El recaudo se creará con estado <strong>Pendiente</strong>.</p></div></div>
              <div className="detail-review-list">
                <div><span>Pagador</span><strong>{selectedPayer?.name}</strong><small>{selectedPayer?.idType} {selectedPayer?.id}</small></div>
                <div><span>Valor esperado</span><strong>{formatAmount(numericAmount, currency)}</strong><small>Moneda: {currency}</small></div>
                <div><span>Concepto</span><strong>{selectedConcept}</strong><small>{description || "Sin descripción adicional"}</small></div>
                <div><span>Fecha del recaudo</span><strong>{formatDate(date)}</strong><small>Se mostrará como operación pendiente</small></div>
              </div>
              <button type="button" className="detail-edit-link" onClick={() => setFormStep(1)}><ArrowLeft size={14} /> Volver a editar datos</button>
            </div>
          )}

          <footer className="detail-form-footer">
            <button type="button" className="secondary-detail-action" onClick={requestExit}>Cancelar</button>
            {formStep === 1 ? <button type="submit" className="primary-detail-action">Continuar a revisión <ArrowRight size={15} /></button> : <button type="submit" className="primary-detail-action" disabled={submitting}>{submitting ? <><LoaderCircle size={15} className="spin" /> Guardando…</> : <>Confirmar y guardar <Check size={15} /></>}</button>}
          </footer>
        </form>

        <aside className="receipt-detail-aside">
          <div className="detail-summary-card panel">
            <div className="detail-summary-accent" />
            <div className="detail-aside-heading"><span className="detail-summary-icon"><ArrowDownLeft size={17} /></span><div><span className="detail-eyebrow">RESUMEN EN VIVO</span><h2>Tu recaudo</h2></div></div>
            <div className="detail-summary-payer"><span className="detail-payer-avatar large">{selectedPayer ? selectedPayer.name.slice(0, 1).toUpperCase() : <UserRound size={17} />}</span><div><small>Pagador</small><strong>{selectedPayer?.name || "Pendiente de seleccionar"}</strong></div></div>
            <div className="detail-summary-amount"><small>Valor esperado</small><strong>{formatAmount(numericAmount, currency)}</strong></div>
            <dl className="detail-summary-details"><div><dt>Concepto</dt><dd>{selectedConcept}</dd></div><div><dt>Fecha</dt><dd>{date ? formatDate(date) : "Pendiente"}</dd></div><div><dt>Estado inicial</dt><dd><span className="pending-dot" /> Pendiente</dd></div></dl>
            <div className="detail-summary-note"><Clock3 size={14} /><span>Al guardar, el equipo podrá hacer seguimiento y confirmar la entrada.</span></div>
          </div>

          <div className="detail-guide-card panel"><div className="detail-aside-heading"><span className="detail-guide-icon"><FileText size={16} /></span><div><span className="detail-eyebrow">GUÍA RÁPIDA</span><h2>Cómo funciona</h2></div></div><ol><li><span>1</span><div><strong>Relaciona un pagador</strong><small>Usa uno existente o inscríbelo.</small></div></li><li><span>2</span><div><strong>Completa los datos</strong><small>Valor, concepto y fecha esperada.</small></div></li><li><span>3</span><div><strong>Revisa y guarda</strong><small>La operación quedará pendiente.</small></div></li></ol><div className="detail-security-line"><ShieldCheck size={14} /> Los datos se guardan con tu sesión de Supabase.</div></div>

          {payersQuery.error && <div className="detail-data-warning" role="status"><Info size={15} /><span><strong>Pagadores no disponibles</strong><small>Puedes continuar cuando la conexión con Supabase esté restablecida.</small></span></div>}
        </aside>
      </div>

      {newPayerOpen && <div className="detail-modal-backdrop" onMouseDown={() => setNewPayerOpen(false)}><section className="detail-payer-modal" role="dialog" aria-modal="true" aria-labelledby="new-payer-title" onMouseDown={event => event.stopPropagation()}><button type="button" className="detail-modal-close" onClick={() => setNewPayerOpen(false)} aria-label="Cerrar inscripción"><X size={17} /></button><span className="detail-modal-icon"><UserRound size={18} /></span><span className="detail-eyebrow">DIRECTORIO DE PAGADORES</span><h2 id="new-payer-title">Inscribir nuevo pagador</h2><p>Guarda los datos de la persona o empresa para usarla en este y futuros recaudos.</p><div className="detail-type-toggle" role="radiogroup" aria-label="Tipo de pagador"><button type="button" className={newPayerType === "Persona natural" ? "active" : ""} role="radio" aria-checked={newPayerType === "Persona natural"} onClick={() => setNewPayerType("Persona natural")}><UserRound size={15} /><span><strong>Persona natural</strong><small>Cliente individual</small></span></button><button type="button" className={newPayerType === "Persona jurídica" ? "active" : ""} role="radio" aria-checked={newPayerType === "Persona jurídica"} onClick={() => setNewPayerType("Persona jurídica")}><Building2 size={15} /><span><strong>Persona jurídica</strong><small>Empresa u organización</small></span></button></div><div className="detail-modal-grid"><label>Tipo de identificación<BrandedSelect value={newPayerIdType} onChange={setNewPayerIdType} aria-label="Tipo de identificación" options={idTypes.map(type => ({ value: type, label: type }))} /></label><label>Número de identificación <em>*</em><input className="detail-modal-input" value={newPayerId} onChange={event => setNewPayerId(event.target.value)} placeholder={newPayerIdType === "NIT" ? "900123456-7" : "10.987.654"} /></label><label className="full-modal-field">Nombres y apellidos / Razón social <em>*</em><input className="detail-modal-input" value={newPayerName} onChange={event => setNewPayerName(event.target.value)} placeholder="Laura Valencia o Empresa S.A.S." /></label><label>Correo electrónico <span className="optional-label">Opcional</span><input className="detail-modal-input" type="email" value={newPayerEmail} onChange={event => setNewPayerEmail(event.target.value)} placeholder="correo@empresa.com" /></label><label>Teléfono <span className="optional-label">Opcional</span><input className="detail-modal-input" value={newPayerPhone} onChange={event => setNewPayerPhone(event.target.value)} placeholder="300 123 4567" /></label></div>{payerError && <div className="detail-form-error" role="alert"><Info size={15} /><span>{payerError}</span></div>}<div className="detail-modal-actions"><button type="button" className="secondary-detail-action" onClick={() => setNewPayerOpen(false)}>Cancelar</button><button type="button" className="primary-detail-action" disabled={payerSubmitting} onClick={() => void savePayer()}>{payerSubmitting ? <><LoaderCircle size={15} className="spin" /> Guardando…</> : <>Guardar pagador <Check size={15} /></>}</button></div></section></div>}
      {confirmExit && <div className="detail-modal-backdrop" onMouseDown={() => setConfirmExit(false)}><section className="detail-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="discard-title" onMouseDown={event => event.stopPropagation()}><span className="detail-confirm-icon"><Info size={18} /></span><h2 id="discard-title">¿Salir sin guardar?</h2><p>Los datos que ingresaste se perderán si sales de esta vista.</p><div className="detail-modal-actions"><button type="button" className="secondary-detail-action" onClick={() => setConfirmExit(false)}>Continuar editando</button><button type="button" className="primary-detail-action" onClick={closeEditor}>Salir sin guardar</button></div></section></div>}
    </section>
  );
}
