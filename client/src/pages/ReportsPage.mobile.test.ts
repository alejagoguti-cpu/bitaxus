import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(resolve(process.cwd(), "client/src/pages/ReportsPage.tsx"), "utf8");
const styleSource = readFileSync(resolve(process.cwd(), "client/src/pages/ReportsInteractiveCharts.css"), "utf8");

describe("Modal móvil de Reportes", () => {
  it("neutraliza el contenedor animado y limita el diálogo al viewport visible", () => {
    expect(pageSource).toContain("reports-page--modal-open");
    expect(styleSource).toContain(".reports-page--modal-open");
    expect(styleSource).toContain("transform: none !important");
    expect(styleSource).toContain("max-height: calc(100dvh - 28px)");
    expect(pageSource).toContain('event.key === "Escape"');
  });

  it("integra la lista de filtros al panel sin crear un hueco antes de los KPI", () => {
    expect(styleSource).toContain("position: static");
    expect(styleSource).toContain("max-height: 144px");
    expect(styleSource).not.toContain("margin-bottom: 138px");
  });
});
