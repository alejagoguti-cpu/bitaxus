/**
 * Router Configuration
 * App routes with role-based access control
 */

import { Router as RootRouter, Route, Redirect } from "wouter";
import { UserRole } from "@shared/types";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { DispersionsPage } from "@/pages/DispersionsPage";
import { CounterpartiesPage } from "@/pages/CounterpartiesPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import Recaudos from "@/pages/Recaudos";
import Global from "@/pages/Global";
import { useLocation } from "wouter";

// Protected route wrapper
interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  requiredRoles?: UserRole[];
  [key: string]: any;
}

export function ProtectedRoute({
  component: Component,
  requiredRoles = [],
  ...rest
}: ProtectedRouteProps) {
  const { isAuthenticated, user, tenant, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return <Redirect to="/unauthorized" />;
  }

  return (
    <AppLayout>
      <Component tenantId={tenant?.id} {...rest} />
    </AppLayout>
  );
}

function LegacyRecaudosPage() {
  const [, navigate] = useLocation();
  return (
    <Recaudos
      onNavigate={section =>
        section === "Pagos y dispersiones"
          ? navigate("/payments")
          : navigate("/")
      }
    />
  );
}

function LegacyGlobalPage() {
  const [, navigate] = useLocation();
  return (
    <Global
      onNavigate={section =>
        section === "Pagos y dispersiones"
          ? navigate("/payments")
          : navigate("/")
      }
    />
  );
}

function ReconciliationPage() {
  const [, navigate] = useLocation();
  return (
    <section className="min-h-[60vh] rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d95f61]">
        Control financiero
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#141719]">
        Conciliación
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Revisa y cruza tus movimientos registrados antes de marcar una operación
        como conciliada.
      </p>
      <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
        <p className="text-sm font-medium text-slate-700">
          No hay movimientos pendientes de conciliación.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Cuando existan recaudos o pagos, aparecerán aquí para su revisión.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-6 rounded-xl bg-[#e06465] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cc595b] focus:outline-none focus:ring-2 focus:ring-[#e06465]"
      >
        Volver al dashboard
      </button>
    </section>
  );
}

// Routes configuration
export const routes = [
  // Public routes
  {
    path: "/login",
    title: "Login",
    component: LoginPage,
    isPublic: true,
  },
  {
    path: "/register",
    title: "Register",
    isPublic: true,
  },

  // Protected routes
  {
    path: "/",
    title: "Dashboard",
    component: DashboardPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  },

  {
    path: "/receipts",
    title: "Recaudos",
    component: LegacyRecaudosPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
  },

  {
    path: "/global",
    title: "Bitaxus Global",
    component: LegacyGlobalPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  },

  {
    path: "/reconciliation",
    title: "Conciliación",
    component: ReconciliationPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  },

  {
    path: "/receipts/:id",
    title: "Detalle de Recaudo",
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  },

  {
    path: "/payments",
    title: "Pagos",
    component: PaymentsPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
  },

  {
    path: "/payments/:id",
    title: "Detalle de Pago",
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  },

  {
    path: "/dispersions",
    title: "Dispersiones",
    component: DispersionsPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
  },

  {
    path: "/dispersions/:id",
    title: "Detalle de Dispersión",
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  },

  {
    path: "/counterparties",
    title: "Contrapartes",
    component: CounterpartiesPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
  },

  {
    path: "/counterparties/:id",
    title: "Detalle de Contraparte",
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  },

  {
    path: "/accounts",
    title: "Cuentas Bancarias",
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
  },

  {
    path: "/reports",
    title: "Reportes",
    component: ReportsPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  },

  {
    path: "/settings",
    title: "Configuración",
    component: SettingsPage,
    requiredRoles: [UserRole.ADMIN],
  },

  // Error routes
  {
    path: "/unauthorized",
    title: "Acceso Denegado",
    isPublic: true,
  },

  {
    path: "/:path*",
    title: "Página No Encontrada",
    isPublic: true,
  },
];

/**
 * Router Component
 */
function RouterContent() {
  return (
    <RootRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      {routes.map(route => (
        <Route key={route.path} path={route.path}>
          {route.component ? (
            route.isPublic ? (
              <route.component />
            ) : (
              <ProtectedRoute
                component={route.component}
                requiredRoles={route.requiredRoles}
              />
            )
          ) : route.path === "/unauthorized" ? (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-red-900 mb-2">403</h1>
                <p className="text-red-700 mb-4">Acceso denegado</p>
                <a href="/" className="text-blue-600 hover:text-blue-700">
                  Volver al inicio
                </a>
              </div>
            </div>
          ) : (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
                <p className="text-gray-600 mb-4">Página no encontrada</p>
                <a href="/" className="text-blue-600 hover:text-blue-700">
                  Volver al inicio
                </a>
              </div>
            </div>
          )}
        </Route>
      ))}
    </RootRouter>
  );
}

export function Router() {
  return (
    <AuthProvider>
      <RouterContent />
    </AuthProvider>
  );
}

export default Router;
