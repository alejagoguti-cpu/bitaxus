import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/DispersionsPage.tsx"), "utf8");

describe("Acceso directo a Dispersión", () => {
  it("abre el formulario cuando Inicio envía el parámetro new", () => {
    expect(source).toContain("window.location.search");
    expect(source).toContain('get("new") === "1"');
    expect(source).toContain('scope="Dispersión" autoOpen={autoOpen}');
  });
});
