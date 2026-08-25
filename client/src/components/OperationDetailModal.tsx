import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import "./OperationDetailModal.css";

export type OperationDetailTone = "receipt" | "payment" | "counterparty";

export type OperationDetailField = {
  label: string;
  value: ReactNode;
};

type OperationDetailModalProps = {
  kind: string;
  tone: OperationDetailTone;
  title: string;
  subtitle: string;
  metricLabel: string;
  metricValue: ReactNode;
  fields: OperationDetailField[];
  note?: ReactNode;
  noteLabel?: string;
  onClose: () => void;
};

export default function OperationDetailModal({
  kind,
  tone,
  title,
  subtitle,
  metricLabel,
  metricValue,
  fields,
  note,
  noteLabel = "Descripción",
  onClose,
}: OperationDetailModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="operation-detail-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="operation-detail-modal" role="dialog" aria-modal="true" aria-labelledby="operation-detail-title" onMouseDown={event => event.stopPropagation()}>
        <button type="button" className="operation-detail-close" onClick={onClose} aria-label="Cerrar detalle"><X size={17} /></button>
        <span className={`operation-detail-kind ${tone}`}>{kind}</span>
        <h2 id="operation-detail-title">{title}</h2>
        <p className="operation-detail-subtitle">{subtitle}</p>
        <div className="operation-detail-metric">
          <span>{metricLabel}</span>
          <strong className={tone}>{metricValue}</strong>
        </div>
        <dl className="operation-detail-grid">
          {fields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}
        </dl>
        {note && <div className="operation-detail-note"><span>{noteLabel}</span><p>{note}</p></div>}
        <button type="button" className="operation-detail-done" onClick={onClose}>Cerrar detalle</button>
      </section>
    </div>
  );
}
