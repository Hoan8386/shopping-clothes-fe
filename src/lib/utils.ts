const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8080/storage";

export function getImageUrl(fileName: string | undefined | null): string {
  if (!fileName) return "/images/placeholder.png";
  if (fileName.startsWith("http")) return fileName;
  // Strip leading /storage/ prefix that the backend may already include
  const clean = fileName.replace(/^\/storage\//, "");
  return `${STORAGE_URL}/${clean}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getOrderStatusText(status: number): string {
  const map: Record<number, string> = {
    0: "Chờ xác nhận",
    1: "Đã xác nhận",
    2: "Đang đóng gói",
    3: "Đang giao",
    4: "Đã hủy",
    5: "Đã nhận hàng",
  };
  return map[status] || `Trạng thái ${status}`;
}

export function getOrderStatusColor(status: number): string {
  const map: Record<number, string> = {
    0: "bg-yellow-100 text-yellow-800",
    1: "bg-blue-100 text-blue-800",
    2: "bg-orange-100 text-orange-800",
    3: "bg-purple-100 text-purple-800",
    4: "bg-red-100 text-red-800",
    5: "bg-green-100 text-green-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export function getPaymentStatusText(status: number): string {
  return status === 0 ? "Chưa thanh toán" : "Đã thanh toán";
}
