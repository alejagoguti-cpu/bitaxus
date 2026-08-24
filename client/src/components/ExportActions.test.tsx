// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ExportActions from "./ExportActions";
import { exportRowsToPdf } from "../lib/exportData";

vi.mock("../lib/exportData", () => ({
  exportRowsToCsv: vi.fn(),
  exportRowsToPdf: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => cleanup());

describe("ExportActions PDF", () => {
  it("exports the complete filtered report instead of only the visible page", async () => {
    const user = userEvent.setup();
    const fetchRows = vi.fn().mockResolvedValue([
      { id: "payment-1", status: "Pendiente" },
      { id: "payment-2", status: "Procesado" },
    ]);

    render(
      <ExportActions
        title="Pagos y dispersiones"
        rows={[{ id: "payment-1", status: "Pendiente" }]}
        columns={[{ key: "id", label: "ID" }, { key: "status", label: "Estado" }]}
        filters={{ Estado: "Todos" }}
        fetchRows={fetchRows}
      />
    );

    await user.click(screen.getByRole("button", { name: /configurar exportación pdf/i }));
    await user.click(screen.getByRole("button", { name: "Exportar PDF" }));

    await waitFor(() => expect(fetchRows).toHaveBeenCalledWith({ from: "", to: "" }));
    await waitFor(() => expect(exportRowsToPdf).toHaveBeenCalledWith(
      "Pagos y dispersiones",
      [
        { id: "payment-1", status: "Pendiente" },
        { id: "payment-2", status: "Procesado" },
      ],
      expect.any(Array),
      expect.objectContaining({ filters: { Estado: "Todos" }, dateRange: { from: "", to: "" } })
    ));
  });

  it("passes the selected date range to the Supabase report loader", async () => {
    const user = userEvent.setup();
    const fetchRows = vi.fn().mockResolvedValue([]);

    render(
      <ExportActions
        title="Pagos"
        rows={[]}
        columns={[{ key: "id", label: "ID" }]}
        fetchRows={fetchRows}
      />
    );

    await user.click(screen.getByRole("button", { name: /configurar exportación pdf/i }));
    const dates = screen.getAllByDisplayValue("");
    await user.type(dates[0], "2026-08-01");
    await user.type(dates[1], "2026-08-31");
    await user.click(screen.getByRole("button", { name: "Exportar PDF" }));

    await waitFor(() => expect(fetchRows).toHaveBeenCalledWith({ from: "2026-08-01", to: "2026-08-31" }));
  });
});
