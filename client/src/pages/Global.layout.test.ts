import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/Global.tsx"), "utf8");

describe("composición de Bitaxus Global", () => {
  it("mantiene las acciones en las tarjetas y también el panel lateral solicitado", () => {
    expect(source).toContain('className="balance-actions"');
    expect(source).toContain('open("Recepción", "COP")');
    expect(source).toContain('open("Conversión", "COP")');
    expect(source).toContain('open("Dispersión", "COP")');
    expect(source).toContain("Acciones rápidas");
    expect(source).toContain('className="quick-global panel"');
    expect(source).toContain('startQuickAction("Recepción")');
    expect(source).toContain('startQuickAction("Conversión")');
    expect(source).toContain('startQuickAction("Dispersión")');
    expect(source).toContain('event.key === "Escape"');
  });

  it("permite buscar y elegir más de doce monedas antes de registrar una acción rápida", () => {
    expect(source).toContain("const GLOBAL_CURRENCIES");
    expect(source).toContain("Hay {GLOBAL_CURRENCIES.length} opciones disponibles.");
    expect(source).toContain('placeholder="Buscar por nombre o código"');
    expect(source).toContain("chooseCurrency(currency)");
    expect(source).toContain("global-currency-list");
  });
});
