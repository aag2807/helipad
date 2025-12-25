"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

// Global toast state
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

export function toast(options: Omit<Toast, "id">) {
  const id = crypto.randomUUID();
  const newToast: Toast = { ...options, id };
  toasts = [...toasts, newToast];
  notifyListeners();

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    dismissToast(id);
  }, 5000);

  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setCurrentToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setCurrentToasts);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {currentToasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl shadow-lg border animate-slide-in-right",
        toast.type === "success" && "bg-emerald-50 border-emerald-200",
        toast.type === "error" && "bg-red-50 border-red-200",
        toast.type === "info" && "bg-blue-50 border-blue-200"
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 shrink-0 mt-0.5",
          toast.type === "success" && "text-emerald-600",
          toast.type === "error" && "text-red-600",
          toast.type === "info" && "text-blue-600"
        )}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium text-sm",
            toast.type === "success" && "text-emerald-900",
            toast.type === "error" && "text-red-900",
            toast.type === "info" && "text-blue-900"
          )}
        >
          {toast.title}
        </p>
        {toast.description && (
          <p
            className={cn(
              "text-sm mt-0.5",
              toast.type === "success" && "text-emerald-700",
              toast.type === "error" && "text-red-700",
              toast.type === "info" && "text-blue-700"
            )}
          >
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className={cn(
          "p-1 rounded-lg transition-colors shrink-0",
          toast.type === "success" && "text-emerald-600 hover:bg-emerald-100",
          toast.type === "error" && "text-red-600 hover:bg-red-100",
          toast.type === "info" && "text-blue-600 hover:bg-blue-100"
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

