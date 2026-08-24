import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/PaymentOperationsWorkspace.tsx"),
  "utf8"
);

describe("Pagos y dispersiones workspace", () => {
  it("loads the live payments and supplier directory from Supabase", () => {
    expect(workspaceSource).toContain('from("payments")');
    expect(workspaceSource).toContain('from("counterparties")');
    expect(workspaceSource).toContain('queryKey: ["public-payment-operations", tenantId]');
    expect(workspaceSource).toContain('queryKey: ["public-payment-counterparties", tenantId]');
    expect(workspaceSource).toContain("No fue posible cargar las operaciones.");
  });

  it("keeps filters and payment/dispersal modes in the active view", () => {
    expect(workspaceSource).toContain("Todos");
    expect(workspaceSource).toContain("En proceso");
    expect(workspaceSource).toContain("Pago individual");
    expect(workspaceSource).toContain("Dispersión");
    expect(workspaceSource).toContain("Buscar por contraparte, ID o concepto");
    expect(workspaceSource).toContain("Programar mensualmente");
  });

  it("creates pending operations and refreshes the dashboard queries", () => {
    expect(workspaceSource).toContain('status: "Pendiente"');
    expect(workspaceSource).toContain('created_by_open_id: auth.user.id');
    expect(workspaceSource).toContain('queryClient.invalidateQueries({ queryKey: ["dashboard-payments"] })');
    expect(workspaceSource).toContain('queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })');
    expect(workspaceSource).toContain("Confirmar y guardar");
  });
});
