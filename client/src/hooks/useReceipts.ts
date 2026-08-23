/**
 * useReceipts Hook
 * React hook for managing receipts (recaudos)
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAPI } from "@/services/api";
import {
  Receipt,
  CreateReceiptRequest,
  ReceiptStatus,
} from "@shared/types";

interface UseReceiptsOptions {
  tenantId: string;
  status?: ReceiptStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook to fetch receipts with React Query
 */
export function useReceipts(options: UseReceiptsOptions) {
  const queryClient = useQueryClient();
  const api = getAPI();

  const query = useQuery({
    queryKey: [
      "receipts",
      options.tenantId,
      options.status,
      options.startDate,
      options.endDate,
      options.page,
      options.limit,
    ],
    queryFn: () =>
      api.getReceipts(options.tenantId, {
        status: options.status,
        startDate: options.startDate,
        endDate: options.endDate,
        page: options.page,
        limit: options.limit,
      }),
    staleTime: 30000, // 30 seconds
    retry: 2,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["receipts", options.tenantId],
    });
  }, [queryClient, options.tenantId]);

  return { ...query, invalidate };
}

/**
 * Hook to fetch a single receipt
 */
export function useReceipt(receiptId: string) {
  const api = getAPI();

  return useQuery({
    queryKey: ["receipt", receiptId],
    queryFn: () => api.getReceipt(receiptId),
    staleTime: 30000,
    retry: 2,
  });
}

/**
 * Hook to create a receipt
 */
export function useCreateReceipt(tenantId: string) {
  const queryClient = useQueryClient();
  const api = getAPI();

  return useMutation({
    mutationFn: (data: CreateReceiptRequest) => api.createReceipt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["receipts", tenantId],
      });
    },
    onError: (error) => {
      console.error("Error creating receipt:", error);
    },
  });
}

/**
 * Hook to update a receipt
 */
export function useUpdateReceipt(receiptId: string) {
  const queryClient = useQueryClient();
  const api = getAPI();

  return useMutation({
    mutationFn: (data: Partial<Receipt>) =>
      api.updateReceipt(receiptId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["receipt", receiptId],
      });
      queryClient.invalidateQueries({
        queryKey: ["receipts"],
      });
    },
    onError: (error) => {
      console.error("Error updating receipt:", error);
    },
  });
}

/**
 * Hook for receipt operations (loading, error, success states)
 */
export function useReceiptOperations(tenantId: string) {
  const createMutation = useCreateReceipt(tenantId);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleCreateReceipt = useCallback(
    async (data: CreateReceiptRequest) => {
      try {
        setErrorMessage("");
        setSuccessMessage("");

        await createMutation.mutateAsync(data);

        setSuccessMessage(
          `Recaudo ${data.concept} por $${data.amount} creado exitosamente`
        );

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Error desconocido";
        setErrorMessage(errorMsg);
      }
    },
    [createMutation]
  );

  return {
    handleCreateReceipt,
    isLoading: createMutation.isPending,
    isError: createMutation.isError,
    isSuccess: createMutation.isSuccess,
    successMessage,
    errorMessage,
  };
}
