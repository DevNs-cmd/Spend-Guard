"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onCancel} />
      <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 flex-shrink-0">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium rounded px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white text-sm font-medium rounded px-4 py-2 hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Delete",
    onConfirm: () => {},
  });

  const confirm = (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel || "Delete",
        onConfirm: () => {
          setState((s) => ({ ...s, open: false }));
          resolve(true);
        },
      });
    });
  };

  const cancel = () => {
    setState((s) => ({ ...s, open: false }));
  };

  const dialogProps: ConfirmDialogProps = {
    ...state,
    onCancel: cancel,
  };

  return { confirm, dialogProps, ConfirmDialog };
}
