import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PublicCounterparty {
  id: string;
  name: string;
  id_type: string;
  identification_number: string;
  relation: "Cliente" | "Proveedor";
  phone: string | null;
  email: string | null;
  bank: string | null;
  account_type: string | null;
  account_number: string | null;
  status: "Activa" | "Inactiva";
  created_at: string;
  updated_at: string;
}

export interface CounterpartyInput {
  name: string;
  id_type: string;
  identification_number: string;
  relation: "Cliente" | "Proveedor";
  phone: string;
  email: string;
  bank: string;
  account_type: string;
  account_number: string;
}

const selectColumns = "id,name,id_type,identification_number,relation,phone,email,bank,account_type,account_number,status,created_at,updated_at";

type CounterpartyFilters = { relation?: "Cliente" | "Proveedor"; status?: "Activa" | "Inactiva"; search?: string };
type CounterpartyOptions = { tenantId: string; type?: "client" | "supplier"; search?: string; page?: number; limit?: number };

type CounterpartyListResponse = { data: PublicCounterparty[]; total: number; page: number; limit: number };
export function useCounterpartiesSupabase(tenantId?: string, filters?: CounterpartyFilters): UseQueryResult<PublicCounterparty[]>;
export function useCounterpartiesSupabase(options: CounterpartyOptions): UseQueryResult<CounterpartyListResponse>;
export function useCounterpartiesSupabase(tenantOrOptions?: string | CounterpartyOptions, filters?: CounterpartyFilters): UseQueryResult<PublicCounterparty[]> | UseQueryResult<CounterpartyListResponse> {
  const options = typeof tenantOrOptions === "object" ? tenantOrOptions : undefined;
  const tenantId = typeof tenantOrOptions === "string" ? tenantOrOptions : options?.tenantId;
  const effectiveFilters: CounterpartyFilters = options?.type ? { ...filters, relation: options.type === "client" ? "Cliente" : "Proveedor", search: options.search } : { ...filters, search: filters?.search };
  const query = useQuery<PublicCounterparty[]>({
    queryKey: ["public-counterparties", tenantId ?? "anonymous", effectiveFilters],
    queryFn: async () => {
      let query = supabase.from("counterparties").select(selectColumns).order("name", { ascending: true }).limit(200);
      if (effectiveFilters.relation) query = query.eq("relation", effectiveFilters.relation);
      if (effectiveFilters.status) query = query.eq("status", effectiveFilters.status);
      if (effectiveFilters.search) query = query.or(`name.ilike.%${effectiveFilters.search}%,identification_number.ilike.%${effectiveFilters.search}%,email.ilike.%${effectiveFilters.search}%,phone.ilike.%${effectiveFilters.search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PublicCounterparty[];
    },
    // RLS filters rows by auth.uid(); the synthetic tenant is only presentation metadata.
    enabled: true,
    retry: false,
    staleTime: 30000,
  });
  if (options) return { ...query, data: query.data ? { data: query.data, total: query.data.length, page: options.page || 1, limit: options.limit || 10 } : undefined } as UseQueryResult<CounterpartyListResponse>;
  return query as UseQueryResult<PublicCounterparty[]>;
}

export function useCounterpartySupabase(counterpartyId: string) {
  return useQuery<PublicCounterparty>({ queryKey: ["public-counterparty", counterpartyId], queryFn: async () => { const { data, error } = await supabase.from("counterparties").select(selectColumns).eq("id", counterpartyId).single(); if (error) throw error; return data as PublicCounterparty; }, enabled: Boolean(counterpartyId), retry: false });
}

export function useUpdateCounterpartySupabase(counterpartyId: string, tenantId?: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (input: Partial<CounterpartyInput>) => { const { data, error } = await supabase.from("counterparties").update({ ...input, updated_at: new Date().toISOString() }).eq("id", counterpartyId).select(selectColumns).single(); if (error) throw error; return data as PublicCounterparty; }, onSuccess: () => { client.invalidateQueries({ queryKey: ["public-counterparty", counterpartyId] }); client.invalidateQueries({ queryKey: ["public-counterparties", tenantId ?? "anonymous"] }); } });
}

export function useDeleteCounterpartySupabase(counterpartyId: string, tenantId?: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async () => { const { error } = await supabase.from("counterparties").delete().eq("id", counterpartyId); if (error) throw error; }, onSuccess: () => client.invalidateQueries({ queryKey: ["public-counterparties", tenantId ?? "anonymous"] }) });
}

export function useCounterpartySubscription(_tenantId?: string) { return null; }

export function useCreateCounterpartySupabase(tenantId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: CounterpartyInput) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
      const { data, error } = await supabase.from("counterparties").insert({ ...input, created_by_open_id: user.id, created_by_name: user.user_metadata?.name || user.email || null }).select(selectColumns).single();
      if (error) throw error;
      return data as PublicCounterparty;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["public-counterparties", tenantId ?? "anonymous"] }),
  });
}
