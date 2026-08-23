import { describe, expect, it } from "vitest";
import { filterReconciliationRows } from "./reconciliationData";

const rows = [
  { id: "a", date: "2026-08-19", status: "Pendiente", amount: 850000, counterparty: "Proveedor Tecnológico", reference: "PA-001" },
  { id: "b", date: "2026-08-20", status: "Conciliada", amount: 1250000, counterparty: "Comercial Andina", reference: "RC-001", reconciliation_comment: "Validado" },
];

describe("filterReconciliationRows", () => {
  it("combina periodo, estado y búsqueda sin incluir movimientos ajenos", () => {
    expect(filterReconciliationRows(rows, { from: "2026-08-20", to: "2026-08-20", status: "Conciliada", term: "validado" }).map(row => row.id)).toEqual(["b"]);
  });

  it("mantiene todas las filas cuando los filtros están vacíos", () => {
    expect(filterReconciliationRows(rows, { from: "", to: "", status: "Todos los estados", term: "" })).toHaveLength(2);
  });
});
