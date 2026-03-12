"use client";

import toast, { ToastBar, Toaster } from "react-hot-toast";
import { FiAlertCircle, FiCheckCircle, FiLoader, FiX } from "react-icons/fi";

const typeStyles: Record<string, string> = {
  success: "border-l-4 border-l-emerald-500 bg-emerald-500/5 text-foreground",
  error: "border-l-4 border-l-red-500 bg-red-500/5 text-foreground",
  loading: "border-l-4 border-l-sky-500 bg-sky-500/5 text-foreground",
};

const fallbackIcons: Record<string, React.ReactNode> = {
  success: <FiCheckCircle className="text-emerald-500" size={16} />,
  error: <FiAlertCircle className="text-red-500" size={16} />,
  loading: <FiLoader className="text-sky-500 animate-spin" size={16} />,
};

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{ top: 30, right: 16 }}
      gutter={12}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "14px",
          border:
            "1px solid color-mix(in oklab, var(--color-foreground) 16%, transparent)",
          background: "var(--color-card)",
          color: "var(--color-foreground)",
          boxShadow: "0 12px 30px -18px rgba(0, 0, 0, 0.55)",
          minWidth: "380px",
          //   padding: "12px 14px",
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div
              className={`flex items-center gap-4 w-full rounded-xl px-1 py-1 ${
                typeStyles[t.type] || "border-l-4 border-l-gray-500"
              }`}
            >
              <div>{icon || fallbackIcons[t.type]}</div>
              <div className="text-base font-medium flex-1">{message}</div>
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                aria-label="Đóng thông báo"
                className="h-9 w-9 rounded-full inline-flex items-center justify-center text-muted hover:text-foreground bg-section hover:bg-subtle transition"
              >
                <FiX size={15} />
              </button>
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
