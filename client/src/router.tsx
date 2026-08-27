/**
 * Router Configuration
 * App routes with role-based access control
 */

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Router as RootRouter, Route, Redirect, Switch } from "wouter";
import { UserRole } from "@shared/types";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { ProgramarPagoPage } from "@/pages/ProgramarPagoPage";
import { DispersionsPage } from "@/pages/DispersionsPage";
import { CounterpartiesPage } from "@/pages/CounterpartiesPage";
import { CounterpartyDetailPage } from "@/pages/CounterpartyDetailPage";
import { PaymentDetailPage } from "@/pages/PaymentDetailPage";
import { ReceiptDetailPage } from "@/pages/ReceiptDetailPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import Recaudos from "@/pages/Recaudos";
import { ProgramarRecaudoPage } from "@/pages/ProgramarRecaudoPage";
import Global from "@/pages/Global";
import { useLocation } from "wouter";
import { PublicReconciliationPage } from "@/pages/PublicReconciliationPage";

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b-[#e06465]"></div>
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

function LegacyRecaudosPage({ tenantId }: { tenantId?: string }) {
  const [location, navigate] = useLocation();
  const [receiptModalRequest, setReceiptModalRequest] = useState(0);
  const [receiptToastVisible, setReceiptToastVisible] = useState(false);
  const openReceiptModal = () => setReceiptModalRequest(request => request + 1);
  const closeReceiptModal = () => {
    setReceiptModalRequest(0);
    navigate("/receipts");
  };

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setReceiptModalRequest(request => request || 1);
      navigate("/receipts", { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!receiptToastVisible) return;
    const timeout = window.setTimeout(() => setReceiptToastVisible(false), 4200);
    return () => window.clearTimeout(timeout);
  }, [receiptToastVisible]);

  return (
    <>
      <Recaudos
        onNavigate={section =>
          section === "Pagos y dispersiones"
            ? navigate("/payments")
            : section === "Programar recaudo"
              ? openReceiptModal()
              : navigate("/")
        }
      />
      {receiptModalRequest > 0 && (
        <div className="receipt-modal-backdrop" role="presentation">
          <section className="receipt-modal-window" role="dialog" aria-modal="true" aria-label="Programar recaudo" onMouseDown={event => event.stopPropagation()}>
            <button type="button" className="receipt-modal-close" onClick={closeReceiptModal} aria-label="Cerrar Programar recaudo"><X size={16} /></button>
            <ProgramarRecaudoPage
              tenantId={tenantId}
              presentation="modal"
              onClose={closeReceiptModal}
              onSuccess={() => {
                closeReceiptModal();
                setReceiptToastVisible(true);
              }}
            />
          </section>
        </div>
      )}
      {receiptToastVisible && (
        <div className="receipt-success-toast" role="status" aria-live="polite">
          <span className="receipt-success-toast-icon"><CheckCircle2 size={17} /></span>
          <span><strong>Recaudo programado correctamente</strong><small>La operación quedó registrada como pendiente.</small></span>
          <button type="button" onClick={() => setReceiptToastVisible(false)} aria-label="Cerrar confirmación"><X size={15} /></button>
        </div>
      )}
    </>
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
    path: "/receipts/new",
    title: "Programar recaudo",
    component: ProgramarRecaudoPage,
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
    component: PublicReconciliationPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  },

  {
    path: "/receipts/:id",
    title: "Detalle de Recaudo",
    component: ReceiptDetailPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  },

  {
    path: "/payments",
    title: "Pagos",
    component: PaymentsPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
  },

  {
    path: "/payments/new",
    title: "Programar pago",
    component: ProgramarPagoPage,
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
  },

  {
    path: "/payments/:id",
    title: "Detalle de Pago",
    component: PaymentDetailPage,
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
    component: CounterpartyDetailPage,
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
      <Switch>
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
              <div className="min-h-screen flex items-center justify-center bg-[#faf8f7]">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-[#141719] mb-2">403</h1>
                  <p className="text-[#d95f61] mb-4">Acceso denegado</p>
                  <a href="/" className="text-[#d95f61] hover:text-[#b94f51]">
                    Volver al inicio
                  </a>
                </div>
              </div>
            ) : (
              <div className="min-h-screen flex items-center justify-center bg-[#faf8f7]">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-[#141719] mb-2">404</h1>
                  <p className="text-[#66706f] mb-4">Página no encontrada</p>
                  <a href="/" className="text-[#d95f61] hover:text-[#b94f51]">
                    Volver al inicio
                  </a>
                </div>
              </div>
            )}
          </Route>
        ))}
      </Switch>
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
