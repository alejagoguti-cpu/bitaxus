import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type GlobalOperationType = "Recepción" | "Conversión" | "Dispersión";
export type GlobalOperationStatus = "Pendiente" | "En proceso" | "Confirmada" | "Procesada" | "Cancelada" | "Fallida";

export interface PublicGlobalOperation {
  id: string;
  operation_type: GlobalOperationType;
  source_currency: string;
  target_currency: string | null;
  source_amount: number;
  target_amount: number | null;
  exchange_rate: number | null;
  account: string | null;
  counterparty: string | null;
  reference: string | null;
  description: string | null;
  operation_date: string;
  status: GlobalOperationStatus;
  created_by_name: string | null;
  created_at: string;
}

export interface GlobalOperationInput {
  operation_type: GlobalOperationType;
  source_currency: string;
  target_currency?: string;
  source_amount: number;
  target_amount?: number;
  exchange_rate?: number;
  account?: string;
  counterparty?: string;
  reference?: string;
  description?: string;
  operation_date: string;
}

export function useGlobalOperationsSupabase(tenantId?: string, filters?: { from?: string; to?: string; operationType?: GlobalOperationType; status?: GlobalOperationStatus; search?: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["global-operations", tenantId ?? "anonymous", filters ?? {}];
  const operationsQuery = useQuery<PublicGlobalOperation[]>({
    queryKey,
    queryFn: async () => {
      let query = supabase.from("global_operations").select("id, operation_type, source_currency, target_currency, source_amount, target_amount, exchange_rate, account, counterparty, reference, description, operation_date, status, created_by_name, created_at").order("operation_date", { ascending: false }).limit(200);
      if (filters?.from) query = query.gte("operation_date", filters.from);
      if (filters?.to) query = query.lte("operation_date", filters.to);
      if (filters?.operationType) query = query.eq("operation_type", filters.operationType);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.search) query = query.or(`reference.ilike.%${filters.search}%,counterparty.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PublicGlobalOperation[];
    },
    // RLS filters rows by auth.uid(); tenantId is presentation metadata only.
    enabled: true,
    retry: false,
    staleTime: 30000,
  });

  const createOperation = useMutation({
    mutationFn: async (input: GlobalOperationInput) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
      const { data, error } = await supabase.from("global_operations").insert({ ...input, source_currency: input.source_currency.toUpperCase(), target_currency: input.target_currency?.toUpperCase() || null, created_by_open_id: user.id, created_by_name: user.user_metadata?.name || user.email || null }).select("id, operation_type, source_currency, target_currency, source_amount, target_amount, exchange_rate, account, counterparty, reference, description, operation_date, status, created_by_name, created_at").single();
      if (error) throw error;
      return data as PublicGlobalOperation;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["global-operations"] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: GlobalOperationStatus }) => {
      const { data, error } = await supabase.from("global_operations").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("id, operation_type, source_currency, target_currency, source_amount, target_amount, exchange_rate, account, counterparty, reference, description, operation_date, status, created_by_name, created_at").single();
      if (error) throw error;
      return data as PublicGlobalOperation;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["global-operations"] }),
  });

  return { operationsQuery, createOperation, updateStatus };
}
