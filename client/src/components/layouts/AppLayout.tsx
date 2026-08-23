import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Grid2X2,
  Home,
  Landmark,
  Menu,
  MessageCircle,
  Receipt,
  Settings,
  Shuffle,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
}

type NavigationItem = {
  label: string;
  path: string;
  icon: typeof Home;
};

const navigation: NavigationItem[] = [
  { label: "Inicio", path: "/", icon: Home },
  { label: "Recaudos", path: "/receipts", icon: Receipt },
  { label: "Pagos y dispersiones", path: "/payments", icon: Shuffle },
  { label: "Contrapartes", path: "/counterparties", icon: UsersRound },
  { label: "Bitaxus Global", path: "/global", icon: Landmark },
  { label: "Reportes", path: "/reports", icon: Grid2X2 },
  { label: "Conciliación", path: "/reconciliation", icon: ChartNoAxesCombined },
  { label: "Configuración", path: "/settings", icon: Settings },
];

const basePath = () => import.meta.env.BASE_URL.replace(/\/$/, "");
const publicPath = (path: string) =>
  `${basePath()}${path === "/" ? "/" : path}`;

export function AppLayout({ children }: AppLayoutProps) {
  const { user, tenant, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activePath = useMemo(() => {
    const normalized = location.replace(basePath(), "") || "/";
    return normalized === "/"
      ? "/"
      : `/${normalized.replace(/^\//, "").split("/")[0]}`;
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const goTo = (path: string) => {
    setIsMobileMenuOpen(false);
    setShowMenu(false);
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f5f3] text-[#141719]">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#e06465]"
            aria-label="Abrir menú principal"
          >
            <Menu size={22} />
          </button>
          <img
            src={`${basePath()}/bitaxus-logo-black.png`}
            alt="Bitaxus"
            className="h-6 w-auto object-contain"
          />
          <button
            type="button"
            onClick={() => setShowMenu(visible => !visible)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e06465] text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#e06465]"
            aria-label="Abrir menú de usuario"
          >
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Cerrar menú principal"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(82vw,480px)] flex-col border-r border-white/[0.08] bg-[#050606] text-white shadow-2xl transition-transform duration-200 lg:fixed lg:top-0 lg:z-30 lg:h-screen lg:w-[280px] lg:translate-x-0 lg:shadow-none ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.08] px-5 lg:h-24 lg:px-7">
          <button
            type="button"
            onClick={() => goTo("/")}
            className="focus:outline-none focus:ring-2 focus:ring-[#e06465]"
            aria-label="Ir al inicio"
          >
            <img
              src={`${basePath()}/bitaxus-logo.png`}
              alt="Bitaxus"
              className="h-5 w-auto object-contain lg:h-8"
            />
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#e06465] lg:hidden"
            aria-label="Cerrar menú principal"
          >
            <X size={24} />
          </button>
        </div>

        <nav
          className="shrink-0 space-y-1 overflow-hidden px-4 py-4 lg:flex-1 lg:space-y-2 lg:overflow-y-auto lg:px-4 lg:py-8"
          aria-label="Navegación principal"
        >
          {navigation.map(({ label, path, icon: Icon }) => {
            const isActive =
              activePath === path ||
              (path !== "/" && activePath.startsWith(path));
            return (
              <button
                type="button"
                key={path}
                onClick={() => goTo(path)}
                className={`flex min-h-11 w-full items-center gap-4 rounded-xl px-5 text-left text-[13px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#e06465] lg:min-h-14 lg:gap-5 lg:rounded-2xl lg:px-6 lg:text-base ${isActive ? "bg-gradient-to-r from-[#e06465]/25 to-[#e06465]/5 text-[#ff7a7b] shadow-[inset_4px_0_0_#e06465]" : "text-white/70 hover:bg-white/[0.07] hover:text-white"}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={20} strokeWidth={1.8} className="lg:h-[23px] lg:w-[23px]" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto shrink-0 p-4 lg:p-4">
          <div
            className="w-full rounded-2xl border border-white/[0.12] bg-[#151719] p-4 text-left lg:p-5"
            role="note"
          >
            <div className="flex items-center gap-3 text-sm font-semibold">
              <MessageCircle size={17} className="text-[#ff7a7b]" /> Agente
              Bitaxus
            </div>
            <p className="mt-2 text-[11px] leading-4 text-white/50 lg:mt-3 lg:text-xs lg:leading-5">
              El centro de ayuda estará disponible cuando se conecte el canal de soporte.
            </p>
            <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-white/45 lg:mt-4 lg:text-sm">
              Próximamente
            </span>
          </div>
        </div>
      </aside>

      <div className="lg:ml-[280px]">
        <header className="sticky top-0 z-30 hidden border-b border-black/[0.06] bg-white/95 backdrop-blur lg:block">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Building2 size={16} /> {tenant?.name || "Bitaxus"}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#e06465]"
                aria-label="Notificaciones"
              >
                <Bell size={18} />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#e06465]" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu(visible => !visible)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e06465] font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#e06465]"
                  aria-label="Abrir menú de usuario"
                >
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => goTo("/settings")}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings size={15} /> Configuración
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#b64b4d] hover:bg-[#fff3f2]"
                    >
                      <CircleHelp size={15} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] bg-[#f5f5f3]">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
