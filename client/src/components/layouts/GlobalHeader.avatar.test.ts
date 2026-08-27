import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/layouts/GlobalHeader.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/components/layouts/GlobalHeader.css"), "utf8");

describe("Avatar de perfil en la cabecera", () => {
  it("muestra la imagen persistida y conserva la inicial como fallback", () => {
    expect(source).toContain("user?.avatar_url");
    expect(source).toContain('className="global-header-profile__avatar-image"');
    expect(source).toContain('alt=""');
    expect(source).toContain('(user?.name || "U").charAt(0).toUpperCase()');
  });

  it("mantiene el avatar circular y responsive sin colores azules", () => {
    expect(styles).toContain(".global-header-profile__avatar-image");
    expect(styles).toContain("object-fit: cover");
    expect(styles).toContain("border-radius: 50%");
    expect(styles).not.toMatch(/\bblue\b|#2563eb|#3b82f6|#60a5fa/i);
  });
});
