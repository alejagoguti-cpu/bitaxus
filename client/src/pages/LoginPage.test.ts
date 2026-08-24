import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "client/src/pages/LoginPage.tsx"),
  "utf8"
);

describe("LoginPage password visibility", () => {
  it("offers an accessible visibility toggle for login and registration", () => {
    expect(source).toMatch(/Eye,\s+EyeOff/);
    expect(source).toContain('type={showPassword ? "text" : "password"}');
    expect(source).toContain(
      'type={showRegisterPassword ? "text" : "password"}'
    );
    expect(source).toMatch(
      /aria-label=\{[\s\S]*?showPassword[\s\S]*?Mostrar contraseña[\s\S]*?\}/
    );
    expect(source).toMatch(
      /aria-label=\{[\s\S]*?showRegisterPassword[\s\S]*?Mostrar contraseña[\s\S]*?\}/
    );
    expect(source).toContain(
      "focus:ring-2 focus:ring-[#d95f61]"
    );
  });

  it("uses the administrator email as the login hint", () => {
    expect(source).toContain('placeholder="admin@bitaxus.test"');
  });

  it("applies the Belamor typeface only to the welcome phrase", () => {
    expect(source).toContain("Controla tu operación con claridad.");
    expect(source).toContain('fontFamily: "Belamor, sans-serif"');
    expect(source).toContain('origin-left -translate-x-10 scale-[2.4]');
  });
});
