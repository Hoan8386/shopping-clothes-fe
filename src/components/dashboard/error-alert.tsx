"use client";

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  type?: "error" | "warning" | "info";
}

export function ErrorAlert({
  message,
  onRetry,
  type = "error",
}: ErrorAlertProps) {
  const colors = {
    error: {
      container: "bg-red-50 border-red-200",
      text: "text-red-700",
      button: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      container: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
      button: "bg-yellow-600 hover:bg-yellow-700",
    },
    info: {
      container: "bg-blue-50 border-blue-200",
      text: "text-blue-700",
      button: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const selectedColor = colors[type];

  return (
    <div
      className={`${selectedColor.container} border rounded-lg p-6 text-center`}
    >
      <h2 className={`text-lg font-semibold ${selectedColor.text}`}>
        {type === "error" && "Lỗi tải dữ liệu"}
        {type === "warning" && "Cảnh báo"}
        {type === "info" && "Thông tin"}
      </h2>
      <p className={`${selectedColor.text} mt-2`}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={`mt-4 px-4 py-2 ${selectedColor.button} text-white rounded transition-colors`}
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  message = "Không có dữ liệu",
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
}
