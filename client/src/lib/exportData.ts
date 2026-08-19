import { jsPDF } from "jspdf";

type ExportValue = string | number | null | undefined;

export interface ExportColumn<T extends Record<string, ExportValue>> {
  key: keyof T;
  label: string;
}

export interface ExportOptions {
  filters?: Record<string, string>;
  dateRange?: { from?: string; to?: string };
  logoUrl?: string;
}

function normalize(value: ExportValue) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function exportRowsToCsv<T extends Record<string, ExportValue>>(
  title: string,
  rows: T[],
  columns: readonly ExportColumn<T>[],
) {
  const escape = (value: ExportValue) => `"${normalize(value).replace(/"/g, '""')}"`;
  const lines = [
    columns.map(column => escape(column.label)).join(","),
    ...rows.map(row => columns.map(column => escape(row[column.key])).join(",")),
  ];
  const csv = `\uFEFF${lines.join("\r\n")}`;
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${slugify(title)}.csv`);
}

async function imageToDataUrl(url: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportRowsToPdf<T extends Record<string, ExportValue>>(
  title: string,
  rows: T[],
  columns: readonly ExportColumn<T>[],
  options: ExportOptions = {},
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  const widths = columns.map(() => usableWidth / Math.max(columns.length, 1));
  const rowHeight = 8;
  let y = 30;
  const logo = options.logoUrl ? await imageToDataUrl(options.logoUrl) : null;

  if (logo) doc.addImage(logo, "PNG", margin, 7, 25, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(36, 39, 53);
  doc.text(title, margin + (logo ? 31 : 0), 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 126, 138);
  doc.text(`Generado el ${new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}`, margin, 21);
  const filterText = Object.entries(options.filters ?? {}).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join(" · ");
  const dateText = options.dateRange?.from || options.dateRange?.to ? `Rango: ${options.dateRange.from || "inicio"} – ${options.dateRange.to || "hoy"}` : "";
  if (filterText || dateText) doc.text([filterText, dateText].filter(Boolean).join(" · "), margin, 25);

  const drawHeader = () => {
    doc.setFillColor(245, 246, 248);
    doc.rect(margin, y - 6, usableWidth, rowHeight, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(70, 76, 88);
    let x = margin;
    columns.forEach((column, index) => {
      doc.text(normalize(column.label).slice(0, 24), x + 2, y - 1);
      x += widths[index];
    });
    y += rowHeight;
  };

  drawHeader();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  rows.forEach(row => {
    if (y > pageHeight - 14) {
      doc.addPage();
      y = 16;
      drawHeader();
    }
    let x = margin;
    columns.forEach((column, index) => {
      doc.setDrawColor(232, 234, 238);
      doc.line(margin, y + 2, margin + usableWidth, y + 2);
      doc.setTextColor(75, 81, 93);
      doc.text(normalize(row[column.key]).slice(0, 30), x + 2, y - 1);
      x += widths[index];
    });
    y += rowHeight;
  });
  doc.save(`${slugify(title)}.pdf`);
}

export function exportTable<T extends Record<string, ExportValue>>(
  format: "csv" | "pdf",
  title: string,
  rows: T[],
  columns: readonly ExportColumn<T>[],
  options?: ExportOptions,
) {
  if (format === "csv") exportRowsToCsv(title, rows, columns);
  else return exportRowsToPdf(title, rows, columns, options);
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "exportacion";
}
