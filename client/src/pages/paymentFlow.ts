export type PaymentMode = "Pago individual" | "Dispersión";

export type PaymentDraft = {
  mode: PaymentMode;
  beneficiary: string;
  dispersionName: string;
  amount: string;
  concept: string;
  date: string;
};

export function validatePaymentDraft(draft: PaymentDraft) {
  if (draft.mode === "Pago individual" && !draft.beneficiary.trim()) return "Selecciona un proveedor o beneficiario.";
  if (draft.mode === "Dispersión" && !draft.dispersionName.trim()) return "Ingresa el nombre de la dispersión.";
  if (!Number(draft.amount.replace(/[^0-9]/g, ""))) return "Ingresa un valor válido para la operación.";
  if (!draft.concept.trim()) return "Selecciona el concepto de la operación.";
  if (!draft.date) return "Selecciona la fecha de la operación.";
  return "";
}
