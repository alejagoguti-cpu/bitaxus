/**
 * Router Configuration
 * App routes with role-based access control
 */

import { RootRouter, Route } from "wouter";
import { UserRole } from "@/shared/types";
import { DashboardPage } from "@/pages/DashboardPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { DispersionsPage } from "@/pages/DispersionsPage";
import { CounterpartiesPage } from "@/pages/CounterpartiesPage";
import { ReportsPage } from "@/pages/ReportsPage";

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
  // Get user from context/auth
  // const { user } = useAuth();

  // if (!user) {
  //   return <Navigate to="/login" />;
  // }

  // if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
  //   return <Navigate to="/unauthorized" />;
  // }

  return <Component {...rest} />;
}

// Routes configuration
export const routes = [
  // Public routes
  {
    path: "/login",
    title: "Login",
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
export function Router() {
  return (
    <RootRouter>
      {routes.map((route) => (
        <Route key={route.path} path={route.path}>
          {route.component ? (
            <ProtectedRoute
              component={route.component}
              requiredRoles={route.requiredRoles}
            />
          ) : (
            <div>En construcción: {route.title}</div>
          )}
        </Route>
      ))}
    </RootRouter>
  );
}

export default Router;
