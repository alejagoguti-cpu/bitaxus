import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/Global.tsx"), "utf8");

describe("composición de Bitaxus Global", () => {
  it("mantiene las acciones operativas dentro de las tarjetas de saldo sin un panel lateral invasivo", () => {
    expect(source).toContain('className="balance-actions"');
    expect(source).toContain('open("Recepción")');
    expect(source).toContain('open("Conversión")');
    expect(source).toContain('open("Dispersión")');
    expect(source).not.toContain("Acciones rápidas");
    expect(source).not.toContain('className="quick-global panel"');
  });
});
