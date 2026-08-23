import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/DashboardPage.tsx"),
  "utf8"
);
const hookSource = readFileSync(
  resolve(process.cwd(), "client/src/hooks/useDashboardSupabase.ts"),
  "utf8"
);

describe("public dashboard data contract", () => {
  it("uses the real receipt and payment summaries", () => {
    expect(pageSource).toContain("useDashboardWidgets(tenantId)");
    expect(pageSource).toContain("Recaudos menos pagos");
    expect(hookSource).toContain('from("receipts")');
    expect(hookSource).toContain('from("payments")');
    expect(hookSource).not.toContain('eq("tenant_id"');
    expect(hookSource).not.toContain('from("dispersions")');
    expect(hookSource).not.toContain('from("activity_logs")');
  });

  it("renders a clear empty state instead of crashing when there are no rows", () => {
    expect(pageSource).toContain("Aún no hay movimientos registrados.");
    expect(pageSource).toContain("No pudimos cargar los movimientos.");
  });
});
