import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/SettingsPage.tsx"), "utf8");

describe("Panel de Configuración", () => {
  it("retira la Zona de Peligro y conserva un cierre de sesión neutral", () => {
    expect(source).not.toContain("Zona de Peligro");
    expect(source).toContain("Sesión actual");
    expect(source).toContain("Cerrar sesión");
    expect(source).toContain("settings-page-v2");
    expect(source).toContain("Editar perfil");
    expect(source).toContain("Preferencias de notificaciones");
    expect(source).toContain("Sí, cerrar sesión");
  });

  it("persiste avatar sin guardar bytes en una columna y mantiene fallback de inicial", () => {
    expect(source).toContain('supabase.storage.from("avatars").upload');
    expect(source).toContain('getPublicUrl(path)');
    expect(source).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(source).toContain("file.size > 3 * 1024 * 1024");
    expect(source).toContain("avatar_url: avatarUrl");
    expect(source).toContain("settings-profile-card__avatar");
  });

  it("ofrece actualización de contraseña con confirmación y control de visibilidad", () => {
    expect(source).toContain('supabase.auth.updateUser({ password: passwordForm.password })');
    expect(source).toContain("passwordForm.password.length < 8");
    expect(source).toContain("passwordForm.password !== passwordForm.confirmation");
    expect(source).toContain("settings-dialog__password-toggle");
    expect(source).toContain("Cambiar contraseña");
    expect(source).toContain("Contraseña actualizada correctamente.");
  });

  it("mantiene preferencias de notificaciones persistidas en metadata y feedback visible", () => {
    expect(source).toContain("email_alerts: next.email");
    expect(source).toContain("push_alerts: next.push");
    expect(source).toContain("activity_alerts: next.activity");
    expect(source).toContain('role="status"');
    expect(source).toContain("Preferencias de notificaciones actualizadas.");
  });
});
