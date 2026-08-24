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
const headerSource = readFileSync(
  resolve(process.cwd(), "client/src/components/layouts/GlobalHeader.tsx"),
  "utf8"
);

describe("public dashboard data contract", () => {
  it("uses the real receipt and payment summaries", () => {
    expect(pageSource).toContain("useDashboardWidgets(tenantId, period)");
    expect(pageSource).toContain("Recaudos menos pagos");
    expect(hookSource).toContain('from("receipts")');
    expect(hookSource).toContain('from("payments")');
    expect(hookSource).not.toContain('eq("tenant_id"');
    expect(hookSource).not.toContain('from("dispersions")');
    expect(hookSource).not.toContain('from("activity_logs")');
    expect(hookSource).toContain('queryKey: ["dashboard-receipts", tenantId, period]');
    expect(hookSource).toContain('queryKey: ["dashboard-payments", tenantId, period]');
  });

  it("filters dashboard rows by operation date and counts scheduled payments", () => {
    expect(hookSource).toContain('.gte("receipt_date", periodStart.slice(0, 10))');
    expect(hookSource).toContain('.gte("payment_date", periodStart.slice(0, 10))');
    expect(hookSource).toContain("const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3;");
    expect(pageSource).toContain('["Pendiente", "Programado", "En proceso"]');
  });

  it("renders a clear empty state instead of crashing when there are no rows", () => {
    expect(pageSource).toContain("Aún no hay movimientos registrados.");
    expect(pageSource).toContain("No pudimos cargar los movimientos desde Supabase.");
  });

  it("keeps the compact operational entry points and a user-aware greeting", () => {
    expect(headerSource).toContain('Hola, {user?.name || "tu cuenta"}');
    expect(pageSource).toContain("Programar recaudo");
    expect(pageSource).toContain("Programar pago");
  });

  it("makes the header controls interactive and uses the reference iconography", () => {
    expect(headerSource).toContain("icon={Building2}");
    expect(headerSource).toContain("notificationsOpen");
    expect(headerSource).toContain("helpOpen");
    expect(headerSource).toContain("Revisar operaciones");
    expect(headerSource).toContain("Ir a Reportes");
    expect(headerSource).toContain("void logout()");
  });

  it("keeps dashboard queries fresh after payment and receipt mutations", () => {
    const paymentsSource = readFileSync(
      resolve(process.cwd(), "client/src/pages/PaymentOperationsWorkspace.tsx"),
      "utf8"
    );
    const receiptsSource = readFileSync(
      resolve(process.cwd(), "client/src/pages/ProgramarRecaudoPage.tsx"),
      "utf8"
    );
    expect(paymentsSource).toContain('queryClient.invalidateQueries({ queryKey: ["dashboard-payments"] })');
    expect(paymentsSource).toContain('queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })');
    expect(receiptsSource).toContain('queryClient.invalidateQueries({ queryKey: ["dashboard-receipts"] })');
    expect(receiptsSource).toContain('queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })');
  });
});
