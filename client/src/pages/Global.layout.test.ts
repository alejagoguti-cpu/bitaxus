import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/Global.tsx"), "utf8");

describe("composición de Bitaxus Global", () => {
  it("muestra tres tarjetas sin lateral y hace visible el par origen-destino", () => {
    expect(source).toContain('className="balance-card currency-config-card"');
    expect(source).toContain("Par de monedas");
    expect(source).toContain('openCurrencyPicker("Origen")');
    expect(source).toContain('openCurrencyPicker("Destino")');
    expect(source).toContain('sourceCurrency.code} · Origen');
    expect(source).toContain('targetCurrency.code} · Destino');
    expect(source).not.toContain("Acciones rápidas");
    expect(source).not.toContain('className="global-aside"');
    expect(source).not.toContain("Guía rápida");
  });

  it("incluye banderas en las tarjetas y en el selector de cada moneda", () => {
    expect(source).toContain('flag: "🇨🇴"');
    expect(source).toContain('flag: "🇺🇸"');
    expect(source).toContain('sourceCurrency.flag');
    expect(source).toContain('targetCurrency.flag');
    expect(source).toContain('currency.flag}</span>');
  });

  it("consulta una tasa de referencia actual y muestra su fecha de publicación", () => {
    expect(source).toContain('https://api.frankfurter.dev/v2/rate/${sourceCurrency.code}/${targetCurrency.code}');
    expect(source).toContain('Cotización de referencia actual');
    expect(source).toContain('Última tasa publicada');
    expect(source).toContain('setQuoteRefreshKey(value => value + 1)');
    expect(source).toContain('No se pudo consultar la tasa para este par.');
    expect(source).toContain('disabled={quoteStatus === "loading"}');
    expect(source).toContain('aria-busy={quoteStatus === "loading"}');
    expect(source).toContain('Actualizando…');
  });

  it("aplica el par y su tasa de referencia a los flujos de operación", () => {
    expect(source).toContain('open("Recepción", targetCurrency.code)');
    expect(source).toContain('open("Conversión", sourceCurrency.code, targetCurrency.code)');
    expect(source).toContain('open("Dispersión", sourceCurrency.code)');
    expect(source).toContain('referenceQuote?.base === sourceCode');
    expect(source).toContain('event.key === "Escape"');
  });

  it("recoge el importe en la tarjeta y evita repetir un formulario extenso", () => {
    expect(source).toContain('const [operationAmount, setOperationAmount]');
    expect(source).toContain('selectedOperationLabel');
    expect(source).toContain('className="global-operation-amount"');
    expect(source).toContain('value={operationAmount}');
    expect(source).toContain('update("source_amount", operationAmount)');
    expect(source).toContain('global-confirmation-modal');
    expect(source).toContain('Confirma que el valor y las monedas coincidan antes de finalizar.');
  });

  it("permite intercambiar el par y anticipa el resultado convertido antes de confirmar", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    expect(source).toContain('const swapCurrencyPair');
    expect(source).toContain('onClick={swapCurrencyPair}');
    expect(source).toContain('Intercambiar ${sourceCurrency.code} y ${targetCurrency.code}');
    expect(source).toContain('const convertedAmount = useMemo');
    expect(source).toContain('Resultado estimado');
    expect(source).toContain('global-converted-preview');
    expect(source).toContain('global-summary-route');
    expect(source).toContain('Revisa tu operación');
    expect(styles).toContain('@keyframes conversionResultIn');
  });

  it("persiste un par válido, evita pares duplicados y conserva el selector compacto", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    expect(source).toContain('GLOBAL_CURRENCY_PAIR_KEY');
    expect(source).toContain('parsed.source !== parsed.target');
    expect(source).toContain('pickerTarget === "Origen"');
    expect(source).toContain('placeholder="Buscar por nombre o código"');
    expect(styles).toContain(".reference-quote");
    expect(styles).toContain(".currency-pair-controls");
    expect(styles).toContain('.global-currency-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))');
  });
});
