import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/Global.tsx"), "utf8");

describe("Flujo de monedas de Bitaxus Global", () => {
  it("mantiene un catálogo real de monedas con banderas y pares persistentes", () => {
    expect(source).toContain("GLOBAL_CURRENCIES");
    expect(source).toContain("flag:");
    expect(source).toContain("GLOBAL_CURRENCY_PAIR_KEY");
    expect(source).toContain("FAVORITE_CURRENCY_PAIRS_KEY");
    expect(source).toContain("localStorage.setItem(GLOBAL_CURRENCY_PAIR_KEY");
  });

  it("consulta la cotización de referencia y calcula la tendencia histórica", () => {
    expect(source).toContain("https://api.frankfurter.dev/v2/rate/");
    expect(source).toContain("quote.rate > historicalQuote.rate");
    expect(source).toContain("quoteTrend");
    expect(source).toContain("Actualizar cotización de referencia");
  });

  it("formatea importes, intercambia monedas y bloquea operaciones sin cotización válida", () => {
    expect(source).toContain("formatAmount");
    expect(source).toContain("swapCurrencyPair");
    expect(source).toContain("quoteIsCurrent");
    expect(source).toContain("Espera la cotización de referencia");
  });

  it("mantiene Dispersar como intención explícita y no como CTA heredado", () => {
    expect(source).toContain('operationIntent === "Dispersión"');
    expect(source).toContain(">Dispersar</button>");
    expect(source).not.toContain("Usar en un pago");
  });
});
