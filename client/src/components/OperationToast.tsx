import { CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";
import "./OperationToast.css";

type OperationToastProps = {
  message: string;
  title?: string;
  onClose: () => void;
  duration?: number;
};

export default function OperationToast({ message, title = "Cambios guardados", onClose, duration = 4200 }: OperationToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeout);
  }, [duration, message, onClose]);

  return (
    <div className="operation-toast" role="status" aria-live="polite">
      <span className="operation-toast-icon" aria-hidden="true"><CheckCircle2 size={17} /></span>
      <span className="operation-toast-copy"><strong>{title}</strong><small>{message}</small></span>
      <button type="button" className="operation-toast-close" onClick={onClose} aria-label="Cerrar notificación"><X size={15} /></button>
    </div>
  );
}

