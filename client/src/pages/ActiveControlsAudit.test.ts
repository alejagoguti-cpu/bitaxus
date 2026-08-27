import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const activeSources = [
  "client/src/components/layouts/AppLayout.tsx",
  "client/src/components/layouts/GlobalHeader.tsx",
  "client/src/pages/PaymentOperationsWorkspace.tsx",
  "client/src/pages/CounterpartiesPage.tsx",
  "client/src/pages/SettingsPage.tsx",
  "client/src/pages/ReportsPage.tsx",
].map(read);

describe("Auditoría de controles activos", () => {
  it("no deja handlers explícitamente vacíos en las pantallas operativas", () => {
    for (const source of activeSources) {
      expect(source).not.toMatch(/onClick=\{\(\) => undefined\}/);
      expect(source).not.toMatch(/onChange=\{\(\) => undefined\}/);
    }
  });

  it("mantiene las rutas de Pagos y Dispersión sobre el workspace compartido", () => {
    expect(read("client/src/pages/PaymentsPage.tsx")).toContain("PaymentOperationsWorkspace");
    expect(read("client/src/pages/DispersionsPage.tsx")).toContain("PaymentOperationsWorkspace");
    expect(read("client/src/router.tsx")).toContain("LegacyPaymentNewRedirect");
  });

  it("no confunde un formulario heredado no montado con el flujo publicado", () => {
    const router = read("client/src/router.tsx");
    expect(router).not.toContain('from "@/components/forms/FormBankAccount"');
    expect(router).not.toContain('from "@/components/forms/FormCounterparty"');
    expect(router).not.toContain('from "@/components/forms/FormDispersion"');
  });
});
