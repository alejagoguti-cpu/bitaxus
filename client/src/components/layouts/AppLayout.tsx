/**
 * AppLayout Component
 * Main application layout with header and sidebar
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { routes } from "@/router";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, tenant, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const protectedRoutes = routes.filter(
    r => !r.isPublic && r.component && r.path !== "/:path*"
  );

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-[#141719]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
            >
              ☰
            </button>
            <img
              src={`${import.meta.env.BASE_URL}bitaxus-logo-black.png`}
              alt="Bitaxus"
              className="h-7 w-auto object-contain"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{tenant?.name}</p>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e06465] font-semibold text-white transition-shadow hover:shadow-md"
              >
                {user?.name.charAt(0).toUpperCase()}
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                  <a
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                    onClick={() => setShowMenu(false)}
                  >
                    ⚙️ Configuración
                  </a>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:relative w-64 bg-gray-900 text-gray-100 transition-transform duration-300 z-30 ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          } min-h-screen`}
        >
          <nav className="p-6 space-y-2">
            {protectedRoutes.map(route => (
              <a
                key={route.path}
                href={route.path}
                className="block rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {route.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#f5f5f3]">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
