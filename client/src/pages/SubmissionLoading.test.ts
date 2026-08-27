import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), `client/src/pages/${file}`), "utf8");
const receiptSource = read("ProgramarRecaudoPage.tsx");
const paymentSource = read("ProgramarPagoPage.tsx");
const operationsSource = read("PaymentOperationsWorkspace.tsx");
const counterpartySource = read("CounterpartiesPage.tsx");

describe("submission loading feedback", () => {
  it("blocks receipt and payment confirmation while Supabase is saving", () => {
    for (const source of [receiptSource, paymentSource]) {
      expect(source).toContain("disabled={submitting}");
      expect(source).toContain("LoaderCircle");
      expect(source).toContain("Guardando…");
    }
  });

  it("blocks the payment workspace and counterparty creation while pending", () => {
    expect(operationsSource).toContain("disabled={submitting}");
    expect(operationsSource).toContain("Procesando");
    expect(operationsSource).toContain("LoaderCircle");
    expect(counterpartySource).toContain("disabled={createMutation.isPending}");
    expect(counterpartySource).toContain("Guardando…");
  });
});

