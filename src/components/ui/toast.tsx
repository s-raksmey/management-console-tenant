'use client';

import React, { useMemo } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast, Toast } from '@/contexts/ToastContext';
import { useAdminLocale } from '@/hooks/useAdminLocale';

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles = {
  success: 'border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-black/30',
  error: 'border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-black/30',
  info: 'border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-black/30',
  warning: 'border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-black/30',
};

const iconStyles = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-sky-400',
  warning: 'text-amber-300',
};

interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast();
  const { locale } = useAdminLocale();
  const Icon = toastIcons[toast.type];
  const closeLabel = locale === 'km' ? 'បិទ' : 'Close';

  return (
    <div
      className={`
        w-full max-w-sm rounded-lg border pointer-events-auto overflow-hidden
        ${toastStyles[toast.type]}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${iconStyles[toast.type]}`} />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm text-slate-300">{toast.message}</p>
            )}
            {toast.action && (
              <div className="mt-3">
                <button
                  type="button"
                  className="text-sm font-medium text-sky-300 underline hover:no-underline focus:outline-none"
                  onClick={toast.action.onClick}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              className="inline-flex text-slate-400 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              onClick={() => removeToast(toast.id)}
            >
              <span className="sr-only">{closeLabel}</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}

// Convenience hook for common toast types
export function useToastHelpers() {
  const { addToast } = useToast();

  return useMemo(
    () => ({
      showSuccess: (title: string, message?: string) => {
        addToast({ type: 'success', title, message });
      },
      showError: (title: string, message?: string) => {
        addToast({ type: 'error', title, message });
      },
      showInfo: (title: string, message?: string) => {
        addToast({ type: 'info', title, message });
      },
      showWarning: (title: string, message?: string) => {
        addToast({ type: 'warning', title, message });
      },
    }),
    [addToast],
  );
}
