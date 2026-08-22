/**
 * usePaymentsSupabase Hook
 * Supabase integration for payments
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, callEdgeFunction } from "@/lib/supabase";
import { Payment, PaymentStatus } from "@/shared/types";

interface UsePaymentsOptions {
  tenantId: string;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function usePaymentsSupabase(options: UsePaymentsOptions) {
  return useQuery({
    queryKey: [
      "payments",
      options.tenantId,
      options.status,
      options.startDate,
      options.endDate,
      options.page,
      options.limit,
    ],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(
          `
          *,
          beneficiary:counterparties(id, name, email),
          source_account:bank_accounts(id, bank_name, account_number),
          created_by:users(id, name)
        `,
          { count: "exact" }
        )
        .eq("tenant_id", options.tenantId)
        .order("scheduled_date", { ascending: false });

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.startDate) {
        query = query.gte("scheduled_date", options.startDate);
      }

      if (options.endDate) {
        query = query.lte("scheduled_date", options.endDate);
      }

      const offset = ((options.page || 1) - 1) * (options.limit || 10);
      query = query.range(offset, offset + (options.limit || 10) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Payment[],
        total: count || 0,
        page: options.page || 1,
        limit: options.limit || 10,
      };
    },
    staleTime: 30000,
    retry: 2,
  });
}

export function usePaymentSupabase(paymentId: string) {
  return useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          *,
          beneficiary:counterparties(id, name, email, phone),
          source_account:bank_accounts(id, bank_name, account_number, account_holder),
          created_by:users(id, name, email)
        `
        )
        .eq("id", paymentId)
        .single();

      if (error) throw error;
      return data as Payment;
    },
    staleTime: 30000,
    retry: 2,
  });
}

export function useCreatePaymentSupabase(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return callEdgeFunction("payments/create", {
        tenant_id: tenantId,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments", tenantId],
        exact: false,
      });
    },
    onError: (error) => {
      console.error("Error creating payment:", error);
      throw error;
    },
  });
}

export function useProcessPaymentSupabase(
  paymentId: string,
  tenantId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return callEdgeFunction("payments/process", {
        payment_id: paymentId,
        tenant_id: tenantId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment", paymentId] });
      queryClient.invalidateQueries({ queryKey: ["payments", tenantId] });
    },
    onError: (error) => {
      console.error("Error processing payment:", error);
      throw error;
    },
  });
}

export function useCancelPaymentSupabase(
  paymentId: string,
  tenantId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .update({
          status: "Cancelado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment", paymentId] });
      queryClient.invalidateQueries({ queryKey: ["payments", tenantId] });
    },
    onError: (error) => {
      console.error("Error canceling payment:", error);
      throw error;
    },
  });
}
