// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PaymentDetailPage } from "./PaymentDetailPage";
import { ReceiptDetailPage } from "./ReceiptDetailPage";
import { CounterpartyDetailPage } from "./CounterpartyDetailPage";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  paymentMutate: vi.fn(),
  receiptMutate: vi.fn(),
  counterpartyMutate: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { role: "admin", name: "Alejandra" }, tenant: { id: "tenant-1" } }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/detail", mocks.navigate],
  useParams: () => ({ id: "record-1" }),
}));

vi.mock("@/hooks/usePaymentsSupabase", () => ({
  usePaymentSupabase: () => ({
    data: { id: "payment-1", payment_type: "Pago individual", beneficiary: "Cliente Uno", account: "Cuenta principal", amount: 125000, currency: "COP", concept: "Honorarios", description: "Pago de prueba", payment_date: "2026-08-23", monthly: false, status: "Pendiente", created_at: "2026-08-20T00:00:00Z", created_by_name: "Alejandra" },
    isLoading: false,
    error: null,
  }),
  useUpdatePaymentSupabase: () => ({ mutate: mocks.paymentMutate, isPending: false }),
}));

vi.mock("@/hooks/useReceiptsSupabase", () => ({
  useReceiptSupabase: () => ({
    data: { id: "receipt-1", payer_id: "client-1", payer_name: "Cliente Uno", amount: 250000, currency: "COP", concept: "Venta de productos", receipt_date: "2026-08-24", reference_id: "REF-1", notes: "Recaudo de prueba", status: "Pendiente", created_at: "2026-08-20T00:00:00Z", created_by_name: "Alejandra" },
    isLoading: false,
    error: null,
  }),
  useEditReceiptSupabase: () => ({ mutate: mocks.receiptMutate, isPending: false }),
}));

vi.mock("@/hooks/useCounterpartiesSupabase", () => ({
  useCounterpartySupabase: () => ({
    data: { id: "counterparty-1", name: "Cliente Uno", id_type: "NIT", identification_number: "900123456", relation: "Cliente", phone: "3001234567", email: "cliente@example.com", bank: "Bancolombia", account_type: "Ahorros", account_number: "1234567890", status: "Activa", created_at: "2026-08-20T00:00:00Z", updated_at: "2026-08-21T00:00:00Z" },
    isLoading: false,
    error: null,
  }),
  useUpdateCounterpartySupabase: () => ({ mutate: mocks.counterpartyMutate, isPending: false }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Detalles editables de operaciones", () => {
  it("abre la edición de un pago y envía los cambios", async () => {
    const user = userEvent.setup();
    render(<PaymentDetailPage tenantId="tenant-1" />);
    await user.click(screen.getByRole("button", { name: /editar operación/i }));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
    expect(mocks.paymentMutate).toHaveBeenCalledWith(expect.objectContaining({ concept: "Honorarios", payment_date: "2026-08-23" }), expect.any(Object));
  });

  it("abre la edición de un recaudo y envía los cambios", async () => {
    const user = userEvent.setup();
    render(<ReceiptDetailPage tenantId="tenant-1" />);
    await user.click(screen.getByRole("button", { name: /editar recaudo/i }));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
    expect(mocks.receiptMutate).toHaveBeenCalledWith(expect.objectContaining({ concept: "Venta de productos", receipt_date: "2026-08-24" }), expect.any(Object));
  });

  it("abre la edición de una contraparte y envía los cambios", async () => {
    const user = userEvent.setup();
    render(<CounterpartyDetailPage tenantId="tenant-1" />);
    await user.click(screen.getByRole("button", { name: /editar contraparte/i }));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
    expect(mocks.counterpartyMutate).toHaveBeenCalledWith(expect.objectContaining({ name: "Cliente Uno", relation: "Cliente", status: "Activa" }), expect.any(Object));
  });
});
