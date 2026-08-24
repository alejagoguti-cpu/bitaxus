import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
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
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { BrandedSelect } from "@/components/BrandedSelect";
import "./ProgramarRecaudoPage.css";
import "./ProgramarPagoPage.css";

type BeneficiaryRecord = {
  id: string;
  name: string | null;
  id_type: string | null;
  identification_number: string | null;
  relation: string | null;
  status: string | null;
  bank: string | null;
  account_type: string | null;
  account_number: string | null;
};

type Beneficiary = {
  recordId: string;
  name: string;
  idType: string;
  identification: string;
  bank?: string;
  accountType?: string;
  accountNumber?: string;
};

type BankAccountRecord = {
  id: string;
  bank_name: string | null;
  account_type: string | null;
  account_number: string | null;
  account_holder: string | null;
  status: string | null;
  is_primary: boolean | null;
};

type BankAccount = BankAccountRecord & { label: string };

const concepts = [
  { value: "", label: "Selecciona un concepto" },
  { value: "Pago de factura", label: "Pago de factura" },
  { value: "Honorarios", label: "Honorarios" },
  { value: "Comisiones", label: "Comisiones" },
  { value: "Prestación de servicios", label: "Prestación de servicios" },
  { value: "Nómina", label: "Nómina" },
];

function todayInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
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
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
}

function maskAccount(value: string | null | undefined) {
  if (!value) return "Sin número";
  const normalized = value.replace(/\s/g, "");
  return normalized.length > 4 ? `••••${normalized.slice(-4)}` : normalized;
}

function mapBeneficiary(row: BeneficiaryRecord): Beneficiary {
  return {
    recordId: row.id,
    name: row.name || "Sin nombre",
    idType: row.id_type || "ID",
    identification: row.identification_number || "Sin identificación",
    bank: row.bank || undefined,
    accountType: row.account_type || undefined,
    accountNumber: row.account_number || undefined,
  };
}

function mapBankAccount(row: BankAccountRecord): BankAccount {
  const bank = row.bank_name || "Cuenta bancaria";
  const type = row.account_type || "Cuenta";
  return {
    ...row,
    label: `${bank} · ${type} · ${maskAccount(row.account_number)}`,
  };
}

