import * as React from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  message: string;
  variant: "default" | "success" | "error";
}

interface ToastContextValue {
  toast: (message: string, variant?: Toast["variant"]) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const VARIANT_ICON = { default: Info, success: CheckCircle2, error: XCircle } as const;

const VARIANT_BORDER = {
  default: "border-l-plum-300 dark:border-l-cream-100/40",
  success: "border-l-emerald-400",
  error: "border-l-red-400",
} as const;

const VARIANT_TEXT = {
  default: "text-plum-700 dark:text-cream-50",
  success: "text-emerald-700 dark:text-emerald-300",
  error: "text-red-700 dark:text-red-300",
} as const;

const VARIANT_ICON_COLOR = {
  default: "text-plum-400 dark:text-cream-100/60",
  success: "text-emerald-500 dark:text-emerald-400",
  error: "text-red-500 dark:text-red-400",
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (message: string, variant: Toast["variant"] = "default") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => {
          const Icon = VARIANT_ICON[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "glass-panel flex items-start gap-2.5 border-l-4 px-4 py-3 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2",
                VARIANT_BORDER[t.variant],
                VARIANT_TEXT[t.variant]
              )}
            >
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", VARIANT_ICON_COLOR[t.variant])} />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-sm text-plum-300 opacity-70 transition-opacity hover:opacity-100 dark:text-cream-100/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
