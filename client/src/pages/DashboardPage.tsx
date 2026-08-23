import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { useDashboardWidgets } from "@/hooks";
import {
  formatCurrency,
  formatDateDisplay,
  formatMonthYear,
} from "@/lib/formatting";
import type {
  PublicPayment,
  PublicReceipt,
} from "@/hooks/useDashboardSupabase";

interface DashboardPageProps {
  tenantId: string;
}

type ActivityItem = {
  id: string;
  type: "receipt" | "payment";
  title: string;
  detail: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

function statusTone(status: string) {
  if (["Recibido", "Procesado", "Completado"].includes(status)) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (["Cancelado", "Fallido"].includes(status)) {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-amber-50 text-amber-700";
}

function MetricCard({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className="rounded-xl bg-rose-50 p-2 text-rose-600">{icon}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{caption}</p>
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
      <WalletCards className="mx-auto mb-3 text-slate-300" size={28} />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function DashboardPage({ tenantId }: DashboardPageProps) {
  const now = new Date();
  const [period, setPeriod] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const { receipts, payments, isLoading, error } =
    useDashboardWidgets(tenantId);

  const receiptRows = receipts.data ?? [];
  const paymentRows = payments.data ?? [];
  const metrics = useMemo(() => {
    const incoming = receiptRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );
    const outgoing = paymentRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );
    return {
      incoming,
      outgoing,
      balance: incoming - outgoing,
      pending:
        receiptRows.filter(row => row.status === "Pendiente").length +
        paymentRows.filter(row =>
          ["Programado", "En proceso"].includes(row.status)
        ).length,
    };
  }, [paymentRows, receiptRows]);

  const activity = useMemo<ActivityItem[]>(() => {
    const receiptItems: ActivityItem[] = receiptRows.map(
      (row: PublicReceipt) => ({
        id: `receipt-${row.id}`,
        type: "receipt",
        title: row.concept || "Recaudo",
        detail: row.payer_name || "Pagador sin nombre",
        amount: Number(row.amount || 0),
        currency: row.currency || "COP",
        status: row.status,
        createdAt: row.created_at,
      })
    );
    const paymentItems: ActivityItem[] = paymentRows.map(
      (row: PublicPayment) => ({
        id: `payment-${row.id}`,
        type: "payment",
        title: row.concept || row.payment_type || "Pago",
        detail: row.beneficiary || row.account || "Beneficiario sin nombre",
        amount: Number(row.amount || 0),
        currency: row.currency || "COP",
        status: row.status,
        createdAt: row.created_at,
      })
    );
    return [...receiptItems, ...paymentItems]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 8);
  }, [paymentRows, receiptRows]);

  const movePeriod = (offset: number) => {
    setPeriod(
      current => new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
  };

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
            Resumen operativo
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Movimientos reales registrados en Supabase.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => movePeriod(-1)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            aria-label="Periodo anterior"
          >
            ←
          </button>
          <span className="min-w-32 text-center text-sm font-medium text-slate-700">
            {formatMonthYear(period.getFullYear(), period.getMonth() + 1)}
          </span>
          <button
            type="button"
            onClick={() => movePeriod(1)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            aria-label="Periodo siguiente"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => {
              void receipts.refetch();
              void payments.refetch();
            }}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Actualizar datos"
            title="Actualizar datos"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {error && (
        <section
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          No pudimos cargar los movimientos. Revisa tu conexión y vuelve a
          intentarlo.
        </section>
      )}

      {isLoading ? (
        <section
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Cargando métricas"
        >
          {[1, 2, 3, 4].map(item => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </section>
      ) : (
        <section
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Métricas del dashboard"
        >
          <MetricCard
            label="Saldo neto"
            value={formatCurrency(metrics.balance)}
            caption="Recaudos menos pagos"
            icon={<WalletCards size={18} />}
          />
          <MetricCard
            label="Entradas"
            value={formatCurrency(metrics.incoming)}
            caption={`${receiptRows.length} recaudo(s)`}
            icon={<ArrowDownLeft size={18} />}
          />
          <MetricCard
            label="Salidas"
            value={formatCurrency(metrics.outgoing)}
            caption={`${paymentRows.length} pago(s)`}
            icon={<ArrowUpRight size={18} />}
          />
          <MetricCard
            label="Por revisar"
            value={String(metrics.pending)}
            caption="Operaciones pendientes"
            icon={<Clock3 size={18} />}
          />
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Actividad reciente
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Últimos movimientos visibles para esta sesión.
              </p>
            </div>
            <Link
              href="/receipts"
              className="text-sm font-medium text-rose-600 hover:text-rose-700"
            >
              Ver recaudos
            </Link>
          </div>
          {isLoading ? (
            <div className="h-52 animate-pulse rounded-xl bg-slate-100" />
          ) : activity.length === 0 ? (
            <EmptyState label="Aún no hay movimientos registrados." />
          ) : (
            <div className="divide-y divide-slate-100">
              {activity.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`rounded-xl p-2 ${item.type === "receipt" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                    >
                      {item.type === "receipt" ? (
                        <ArrowDownLeft size={17} />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {item.detail} · {formatDateDisplay(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(item.amount, item.currency)}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Acciones rápidas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Accede a los módulos operativos.
              </p>
            </div>
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
          <div className="grid gap-3">
            <Link
              href="/receipts"
              className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-rose-200 hover:bg-rose-50/40"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-slate-800">
                <ArrowDownLeft size={18} className="text-emerald-600" />{" "}
                Gestionar recaudos
              </span>
            </Link>
            <Link
              href="/payments"
              className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-rose-200 hover:bg-rose-50/40"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-slate-800">
                <ArrowUpRight size={18} className="text-rose-600" /> Gestionar
                pagos
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
