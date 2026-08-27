import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), `client/src/pages/${file}`), "utf8");
const receiptSource = read("ProgramarRecaudoPage.tsx");
const counterpartySource = read("CounterpartiesPage.tsx");
const operationsSource = read("PaymentOperationsWorkspace.tsx");
const globalSource = read("Global.tsx");

describe("seguridad y consistencia de modales operativos", () => {
  it("mantiene Dispersar como CTA explícito sin tooltip redundante heredado", () => {
    expect(globalSource).toContain(">Dispersar</button>");
    expect(globalSource).not.toContain("Usar en un pago");
    expect(operationsSource).not.toContain("title=\"Dispersar\"");
  });

  it("protege el cierre por Escape y los cambios sin guardar en Recaudos, Pago, Dispersión y Contrapartes", () => {
    for (const source of [receiptSource, operationsSource, counterpartySource]) {
      expect(source).toMatch(/event\.key\s*[!=]==\s*["']Escape["']/);
      expect(source).toContain("modal-backdrop");
      expect(source).toMatch(/aria-label="Cerrar[^\"]*"/);
    }
    expect(receiptSource).toContain("setConfirmExit(true)");
    expect(operationsSource).toContain("setConfirmDiscard(true)");
    expect(counterpartySource).toContain("setConfirmDiscard(true)");
  });

  it("conserva el patrón responsive compartido de los cuatro flujos", () => {
    expect(receiptSource).toContain("detail-modal-backdrop");
    expect(operationsSource).toContain("shared-operation-modal");
    expect(counterpartySource).toContain("shared-operation-modal");
    expect(operationsSource).toContain("payment-form-backdrop");
  });
});
