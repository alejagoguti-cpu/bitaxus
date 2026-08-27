import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
const counterparties = readFileSync(resolve(process.cwd(), "client/src/pages/CounterpartiesPage.tsx"), "utf8");
const global = readFileSync(resolve(process.cwd(), "client/src/pages/Global.tsx"), "utf8");

describe("Densidad visual de Contrapartes y Bitaxus Global", () => {
  it("comparte medidas compactas para encabezados y filas de tabla", () => {
    expect(css).toContain(".counterparties-table th");
    expect(css).toContain(".global-table th");
    expect(css).toContain("font-size:11px!important");
    expect(css).toContain("height:68px!important");
  });

  it("mantiene filtros en una columna en móvil y tablas desplazables", () => {
    expect(css).toContain(".counterparties-filterbar{grid-template-columns:1fr!important}");
    expect(css).toContain(".global-filters{grid-template-columns:1fr!important}");
    expect(css).toContain(".counterparties-table-wrap");
    expect(css).toContain(".global-table-wrap");
  });

  it("conserva datos reales en ambos módulos", () => {
    expect(counterparties).toContain("useCounterpartiesSupabase");
    expect(global).toContain("useGlobalOperationsSupabase");
    expect(global).not.toContain("mockData");
    expect(global).not.toContain("placeholderData");
  });
});
