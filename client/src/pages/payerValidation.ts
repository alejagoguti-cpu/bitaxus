export type PayerDraft = {
  name: string;
  identification: string;
  idType: string;
  email: string;
  phone: string;
};

export type PayerValidation = {
  isValid: boolean;
  name?: string;
  identification?: string;
  email?: string;
  phone?: string;
};

export function validateNewPayer(draft: PayerDraft): PayerValidation {
  const name = draft.name.trim();
  const identification = draft.identification.trim();
  const email = draft.email.trim();
  const phone = draft.phone.trim();
  const numericId = identification.replace(/\D/g, "");
  const compactId = identification.replace(/[^0-9A-Za-z]/g, "");
  const result: Omit<PayerValidation, "isValid"> = {};

  if (name.length < 3) result.name = "Escribe un nombre o razón social de al menos 3 caracteres.";
  if (!identification) result.identification = "Ingresa el número de identificación.";
  else if (draft.idType === "Pasaporte" ? !/^[A-Za-z0-9]{6,20}$/.test(compactId) : numericId.length < 6) result.identification = "Revisa la identificación ingresada.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) result.email = "Ingresa un correo con formato válido.";
  if (phone && !/^\+?[0-9\s()-]{7,18}$/.test(phone)) result.phone = "Ingresa un teléfono válido.";

  return { isValid: Object.keys(result).length === 0, ...result };
}
