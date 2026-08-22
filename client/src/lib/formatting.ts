/**
 * Formatting Utilities
 * Helper functions for formatting currency, dates, and status
 */

import {
  ReceiptStatus,
  PaymentStatus,
  DispersionStatus,
  UserRole,
} from "@/shared/types";

/**
 * Format currency value
 */
export function formatCurrency(
  value: number,
  currency: string = "COP",
  locale: string = "es-CO"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format currency for display (compact format for large numbers)
 */
export function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Format date for display
 */
export function formatDateDisplay(
  date: Date | string,
  locale: string = "es-CO"
): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string,
  locale: string = "es-CO"
): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Format relative time (e.g., "hace 2 horas")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "hace unos segundos";
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} minutos`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} horas`;
  if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)} días`;

  return formatDateDisplay(d);
}

/**
 * Get color for receipt status
 */
export function getReceiptStatusColor(status: ReceiptStatus): string {
  switch (status) {
    case ReceiptStatus.PENDING:
      return "amber"; // Warning
    case ReceiptStatus.RECEIVED:
      return "emerald"; // Success
    case ReceiptStatus.CANCELED:
      return "slate"; // Neutral
    default:
      return "gray";
  }
}

/**
 * Get label for receipt status
 */
export function getReceiptStatusLabel(status: ReceiptStatus): string {
  switch (status) {
    case ReceiptStatus.PENDING:
      return "Pendiente";
    case ReceiptStatus.RECEIVED:
      return "Recibido";
    case ReceiptStatus.CANCELED:
      return "Cancelado";
    default:
      return status;
  }
}

/**
 * Get color for payment status
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.SCHEDULED:
      return "blue"; // Info
    case PaymentStatus.IN_PROGRESS:
      return "amber"; // Warning
    case PaymentStatus.PROCESSED:
      return "emerald"; // Success
    case PaymentStatus.CANCELED:
      return "slate"; // Neutral
    case PaymentStatus.FAILED:
      return "red"; // Error
    default:
      return "gray";
  }
}

/**
 * Get label for payment status
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.SCHEDULED:
      return "Programado";
    case PaymentStatus.IN_PROGRESS:
      return "En proceso";
    case PaymentStatus.PROCESSED:
      return "Procesado";
    case PaymentStatus.CANCELED:
      return "Cancelado";
    case PaymentStatus.FAILED:
      return "Fallido";
    default:
      return status;
  }
}

/**
 * Get color for dispersion status
 */
export function getDispersionStatusColor(status: DispersionStatus): string {
  switch (status) {
    case DispersionStatus.SCHEDULED:
      return "blue";
    case DispersionStatus.IN_PROGRESS:
      return "amber";
    case DispersionStatus.PROCESSED:
      return "emerald";
    case DispersionStatus.CANCELED:
      return "slate";
    case DispersionStatus.FAILED:
      return "red";
    default:
      return "gray";
  }
}

/**
 * Get label for dispersion status
 */
export function getDispersionStatusLabel(status: DispersionStatus): string {
  switch (status) {
    case DispersionStatus.SCHEDULED:
      return "Programada";
    case DispersionStatus.IN_PROGRESS:
      return "En proceso";
    case DispersionStatus.PROCESSED:
      return "Procesada";
    case DispersionStatus.CANCELED:
      return "Cancelada";
    case DispersionStatus.FAILED:
      return "Fallida";
    default:
      return status;
  }
}

/**
 * Get label for user role
 */
export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "Administrador";
    case UserRole.OPERATOR:
      return "Operador";
    case UserRole.VIEWER:
      return "Revisor";
    default:
      return role;
  }
}

/**
 * Format month and year
 */
export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Format number with thousand separator
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Mask account number for display
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  const lastFour = accountNumber.slice(-4);
  return `****${lastFour}`;
}

/**
 * Mask ID number for display
 */
export function maskIdNumber(idNumber: string): string {
  if (idNumber.length <= 4) return idNumber;
  const lastFour = idNumber.slice(-4);
  return `${idNumber.slice(0, -4).replace(/./g, "*")}${lastFour}`;
}
