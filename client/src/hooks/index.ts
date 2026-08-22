/**
 * Hooks Index
 * Export all custom React hooks
 */

export {
  useReceipts,
  useReceipt,
  useCreateReceipt,
  useUpdateReceipt,
  useReceiptOperations,
} from "./useReceipts";

export {
  usePayments,
  usePayment,
  useCreatePayment,
  useProcessPayment,
  useCancelPayment,
  usePaymentOperations,
} from "./usePayments";

export {
  useDashboardMetrics,
  useDashboardState,
  useDashboardComparison,
  useDashboardWidgets,
} from "./useDashboard";
