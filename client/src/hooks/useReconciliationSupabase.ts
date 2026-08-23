import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PublicReconciliationRow { id: string; transaction_type?: string | null; source_type?: string | null; source_id?: string | null; amount: number; currency?: string | null; date?: string | null; transaction_date?: string | null; status: string; account?: string | null; reference?: string | null; counterparty?: string | null; reconciliation_comment?: string | null; reconciled_by?: string | null; reconciled_at?: string | null; created_at?: string | null; }

export function useReconciliationSupabase(tenantId?: string) {
  return useQuery<PublicReconciliationRow[]>({ queryKey: ["public-reconciliation", tenantId ?? "anonymous"], queryFn: async () => { const { data, error } = await supabase.from("reconciliation").select("*").order("created_at", { ascending: false }).limit(200); if (error) throw error; return (data ?? []) as PublicReconciliationRow[]; }, enabled: Boolean(tenantId), retry: false, staleTime: 30000 });
}
