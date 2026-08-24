// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NativeSelectGuard } from "./NativeSelectGuard";

afterEach(() => cleanup());

describe("NativeSelectGuard", () => {
  it("intercepta un select nativo y aplica el cambio mediante una lista Bitaxus", () => {
    const onChange = vi.fn();
    render(<><NativeSelectGuard /><label>Periodo<select aria-label="Periodo" defaultValue="mes" onChange={onChange}><option value="mes">Este mes</option><option value="trimestre">Últimos 3 meses</option></select></label></>);

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Periodo" }));
    expect(screen.getByRole("listbox", { name: "Periodo" })).toBeTruthy();
    const menu = screen.getByRole("listbox", { name: "Periodo" });
    expect(within(menu).getByRole("option", { name: "Este mes" }).className).toContain("selected");
    fireEvent.click(within(menu).getByRole("option", { name: "Últimos 3 meses" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
