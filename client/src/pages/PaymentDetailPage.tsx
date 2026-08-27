import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FilePenLine, LoaderCircle, Save, X } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { UserRole } from "@shared/types";
import OperationToast from "@/components/OperationToast";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentSupabase, useUpdatePaymentSupabase, type PaymentUpdateInput } from "@/hooks/usePaymentsSupabase";
import "./RecordDetail.css";

type PaymentDetailRecord = {
  id: string;
  payment_type?: string | null;
  beneficiary?: string | { name?: string | null } | null;
  dispersion_name?: string | null;
  account?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  concept?: string | null;
  description?: string | null;
  payment_date?: string | null;
  scheduled_date?: string | null;
  monthly?: boolean | null;
  status?: string | null;
  created_at?: string | null;
  created_by_name?: string | null;
};

type PaymentForm = {
  beneficiary: string;
  dispersionName: string;
  account: string;
  amount: string;
  concept: string;
  description: string;
  paymentDate: string;
  monthly: boolean;
  status: string;
};

const emptyForm: PaymentForm = {
  beneficiary: "",
  dispersionName: "",
  account: "",
  amount: "",
  concept: "",
  description: "",
  paymentDate: "",
  monthly: false,
  status: "Pendiente",
};

const statusOptions = ["Pendiente", "Programado", "En proceso", "Procesado", "Cancelado", "Fallido"];
const getString = (value: unknown) => typeof value === "string" ? value : "";
const formatAmount = (amount: unknown, currency: string) => new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: currency === "COP" ? 0 : 2 }).format(Number(amount || 0));
const formatDate = (value: string) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) : "Sin fecha";
const toDateInput = (value: string) => value ? value.slice(0, 10) : "";

