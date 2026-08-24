// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { GlobalHeader, GlobalHeaderProvider } from "@/components/layouts/GlobalHeader";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  receipts: [] as Array<Record<string, unknown>>,
  payments: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Alejandra" },
    tenant: { name: "OnTarget SAS" },
    logout: mocks.logout,
  }),
}));

vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true }));

vi.mock("@/hooks", () => ({
  useDashboardWidgets: () => ({
    receipts: { data: mocks.receipts, refetch: vi.fn() },
    payments: { data: mocks.payments, refetch: vi.fn() },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("wouter", () => ({
  Link: ({ children, to, onClick }: { children: React.ReactNode; to: string; onClick?: () => void }) => (
    <a href={to} onClick={onClick}>{children}</a>
  ),
  useLocation: () => ["/", mocks.navigate],
}));

describe("Dashboard header menus", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.navigate.mockClear();
    mocks.logout.mockClear();
    mocks.receipts = [];
    mocks.payments = [];
  });

  const renderDashboardWithGlobalHeader = () => render(
    <GlobalHeaderProvider>
      <GlobalHeader />
      <DashboardPage tenantId="tenant-1" />
    </GlobalHeaderProvider>
  );

  it("opens notifications and navigates to reports", async () => {
    const user = userEvent.setup();
    renderDashboardWithGlobalHeader();

    const notifications = screen.getByRole("button", { name: /notificaciones/i });
    expect(notifications.getAttribute("aria-expanded")).toBe("false");

    await user.click(notifications);

    const notificationDialog = screen.getByRole("dialog", { name: "Notificaciones" });
    expect(notificationDialog).not.toBeNull();
    expect(within(notificationDialog).getByText("No hay operaciones pendientes.")).not.toBeNull();
    expect(notifications.getAttribute("aria-expanded")).toBe("true");

    await user.click(screen.getByRole("button", { name: /revisar operaciones/i }));

    expect(mocks.navigate).toHaveBeenCalledWith("/reports");
    expect(screen.queryByRole("dialog", { name: "Notificaciones" })).toBeNull();
  });

  it("opens help, closes another header menu and routes to reports", async () => {
    const user = userEvent.setup();
    renderDashboardWithGlobalHeader();

    await user.click(screen.getByRole("button", { name: /notificaciones/i }));
    expect(screen.getByRole("dialog", { name: "Notificaciones" })).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Ayuda" }));

    expect(screen.queryByRole("dialog", { name: "Notificaciones" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "Ayuda" })).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /ir a reportes/i }));
    expect(mocks.navigate).toHaveBeenCalledWith("/reports");
  });

  it("lists a real pending operation and routes to its module", async () => {
    mocks.receipts = [{ id: "receipt-1", payer_name: "Comercial Andina", concept: "Factura", status: "Pendiente", receipt_date: "2026-08-23", created_at: "2026-08-23" }];
    const user = userEvent.setup();
    renderDashboardWithGlobalHeader();

    await user.click(screen.getByRole("button", { name: /notificaciones/i }));
    const notificationDialog = screen.getByRole("dialog", { name: "Notificaciones" });
    const alert = within(notificationDialog).getByRole("button", { name: /recaudo pendiente/i });

    expect(within(notificationDialog).getByText("Comercial Andina")).not.toBeNull();
    await user.click(alert);
    expect(mocks.navigate).toHaveBeenCalledWith("/receipts");
  });

  it("opens profile, exposes configuration and closes the session", async () => {
    const user = userEvent.setup();
    renderDashboardWithGlobalHeader();

    const profile = screen.getByRole("button", { name: "Abrir menú de perfil" });
    await user.click(profile);

    expect(screen.getByRole("menu")).not.toBeNull();
    expect(screen.getByText("Alejandra")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Configuración" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/settings");

    await user.click(profile);
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });
});
