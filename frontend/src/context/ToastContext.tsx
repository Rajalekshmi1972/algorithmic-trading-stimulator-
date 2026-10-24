import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import type { NotificationItem, NotificationType } from "../types";

interface ToastContextType {
  notify: (type: NotificationType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<NotificationItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (type: NotificationType, message: string, title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message, title }]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string) => notify("success", msg, title), [notify]);
  const error = useCallback((msg: string, title?: string) => notify("error", msg, title), [notify]);
  const info = useCallback((msg: string, title?: string) => notify("info", msg, title), [notify]);
  const warning = useCallback((msg: string, title?: string) => notify("warning", msg, title), [notify]);

  return (
    <ToastContext.Provider value={{ notify, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-2 ${
                isSuccess
                  ? "border-emerald-500/30 bg-slate-900/95 text-emerald-300"
                  : isError
                  ? "border-rose-500/30 bg-slate-900/95 text-rose-300"
                  : isWarning
                  ? "border-amber-500/30 bg-slate-900/95 text-amber-300"
                  : "border-cyan-500/30 bg-slate-900/95 text-cyan-300"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 size={18} className="text-emerald-400" />}
                {isError && <AlertCircle size={18} className="text-rose-400" />}
                {isWarning && <AlertTriangle size={18} className="text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info size={18} className="text-cyan-400" />}
              </div>
              <div className="flex-1 text-xs">
                {toast.title && <div className="font-semibold text-slate-100 mb-0.5">{toast.title}</div>}
                <div className="text-slate-300 leading-relaxed">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
