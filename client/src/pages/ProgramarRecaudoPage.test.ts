import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/ProgramarRecaudoPage.tsx"),
  "utf8"
);
const routerSource = readFileSync(
  resolve(process.cwd(), "client/src/router.tsx"),
  "utf8"
);

describe("Programar recaudo detail view", () => {
  it("uses the protected Supabase tables for payers and receipts", () => {
    expect(pageSource).toContain('from("payers")');
    expect(pageSource).toContain('from("receipts")');
    expect(pageSource).toContain("payer_id: payer.recordId");
    expect(pageSource).toContain("created_by_open_id: user.id");
    expect(pageSource).toContain('status: "Pendiente"');
  });

  it("keeps review separate from the final insert", () => {
    expect(pageSource).toContain("setFormStep(2)");
    expect(pageSource).toContain("formStep === 1 ? continueToReview() : void submitReceipt()");
    expect(pageSource).toContain("Confirmar y guardar");
    expect(pageSource).toContain("Revisa antes de guardar");
  });

  it("is exposed as a protected route and connected from Recaudos", () => {
    expect(routerSource).toContain('path: "/receipts/new"');
    expect(routerSource).toContain("component: ProgramarRecaudoPage");
    expect(routerSource).toContain('navigate("/receipts/new")');
  });
});
