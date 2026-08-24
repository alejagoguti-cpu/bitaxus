import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, FilePenLine, LoaderCircle, Save, X } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { UserRole } from "@shared/types";
import { useAuth } from "@/contexts/AuthContext";
import { useEditReceiptSupabase, useReceiptSupabase, type ReceiptUpdateInput } from "@/hooks/useReceiptsSupabase";
import "./RecordDetail.css";

type ReceiptDetailRecord = {
  id: string;
  payer_id?: string | null;
  payer_name?: string | null;
  payer?: string | { name?: string | null } | null;
  concept?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  date?: string | null;
  receipt_date?: string | null;
  status?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  description?: string | null;
  created_at?: string | null;
  created_by_name?: string | null;
};

type ReceiptForm = {
  concept: string;
  amount: string;
  receiptDate: string;
  reference: string;
  notes: string;
  status: string;
};

const emptyForm: ReceiptForm = { concept: "", amount: "", receiptDate: "", reference: "", notes: "", status: "Pendiente" };
const statusOptions = ["Pendiente", "Recibido", "Cancelado"];
const getString = (value: unknown) => typeof value === "string" ? value : "";
const formatAmount = (amount: unknown, currency: string) => new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: currency === "COP" ? 0 : 2 }).format(Number(amount || 0));
const formatDate = (value: string) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) : "Sin fecha";

