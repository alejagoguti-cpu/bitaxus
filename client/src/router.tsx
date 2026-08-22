/**
 * Router Configuration
 * App routes with role-based access control
 */

import { RootRouter, Route, Redirect } from "wouter";
import { UserRole } from "@/shared/types";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { DispersionsPage } from "@/pages/DispersionsPage";
import { CounterpartiesPage } from "@/pages/CounterpartiesPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";

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
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
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
    <RootRouter>
      {routes.map((route) => (
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
