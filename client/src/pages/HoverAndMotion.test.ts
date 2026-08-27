import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("Microinteracciones operativas", () => {
  it("mantiene transiciones cortas y acentos coral en controles interactivos", () => {
    expect(css).toContain(":hover");
    expect(css).toContain(":focus-visible");
    expect(css).toMatch(/transition:[^;]*(\.16s|\.18s|\.2s)/);
    expect(css).toMatch(/#(?:ef5b59|d95f61|e56a6a)/i);
  });

  it("incluye soporte reduced motion para superficies animadas", () => {
    expect(css).toContain("prefers-reduced-motion:reduce");
    expect(css).toMatch(/animation:none!important/);
    expect(css).toMatch(/transition:none!important/);
  });

  it("no reintroduce el azul nativo en los selectores controlados", () => {
    expect(css).toContain("accent-color:#ef5b59");
    expect(css).not.toMatch(/#(?:2563eb|3b82f6|007bff)/i);
  });

  it("mantiene microinteracciones dentro de los breakpoints desktop y móvil", () => {
    expect(css).toContain("@media(max-width:700px)");
    expect(css).toContain("@media(max-width:560px)");
    expect(css).toContain("@media(prefers-reduced-motion:reduce)");
    expect(css).toMatch(/:hover[^}]*background:[^;]+/);
    expect(css).toMatch(/:active[^}]*transform:scale\(\.97\)/);
  });
});
