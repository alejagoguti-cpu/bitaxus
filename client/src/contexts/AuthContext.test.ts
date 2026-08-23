import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "client/src/contexts/AuthContext.tsx"),
  "utf8"
);

describe("public Supabase authentication", () => {
  it("keeps Auth sessions usable when profile tables are unavailable", () => {
    expect(source).toContain("function buildFallbackProfile");
    expect(source).toContain("if (userError || !userData) return fallback;");
    expect(source).toContain(
      "if (tenantError || !tenantData) return fallback;"
    );
    expect(source).toContain(
      "const profile = await resolveProfile(data.user);"
    );
    expect(source).not.toContain("if (userError) throw userError;");
    expect(source).not.toContain("if (tenantError) throw tenantError;");
  });

  it("normalizes Supabase invalid-credential feedback in Spanish", () => {
    expect(source).toContain("El correo o la contraseña no son correctos.");
    expect(source).toContain("email: email.trim(),");
  });
});
