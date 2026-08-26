// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";

const mocks = vi.hoisted(() => ({
  receipts: [] as Array<Record<string, unknown>>,
  payments: [] as Array<Record<string, unknown>>,
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
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
  mocks.receipts = [];
  mocks.payments = [];
});

describe("Dashboard sin header global", () => {
  it("no muestra la franja superior y conserva las acciones del Home", () => {
    render(<DashboardPage tenantId="tenant-1" />);

    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.queryByRole("button", { name: /notificaciones/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ayuda" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Abrir menú de perfil" })).toBeNull();
    const paymentAction = screen.getByRole("button", { name: /programar pago/i });
    expect(paymentAction).not.toBeNull();
    fireEvent.click(paymentAction);
    expect(screen.getByRole("dialog", { name: /qué deseas programar/i })).not.toBeNull();
  });
});
