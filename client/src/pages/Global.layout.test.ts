import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/Global.tsx"), "utf8");

describe("composición de Bitaxus Global", () => {
  it("mantiene las acciones en las tarjetas y también el panel lateral solicitado", () => {
    expect(source).toContain('className="balance-actions"');
    expect(source).toContain('open("Recepción")');
    expect(source).toContain('open("Conversión")');
    expect(source).toContain('open("Dispersión")');
    expect(source).toContain("Acciones rápidas");
    expect(source).toContain('className="quick-global panel"');
    expect(source).toContain("Registra una recepción de recursos.");
    expect(source).toContain("Registra una conversión entre monedas.");
    expect(source).toContain("Registra fondos enviados a una contraparte.");
  });
});
