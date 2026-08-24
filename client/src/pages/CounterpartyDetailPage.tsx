import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, FilePenLine, LoaderCircle, Save, UserRound, X } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { UserRole } from "@shared/types";
import { useAuth } from "@/contexts/AuthContext";
import { useCounterpartySupabase, useUpdateCounterpartySupabase, type CounterpartyUpdateInput, type PublicCounterparty } from "@/hooks/useCounterpartiesSupabase";
import "./RecordDetail.css";

type CounterpartyForm = {
  name: string;
  id_type: string;
  identification_number: string;
  relation: "Cliente" | "Proveedor";
  phone: string;
  email: string;
  bank: string;
  account_type: string;
  account_number: string;
  status: "Activa" | "Inactiva";
};

const emptyForm: CounterpartyForm = { name: "", id_type: "NIT", identification_number: "", relation: "Proveedor", phone: "", email: "", bank: "", account_type: "", account_number: "", status: "Activa" };
const banks = ["Bancolombia", "Davivienda", "Banco de Bogotá", "BBVA", "Otra entidad"];
const getString = (value: unknown) => typeof value === "string" ? value : "";
const formatDate = (value: string) => value ? new Date(value).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) : "Sin fecha";
const initials = (name: string) => name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "CP";

export function CounterpartyDetailPage({ tenantId }: { tenantId?: string }) {
  const { id = "" } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const counterpartyQuery = useCounterpartySupabase(id);
  const updateMutation = useUpdateCounterpartySupabase(id, tenantId);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CounterpartyForm>(emptyForm);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR;
  const counterparty = counterpartyQuery.data;
  const initialsValue = useMemo(() => initials(counterparty?.name || ""), [counterparty?.name]);

  useEffect(() => {
    if (!counterparty) return;
    setForm({
      name: counterparty.name || "",
      id_type: counterparty.id_type || "NIT",
      identification_number: counterparty.identification_number || "",
      relation: counterparty.relation || "Proveedor",
      phone: counterparty.phone || "",
      email: counterparty.email || "",
      bank: counterparty.bank || "",
      account_type: counterparty.account_type || "",
      account_number: counterparty.account_number || "",
      status: counterparty.status || "Activa",
    });
  }, [counterparty?.id, counterparty?.name, counterparty?.id_type, counterparty?.identification_number, counterparty?.relation, counterparty?.phone, counterparty?.email, counterparty?.bank, counterparty?.account_type, counterparty?.account_number, counterparty?.status]);

  const updateField = <K extends keyof CounterpartyForm>(key: K, value: CounterpartyForm[K]) => setForm(current => ({ ...current, [key]: value }));
  const save = () => {
    if (!form.name.trim() || !form.identification_number.trim()) {
      setError("Completa el nombre o razón social y la identificación.");
      return;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Revisa el formato del correo electrónico.");
      return;
    }
    const input: CounterpartyUpdateInput = { ...form, name: form.name.trim(), identification_number: form.identification_number.trim(), phone: form.phone.trim(), email: form.email.trim(), bank: form.bank.trim(), account_type: form.account_type.trim(), account_number: form.account_number.trim() };
    setError("");
    updateMutation.mutate(input, {
      onSuccess: () => { setEditing(false); setFeedback("La contraparte se actualizó correctamente."); window.setTimeout(() => setFeedback(""), 4200); },
      onError: mutationError => setError(mutationError.message || "No fue posible actualizar la contraparte."),
    });
  };

  if (counterpartyQuery.isLoading) return <section className="record-detail-page"><button type="button" className="detail-back" onClick={() => navigate("/counterparties")}><ArrowLeft size={16} /> Volver a Contrapartes</button><div className="detail-loading"><LoaderCircle className="spin" size={22} /> Cargando detalle…</div></section>;
  if (counterpartyQuery.error || !counterparty) return <section className="record-detail-page"><button type="button" className="detail-back" onClick={() => navigate("/counterparties")}><ArrowLeft size={16} /> Volver a Contrapartes</button><div className="detail-empty"><div><strong>No fue posible cargar esta contraparte.</strong><p>Verifica que el registro exista y que tengas permisos para consultarlo.</p></div></div></section>;

  return <section className="record-detail-page">
    <div className="record-detail-toolbar"><button type="button" className="detail-back" onClick={() => navigate("/counterparties")}><ArrowLeft size={16} /> Volver a Contrapartes</button><div className="record-detail-actions">{canEdit && <button type="button" className="primary-action" onClick={() => { setError(""); setEditing(value => !value); }}>{editing ? <><X size={15} /> Cancelar edición</> : <><FilePenLine size={15} /> Editar contraparte</>}</button>}</div></div>
    <header className="record-detail-header"><div><span className="detail-eyebrow">Detalle de contraparte</span><h1>{counterparty.name}</h1><p>Identificador: {counterparty.id}</p></div><span className="detail-status">{counterparty.status}</span></header>
    {feedback && <div className="detail-alert success" role="status"><Check size={16} /> {feedback}</div>}
    {error && <div className="detail-alert" role="alert"><X size={16} /> {error}</div>}
    <div className="record-detail-grid">
      <article className="detail-card"><div className="detail-hero"><span className="detail-avatar"><UserRound size={20} /></span><div><span className="detail-eyebrow">{counterparty.relation}</span><strong>{counterparty.name}</strong><small>{counterparty.id_type} {counterparty.identification_number}</small></div></div><div className="detail-list"><div className="detail-row"><span>Relación</span><strong>{counterparty.relation}</strong></div><div className="detail-row"><span>Teléfono</span><strong>{counterparty.phone || "Sin teléfono registrado"}</strong></div><div className="detail-row"><span>Correo electrónico</span><strong>{counterparty.email || "Sin correo registrado"}</strong></div><div className="detail-row"><span>Cuenta bancaria</span><strong>{counterparty.account_number ? `${counterparty.bank || "Banco"} · ${counterparty.account_type || "Cuenta"} · ••••${counterparty.account_number.slice(-4)}` : "Sin cuenta registrada"}</strong></div></div></article>
      <article className="detail-card"><h2>Información de control</h2><p>Estado y fechas registradas para esta contraparte.</p><div className="detail-list"><div className="detail-row"><span>Estado</span><strong>{counterparty.status}</strong></div><div className="detail-row"><span>Creada el</span><strong>{formatDate(counterparty.created_at)}</strong></div><div className="detail-row"><span>Última actualización</span><strong>{formatDate(counterparty.updated_at)}</strong></div><div className="detail-row"><span>ID completo</span><strong>{counterparty.id}</strong></div></div></article>
      {editing && <article className="record-edit-card"><h2>Editar contraparte</h2><p>Actualiza la información del cliente o proveedor y guarda los cambios en Supabase.</p><div className="record-form-grid"><label className="record-form-field full">Nombre completo o razón social<input value={form.name} onChange={event => updateField("name", event.target.value)} /></label><label className="record-form-field">Tipo de identificación<select value={form.id_type} onChange={event => updateField("id_type", event.target.value)}><option>CC</option><option>NIT</option><option>CE</option><option>Pasaporte</option></select></label><label className="record-form-field">Número de identificación<input value={form.identification_number} onChange={event => updateField("identification_number", event.target.value)} /></label><label className="record-form-field">Relación<select value={form.relation} onChange={event => updateField("relation", event.target.value as CounterpartyForm["relation"])}><option>Cliente</option><option>Proveedor</option></select></label><label className="record-form-field">Estado<select value={form.status} onChange={event => updateField("status", event.target.value as CounterpartyForm["status"])}><option>Activa</option><option>Inactiva</option></select></label><label className="record-form-field">Teléfono<input value={form.phone} onChange={event => updateField("phone", event.target.value)} /></label><label className="record-form-field">Correo electrónico<input type="email" value={form.email} onChange={event => updateField("email", event.target.value)} /></label><label className="record-form-field">Banco<select value={form.bank} onChange={event => updateField("bank", event.target.value)}><option value="">Selecciona</option>{banks.map(bank => <option key={bank}>{bank}</option>)}</select></label><label className="record-form-field">Tipo de cuenta<select value={form.account_type} onChange={event => updateField("account_type", event.target.value)}><option value="">Selecciona</option><option>Ahorros</option><option>Corriente</option></select></label><label className="record-form-field full">Número de cuenta<input value={form.account_number} onChange={event => updateField("account_number", event.target.value)} /></label></div><div className="record-form-actions"><button type="button" className="secondary-action" onClick={() => setEditing(false)} disabled={updateMutation.isPending}>Cancelar</button><button type="button" className="primary-action" onClick={save} disabled={updateMutation.isPending}>{updateMutation.isPending ? <><LoaderCircle size={15} className="spin" /> Guardando…</> : <><Save size={15} /> Guardar cambios</>}</button></div></article>}
    </div>
  </section>;
}
