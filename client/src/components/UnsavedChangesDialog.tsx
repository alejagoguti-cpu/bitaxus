/* Bitaxus unsaved changes dialog: calm, explicit confirmation before discarding form data. */
import { AlertTriangle, X } from "lucide-react";

type UnsavedChangesDialogProps = {
  open: boolean;
  onContinue: () => void;
  onDiscard: () => void;
};

export default function UnsavedChangesDialog({ open, onContinue, onDiscard }: UnsavedChangesDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop unsaved-changes-backdrop" role="presentation" onClick={onContinue}>
      <div className="unsaved-changes-dialog" role="alertdialog" aria-modal="true" aria-labelledby="unsaved-changes-title" aria-describedby="unsaved-changes-description" onClick={event => event.stopPropagation()}>
        <button type="button" className="unsaved-changes-close" aria-label="Seguir editando" onClick={onContinue}><X size={17} /></button>
        <div className="unsaved-changes-icon"><AlertTriangle size={19} /></div>
        <h2 id="unsaved-changes-title">¿Descartar cambios?</h2>
        <p id="unsaved-changes-description">Tienes información sin guardar. Si cierras este formulario, perderás los cambios realizados.</p>
        <div className="unsaved-changes-actions">
          <button type="button" className="secondary-action" onClick={onContinue}>Seguir editando</button>
          <button type="button" className="primary-action discard-action" onClick={onDiscard}>Descartar cambios</button>
        </div>
      </div>
    </div>
  );
}
