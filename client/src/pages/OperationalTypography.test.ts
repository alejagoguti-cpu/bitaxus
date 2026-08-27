import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("operational typography", () => {
  it("shares the same desktop heading and body scale across Pagos and Contrapartes", () => {
    expect(css).toContain(".payments-page h2");
    expect(css).toContain(".counterparties-page h2");
    expect(css).toContain(".payments-page h3");
    expect(css).toContain(".counterparties-page h3");
    expect(css).toContain(".payments-page p");
    expect(css).toContain(".counterparties-page p");
    expect(css).toContain("font-size: 22px !important");
    expect(css).toContain("font-size: 16px !important");
    expect(css).toContain("font-size: 13px");
  });

  it("keeps the mobile scale intentionally smaller at the same breakpoint", () => {
    expect(css).toContain(".payments-page h2, .counterparties-page h2");
    expect(css).toContain("font-size: 20px !important");
    expect(css).toContain("font-size: 15px !important");
  });

  it("keeps table headings emphasized without changing their compact sizes", () => {
    expect(css).toContain(".counterparties-table th");
    expect(css).toContain(".payments-table th");
    expect(css).toContain(".payments-table th,.counterparties-table th,.global-table th,.reports-table th,.reconciliation-table th{height:54px!important;padding:0 16px!important;font-size:11px!important;font-weight:800!important");
  });
});