export function PaymentDetailPage({ tenantId }: { tenantId?: string }) {
  const { id = "" } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const paymentQuery = usePaymentSupabase(id);
  const updateMutation = useUpdatePaymentSupabase(id, tenantId);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PaymentForm>(emptyForm);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR;

  const payment = paymentQuery.data as unknown as PaymentDetailRecord | undefined;
  const currency = String(payment?.currency || "COP").toUpperCase();
  const beneficiary = typeof payment?.beneficiary === "object" && payment.beneficiary ? getString(payment.beneficiary.name) : getString(payment?.beneficiary);
  const displayName = payment?.payment_type === "Dispersión" ? getString(payment.dispersion_name) || "Dispersión sin nombre" : beneficiary || "Pago individual";
  const paymentDate = getString(payment?.payment_date) || getString(payment?.scheduled_date);
  const reference = getString(payment?.account) || "Sin cuenta o referencia de salida";
  const title = payment?.payment_type === "Dispersión" ? "Detalle de dispersión" : "Detalle de pago";
  const initials = useMemo(() => displayName.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "OP", [displayName]);

  useEffect(() => {
    if (!payment) return;
    setForm({
      beneficiary,
      dispersionName: getString(payment.dispersion_name),
      account: getString(payment.account),
      amount: String(payment.amount ?? ""),
      concept: getString(payment.concept),
      description: getString(payment.description),
      paymentDate: toDateInput(paymentDate),
      monthly: Boolean(payment.monthly),
      status: getString(payment.status) || "Pendiente",
    });
  }, [payment?.id, beneficiary, payment?.dispersion_name, payment?.account, payment?.amount, payment?.concept, payment?.description, paymentDate, payment?.monthly, payment?.status]);

  const updateField = <K extends keyof PaymentForm>(key: K, value: PaymentForm[K]) => setForm(current => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.concept.trim() || !form.paymentDate || Number(form.amount.replace(/[^0-9]/g, "")) <= 0) {
      setError("Completa concepto, valor y fecha para guardar los cambios.");
      return;
    }
    const input: PaymentUpdateInput = {
      beneficiary: form.beneficiary.trim() || null,
      dispersion_name: form.dispersionName.trim() || null,
      account: form.account.trim() || null,
      amount: Number(form.amount.replace(/[^0-9]/g, "")),
      concept: form.concept.trim(),
      description: form.description.trim() || null,
      payment_date: form.paymentDate,
      monthly: form.monthly,
      status: form.status,
    };
    setError("");
    updateMutation.mutate(input, {
      onSuccess: () => {
        setEditing(false);
        setFeedback("La operación se actualizó correctamente.");
      },
      onError: mutationError => setError(mutationError.message || "No fue posible actualizar la operación."),
    });
  };

  if (paymentQuery.isLoading) return <section className="record-detail-page"><button type="button" className="detail-back" onClick={() => navigate("/payments")}><ArrowLeft size={16} /> Volver a Pagos y dispersiones</button><div className="detail-loading"><LoaderCircle className="spin" size={22} /> Cargando detalle…</div></section>;
  if (paymentQuery.error || !payment) return <section className="record-detail-page"><button type="button" className="detail-back" onClick={() => navigate("/payments")}><ArrowLeft size={16} /> Volver a Pagos y dispersiones</button><div className="detail-empty"><div><strong>No fue posible cargar esta operación.</strong><p>Verifica que el registro exista y que tengas permisos para consultarlo.</p></div></div></section>;

  return <section className="record-detail-page">
    <div className="record-detail-toolbar"><button type="button" className="detail-back" onClick={() => navigate("/payments")}><ArrowLeft size={16} /> Volver a Pagos y dispersiones</button><div className="record-detail-actions">{canEdit && <button type="button" className="primary-action" onClick={() => { setError(""); setEditing(value => !value); }}>{editing ? <><X size={15} /> Cancelar edición</> : <><FilePenLine size={15} /> Editar operación</>}</button>}</div></div>
    <header className="record-detail-header"><div><span className="detail-eyebrow">{title}</span><h1>{displayName}</h1><p>Identificador: {payment.id}</p></div><span className="detail-status">{payment.status || "Pendiente"}</span></header>
    {feedback && <OperationToast message={feedback} onClose={() => setFeedback("")} />}
    {error && <div className="detail-alert" role="alert"><X size={16} /> {error}</div>}
    <div className="record-detail-grid">
      <article className="detail-card"><div className="detail-hero"><span className="detail-avatar">{initials}</span><div><span className="detail-eyebrow">Resumen de la operación</span><strong>{formatAmount(payment.amount, currency)}</strong><small>{payment.concept || "Sin concepto"} · {payment.payment_type || "Pago individual"}</small></div></div><div className="detail-list"><div className="detail-row"><span>Contraparte / grupo</span><strong>{displayName}</strong></div><div className="detail-row"><span>Fecha programada</span><strong>{formatDate(paymentDate)}</strong></div><div className="detail-row"><span>Cuenta o referencia</span><strong>{reference}</strong></div><div className="detail-row"><span>Periodicidad</span><strong>{payment.monthly ? "Mensual" : "Una sola vez"}</strong></div></div></article>
      <article className="detail-card"><h2>Información adicional</h2><p>Datos de control y trazabilidad de la operación.</p><div className="detail-list"><div className="detail-row"><span>Creado el</span><strong>{formatDate(getString(payment.created_at))}</strong></div><div className="detail-row"><span>Creado por</span><strong>{getString(payment.created_by_name) || "Usuario autenticado"}</strong></div><div className="detail-row"><span>Moneda</span><strong>{currency}</strong></div><div className="detail-row"><span>Descripción</span><strong>{getString(payment.description) || "Sin descripción"}</strong></div></div></article>
      {editing && <article className="record-edit-card"><h2>Editar operación</h2><p>Actualiza los datos permitidos y guarda los cambios en Supabase.</p><div className="record-form-grid">{payment.payment_type === "Dispersión" ? <label className="record-form-field full">Nombre de la dispersión<input value={form.dispersionName} onChange={event => updateField("dispersionName", event.target.value)} /></label> : <label className="record-form-field full">Proveedor o beneficiario<input value={form.beneficiary} onChange={event => updateField("beneficiary", event.target.value)} /></label>}<label className="record-form-field">Valor<input inputMode="numeric" value={form.amount} onChange={event => updateField("amount", event.target.value)} /></label><label className="record-form-field">Estado<select value={form.status} onChange={event => updateField("status", event.target.value)}>{statusOptions.map(option => <option key={option}>{option}</option>)}</select></label><label className="record-form-field">Concepto<input value={form.concept} onChange={event => updateField("concept", event.target.value)} /></label><label className="record-form-field">Fecha de operación<input type="date" value={form.paymentDate} onChange={event => updateField("paymentDate", event.target.value)} /></label><label className="record-form-field full">Cuenta o referencia<input value={form.account} onChange={event => updateField("account", event.target.value)} /></label><label className="record-form-field full">Descripción<textarea value={form.description} onChange={event => updateField("description", event.target.value)} /></label><label className="record-check-field"><input type="checkbox" checked={form.monthly} onChange={event => updateField("monthly", event.target.checked)} /> Programar mensualmente</label></div><div className="record-form-actions"><button type="button" className="secondary-action" onClick={() => setEditing(false)} disabled={updateMutation.isPending}>Cancelar</button><button type="button" className="primary-action" onClick={save} disabled={updateMutation.isPending}>{updateMutation.isPending ? <><LoaderCircle size={15} className="spin" /> Guardando…</> : <><Save size={15} /> Guardar cambios</>}</button></div></article>}
    </div>
  </section>;
}
