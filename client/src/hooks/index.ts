/**
 * Hooks Index
 * Export all custom React hooks (Supabase version)
 */

// Receipts - Supabase
export {
  useReceiptsSupabase as useReceipts,
  useReceiptSupabase as useReceipt,
  useCreateReceiptSupabase as useCreateReceipt,
  useUpdateReceiptSupabase as useUpdateReceipt,
  useEditReceiptSupabase,
  useReceiptSubscription,
} from "./useReceiptsSupabase";

// Payments - Supabase
export {
  usePaymentsSupabase as usePayments,
  usePaymentSupabase as usePayment,
  useCreatePaymentSupabase as useCreatePayment,
  useProcessPaymentSupabase as useProcessPayment,
  useCancelPaymentSupabase as useCancelPayment,
  useUpdatePaymentSupabase,
} from "./usePaymentsSupabase";
export { usePaymentOperationsSupabase as usePaymentOperations } from "./usePaymentOperationsSupabase";

// Dashboard - Supabase
export {
  useDashboardMetricsSupabase as useDashboardMetrics,
  useDashboardWidgetsSupabase as useDashboardWidgets,
  useDashboardRecentActivity,
} from "./useDashboardSupabase";

// Counterparties - Supabase
export {
  useCounterpartiesSupabase as useCounterparties,
  useCounterpartySupabase as useCounterparty,
  useCreateCounterpartySupabase as useCreateCounterparty,
  useUpdateCounterpartySupabase as useUpdateCounterparty,
  useDeleteCounterpartySupabase as useDeleteCounterparty,
  useCounterpartySubscription,
} from "./useCounterpartiesSupabase";

// Bank Accounts - Supabase
export {
  useBankAccountsSupabase as useBankAccounts,
  useBankAccountSupabase as useBankAccount,
  useCreateBankAccountSupabase as useCreateBankAccount,
  useUpdateBankAccountSupabase as useUpdateBankAccount,
  useDeleteBankAccountSupabase as useDeleteBankAccount,
  useBankAccountSubscription,
} from "./useBankAccountsSupabase";

// Dispersions - Supabase
export {
  useDispersionsSupabase as useDispersions,
  useDispersionSupabase as useDispersion,
  useCreateDispersionSupabase as useCreateDispersion,
  useProcessDispersionSupabase as useProcessDispersion,
  useCancelDispersionSupabase as useCancelDispersion,
  useDispersionSubscription,
} from "./useDispersionsSupabase";

// Utilities
export { useComposition } from "./useComposition";
export { useMobile } from "./useMobile";
export { usePersistFn } from "./usePersistFn";
