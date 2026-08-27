// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "./AppLayout";

const layoutSource = readFileSync(resolve(process.cwd(), "client/src/components/layouts/AppLayout.tsx"), "utf8");

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
    expect(screen.getByLabelText("Empresa activa: OnTarget SAS")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Seleccionar empresa" })).toBeNull();
    expect(screen.getByRole("button", { name: "Seleccionar periodo" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Notificaciones/ })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Ayuda" })).not.toBeNull();
  });

  it("mantiene el menú móvil sin scrollbar vertical artificial", () => {
    expect(layoutSource).toContain("mobile-sidebar-nav");
    expect(layoutSource).toContain("overflow-hidden");
    expect(layoutSource).not.toContain("mobile-sidebar-nav min-h-0 flex-1 space-y-1 overflow-y-auto");
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
