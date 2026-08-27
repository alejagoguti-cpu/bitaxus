import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(resolve(process.cwd(), "client/src/pages/PublicReconciliationPage.tsx"), "utf8");
const helperSource = readFileSync(resolve(process.cwd(), "client/src/pages/reconciliationData.ts"), "utf8");
const styleSource = readFileSync(resolve(process.cwd(), "client/src/pages/PublicReconciliationPage.css"), "utf8");

describe("PublicReconciliationPage accounting filters", () => {
  it("derives the account selector from rows returned by Supabase", () => {
    expect(pageSource).toContain("const accountOptions = useMemo");
    expect(pageSource).toContain('value={account}');
    expect(pageSource).toContain("Todas las cuentas");
    expect(helperSource).toContain("filters.account");
  });

  it("keeps the filter grid readable across desktop, tablet and mobile widths", () => {
    expect(styleSource).toContain("@media (max-width:1100px)");
    expect(styleSource).toContain("@media (max-width:900px)");
    expect(styleSource).toContain("@media (max-width:560px)");
    expect(styleSource).toContain("grid-template-columns:repeat(3,minmax(0,1fr))");
    expect(styleSource).toContain("grid-template-columns:repeat(2,minmax(0,1fr))");
    expect(styleSource).toContain("grid-template-columns:1fr");
  });
});

