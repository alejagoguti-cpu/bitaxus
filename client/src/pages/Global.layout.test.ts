import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/Global.tsx"), "utf8");

describe("composición de Bitaxus Global", () => {
  it("muestra tres tarjetas sin paneles laterales y distingue origen de destino", () => {
    expect(source).toContain('className="balance-card currency-config-card"');
    expect(source).toContain("Configura las monedas");
    expect(source).toContain('Moneda de origen');
    expect(source).toContain('Moneda de destino');
    expect(source).toContain('openCurrencyPicker("Origen")');
    expect(source).toContain('openCurrencyPicker("Destino")');
    expect(source).toContain('sourceCurrency.code} · Moneda de origen');
    expect(source).toContain('targetCurrency.code} · Moneda de destino');
    expect(source).not.toContain("Acciones rápidas");
    expect(source).not.toContain('className="global-aside"');
    expect(source).not.toContain("Guía rápida");
  });

  it("envía las monedas elegidas a cada flujo operativo", () => {
    expect(source).toContain('open("Recepción", targetCurrency.code)');
    expect(source).toContain('open("Conversión", sourceCurrency.code, targetCurrency.code)');
    expect(source).toContain('open("Dispersión", sourceCurrency.code)');
    expect(source).toContain('event.key === "Escape"');
  });

  it("persiste el par de monedas válido y evita pares duplicados", () => {
    expect(source).toContain('GLOBAL_CURRENCY_PAIR_KEY');
    expect(source).toContain('getSavedCurrencyPair');
    expect(source).toContain('parsed.source !== parsed.target');
    expect(source).toContain('window.localStorage.setItem(GLOBAL_CURRENCY_PAIR_KEY');
    expect(source).toContain('pickerTarget === "Origen"');
  });

  it("permite buscar y elegir las dieciséis monedas con favoritos y saldo operativo real", () => {
    expect(source).toContain("const GLOBAL_CURRENCIES");
    expect(source).toContain("Hay {GLOBAL_CURRENCIES.length} opciones disponibles.");
    expect(source).toContain('placeholder="Buscar por nombre o código"');
    expect(source).toContain("chooseCurrency(currency)");
    expect(source).toContain('Saldo disponible · ${money(balances[currency.code], currency.code)}');
    expect(source).toContain('Sin saldo operativo registrado');
    expect(source).toContain('currency-favorite');
  });

  it("mantiene el selector compacto y responsive", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    expect(styles).toContain(".currency-pair-controls");
    expect(styles).toContain('.global-currency-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))');
    expect(styles).toContain('@media(max-width:560px){.global-currency-list{grid-template-columns:1fr');
  });
});
