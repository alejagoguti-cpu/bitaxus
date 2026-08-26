import { PaymentOperationsWorkspace } from "./PaymentOperationsWorkspace";
import { useLocation } from "wouter";

export function DispersionsPage({ tenantId }: { tenantId: string }) {
  const [location] = useLocation();
  const autoOpen = new URLSearchParams(location.split("?")[1] ?? "").get("new") === "1";
  return <PaymentOperationsWorkspace tenantId={tenantId} scope="Dispersión" autoOpen={autoOpen} />;
}
