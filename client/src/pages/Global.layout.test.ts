import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/Global.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("experiencia unificada de Bitaxus Global", () => {
  it("reúne la operación en una sola superficie sin paneles laterales", () => {
    expect(source).toContain('className="global-operation-shell global-operation-minimal"');
    expect(source).toContain("Nueva operación");
    expect(source).toContain('className="minimal-operation-body"');
    expect(source).not.toContain('className="balance-card currency-config-card"');
    expect(source).not.toContain("Acciones rápidas");
    expect(source).not.toContain('className="global-aside"');
    expect(source).not.toContain("Guía rápida");
  });

  it("mantiene banderas, selectores integrados de origen-destino e intercambio accesible", () => {
    expect(source).toContain('flag: "🇨🇴"');
    expect(source).toContain('flag: "🇺🇸"');
    expect(source).toContain("function CurrencyFlag");
    expect(source).toContain("<CurrencyFlag currency={currency}");
    expect(source).toContain('<svg viewBox="0 0 24 16"');
    expect(source).toContain('className="global-inline-currency"');
    expect(source).toContain('<BrandedSelect className="global-currency-select" value={sourceCurrency.code}');
    expect(source).toContain('<BrandedSelect className="global-currency-select" value={targetCurrency.code}');
    expect(source).toContain('onChange={chooseSourceCurrency}');
    expect(source).toContain('onChange={chooseTargetCurrency}');
    expect(source).toContain('const swapCurrencyPair');
    expect(source).toContain('onClick={swapCurrencyPair}');
    expect(source).toContain('Intercambiar ${sourceCurrency.code} y ${targetCurrency.code}');
    expect(source).not.toContain('global-currency-backdrop');
  });

  it("consulta una tasa verificable y hace evidente el estado de actualización", () => {
    expect(source).toContain('https://api.frankfurter.dev/v2/rate/${sourceCurrency.code}/${targetCurrency.code}');
    expect(source).toContain('className={`minimal-quote ${quoteStatus}`}');
    expect(source).toContain('setQuoteRefreshKey(value => value + 1)');
    expect(source).toContain('No se pudo consultar la tasa');
    expect(source).toContain('aria-busy={quoteStatus === "loading"}');
    expect(source).toContain('<LoaderCircle size={13} className="spin" />');
    expect(source).toContain('?date=${previousDate.toISOString().slice(0, 10)}');
    expect(source).toContain('const [quoteTrend, setQuoteTrend]');
    expect(source).toContain('className={`quote-trend ${quoteTrend}`}');
  });

  it("permite calcular la conversión y confirmar con una ruta visual clara", () => {
    expect(source).toContain('const [operationAmount, setOperationAmount]');
    expect(source).toContain('const formatAmount');
    expect(source).toContain('setOperationAmount(formatAmount(event.target.value))');
    expect(source).toContain('const convertedAmount = useMemo');
    expect(source).toContain("Recibirás");
    expect(source).toContain('className="global-operation-amount"');
    expect(source).toContain('update("source_amount", String(numericAmount))');
    expect(source).toContain('global-confirmation-modal');
    expect(source).toContain('global-summary-route');
    expect(source).toContain('Revisa tu operación');
    expect(styles).toContain('@keyframes conversionResultIn');
  });

  it("persiste pares válidos y permite guardarlos desde la pantalla principal", () => {
    expect(source).toContain('GLOBAL_CURRENCY_PAIR_KEY');
    expect(source).toContain('FAVORITE_CURRENCY_PAIRS_KEY');
    expect(source).toContain('parsed.source !== parsed.target');
    expect(source).toContain('const toggleCurrentPairFavorite');
    expect(source).toContain('className="global-pair-favorites"');
    expect(source).toContain('Guardar par');
    expect(styles).toContain(".global-operation-minimal");
    expect(styles).toContain(".minimal-pair-row");
    expect(styles).toContain(".global-page .global-currency-select");
    expect(styles).toContain(".global-pair-favorites");
  });
});
