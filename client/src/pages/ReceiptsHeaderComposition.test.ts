import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
const page = readFileSync(resolve(process.cwd(), "client/src/pages/Recaudos.tsx"), "utf8");

describe("Composición superior de Recaudos", () => {
  it("mantiene un CTA de programación dentro de las acciones del encabezado", () => {
    expect(page).toContain("receipts-header-actions");
    expect(page).toContain("schedule-top");
    expect(page).not.toContain("floating-add");
  });

  it("apila el encabezado y el CTA en móvil sin desbordar el ancho", () => {
    expect(css).toContain(".receipts-header-actions .schedule-top{width:100%!important");
    expect(css).toContain(".receipts-header>div:first-child{flex-basis:100%}");
    expect(css).toContain("@media (max-width:430px)");
  });

  it("mantiene jerarquía tipográfica compacta y accesible", () => {
    expect(css).toContain(".receipts-header h2{font-size:23px!important}");
    expect(css).toContain(".schedule-top:focus-visible");
    expect(css).toContain("prefers-reduced-motion:reduce");
  });
});