export function ProgramarPagoPage({ tenantId }: { tenantId?: string }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const beneficiaryMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [beneficiaryMenuOpen, setBeneficiaryMenuOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [accountReference, setAccountReference] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("COP");
  const [concept, setConcept] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [monthly, setMonthly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const beneficiariesQuery = useQuery<BeneficiaryRecord[]>({
    queryKey: ["payment-beneficiaries", tenantId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("counterparties")
        .select("id,name,id_type,identification_number,relation,status,bank,account_type,account_number")
        .eq("relation", "Proveedor")
        .eq("status", "Activa")
        .order("name", { ascending: true })
        .limit(150);
      if (queryError) throw queryError;
      return (data ?? []) as BeneficiaryRecord[];
    },
    staleTime: 30_000,
    retry: false,
    enabled: Boolean(tenantId && isSupabaseConfigured),
  });

  const accountsQuery = useQuery<BankAccountRecord[]>({
    queryKey: ["payment-source-accounts", tenantId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("bank_accounts")
        .select("id,bank_name,account_type,account_number,account_holder,status,is_primary")
        .eq("tenant_id", tenantId)
        .eq("status", "Activa")
        .order("is_primary", { ascending: false })
        .order("bank_name", { ascending: true })
        .limit(50);
      if (queryError) throw queryError;
      return (data ?? []) as BankAccountRecord[];
    },
    staleTime: 30_000,
    retry: false,
    enabled: Boolean(tenantId && isSupabaseConfigured),
  });

  const beneficiaries = useMemo(
    () => (beneficiariesQuery.data ?? []).map(mapBeneficiary),
    [beneficiariesQuery.data]
  );
  const accounts = useMemo(
    () => (accountsQuery.data ?? []).map(mapBankAccount),
    [accountsQuery.data]
  );
  const filteredBeneficiaries = useMemo(() => {
    const normalized = beneficiarySearch.trim().toLocaleLowerCase("es-CO");
    if (!normalized) return beneficiaries.slice(0, 6);
    return beneficiaries
      .filter(item => `${item.name} ${item.identification}`.toLocaleLowerCase("es-CO").includes(normalized))
      .slice(0, 6);
  }, [beneficiaries, beneficiarySearch]);

  const numericAmount = parseAmount(amount, currency);
  const selectedConcept = concepts.find(item => item.value === concept)?.label || "Concepto pendiente";
  const selectedAccountLabel = selectedAccount?.label || accountReference.trim() || "Cuenta pendiente";
  const hasChanges = Boolean(selectedBeneficiary || beneficiarySearch || selectedAccount || accountReference || amount || concept || description || date || monthly);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (beneficiaryMenuRef.current && !beneficiaryMenuRef.current.contains(event.target as Node)) setBeneficiaryMenuOpen(false);
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (beneficiaryMenuOpen) setBeneficiaryMenuOpen(false);
      else if (accountMenuOpen) setAccountMenuOpen(false);
      else requestExit();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  });

  function requestExit() {
    if (hasChanges) setConfirmExit(true);
    else navigate("/payments");
  }

  function resetDraft() {
    setFormStep(1);
    setSelectedBeneficiary(null);
    setBeneficiarySearch("");
    setBeneficiaryMenuOpen(false);
    setSelectedAccount(null);
    setAccountReference("");
    setAccountMenuOpen(false);
    setAmount("");
    setCurrency("COP");
    setConcept("");
    setDescription("");
    setDate("");
    setMonthly(false);
    setError("");
    setConfirmExit(false);
  }

  function validateDraft() {
    if (!selectedBeneficiary) return "Selecciona un proveedor o beneficiario.";
    if (!selectedAccount && !accountReference.trim()) return "Selecciona una cuenta de salida o ingresa una referencia.";
    if (!amount.trim() || numericAmount <= 0 || !Number.isFinite(numericAmount)) return "Ingresa un valor de pago mayor que cero.";
    if (!concept) return "Selecciona el concepto del pago.";
    if (!date) return "Selecciona la fecha programada del pago.";
    if (date < todayInputValue()) return "La fecha del pago no puede ser anterior a hoy.";
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

  async function submitPayment() {
    if (submitting) return;
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      setFormStep(1);
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase no está configurado en este entorno.");
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError("Tu sesión expiró. Inicia sesión nuevamente para guardar el pago.");
      return;
    }

    setSubmitting(true);
    setError("");
    const { error: insertError } = await supabase.from("payments").insert({
      payment_type: "Pago individual",
      beneficiary: selectedBeneficiary?.name || null,
      dispersion_name: null,
      account: selectedAccountLabel,
      amount: numericAmount,
      currency,
      concept,
      description: description.trim() || null,
      payment_date: date,
      monthly,
      status: "Pendiente",
      created_by_open_id: auth.user.id,
      created_by_name: auth.user.user_metadata?.name || auth.user.email || user?.name || null,
    });

    if (insertError) {
      setSubmitting(false);
      setError("No fue posible guardar el pago. Revisa la información e inténtalo nuevamente.");
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["public-payment-operations", tenantId] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-payments"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }),
    ]);
    setSubmitting(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <section className="receipt-detail-page receipt-detail-success-page payment-detail-page">
        <div className="receipt-created-card">
          <div className="receipt-created-icon"><CheckCircle2 size={28} /></div>
          <span className="detail-eyebrow">OPERACIÓN CREADA</span>
          <h1>Pago programado correctamente</h1>
          <p>La salida quedó registrada en Supabase con estado pendiente y ya puedes consultarla desde Pagos y dispersiones.</p>
          <div className="created-summary">
            <div><span>Beneficiario</span><strong>{selectedBeneficiary?.name}</strong></div>
            <div><span>Valor del pago</span><strong>{formatAmount(numericAmount, currency)}</strong></div>
            <div><span>Fecha programada</span><strong>{formatDate(date)}</strong></div>
          </div>
          <div className="created-actions">
            <button type="button" className="secondary-detail-action" onClick={() => { setSuccess(false); resetDraft(); }}>Programar otro pago</button>
            <button type="button" className="primary-detail-action" onClick={() => navigate("/payments")}>Ver Pagos y dispersiones <ArrowRight size={15} /></button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="receipt-detail-page payment-detail-page">
      <header className="receipt-detail-header">
        <button type="button" className="detail-back-action" onClick={requestExit}><ArrowLeft size={15} /> Pagos y dispersiones</button>
        <div className="detail-header-copy">
          <span className="detail-eyebrow">NUEVA OPERACIÓN</span>
          <h1>Programar pago</h1>
          <p>Programa una salida individual y déjala lista para aprobación y seguimiento.</p>
        </div>
        <div className="detail-trust-note"><ShieldCheck size={16} /><span><strong>Guardado protegido</strong><small>Tu sesión y las reglas de acceso de Supabase protegen esta operación.</small></span></div>
      </header>

      {!isSupabaseConfigured && <div className="payment-config-warning" role="alert"><Info size={16} /><span>Supabase no está configurado en este entorno. Agrega las variables públicas para cargar beneficiarios y guardar pagos.</span></div>}

      <div className="receipt-detail-grid">
        <form className="receipt-detail-form panel" onSubmit={event => { event.preventDefault(); formStep === 1 ? continueToReview() : void submitPayment(); }}>
          <div className="detail-form-topline">
            <div><span className="detail-eyebrow">DATOS DEL PAGO</span><h2>Completa la operación</h2><p>Los campos marcados con <b>*</b> son obligatorios.</p></div>
            <span className="detail-step-count">Paso {formStep} de 2</span>
          </div>

          <div className="detail-stepper" aria-label="Progreso del pago">
            <button type="button" className={formStep === 1 ? "active" : "complete"} onClick={() => setFormStep(1)}><span>{formStep === 1 ? "1" : <Check size={14} />}</span><strong>Datos</strong><small>Información básica</small></button>
            <span className="detail-stepper-line" />
            <button type="button" className={formStep === 2 ? "active" : ""} disabled={formStep === 1} onClick={() => setFormStep(2)}><span>2</span><strong>Revisar y guardar</strong><small>Confirma la información</small></button>
          </div>

          {error && <div className="detail-form-error" role="alert"><Info size={16} /><span>{error}</span><button type="button" aria-label="Cerrar error" onClick={() => setError("")}><X size={14} /></button></div>}

          {formStep === 1 ? (
            <>
              <div className="detail-section-block">
                <div className="detail-section-heading"><span className="detail-section-number">01</span><div><h3>Beneficiario</h3><p>Selecciona el proveedor o persona que recibirá el pago.</p></div></div>
                <div className="payer-detail-field" ref={beneficiaryMenuRef}>
                  <label htmlFor="payment-beneficiary-search">Proveedor / beneficiario <em>*</em></label>
                  <div className={`detail-combobox ${beneficiaryMenuOpen ? "is-open" : ""} ${selectedBeneficiary ? "has-value" : ""}`}>
                    <Search size={16} />
                    <input id="payment-beneficiary-search" value={selectedBeneficiary?.name || beneficiarySearch} onChange={event => { setSelectedBeneficiary(null); setBeneficiarySearch(event.target.value); setBeneficiaryMenuOpen(true); }} onFocus={() => setBeneficiaryMenuOpen(true)} placeholder="Buscar por nombre o identificación" readOnly={Boolean(selectedBeneficiary)} autoComplete="off" />
                    {selectedBeneficiary ? <button type="button" className="detail-clear-field" aria-label="Quitar beneficiario" onClick={() => { setSelectedBeneficiary(null); setBeneficiarySearch(""); setBeneficiaryMenuOpen(true); }}><X size={14} /></button> : <ChevronDown size={15} />}
                  </div>
                  {selectedBeneficiary && <div className="detail-selected-payer"><span className="detail-payer-avatar">{selectedBeneficiary.name.slice(0, 1).toUpperCase()}</span><span><strong>{selectedBeneficiary.name}</strong><small>{selectedBeneficiary.idType} {selectedBeneficiary.identification}{selectedBeneficiary.bank ? ` · ${selectedBeneficiary.bank}` : ""}</small></span><Check size={16} /></div>}
                  {beneficiaryMenuOpen && !selectedBeneficiary && <div className="detail-payer-menu" role="listbox">
                    <div className="detail-payer-menu-header"><span>{beneficiarySearch ? "Coincidencias" : "Beneficiarios disponibles"}</span><small>{beneficiariesQuery.isLoading ? "Cargando…" : `${filteredBeneficiaries.length} disponibles`}</small></div>
                    {beneficiariesQuery.error && <div className="detail-payer-state"><Info size={15} /> No pudimos cargar los beneficiarios. Revisa la conexión.</div>}
                    {!beneficiariesQuery.error && beneficiariesQuery.isLoading && <div className="detail-payer-state"><LoaderCircle size={15} className="spin" /> Cargando beneficiarios…</div>}
                    {!beneficiariesQuery.error && !beneficiariesQuery.isLoading && filteredBeneficiaries.map(item => <button type="button" className="detail-payer-option" key={item.recordId} onClick={() => { setSelectedBeneficiary(item); setBeneficiarySearch(""); setBeneficiaryMenuOpen(false); setError(""); }}><span className="detail-payer-avatar small">{item.name.slice(0, 1).toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.idType} {item.identification}</small></span><ChevronRight size={14} /></button>)}
                    {!beneficiariesQuery.isLoading && !beneficiariesQuery.error && !filteredBeneficiaries.length && <div className="detail-payer-state">No encontramos un beneficiario con ese criterio.</div>}
                    <button type="button" className="detail-new-payer-option" onClick={() => navigate("/counterparties")}><Building2 size={15} /><span><strong>Inscribir beneficiario</strong><small>Agrega un proveedor desde Contrapartes.</small></span><ArrowRight size={14} /></button>
                  </div>}
                  <small className="detail-field-help">Solo aparecen proveedores activos de tu directorio de Contrapartes.</small>
                </div>
              </div>

              <div className="detail-section-block detail-section-two-column">
                <div className="detail-section-heading"><span className="detail-section-number">02</span><div><h3>Cuenta y valor</h3><p>Define desde dónde saldrá el dinero y cuánto vas a pagar.</p></div></div>
                <div className="detail-fields-grid">
                  <div className="detail-field wide-field" ref={accountMenuRef}>
                    <label htmlFor="payment-source-account">Cuenta de salida <em>*</em></label>
                    <button type="button" id="payment-source-account" className={`detail-account-select ${accountMenuOpen ? "is-open" : ""} ${selectedAccount ? "has-value" : ""}`} onClick={() => setAccountMenuOpen(value => !value)} aria-haspopup="listbox" aria-expanded={accountMenuOpen}><WalletCards size={16} /><span>{selectedAccount?.label || (accountReference ? accountReference : accounts.length ? "Selecciona una cuenta" : "Ingresa una referencia de salida")}</span><ChevronDown size={15} /></button>
                    {accountMenuOpen && <div className="detail-account-menu" role="listbox">
                      {accountsQuery.error && <div className="detail-payer-state"><Info size={15} /> No pudimos cargar las cuentas bancarias.</div>}
                      {!accountsQuery.error && accountsQuery.isLoading && <div className="detail-payer-state"><LoaderCircle size={15} className="spin" /> Cargando cuentas…</div>}
                      {!accountsQuery.isLoading && !accountsQuery.error && accounts.map(account => <button type="button" className="detail-payer-option" key={account.id} onClick={() => { setSelectedAccount(account); setAccountReference(""); setAccountMenuOpen(false); setError(""); }}><span className="detail-payer-avatar small"><WalletCards size={14} /></span><span><strong>{account.label}</strong><small>{account.account_holder || "Cuenta de la empresa"}</small></span><ChevronRight size={14} /></button>)}
                      <label className="detail-account-reference"><span>Usar otra referencia</span><input value={accountReference} onChange={event => { setAccountReference(event.target.value); setSelectedAccount(null); }} placeholder="Ej. Cuenta principal" /></label>
                    </div>}
                    {selectedAccount && <div className="detail-selected-payer"><span className="detail-payer-avatar"><WalletCards size={15} /></span><span><strong>{selectedAccount.label}</strong><small>{selectedAccount.account_holder || "Cuenta de la empresa"}</small></span><button type="button" className="detail-clear-field" aria-label="Quitar cuenta" onClick={() => setSelectedAccount(null)}><X size={14} /></button></div>}
                    <small>La cuenta se guarda como referencia de salida en el pago.</small>
                  </div>
                  <label className="detail-field" htmlFor="payment-amount">Valor del pago <em>*</em><div className="detail-money-input"><span>$</span><input id="payment-amount" value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="0" autoComplete="off" /><BrandedSelect value={currency} onChange={setCurrency} aria-label="Moneda" options={[{ value: "COP", label: "COP" }, { value: "USD", label: "USD" }]} /></div><small>Ingresa el valor sin símbolos ni espacios.</small></label>
                  <label className="detail-field" htmlFor="payment-date">Fecha del pago <em>*</em><div className="detail-input-with-icon"><CalendarDays size={16} /><input id="payment-date" type="date" min={todayInputValue()} value={date} onChange={event => setDate(event.target.value)} /></div><small>El pago quedará pendiente de aprobación.</small></label>
                  <label className="detail-field" htmlFor="payment-concept">Concepto <em>*</em><BrandedSelect value={concept} onChange={setConcept} aria-label="Concepto" placeholder="Selecciona un concepto" options={concepts.filter(item => item.value).map(item => ({ value: item.value, label: item.label }))} /><small>Ayuda a clasificar la operación.</small></label>
                  <label className="detail-field detail-description-field" htmlFor="payment-description">Descripción <span className="optional-label">Opcional</span><textarea id="payment-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Agrega una nota o referencia adicional" maxLength={240} /><small>{description.length}/240 caracteres</small></label>
                </div>
              </div>
              <label className="payment-monthly-toggle"><span><strong>Programar mensualmente</strong><small>Se repetirá cada mes con los mismos datos.</small></span><button type="button" className={monthly ? "on" : ""} onClick={() => setMonthly(value => !value)} aria-pressed={monthly}><i /></button></label>
            </>
          ) : (
            <div className="detail-review-step">
              <div className="detail-review-intro"><span className="detail-review-icon"><CheckCircle2 size={20} /></span><div><h3>Revisa antes de guardar</h3><p>Confirma que la información sea correcta. El pago se creará con estado <strong>Pendiente</strong>.</p></div></div>
              <div className="detail-review-list">
                <div><span>Beneficiario</span><strong>{selectedBeneficiary?.name}</strong><small>{selectedBeneficiary?.idType} {selectedBeneficiary?.identification}</small></div>
                <div><span>Cuenta de salida</span><strong>{selectedAccountLabel}</strong><small>Referencia protegida en Supabase</small></div>
                <div><span>Valor del pago</span><strong>{formatAmount(numericAmount, currency)}</strong><small>Moneda: {currency}</small></div>
                <div><span>Concepto</span><strong>{selectedConcept}</strong><small>{description || "Sin descripción adicional"}</small></div>
                <div><span>Fecha programada</span><strong>{formatDate(date)}</strong><small>{monthly ? "Se repetirá mensualmente" : "Pago único"}</small></div>
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
            <div className="detail-summary-accent payment-summary-accent" />
            <div className="detail-aside-heading"><span className="detail-summary-icon payment-summary-icon"><ArrowRight size={17} /></span><div><span className="detail-eyebrow">RESUMEN EN VIVO</span><h2>Tu pago</h2></div></div>
            <div className="detail-summary-payer"><span className="detail-payer-avatar large">{selectedBeneficiary ? selectedBeneficiary.name.slice(0, 1).toUpperCase() : <UserRound size={17} />}</span><div><small>Beneficiario</small><strong>{selectedBeneficiary?.name || "Pendiente de seleccionar"}</strong></div></div>
            <div className="detail-summary-amount"><small>Valor del pago</small><strong>{formatAmount(numericAmount, currency)}</strong></div>
            <dl className="detail-summary-details"><div><dt>Cuenta de salida</dt><dd>{selectedAccountLabel}</dd></div><div><dt>Concepto</dt><dd>{selectedConcept}</dd></div><div><dt>Fecha</dt><dd>{date ? formatDate(date) : "Pendiente"}</dd></div><div><dt>Estado inicial</dt><dd><span className="pending-dot" /> Pendiente</dd></div></dl>
            <div className="detail-summary-note"><Clock3 size={14} /><span>Al guardar, el pago quedará disponible para aprobación y seguimiento.</span></div>
          </div>

          <div className="detail-guide-card panel"><div className="detail-aside-heading"><span className="detail-guide-icon"><FileText size={16} /></span><div><span className="detail-eyebrow">GUÍA RÁPIDA</span><h2>Cómo funciona</h2></div></div><ol><li><span>1</span><div><strong>Relaciona un beneficiario</strong><small>Usa un proveedor activo del directorio.</small></div></li><li><span>2</span><div><strong>Define la operación</strong><small>Cuenta, valor, concepto y fecha.</small></div></li><li><span>3</span><div><strong>Revisa y guarda</strong><small>El pago quedará pendiente.</small></div></li></ol><div className="detail-security-line"><ShieldCheck size={14} /> Los datos se guardan con tu sesión de Supabase.</div></div>

          {(beneficiariesQuery.error || accountsQuery.error) && <div className="detail-data-warning" role="status"><Info size={15} /><span><strong>Datos no disponibles</strong><small>Revisa la conexión con Supabase; también puedes usar una referencia de salida manual.</small></span></div>}
        </aside>
      </div>

      {confirmExit && <div className="detail-modal-backdrop" onMouseDown={() => setConfirmExit(false)}><section className="detail-payer-modal exit-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="payment-exit-title" onMouseDown={event => event.stopPropagation()}><button type="button" className="detail-modal-close" onClick={() => setConfirmExit(false)} aria-label="Cerrar"><X size={17} /></button><span className="detail-modal-icon"><Info size={18} /></span><span className="detail-eyebrow">CAMBIOS SIN GUARDAR</span><h2 id="payment-exit-title">¿Salir de Programar pago?</h2><p>La información que ingresaste se perderá si sales ahora.</p><div className="detail-modal-actions"><button type="button" className="secondary-detail-action" onClick={() => setConfirmExit(false)}>Continuar editando</button><button type="button" className="primary-detail-action" onClick={() => { resetDraft(); navigate("/payments"); }}>Salir sin guardar</button></div></section></div>}
    </section>
  );
}
