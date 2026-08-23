import { PaymentOperationsWorkspace } from "./PaymentOperationsWorkspace";

export function DispersionsPage({ tenantId }: { tenantId: string }) {
  return <PaymentOperationsWorkspace tenantId={tenantId} scope="Dispersión" />;
}
