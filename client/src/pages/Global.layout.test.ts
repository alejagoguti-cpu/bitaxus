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

  it("prioriza favoritas y presenta saldo operativo real al seleccionar una moneda", () => {
    expect(source).toContain('FAVORITE_CURRENCIES_KEY');
    expect(source).toContain('window.localStorage.setItem(FAVORITE_CURRENCIES_KEY');
    expect(source).toContain('favoriteCodes.includes(right.code)');
    expect(source).toContain('Saldo disponible · ${money(balances[currency.code], currency.code)}');
    expect(source).toContain('Sin saldo operativo registrado');
    expect(source).toContain('balanceOperationsQuery');
  });

  it("mantiene la moneda activa para el selector sin recargar el panel de acciones", () => {
    expect(source).toContain('const [quickCurrencyCode, setQuickCurrencyCode]');
    expect(source).toContain('isCurrent ? " · Activa" : ""');
    expect(source).not.toContain('quick-global-currency-summary');
    expect(source).not.toContain('quick-currency-options');
    expect(source).not.toContain('Moneda visible antes de operar');
  });

  it("mantiene las acciones rápidas limpias sin repetir saldo o moneda bajo cada acción", () => {
    expect(source).not.toContain('Origen actual: {quickCurrency.code}. Puedes cambiarlo al continuar.');
    expect(source).not.toContain('<b>Recibir</b><small>{quickCurrency.code}');
    expect(source).not.toContain('<b>Dispersar</b><small>{quickCurrency.code}');
    expect(source).toContain('<b>Recibir</b></span><ChevronRight');
    expect(source).toContain('<b>Convertir</b></span><ChevronRight');
    expect(source).toContain('<b>Dispersar</b></span><ChevronRight');
  });

  it("muestra una confirmación visual antes de abrir el formulario de la moneda elegida", () => {
    expect(source).toContain('setSelectedCurrencyCode(currency.code)');
    expect(source).toContain('setTimeout(() => {');
    expect(source).toContain('global-currency-option${isCurrent ? " is-current" : ""}${isSelected ? " is-selected" : ""}');
    expect(source).toContain('Moneda seleccionada. Abriendo formulario…');
    expect(source).toContain('currency-favorite');
  });

  it("conserva las dieciséis opciones dentro de un selector compacto", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    expect(styles).toContain('.global-currency-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))');
    expect(styles).toContain('@media(max-width:560px){.global-currency-list{grid-template-columns:1fr');
  });
});
