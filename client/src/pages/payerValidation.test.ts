import { describe, expect, it } from "vitest";
import { validateNewPayer } from "./payerValidation";

describe("validateNewPayer", () => {
  const valid = { name: "Comercial Andina", identification: "901234567", idType: "NIT", email: "operaciones@andina.co", phone: "300 123 4567" };
  it("accepts a valid payer draft", () => expect(validateNewPayer(valid).isValid).toBe(true));
  it("reports required identity and name errors", () => {
    const result = validateNewPayer({ ...valid, name: "A", identification: "" });
    expect(result.name).toBeDefined();
    expect(result.identification).toBeDefined();
  });
  it("reports invalid optional contact formats", () => {
    const result = validateNewPayer({ ...valid, email: "incorrecto", phone: "12" });
    expect(result.email).toBeDefined();
    expect(result.phone).toBeDefined();
  });
});
