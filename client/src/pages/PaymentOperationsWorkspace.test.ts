import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/PaymentOperationsWorkspace.tsx"),
  "utf8"
);

describe("Pagos y dispersiones workspace", () => {
  it("loads the live payments with an exact, server-paginated Supabase query", () => {
    expect(workspaceSource).toContain('from("payments")');
    expect(workspaceSource).toContain('queryKey: [\n      "public-payment-operations",');
    expect(workspaceSource).toContain('{ count: "exact" }');
    expect(workspaceSource).toContain("range(from, from + pageSize - 1)");
    expect(workspaceSource).toContain("return { rows: (data ?? []) as PaymentRecord[], total: count ?? 0 }");
    expect(workspaceSource).toContain("No fue posible cargar las operaciones.");
  });

  it("applies tab, status, type, concept, date and text filters in Supabase", () => {
    expect(workspaceSource).toContain("request.in(\"status\", [\"Pendiente\", \"Programado\", \"En proceso\"])");
    expect(workspaceSource).toContain('request.eq("status", statusFilter)');
    expect(workspaceSource).toContain('request.eq("payment_type", typeFilter)');
    expect(workspaceSource).toContain('request.eq("concept", conceptFilter)');
    expect(workspaceSource).toContain('request.gte("payment_date", dateRange.start)');
    expect(workspaceSource).toContain("request.or(filters.join(\",\"))");
    expect(workspaceSource).toContain("fetchExportRows");
    expect(workspaceSource).toContain("batchSize = 500");
    expect(workspaceSource).toContain("logoUrl={`${import.meta.env.BASE_URL}bitaxus-logo-black.png`}");
    expect(workspaceSource).toContain("setSearchTerm(query.trim())");
  });

  it("keeps filters and payment/dispersal modes in the active view", () => {
    expect(workspaceSource).toContain("Todos");
    expect(workspaceSource).toContain("En proceso");
    expect(workspaceSource).toContain("Pago individual");
    expect(workspaceSource).toContain("Dispersión");
    expect(workspaceSource).toContain("Buscar por contraparte, ID o concepto");
    expect(workspaceSource).toContain("Programar mensualmente");
    expect(workspaceSource).toContain("Por página");
    expect(workspaceSource).toContain("Mostrando {firstResult} a {lastResult} de {total} operación(es)");
  });

  it("creates pending operations and refreshes the dashboard queries", () => {
    expect(workspaceSource).toContain('status: "Pendiente"');
    expect(workspaceSource).toContain('created_by_open_id: auth.user.id');
    expect(workspaceSource).toContain('queryClient.invalidateQueries({ queryKey: ["dashboard-payments"] })');
    expect(workspaceSource).toContain('queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })');
    expect(workspaceSource).toContain("Confirmar y guardar");
  });

  it("abre un detalle accesible al seleccionar una fila de pago o dispersión", () => {
    expect(workspaceSource).toContain("setSelectedPayment(item)");
    expect(workspaceSource).toContain('OperationDetailModal');
    expect(workspaceSource).toContain("Fecha de operación");
    expect(workspaceSource).toContain("onClose={() => setSelectedPayment(null)}");
  });
});
