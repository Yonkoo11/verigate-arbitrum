"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-[var(--radius-sm)] text-sm font-medium shadow-lg border transition-opacity duration-[var(--duration-normal)] ease-out ${
              t.type === "success"
                ? "bg-[#0f2e1a] border-[var(--accent-green)] text-[var(--accent-green)]"
                : t.type === "error"
                  ? "bg-[#2e0f0f] border-[var(--accent-red)] text-[var(--accent-red)]"
                  : "bg-[var(--bg-card)] border-[var(--border-primary)] text-[var(--text-primary)]"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
