import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(resolve(process.cwd(), `client/src/pages/${file}`), "utf8");
const style = readFileSync(resolve(process.cwd(), "client/src/pages/ProgramarRecaudoPage.css"), "utf8");


describe("operational pop-up consistency", () => {
  it("keeps the principal receipt flow as a controlled accessible modal", () => {
    const router = source("../router.tsx");
    expect(router).toContain('presentation="modal"');
    expect(router).toContain('aria-label="Programar recaudo"');
    expect(router).toContain("receipt-modal-window");
    expect(router).toContain("Cerrar Programar recaudo");
  });

  it("keeps internal modal content scrollable without the removed arrow rail", () => {
    const controls = readFileSync(resolve(process.cwd(), "client/src/components/ModalScrollControls.tsx"), "utf8");
    expect(controls).toContain("modal-scroll-content");
    expect(controls).not.toContain("modal-scroll-arrow");
    expect(controls).not.toContain("ChevronUp");
    expect(controls).not.toContain("ChevronDown");
    expect(style).not.toContain("modal-scroll-arrow");
  });

  it("uses the same toast pattern for operational success feedback", () => {
    for (const file of ["ReceiptDetailPage.tsx", "PaymentDetailPage.tsx", "CounterpartyDetailPage.tsx", "PublicReconciliationPage.tsx"]) {
      expect(source(file)).toContain("<OperationToast");
    }
  });
});

