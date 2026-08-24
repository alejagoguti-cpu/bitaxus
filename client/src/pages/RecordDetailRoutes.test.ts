import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(resolve(process.cwd(), "client/src/router.tsx"), "utf8");
const paymentsSource = readFileSync(resolve(process.cwd(), "client/src/pages/PaymentOperationsWorkspace.tsx"), "utf8");
const receiptsSource = readFileSync(resolve(process.cwd(), "client/src/pages/Recaudos.tsx"), "utf8");
const counterpartiesSource = readFileSync(resolve(process.cwd(), "client/src/pages/CounterpartiesPage.tsx"), "utf8");
const paymentDetailSource = readFileSync(resolve(process.cwd(), "client/src/pages/PaymentDetailPage.tsx"), "utf8");
const receiptDetailSource = readFileSync(resolve(process.cwd(), "client/src/pages/ReceiptDetailPage.tsx"), "utf8");
const counterpartyDetailSource = readFileSync(resolve(process.cwd(), "client/src/pages/CounterpartyDetailPage.tsx"), "utf8");

describe("Navegación y detalle de registros", () => {
  it("registra las rutas protegidas para los tres módulos", () => {
    expect(routerSource).toContain('path: "/payments/:id"');
    expect(routerSource).toContain("component: PaymentDetailPage");
    expect(routerSource).toContain('path: "/receipts/:id"');
    expect(routerSource).toContain("component: ReceiptDetailPage");
    expect(routerSource).toContain('path: "/counterparties/:id"');
    expect(routerSource).toContain("component: CounterpartyDetailPage");
  });

  it("conecta los nombres y acciones de cada listado con su detalle", () => {
    expect(paymentsSource).toContain("navigate(`/payments/${item.id}`)");
    expect(receiptsSource).toContain("navigate(`/receipts/${item.id}`)");
    expect(counterpartiesSource).toContain("navigate(`/counterparties/${row.id}`)");
  });

  it("ofrece edición Supabase en cada detalle", () => {
    expect(paymentDetailSource).toContain("useUpdatePaymentSupabase");
    expect(paymentDetailSource).toContain("Editar operación");
    expect(receiptDetailSource).toContain("useEditReceiptSupabase");
    expect(receiptDetailSource).toContain("Editar recaudo");
    expect(counterpartyDetailSource).toContain("useUpdateCounterpartySupabase");
    expect(counterpartyDetailSource).toContain("Editar contraparte");
  });
});
