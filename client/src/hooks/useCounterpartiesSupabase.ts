/**
 * useCounterpartiesSupabase Hook
 * Supabase integration for counterparties (clients/suppliers)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, callEdgeFunction } from "@/lib/supabase";
import { Counterparty } from "@shared/types";

interface UseCounterpartiesOptions {
  tenantId: string;
  type?: "client" | "supplier";
  search?: string;
  page?: number;
  limit?: number;
}

export function useCounterpartiesSupabase(options: UseCounterpartiesOptions) {
  return useQuery({
    queryKey: [
      "counterparties",
      options.tenantId,
      options.type,
      options.search,
      options.page,
      options.limit,
    ],
    queryFn: async () => {
      let query = supabase
        .from("counterparties")
        .select("*", { count: "exact" })
        .eq("tenant_id", options.tenantId)
        .order("name", { ascending: true });

      if (options.type) {
        query = query.eq("type", options.type);
      }

      if (options.search) {
        query = query.or(
          `name.ilike.%${options.search}%,email.ilike.%${options.search}%`
        );
      }

      const offset = ((options.page || 1) - 1) * (options.limit || 10);
      query = query.range(offset, offset + (options.limit || 10) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Counterparty[],
        total: count || 0,
        page: options.page || 1,
        limit: options.limit || 10,
      };
    },
    staleTime: 30000,
    retry: 2,
  });
}

export function useCounterpartySupabase(counterpartyId: string) {
  return useQuery({
    queryKey: ["counterparty", counterpartyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counterparties")
        .select("*")
        .eq("id", counterpartyId)
        .single();

      if (error) throw error;
      return data as Counterparty;
    },
    staleTime: 30000,
    retry: 2,
  });
}

export function useCreateCounterpartySupabase(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Counterparty, "id" | "tenant_id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("counterparties")
        .insert({
          tenant_id: tenantId,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return result as Counterparty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["counterparties", tenantId],
      });
    },
    onError: (error) => {
      console.error("Error creating counterparty:", error);
      throw error;
    },
  });
}

export function useUpdateCounterpartySupabase(
  counterpartyId: string,
  tenantId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Counterparty>) => {
      const { data: result, error } = await supabase
        .from("counterparties")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", counterpartyId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return result as Counterparty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counterparty", counterpartyId] });
      queryClient.invalidateQueries({ queryKey: ["counterparties", tenantId] });
    },
    onError: (error) => {
      console.error("Error updating counterparty:", error);
      throw error;
    },
  });
}

export function useDeleteCounterpartySupabase(
  counterpartyId: string,
  tenantId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("counterparties")
        .delete()
        .eq("id", counterpartyId)
        .eq("tenant_id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counterparty", counterpartyId] });
      queryClient.invalidateQueries({ queryKey: ["counterparties", tenantId] });
    },
    onError: (error) => {
      console.error("Error deleting counterparty:", error);
      throw error;
    },
  });
}

export function useCounterpartySubscription(tenantId: string) {
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ["counterparties-subscription", tenantId],
    queryFn: async () => {
      const subscription = supabase
        .channel(`counterparties:${tenantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "counterparties",
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            queryClient.invalidateQueries({
              queryKey: ["counterparties", tenantId],
            });
            if (payload.new?.id) {
              queryClient.invalidateQueries({
                queryKey: ["counterparty", payload.new.id],
              });
            }
          }
        )
        .subscribe();

      return subscription;
    },
    enabled: !!tenantId,
    staleTime: Infinity,
  });
}
