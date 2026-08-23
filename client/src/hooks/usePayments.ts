/**
 * usePayments Hook
 * React hook for managing payments (pagos)
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAPI } from "@/services/api";
import { Payment, CreatePaymentRequest, PaymentStatus } from "@shared/types";

interface UsePaymentsOptions {
  tenantId: string;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook to fetch payments
 */
export function usePayments(options: UsePaymentsOptions) {
  const queryClient = useQueryClient();
  const api = getAPI();

  const query = useQuery({
    queryKey: [
      "payments",
      options.tenantId,
      options.status,
      options.startDate,
      options.endDate,
      options.page,
      options.limit,
    ],
    queryFn: () =>
      api.getPayments(options.tenantId, {
        status: options.status,
        startDate: options.startDate,
        endDate: options.endDate,
        page: options.page,
        limit: options.limit,
      }),
    staleTime: 30000,
    retry: 2,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["payments", options.tenantId],
    });
  }, [queryClient, options.tenantId]);

  return { ...query, invalidate };
}

/**
 * Hook to fetch a single payment
 */
export function usePayment(paymentId: string) {
  const api = getAPI();

  return useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => api.getPayment(paymentId),
    staleTime: 30000,
    retry: 2,
  });
}

/**
 * Hook to create a payment
 */
export function useCreatePayment(tenantId: string) {
  const queryClient = useQueryClient();
  const api = getAPI();

  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => api.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments", tenantId],
      });
    },
    onError: (error) => {
      console.error("Error creating payment:", error);
    },
  });
}

/**
 * Hook to process a payment (execute)
 */
export function useProcessPayment(tenantId: string) {
  const queryClient = useQueryClient();
  const api = getAPI();

  return useMutation({
    mutationFn: (paymentId: string) =>
      api.processPayment({ paymentId, tenantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments", tenantId],
      });
    },
    onError: (error) => {
      console.error("Error processing payment:", error);
    },
  });
}

/**
 * Hook to cancel a payment
 */
export function useCancelPayment(tenantId: string) {
  const queryClient = useQueryClient();
  const api = getAPI();

  return useMutation({
    mutationFn: (paymentId: string) => api.cancelPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments", tenantId],
      });
    },
    onError: (error) => {
      console.error("Error canceling payment:", error);
    },
  });
}

/**
 * Hook for payment operations with state management
 */
export function usePaymentOperations(tenantId: string) {
  const createMutation = useCreatePayment(tenantId);
  const processMutation = useProcessPayment(tenantId);
  const cancelMutation = useCancelPayment(tenantId);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleCreatePayment = useCallback(
    async (data: CreatePaymentRequest) => {
      try {
        setErrorMessage("");
        setSuccessMessage("");

        await createMutation.mutateAsync(data);

        setSuccessMessage(
          `Pago ${data.concept} por $${data.amount} programado para ${data.scheduledDate}`
        );

        setTimeout(() => setSuccessMessage(""), 5000);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Error desconocido";
        setErrorMessage(errorMsg);
      }
    },
    [createMutation]
  );

  const handleProcessPayment = useCallback(
    async (paymentId: string) => {
      try {
        setErrorMessage("");
        setSuccessMessage("");

        await processMutation.mutateAsync(paymentId);

        setSuccessMessage("Pago procesado exitosamente");

        setTimeout(() => setSuccessMessage(""), 5000);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Error desconocido";
        setErrorMessage(errorMsg);
      }
    },
    [processMutation]
  );

  const handleCancelPayment = useCallback(
    async (paymentId: string) => {
      try {
        setErrorMessage("");
        setSuccessMessage("");

        await cancelMutation.mutateAsync(paymentId);

        setSuccessMessage("Pago cancelado");

        setTimeout(() => setSuccessMessage(""), 5000);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Error desconocido";
        setErrorMessage(errorMsg);
      }
    },
    [cancelMutation]
  );

  return {
    handleCreatePayment,
    handleProcessPayment,
    handleCancelPayment,
    isLoading:
      createMutation.isPending ||
      processMutation.isPending ||
      cancelMutation.isPending,
    isError:
      createMutation.isError ||
      processMutation.isError ||
      cancelMutation.isError,
    isSuccess:
      createMutation.isSuccess ||
      processMutation.isSuccess ||
      cancelMutation.isSuccess,
    successMessage,
    errorMessage,
  };
}
