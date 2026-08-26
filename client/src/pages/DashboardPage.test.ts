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

  it("muestra el detalle accesible de una operación al seleccionar una fila", () => {
    expect(pageSource).toContain('setSelectedActivity(item)');
    expect(pageSource).toContain('role="dialog"');
    expect(pageSource).toContain("Cerrar detalle");
    expect(pageSource).toContain('event.key === "Escape"');
  });

  it("conserva las acciones operativas del Home", () => {
    expect(pageSource).toContain("Programar recaudo");
    expect(pageSource).toContain("Programar pago");
    expect(pageSource).toContain("Consultar en Global");
  });

  it("permite elegir entre pago individual y dispersión desde la acción de pagos", () => {
    expect(pageSource).toContain("Pago individual o dispersión");
    expect(pageSource).toContain("setPaymentChoiceOpen(true)");
    expect(pageSource).toContain('to="/payments/new"');
    expect(pageSource).toContain('to="/dispersions?new=1"');
  });

  it("funciona sin depender del header global eliminado", () => {
    expect(pageSource).not.toContain("GlobalHeader");
    expect(pageSource).not.toContain("useGlobalHeader");
    expect(pageSource).toContain('useState<DashboardPeriod>("Este mes")');
    expect(pageSource).toContain('tone="coral"');
    expect(hookSource).toContain("const shouldSubscribe = options.subscribe !== false;");
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
