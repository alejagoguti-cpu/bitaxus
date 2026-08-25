import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/OperationDetailModal.tsx"), "utf8");

describe("OperationDetailModal", () => {
  it("mantiene la estructura accesible y los cierres de la referencia de Inicio", () => {
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("metricLabel");
    expect(source).toContain("Cerrar detalle");
  });
});
