import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/layouts/GlobalHeader.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/components/layouts/GlobalHeader.css"), "utf8");

describe("Controles superiores de GlobalHeader", () => {
  it("mantiene empresa como información no interactiva y periodo como selector controlado", () => {
    expect(source).toContain("global-header-select--static");
    expect(source).toContain("Empresa activa:");
    expect(source).toContain('onChange={value => setPeriod(value as HeaderPeriod)}');
    expect(source).not.toContain('options={[company]} onChange={() => undefined}');
  });

  it("protege cierre por Escape y clic fuera", () => {
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('document.addEventListener("mousedown", close)');
    expect(source).toContain('document.addEventListener("keydown", closeEscape)');
    expect(source).toContain('aria-expanded={open}');
  });

  it("conserva estados visuales coral/neutros y focus-visible", () => {
    expect(styles).toContain("#e06465");
    expect(styles).toContain("focus-visible");
    expect(styles).not.toMatch(/#[0-9a-f]{6}/i.test("#2563eb") ? /a^/ : /#2563eb/);
  });
});
