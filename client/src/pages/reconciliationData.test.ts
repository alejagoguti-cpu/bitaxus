import { describe, expect, it } from "vitest";
import { filterReconciliationRows, getAuditSummary, getPendingReconciliationRows } from "./reconciliationData";

const rows = [
  { id: "a", date: "2026-08-19", status: "Pendiente", amount: 850000, account: "Cuenta principal", counterparty: "Proveedor Tecnológico", reference: "PA-001" },
  { id: "b", date: "2026-08-20", status: "Conciliada", amount: 1250000, account: "Cuenta principal", counterparty: "Comercial Andina", reference: "RC-001", reconciliation_comment: "Validado" },
];

describe("filterReconciliationRows", () => {
  it("combina periodo, estado y búsqueda sin incluir movimientos ajenos", () => {
    expect(filterReconciliationRows(rows, { from: "2026-08-20", to: "2026-08-20", status: "Conciliada", account: "Cuenta principal", term: "validado" }).map(row => row.id)).toEqual(["b"]);
  });

  it("mantiene todas las filas cuando los filtros están vacíos", () => {
    expect(filterReconciliationRows(rows, { from: "", to: "", status: "Todos los estados", account: "", term: "" })).toHaveLength(2);
  });

  it("limita los resultados a la cuenta seleccionada", () => {
    const otherAccountRows = [...rows, { id: "c", date: "2026-08-21", status: "Pendiente", amount: 400000, account: "Cuenta operativa", counterparty: "Servicios del Norte", reference: "RC-002" }];
    expect(filterReconciliationRows(otherAccountRows, { from: "", to: "", status: "Todos los estados", account: "Cuenta operativa", term: "" }).map(row => row.id)).toEqual(["c"]);
  });

  it("selecciona todas las filas no conciliadas para el CTA masivo", () => {
    expect(getPendingReconciliationRows(rows).map(row => row.id)).toEqual(["a"]);
    expect(getPendingReconciliationRows([...rows, { id: "c", date: "2026-08-21", status: "En revisión", amount: 400000 }]).map(row => row.id)).toEqual(["a", "c"]);
  });

  it("expone la trazabilidad de auditoría solo cuando existe en la fila real", () => {
    expect(getAuditSummary(rows[0])).toEqual({ state: "Pendiente", user: "", date: "" });
    expect(getAuditSummary({ ...rows[1], reconciled_by: "admin@bitaxus.test", reconciled_at: "2026-08-20T14:00:00.000Z" })).toEqual({ state: "Conciliada", user: "admin@bitaxus.test", date: "2026-08-20T14:00:00.000Z" });
  });
});
