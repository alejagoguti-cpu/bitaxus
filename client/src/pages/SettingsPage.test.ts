import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/SettingsPage.tsx"), "utf8");

describe("Panel de Configuración", () => {
  it("retira la Zona de Peligro y conserva un cierre de sesión neutral", () => {
    expect(source).not.toContain("Zona de Peligro");
    expect(source).toContain("Sesión actual");
    expect(source).toContain("Cerrar sesión");
    expect(source).toContain("settings-page-v2");
  });
});

