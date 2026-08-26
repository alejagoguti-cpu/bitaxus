import { PaymentOperationsWorkspace } from "./PaymentOperationsWorkspace";

export function DispersionsPage({ tenantId }: { tenantId: string }) {
  const autoOpen = new URLSearchParams(window.location.search).get("new") === "1";
  return <PaymentOperationsWorkspace tenantId={tenantId} scope="Dispersión" autoOpen={autoOpen} />;
}
