import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/ModalScrollControls.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("ModalScrollControls", () => {
  it("conserva el scroll interno sin renderizar un riel ni flechas auxiliares", () => {
    expect(source).toContain('className={`modal-scroll-content ${className}`}');
    expect(source).not.toContain("modal-scroll-arrow");
    expect(source).not.toContain("ChevronUp");
    expect(source).not.toContain("ChevronDown");
    expect(styles).toContain(".modal-scroll-content { min-height: 0; max-height: 100%; overflow-y: auto;");
    expect(styles).not.toContain(".modal-scroll-arrow");
    expect(styles).not.toContain(".modal-scroll-shell::before");
    expect(styles).not.toContain(".modal-scroll-shell::after");
  });
});
