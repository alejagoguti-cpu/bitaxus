import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/Global.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("Flujo de monedas de Bitaxus Global", () => {
  it("mantiene un catálogo real de monedas con banderas y pares persistentes", () => {
    expect(source).toContain("GLOBAL_CURRENCIES");
    expect(source).toContain("flag:");
    expect(source).toContain("function CurrencyFlag");
    expect(source).toContain('<svg viewBox="0 0 24 16" preserveAspectRatio="xMidYMid slice"');
    expect(styles).toContain(".global-page .currency-flag svg");
    expect(styles).toContain(".global-page .global-inline-currency .currency-flag");
    expect(styles).toContain("border:2px solid #fff");
    expect(styles).toContain("padding:3px");
    expect(styles).toContain(".global-page .currency-flag-inline");
    expect(styles).toContain("@media(max-width:700px){.global-page .global-summary-currency .currency-flag");
    expect(styles).toContain("fuentes emoji del dispositivo");
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

  it("protege el contraste editorial focalizado de la tarjeta operativa", () => {
    expect(styles).toContain(".global-page .global-operation-minimal");
    expect(styles).toContain("background:#282426!important");
    expect(styles).not.toContain("linear-gradient(135deg,#262225 0%,#171416 72%,#3f262b 100%)");
    expect(styles).toContain("#ef5b59!important;color:#fff!important");
  });
});
