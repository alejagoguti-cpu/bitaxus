import { describe, expect, it } from "vitest";
import { periodStart, summarizeReportOperations } from "./reportData";

describe("resumen de operaciones para Reportes", () => {
  const today = new Date("2026-08-23T12:00:00");
  const operations = [
    { id: "1", type: "Recaudo" as const, date: "2026-08-20", amount: 120000, currency: "COP", status: "Recibido", subject: "Comercial Andina", concept: "Factura 1" },
    { id: "2", type: "Pago" as const, date: "2026-08-18", amount: 30000, currency: "COP", status: "Pendiente", subject: "Proveedor Uno", concept: "Servicio" },
    { id: "3", type: "Recaudo" as const, date: "2026-04-02", amount: 80000, currency: "COP", status: "Recibido", subject: "Fuera de rango", concept: "Antiguo" },
  ];

  it("calcula el inicio correcto para un periodo móvil", () => {
    expect(periodStart("Últimos 3 meses", today).toISOString().slice(0, 10)).toBe("2026-06-01");
  });

  it("filtra, suma y clasifica solo operaciones del periodo seleccionado", () => {
    const summary = summarizeReportOperations(operations, "Últimos 3 meses", "Todas", today);
    expect(summary.filtered).toHaveLength(2);
    expect(summary.incoming).toBe(120000);
    expect(summary.outgoing).toBe(30000);
    expect(summary.completed).toBe(1);
    expect(summary.pending).toBe(1);
    expect(summary.months).toHaveLength(3);
    expect(summary.months.at(-1)).toMatchObject({ incoming: 120000, outgoing: 30000 });
  });
});
