/**
 * usePaymentOperationsSupabase Hook
 * High-level payment operations state management
 */

import { useCallback } from "react";
import {
  useCreatePaymentSupabase,
  useProcessPaymentSupabase,
  useCancelPaymentSupabase,
} from "./usePaymentsSupabase";
import { useQueryClient } from "@tanstack/react-query";

interface PaymentOperationState {
  isLoading: boolean;
  error: Error | null;
}

export function usePaymentOperationsSupabase(tenantId: string) {
  const queryClient = useQueryClient();

  const createMutation = useCreatePaymentSupabase(tenantId);
  const processMutation = useProcessPaymentSupabase("", tenantId);
  const cancelMutation = useCancelPaymentSupabase("", tenantId);

  const create = useCallback(
    async (data: any) => {
      return createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const process = useCallback(
    async (paymentId: string) => {
      const mutation = useProcessPaymentSupabase(paymentId, tenantId);
      return mutation.mutateAsync();
    },
    [tenantId]
  );

  const cancel = useCallback(
    async (paymentId: string) => {
      const mutation = useCancelPaymentSupabase(paymentId, tenantId);
      return mutation.mutateAsync();
    },
    [tenantId]
  );

  const state: PaymentOperationState = {
    isLoading:
      createMutation.isPending ||
      processMutation.isPending ||
      cancelMutation.isPending,
    error:
      createMutation.error ||
      processMutation.error ||
      cancelMutation.error ||
      null,
  };

  return {
    ...state,
    create,
    process,
    cancel,
    reset: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", tenantId] });
    },
  };
}

export function usePaymentBatchOperationsSupabase(tenantId: string) {
  const queryClient = useQueryClient();
  const createMutation = useCreatePaymentSupabase(tenantId);

  const createBatch = useCallback(
    async (payments: any[]) => {
      const results = [];
      for (const payment of payments) {
        try {
          const result = await createMutation.mutateAsync(payment);
          results.push({ success: true, data: result });
        } catch (error) {
          results.push({ success: false, error });
        }
      }
      return results;
    },
    [createMutation]
  );

  return {
    isLoading: createMutation.isPending,
    error: createMutation.error,
    createBatch,
    reset: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", tenantId] });
    },
  };
}
