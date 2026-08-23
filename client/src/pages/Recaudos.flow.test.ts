import { describe, expect, it } from "vitest";
import { canReviewReceipt } from "./receiptFlow";

describe("Programar recaudo flow", () => {
  const payer = { name: "Cliente", idType: "CC", id: "123", type: "Persona natural" as const };
  it("allows review only with the required operation data", () => {
    expect(canReviewReceipt(payer, "1250000", "Honorarios", "2026-08-23")).toBe(true);
    expect(canReviewReceipt(null, "1250000", "Honorarios", "2026-08-23")).toBe(false);
    expect(canReviewReceipt(payer, "", "Honorarios", "2026-08-23")).toBe(false);
    expect(canReviewReceipt(payer, "1250000", "", "2026-08-23")).toBe(false);
    expect(canReviewReceipt(payer, "1250000", "Honorarios", "")).toBe(false);
  });
});
