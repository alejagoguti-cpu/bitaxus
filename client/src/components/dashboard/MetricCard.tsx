/**
 * MetricCard Component
 * Card for displaying dashboard metrics
 */

import { ReactNode } from "react";
import { formatCurrency, formatNumber } from "@/lib/formatting";

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  status?: "success" | "warning" | "error" | "info";
  trend?: {
    direction: "up" | "down" | "stable";
    value: number;
    label?: string;
  };
  backgroundColor?: string;
  onClick?: () => void;
  variant?: "default" | "compact" | "detailed";
  currency?: boolean;
  compact?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  status = "info",
  trend,
  backgroundColor,
  onClick,
  variant = "default",
  currency = false,
  compact = false,
}: MetricCardProps) {
  const statusClasses = {
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    error: "bg-red-50 border-red-200",
    info: "bg-[#fff0ef] border-[#f1bfbd]",
  };

  const statusIconClasses = {
    success: "text-emerald-600",
    warning: "text-amber-600",
    error: "text-red-600",
    info: "text-[#b64b4d]",
  };

  const trendIconClasses = {
    up: "text-red-600 rotate-45",
    down: "text-green-600 -rotate-45",
    stable: "text-gray-600",
  };

  const trendIcon = {
    up: "↗",
    down: "↘",
    stable: "→",
  };

  const formattedValue =
    currency && typeof value === "number"
      ? formatCurrency(value)
      : typeof value === "number"
        ? formatNumber(value)
        : value;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-lg border ${statusClasses[status]} ${
          onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formattedValue}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={`text-2xl ${statusIconClasses[status]}`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-lg border ${statusClasses[status]} ${
        backgroundColor || ""
      } ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>
        {icon && (
          <div className={`text-3xl ${statusIconClasses[status]} ml-2`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">{formattedValue}</p>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <span className={`text-lg font-bold ${trendIconClasses[trend.direction]}`}>
            {trendIcon[trend.direction]}
          </span>
          <span className="text-sm">
            <span className="font-semibold text-gray-900">
              {trend.direction === "up" ? "+" : ""}
              {formatNumber(trend.value)}
            </span>
            {trend.label && (
              <span className="text-gray-600 ml-1">{trend.label}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Dashboard Grid Component
 */
interface DashboardGridProps {
  children: ReactNode;
  columns?: number;
}

export function DashboardGrid({
  children,
  columns = 3,
}: DashboardGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={`grid ${gridClasses[columns as keyof typeof gridClasses]} gap-4`}
    >
      {children}
    </div>
  );
}
