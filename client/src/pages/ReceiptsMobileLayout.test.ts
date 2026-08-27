import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(process.cwd(), "client/src/pages/Recaudos.tsx"), "utf8");
const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
const modalCss = readFileSync(resolve(process.cwd(), "client/src/pages/ProgramarRecaudoPage.css"), "utf8");

describe("Recaudos mobile layout", () => {
  it("keeps one primary scheduling action in the header", () => {
    expect(page).toContain("schedule-top");
    expect(page).not.toContain("floating-add");
    expect(page).not.toContain("Importar desde archivos");
  });

  it("stacks the header action and filters at narrow widths", () => {
    expect(css).toContain("@media (max-width:760px)");
    expect(css).toContain(".receipts-header-actions .schedule-top{width:100%!important");
    expect(css).toContain(".receipts-filters,.payments-filters,.reports-filters,.reconciliation-filters,.global-filters,.counterparties-filterbar{grid-template-columns:1fr 1fr!important}");
  });

  it("keeps the long form scrollable and motion-safe on mobile", () => {
    expect(css).toContain(".receipt-form-backdrop .receipt-form{width:100%!important");
    expect(css).toContain("max-height:calc(100dvh - 18px)");
    expect(css).toContain(".receipt-form-backdrop .modal-scroll-content{padding:26px 18px 22px!important}");
    expect(modalCss).toContain(".receipt-modal-window { max-height: calc(100vh - 20px);");
    expect(modalCss).toContain("@media (prefers-reduced-motion: reduce)");
  });
});

