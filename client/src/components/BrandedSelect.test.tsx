// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandedSelect } from "./BrandedSelect";

afterEach(() => cleanup());

describe("BrandedSelect", () => {
  it("opens without a native select and emits the selected value", async () => {
    const user = userEvent.setup({ document });
    const onChange = vi.fn();

    render(
      <BrandedSelect
        value="CC"
        onChange={onChange}
        aria-label="Tipo de identificación"
        options={[
          { value: "CC", label: "Cédula" },
          { value: "NIT", label: "NIT" },
          { value: "PP", label: "Pasaporte" },
        ]}
      />
    );

    expect(screen.queryByRole("combobox")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Tipo de identificación" }));
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Cédula" }).className).toContain("selected");
    await user.click(screen.getByRole("option", { name: "NIT" }));

    expect(onChange).toHaveBeenCalledWith("NIT");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
