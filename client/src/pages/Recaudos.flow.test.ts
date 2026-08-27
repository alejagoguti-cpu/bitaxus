import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canReviewReceipt } from "./receiptFlow";

const pageSource = readFileSync(resolve(process.cwd(), "client/src/pages/Recaudos.tsx"), "utf8");

describe("Programar recaudo flow", () => {
  const payer = { name: "Cliente", idType: "CC", id: "123", type: "Persona natural" as const };
  it("allows review only with the required operation data", () => {
    expect(canReviewReceipt(payer, "1250000", "Honorarios", "2026-08-23")).toBe(true);
    expect(canReviewReceipt(null, "1250000", "Honorarios", "2026-08-23")).toBe(false);
    expect(canReviewReceipt(payer, "", "Honorarios", "2026-08-23")).toBe(false);
    expect(canReviewReceipt(payer, "1250000", "", "2026-08-23")).toBe(false);
    expect(canReviewReceipt(payer, "1250000", "Honorarios", "")).toBe(false);
  });

  it("mantiene el CTA de Programar recaudo con icono y texto visible", () => {
    expect(pageSource).toContain("Programar recaudo");
    expect(pageSource).toMatch(/Plus|Arrow/);
    expect(pageSource).not.toContain("Importar desde archivos");
  });
});
