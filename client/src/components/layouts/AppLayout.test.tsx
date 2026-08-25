// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "./AppLayout";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Alejandra" },
    tenant: { name: "OnTarget SAS" },
    logout: vi.fn(),
  }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

vi.mock("@/hooks", () => ({
  useDashboardWidgets: () => ({ receipts: { data: [] }, payments: { data: [] } }),
}));

afterEach(() => cleanup());

describe("AppLayout en Home", () => {
  it("mantiene visible la side bar y marca Inicio como sección activa", () => {
    const { container } = render(
      <AppLayout>
        <div>Contenido del inicio</div>
      </AppLayout>
    );

    expect(screen.getByRole("navigation", { name: "Navegación principal" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Inicio" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: "Recaudos" })).not.toBeNull();
    expect(container.querySelector(".global-dashboard-header")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Hola, Alejandra" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Seleccionar empresa" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Seleccionar periodo" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Notificaciones/ })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Ayuda" })).not.toBeNull();
  });

  it("ofrece un menú móvil con apertura y cierre accesibles", () => {
    render(<AppLayout><div>Contenido móvil</div></AppLayout>);
    const openMenu = screen.getByRole("button", { name: "Abrir menú" });
    const sidebar = screen.getByRole("complementary");

    fireEvent.click(openMenu);
    expect(sidebar.className).toContain("translate-x-0");

    fireEvent.click(sidebar.querySelector('button[aria-label="Cerrar menú"]')!);
    expect(sidebar.className).toContain("-translate-x-full");
  });
});
