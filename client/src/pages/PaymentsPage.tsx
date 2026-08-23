import { PaymentOperationsWorkspace } from "./PaymentOperationsWorkspace";

export function PaymentsPage({ tenantId }: { tenantId: string }) {
  return <PaymentOperationsWorkspace tenantId={tenantId} scope="all" />;
}
