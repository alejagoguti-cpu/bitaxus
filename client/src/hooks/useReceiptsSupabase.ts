/**
 * useReceiptsSupabase Hook
 * Example: Using Supabase directly with React Query
 *
 * This demonstrates the pattern for replacing API service calls
 * with direct Supabase queries. Apply this pattern to other hooks.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, callEdgeFunction } from "@/lib/supabase";
import { Receipt, ReceiptStatus } from "@/shared/types";

interface UseReceiptsOptions {
  tenantId: string;
  status?: ReceiptStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch receipts directly from Supabase with RLS
 */
export function useReceiptsSupabase(options: UseReceiptsOptions) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [
      "receipts",
      options.tenantId,
      options.status,
      options.startDate,
      options.endDate,
      options.page,
      options.limit,
    ],
    queryFn: async () => {
      let query = supabase
        .from("receipts")
        .select(
          `
          *,
          payer:counterparties(id, name, email),
          created_by:users(id, name)
        `,
          { count: "exact" }
        )
        .eq("tenant_id", options.tenantId)
        .order("created_at", { ascending: false });

      // Add filters
      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.startDate) {
        query = query.gte("date", options.startDate);
      }

      if (options.endDate) {
        query = query.lte("date", options.endDate);
      }

      // Pagination
      const offset = ((options.page || 1) - 1) * (options.limit || 10);
      query = query.range(offset, offset + (options.limit || 10) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Receipt[],
        total: count || 0,
        page: options.page || 1,
        limit: options.limit || 10,
      };
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}

/**
 * Fetch single receipt
 */
export function useReceiptSupabase(receiptId: string) {
  return useQuery({
    queryKey: ["receipt", receiptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select(
          `
          *,
          payer:counterparties(id, name, email, phone),
          created_by:users(id, name, email)
        `
        )
        .eq("id", receiptId)
        .single();

      if (error) throw error;
      return data as Receipt;
    },
    staleTime: 30000,
    retry: 2,
  });
}

/**
 * Create receipt via Edge Function
 */
export function useCreateReceiptSupabase(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      payerId: string;
      concept: string;
      amount: number;
      currency: string;
      date: string;
      referenceId?: string;
      notes?: string;
    }) => {
      return callEdgeFunction("receipts/create", {
        tenant_id: tenantId,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["receipts", tenantId],
        exact: false,
      });
    },
    onError: (error) => {
      console.error("Error creating receipt:", error);
      throw error;
    },
  });
}

/**
 * Update receipt status
 */
export function useUpdateReceiptSupabase(receiptId: string, tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: ReceiptStatus) => {
      const { data, error } = await supabase
        .from("receipts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", receiptId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return data as Receipt;
    },
    onSuccess: () => {
      // Invalidate both the single receipt and receipts list
      queryClient.invalidateQueries({ queryKey: ["receipt", receiptId] });
      queryClient.invalidateQueries({ queryKey: ["receipts", tenantId] });
    },
    onError: (error) => {
      console.error("Error updating receipt:", error);
      throw error;
    },
  });
}

/**
 * Subscribe to real-time receipt updates
 */
export function useReceiptSubscription(tenantId: string) {
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ["receipts-subscription", tenantId],
    queryFn: async () => {
      const subscription = supabase
        .channel(`receipts:${tenantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "receipts",
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            // Invalidate on any change
            queryClient.invalidateQueries({
              queryKey: ["receipts", tenantId],
            });
            if (payload.new?.id) {
              queryClient.invalidateQueries({
                queryKey: ["receipt", payload.new.id],
              });
            }
          }
        )
        .subscribe();

      return subscription;
    },
    enabled: !!tenantId,
    staleTime: Infinity, // Don't refetch
  });
}
