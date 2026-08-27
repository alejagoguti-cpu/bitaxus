import type { PublicReconciliationRow } from "@/hooks/useReconciliationSupabase";

export type ReconciliationFilters = { from: string; to: string; status: string; account: string; term: string };

export function filterReconciliationRows(rows: PublicReconciliationRow[], filters: ReconciliationFilters) {
  const needle = filters.term.trim().toLocaleLowerCase("es-CO");
  return rows.filter(row => {
    const date = String(row.date || row.transaction_date || "").slice(0, 10);
    const text = `${row.reference || row.source_id || ""} ${row.counterparty || ""} ${row.transaction_type || row.source_type || ""} ${row.reconciliation_comment || ""} ${row.reconciled_by || ""}`.toLocaleLowerCase("es-CO");
    return (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to) && (filters.status === "Todos los estados" || row.status === filters.status) && (!filters.account || row.account === filters.account) && (!needle || text.includes(needle));
  });
}
