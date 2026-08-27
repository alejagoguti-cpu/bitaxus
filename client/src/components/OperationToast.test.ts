import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = (file: string) => readFileSync(resolve(process.cwd(), `client/src/pages/${file}`), "utf8");
const toastSource = readFileSync(resolve(process.cwd(), "client/src/components/OperationToast.tsx"), "utf8");
const toastStyle = readFileSync(resolve(process.cwd(), "client/src/components/OperationToast.css"), "utf8");

describe("OperationToast", () => {
  it("exposes an accessible, dismissible toast with automatic cleanup", () => {
    expect(toastSource).toContain('role="status"');
    expect(toastSource).toContain('aria-live="polite"');
    expect(toastSource).toContain("window.setTimeout(onClose, duration)");
    expect(toastSource).toContain('aria-label="Cerrar notificación"');
  });

  it("keeps coral styling responsive and motion-safe", () => {
    expect(toastStyle).toContain(".operation-toast");
    expect(toastStyle).toContain("@media (max-width: 560px)");
    expect(toastStyle).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("is used by success confirmations instead of inline success banners", () => {
    for (const file of ["ReceiptDetailPage.tsx", "PaymentDetailPage.tsx", "CounterpartyDetailPage.tsx", "PublicReconciliationPage.tsx"]) {
      const source = page(file);
      expect(source).toContain('import OperationToast from "@/components/OperationToast"');
      expect(source).toContain("<OperationToast");
    }
  });
});

