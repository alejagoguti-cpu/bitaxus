/**
 * useDispersionsSupabase Hook
 * Supabase integration for dispersions with line items
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, callEdgeFunction } from "@/lib/supabase";
import { Dispersion } from "@shared/types";

interface UseDispersionsOptions {
  tenantId: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useDispersionsSupabase(options: UseDispersionsOptions) {
  return useQuery({
    queryKey: [
      "dispersions",
      options.tenantId,
      options.status,
      options.startDate,
      options.endDate,
      options.page,
      options.limit,
    ],
    queryFn: async () => {
      let query = supabase
        .from("dispersions")
        .select(
          `
          *,
          created_by:users(id, name)
        `,
          { count: "exact" }
        )
        .eq("tenant_id", options.tenantId)
        .order("created_at", { ascending: false });

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.startDate) {
        query = query.gte("created_at", options.startDate);
      }

      if (options.endDate) {
        query = query.lte("created_at", options.endDate);
      }

      const offset = ((options.page || 1) - 1) * (options.limit || 10);
      query = query.range(offset, offset + (options.limit || 10) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Dispersion[],
        total: count || 0,
        page: options.page || 1,
        limit: options.limit || 10,
      };
    },
    staleTime: 30000,
    retry: 2,
  });
}

export function useDispersionSupabase(dispersionId: string) {
  return useQuery({
    queryKey: ["dispersion", dispersionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dispersions")
        .select(
          `
          *,
          items:dispersion_items(*),
          created_by:users(id, name, email)
        `
        )
        .eq("id", dispersionId)
        .single();

      if (error) throw error;
      return data as Dispersion;
    },
    staleTime: 30000,
    retry: 2,
  });
}

export function useCreateDispersionSupabase(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: any
    ) => {
      return callEdgeFunction("dispersions/create", {
        tenant_id: tenantId,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dispersions", tenantId],
      });
    },
    onError: (error) => {
      console.error("Error creating dispersion:", error);
      throw error;
    },
  });
}

export function useProcessDispersionSupabase(
  dispersionId: string,
  tenantId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return callEdgeFunction("dispersions/process", {
        dispersion_id: dispersionId,
        tenant_id: tenantId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispersion", dispersionId] });
      queryClient.invalidateQueries({ queryKey: ["dispersions", tenantId] });
    },
    onError: (error) => {
      console.error("Error processing dispersion:", error);
      throw error;
    },
  });
}

export function useCancelDispersionSupabase(
  dispersionId: string,
  tenantId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("dispersions")
        .update({
          status: "Cancelado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", dispersionId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return data as Dispersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispersion", dispersionId] });
      queryClient.invalidateQueries({ queryKey: ["dispersions", tenantId] });
    },
    onError: (error) => {
      console.error("Error canceling dispersion:", error);
      throw error;
    },
  });
}

export function useDispersionSubscription(tenantId: string) {
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ["dispersions-subscription", tenantId],
    queryFn: async () => {
      const subscription = supabase
        .channel(`dispersions:${tenantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "dispersions",
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            queryClient.invalidateQueries({
              queryKey: ["dispersions", tenantId],
            });
            if (payload.new?.id) {
              queryClient.invalidateQueries({
                queryKey: ["dispersion", payload.new.id],
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
