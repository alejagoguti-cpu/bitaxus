import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/ProgramarPagoPage.tsx"),
  "utf8"
);
const routerSource = readFileSync(
  resolve(process.cwd(), "client/src/router.tsx"),
  "utf8"
);
const dashboardSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/DashboardPage.tsx"),
  "utf8"
);
const workspaceSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/PaymentOperationsWorkspace.tsx"),
  "utf8"
);

describe("Programar pago detail view", () => {
  it("loads beneficiaries and source accounts from Supabase", () => {
    expect(pageSource).toContain('from("counterparties")');
    expect(pageSource).toContain('from("bank_accounts")');
    expect(pageSource).toContain('queryKey: ["payment-beneficiaries", tenantId]');
    expect(pageSource).toContain('queryKey: ["payment-source-accounts", tenantId]');
    expect(pageSource).toContain('eq("relation", "Proveedor")');
  });

  it("keeps validation, review and authenticated insertion separate", () => {
    expect(pageSource).toContain("function validateDraft()");
    expect(pageSource).toContain("setFormStep(2)");
    expect(pageSource).toContain("formStep === 1 ? continueToReview() : void submitPayment()");
    expect(pageSource).toContain('status: "Pendiente"');
    expect(pageSource).toContain("created_by_open_id: auth.user.id");
    expect(pageSource).toContain("Confirmar y guardar");
  });

  it("is linked from Home and registered as a protected route", () => {
    expect(routerSource).toContain('path: "/payments/new"');
    expect(routerSource).toContain("component: LegacyPaymentNewRedirect");
    expect(routerSource).toContain('return <Redirect to="/payments?new=1" />;');
    expect(dashboardSource).toContain('to="/payments/new"');
    expect(workspaceSource).toContain("onClick={openForm}");
    expect(workspaceSource).not.toContain('onClick={() => scope === "all" ? navigate("/payments/new") : openForm()}');
  });

  it("refreshes payment and dashboard queries after saving", () => {
    expect(pageSource).toContain('queryClient.invalidateQueries({ queryKey: ["public-payment-operations", tenantId] })');
    expect(pageSource).toContain('queryClient.invalidateQueries({ queryKey: ["dashboard-payments"] })');
    expect(pageSource).toContain('queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })');
  });
});
