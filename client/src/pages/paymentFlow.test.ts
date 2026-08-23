import { describe, expect, it } from "vitest";
import { validatePaymentDraft } from "./paymentFlow";

describe("validación del flujo de pagos", () => {
  const base = { mode: "Pago individual" as const, beneficiary: "Proveedor DEMO", dispersionName: "", amount: "250000", concept: "Pago de factura", date: "2026-08-23" };

  it("requiere beneficiario para un pago individual", () => {
    expect(validatePaymentDraft({ ...base, beneficiary: "" })).toBe("Selecciona un proveedor o beneficiario.");
  });

  it("requiere nombre para una dispersión", () => {
    expect(validatePaymentDraft({ ...base, mode: "Dispersión", beneficiary: "", dispersionName: "" })).toBe("Ingresa el nombre de la dispersión.");
  });

  it("permite continuar cuando el borrador está completo", () => {
    expect(validatePaymentDraft(base)).toBe("");
  });
});
