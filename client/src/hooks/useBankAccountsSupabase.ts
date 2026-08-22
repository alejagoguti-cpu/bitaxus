/**
 * useBankAccountsSupabase Hook
 * Supabase integration for bank accounts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BankAccount } from "@/shared/types";

interface UseBankAccountsOptions {
  tenantId: string;
  page?: number;
  limit?: number;
}

export function useBankAccountsSupabase(options: UseBankAccountsOptions) {
  return useQuery({
    queryKey: [
      "bank_accounts",
      options.tenantId,
      options.page,
      options.limit,
    ],
    queryFn: async () => {
      let query = supabase
        .from("bank_accounts")
        .select("*", { count: "exact" })
        .eq("tenant_id", options.tenantId)
        .order("bank_name", { ascending: true });

      const offset = ((options.page || 1) - 1) * (options.limit || 10);
      query = query.range(offset, offset + (options.limit || 10) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as BankAccount[],
        total: count || 0,
        page: options.page || 1,
        limit: options.limit || 10,
      };
    },
    staleTime: 30000,
    retry: 2,
  });
}

export function useBankAccountSupabase(accountId: string) {
  return useQuery({
    queryKey: ["bank_account", accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("id", accountId)
        .single();

      if (error) throw error;
      return data as BankAccount;
    },
    staleTime: 30000,
    retry: 2,
  });
}

export function useCreateBankAccountSupabase(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Omit<BankAccount, "id" | "tenant_id" | "created_at" | "updated_at">
    ) => {
      const { data: result, error } = await supabase
        .from("bank_accounts")
        .insert({
          tenant_id: tenantId,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return result as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bank_accounts", tenantId],
      });
    },
    onError: (error) => {
      console.error("Error creating bank account:", error);
      throw error;
    },
  });
}

export function useUpdateBankAccountSupabase(
  accountId: string,
  tenantId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BankAccount>) => {
      const { data: result, error } = await supabase
        .from("bank_accounts")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return result as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_account", accountId] });
      queryClient.invalidateQueries({ queryKey: ["bank_accounts", tenantId] });
    },
    onError: (error) => {
      console.error("Error updating bank account:", error);
      throw error;
    },
  });
}

export function useDeleteBankAccountSupabase(
  accountId: string,
  tenantId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", accountId)
        .eq("tenant_id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_account", accountId] });
      queryClient.invalidateQueries({ queryKey: ["bank_accounts", tenantId] });
    },
    onError: (error) => {
      console.error("Error deleting bank account:", error);
      throw error;
    },
  });
}

export function useBankAccountSubscription(tenantId: string) {
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ["bank_accounts-subscription", tenantId],
    queryFn: async () => {
      const subscription = supabase
        .channel(`bank_accounts:${tenantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bank_accounts",
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            queryClient.invalidateQueries({
              queryKey: ["bank_accounts", tenantId],
            });
            if (payload.new?.id) {
              queryClient.invalidateQueries({
                queryKey: ["bank_account", payload.new.id],
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
