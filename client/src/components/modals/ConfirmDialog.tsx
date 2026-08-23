// @ts-nocheck
/**
 * ConfirmDialog Component
 * Reusable confirmation modal
 */

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: "bg-red-50 border-red-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-blue-50 border-blue-200",
  };

  const buttonStyles = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-amber-600 hover:bg-amber-700",
    info: "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      ></div>

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className={`p-6 border-b ${variantStyles[variant]}`}>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-md ${buttonStyles[variant]} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {isLoading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para manejar estado del diálogo
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<
    ConfirmDialogProps,
    "isOpen" | "onConfirm" | "onCancel"
  > | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const confirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: "danger" | "warning" | "info";
    }
  ) => {
    setConfig({
      title,
      message,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      variant: options?.variant,
      isLoading,
    });
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      const handleConfirm = async () => {
        setIsLoading(true);
        try {
          await onConfirm();
          resolve(true);
          setIsOpen(false);
        } finally {
          setIsLoading(false);
        }
      };

      const handleCancel = () => {
        resolve(false);
        setIsOpen(false);
      };

      setConfig((prev) => ({
        ...prev,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      }));
    });
  };

  return {
    isOpen,
    config,
    isLoading,
    confirm,
  };
}

// Add React import for the hook
import React from "react";
