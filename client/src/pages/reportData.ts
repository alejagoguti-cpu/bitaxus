export type ReportOperation = {
  id: string;
  type: "Recaudo" | "Pago";
  date: string;
  amount: number;
  currency: string;
  status: string;
  subject: string;
  concept: string;
};

export type ReportPeriod = "Este mes" | "Últimos 3 meses" | "Últimos 6 meses" | "Este año";
export type ReportOperationFilter = "Todas" | "Recaudos" | "Pagos";

const normalized = (value: string) => value.toLocaleLowerCase("es-CO");
const asDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function periodStart(period: ReportPeriod, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  if (period === "Últimos 3 meses") start.setMonth(start.getMonth() - 2);
  if (period === "Últimos 6 meses") start.setMonth(start.getMonth() - 5);
  if (period === "Este año") start.setMonth(0);
  return start;
}

export function summarizeReportOperations(
  operations: ReportOperation[],
  period: ReportPeriod,
  operationFilter: ReportOperationFilter,
  today = new Date(),
) {
  const start = periodStart(period, today);
  const filtered = operations
    .filter(operation => {
      const date = asDate(operation.date);
      const matchesType = operationFilter === "Todas" || (operationFilter === "Recaudos" ? operation.type === "Recaudo" : operation.type === "Pago");
      return Boolean(date && date >= start && date <= today && matchesType);
    })
    .sort((a, b) => (asDate(b.date)?.getTime() ?? 0) - (asDate(a.date)?.getTime() ?? 0));

  const incoming = filtered.filter(operation => operation.type === "Recaudo").reduce((sum, operation) => sum + operation.amount, 0);
  const outgoing = filtered.filter(operation => operation.type === "Pago").reduce((sum, operation) => sum + operation.amount, 0);
  const completed = filtered.filter(operation => !normalized(operation.status).includes("pendiente") && !normalized(operation.status).includes("proceso") && !normalized(operation.status).includes("cancel") && !normalized(operation.status).includes("fall")).length;
  const pending = filtered.filter(operation => normalized(operation.status).includes("pendiente") || normalized(operation.status).includes("proceso")).length;
  const cancelled = filtered.filter(operation => normalized(operation.status).includes("cancel") || normalized(operation.status).includes("fall")).length;

  const monthCount = period === "Este mes" ? 1 : period === "Últimos 3 meses" ? 3 : period === "Este año" ? today.getMonth() + 1 : 6;
  const months = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (monthCount - 1 - index), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return { key, label: new Intl.DateTimeFormat("es-CO", { month: "short" }).format(date).replace(".", ""), incoming: 0, outgoing: 0 };
  });
  filtered.forEach(operation => {
    const date = asDate(operation.date);
    const month = date ? months.find(item => item.key === `${date.getFullYear()}-${date.getMonth()}`) : undefined;
    if (!month) return;
    if (operation.type === "Recaudo") month.incoming += operation.amount;
    else month.outgoing += operation.amount;
  });

  return {
    filtered,
    incoming,
    outgoing,
    total: incoming + outgoing,
    completed,
    pending,
    cancelled,
    months,
    maxMonthlyValue: Math.max(1, ...months.flatMap(month => [month.incoming, month.outgoing])),
  };
}
