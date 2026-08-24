import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  ChartNoAxesCombined,
  Grid2X2,
  Home,
  Landmark,
  MessageCircle,
  Receipt,
  Settings,
  Shuffle,
  UsersRound,
} from "lucide-react";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
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

export function AppLayout({ children }: AppLayoutProps) {
  const [location, navigate] = useLocation();

  const activePath = useMemo(() => {
    const normalized = location.replace(basePath(), "") || "/";
    return normalized === "/"
      ? "/"
      : `/${normalized.replace(/^\//, "").split("/")[0]}`;
  }, [location]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f5f3] text-[#141719]">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[300px] flex-col border-r border-white/[0.08] bg-[#050606] text-white shadow-2xl">
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.08] px-5 lg:h-28 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="focus:outline-none focus:ring-2 focus:ring-[#e06465]"
            aria-label="Ir al inicio"
          >
            <img
              src={`${basePath()}/bitaxus-logo.png`}
              alt="Bitaxus"
              className="h-5 w-auto object-contain lg:h-auto lg:w-[155px] lg:max-h-12"
            />
          </button>
        </div>

        <nav
          className="mobile-sidebar-nav shrink-0 space-y-1 overflow-hidden px-4 py-4 lg:flex-none lg:space-y-1 lg:overflow-hidden lg:px-5 lg:py-5"
          style={{ overflowY: "hidden", overflowX: "hidden" }}
          aria-label="Navegación principal"
        >
          {navigation.map(({ label, path, icon: Icon }) => {
            const isActive = activePath === path || (path !== "/" && activePath.startsWith(path));
            return (
              <button
                type="button"
                key={path}
                onClick={() => navigate(path)}
                className={`flex min-h-11 w-full items-center gap-4 rounded-xl px-5 text-left text-[13px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#e06465] lg:min-h-12 lg:gap-4 lg:rounded-xl lg:px-5 lg:text-sm ${isActive ? "bg-gradient-to-r from-[#e06465]/25 to-[#e06465]/5 text-[#ff7a7b] shadow-[inset_4px_0_0_#e06465]" : "text-white/70 hover:bg-white/[0.07] hover:text-white"}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={20} strokeWidth={1.8} className="lg:h-[23px] lg:w-[23px]" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto shrink-0 p-4 lg:p-5">
          <div className="w-full rounded-2xl border border-white/[0.12] bg-[#151719] p-4 text-left lg:p-5" role="note">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <MessageCircle size={17} className="text-[#ff7a7b]" /> Agente Bitaxus
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

      <div className="ml-[300px] min-h-screen">
        <main className="min-h-screen bg-[#f5f5f3]">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