export function ReceiptDetailPage({ tenantId }: { tenantId?: string }) {
  const { id = "" } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const receiptQuery = useReceiptSupabase(id);
  const editMutation = useEditReceiptSupabase(id, tenantId);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ReceiptForm>(emptyForm);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR;
  const receipt = receiptQuery.data as unknown as ReceiptDetailRecord | undefined;
  const payer = typeof receipt?.payer === "object" && receipt.payer ? getString(receipt.payer.name) : getString(receipt?.payer_name) || getString(receipt?.payer);
  const currency = String(receipt?.currency || "COP").toUpperCase();
  const receiptDate = getString(receipt?.receipt_date) || getString(receipt?.date);
  const initials = useMemo(() => payer.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "CL", [payer]);

  useEffect(() => {
    if (!receipt) return;
    setForm({
      concept: getString(receipt.concept),
      amount: String(receipt.amount ?? ""),
      receiptDate: receiptDate.slice(0, 10),
      reference: getString(receipt.reference_id),
      notes: getString(receipt.notes) || getString(receipt.description),
      status: getString(receipt.status) || "Pendiente",
    });
  }, [receipt?.id, receipt?.concept, receipt?.amount, receiptDate, receipt?.reference_id, receipt?.notes, receipt?.description, receipt?.status]);

  const updateField = <K extends keyof ReceiptForm>(key: K, value: ReceiptForm[K]) => setForm(current => ({ ...current, [key]: value }));
  const save = () => {
    if (!form.concept.trim() || !form.receiptDate || Number(form.amount.replace(/[^0-9]/g, "")) <= 0) {
      setError("Completa concepto, valor y fecha para guardar los cambios.");
      return;
    }
    const input: ReceiptUpdateInput = { concept: form.concept.trim(), amount: Number(form.amount.replace(/[^0-9]/g, "")), receipt_date: form.receiptDate, reference_id: form.reference.trim() || null, description: form.notes.trim() || null, status: form.status };
    setError("");
    editMutation.mutate(input, {
      onSuccess: () => { setEditing(false); setFeedback("El recaudo se actualizó correctamente."); window.setTimeout(() => setFeedback(""), 4200); },
      onError: mutationError => setError(mutationError.message || "No fue posible actualizar el recaudo."),
    });
  };

  if (receiptQuery.isLoading) return <section className="record-detail-page"><button type="button" className="detail-back" onClick={() => navigate("/receipts")}><ArrowLeft size={16} /> Volver a Recaudos</button><div className="detail-loading"><LoaderCircle className="spin" size={22} /> Cargando detalle…</div></section>;
  if (receiptQuery.error || !receipt) return <section className="record-detail-page"><button type="button" className="detail-back" onClick={() => navigate("/receipts")}><ArrowLeft size={16} /> Volver a Recaudos</button><div className="detail-empty"><div><strong>No fue posible cargar este recaudo.</strong><p>Verifica que el registro exista y que tengas permisos para consultarlo.</p></div></div></section>;

  return <section className="record-detail-page">
    <div className="record-detail-toolbar"><button type="button" className="detail-back" onClick={() => navigate("/receipts")}><ArrowLeft size={16} /> Volver a Recaudos</button><div className="record-detail-actions">{canEdit && <button type="button" className="primary-action" onClick={() => { setError(""); setEditing(value => !value); }}>{editing ? <><X size={15} /> Cancelar edición</> : <><FilePenLine size={15} /> Editar recaudo</>}</button>}</div></div>
    <header className="record-detail-header"><div><span className="detail-eyebrow">Detalle de recaudo</span><h1>{payer || "Recaudo sin pagador"}</h1><p>Identificador: {receipt.id}</p></div><span className="detail-status">{receipt.status || "Pendiente"}</span></header>
    {feedback && <div className="detail-alert success" role="status"><Check size={16} /> {feedback}</div>}
    {error && <div className="detail-alert" role="alert"><X size={16} /> {error}</div>}
    <div className="record-detail-grid">
      <article className="detail-card"><div className="detail-hero"><span className="detail-avatar">{initials}</span><div><span className="detail-eyebrow">Valor recibido</span><strong>{formatAmount(receipt.amount, currency)}</strong><small>{receipt.concept || "Sin concepto"}</small></div></div><div className="detail-list"><div className="detail-row"><span>Cliente / pagador</span><strong>{payer || "Sin pagador"}</strong></div><div className="detail-row"><span>Fecha del recaudo</span><strong>{formatDate(receiptDate)}</strong></div><div className="detail-row"><span>Identificación del pagador</span><strong>{getString(receipt.payer_id) || "No disponible"}</strong></div><div className="detail-row"><span>Referencia</span><strong>{getString(receipt.reference_id) || "Sin referencia"}</strong></div></div></article>
      <article className="detail-card"><h2>Información adicional</h2><p>Datos de control y trazabilidad del recaudo.</p><div className="detail-list"><div className="detail-row"><span>Creado el</span><strong>{formatDate(getString(receipt.created_at))}</strong></div><div className="detail-row"><span>Creado por</span><strong>{getString(receipt.created_by_name) || "Usuario autenticado"}</strong></div><div className="detail-row"><span>Moneda</span><strong>{currency}</strong></div><div className="detail-row"><span>Notas</span><strong>{getString(receipt.notes) || getString(receipt.description) || "Sin notas"}</strong></div></div></article>
      {editing && <article className="record-edit-card"><h2>Editar recaudo</h2><p>Actualiza los datos permitidos y guarda los cambios en Supabase.</p><div className="record-form-grid"><label className="record-form-field full">Cliente / pagador<input value={payer} disabled /></label><label className="record-form-field">Valor<input inputMode="numeric" value={form.amount} onChange={event => updateField("amount", event.target.value)} /></label><label className="record-form-field">Estado<select value={form.status} onChange={event => updateField("status", event.target.value)}>{statusOptions.map(option => <option key={option}>{option}</option>)}</select></label><label className="record-form-field">Concepto<input value={form.concept} onChange={event => updateField("concept", event.target.value)} /></label><label className="record-form-field">Fecha del recaudo<input type="date" value={form.receiptDate} onChange={event => updateField("receiptDate", event.target.value)} /></label><label className="record-form-field full">Referencia<input value={form.reference} onChange={event => updateField("reference", event.target.value)} /></label><label className="record-form-field full">Notas<textarea value={form.notes} onChange={event => updateField("notes", event.target.value)} /></label></div><div className="record-form-actions"><button type="button" className="secondary-action" onClick={() => setEditing(false)} disabled={editMutation.isPending}>Cancelar</button><button type="button" className="primary-action" onClick={save} disabled={editMutation.isPending}>{editMutation.isPending ? <><LoaderCircle size={15} className="spin" /> Guardando…</> : <><Save size={15} /> Guardar cambios</>}</button></div></article>}
    </div>
  </section>;
}
