const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8080/storage";
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_BASE = CLOUDINARY_CLOUD_NAME
  ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`
  : "";

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function getImageUrl(fileName: string | undefined | null): string {
  if (!fileName) return "/images/placeholder.png";
  const raw = fileName.trim();
  if (!raw) return "/images/placeholder.png";
  if (isAbsoluteUrl(raw) || raw.startsWith("data:")) return raw;

  // Strip leading /storage/ prefix that the backend may already include
  const clean = raw.replace(/^\/storage\//, "").replace(/^\/+/, "");

  // Support Cloudinary public_id / folder path values stored in DB.
  if (CLOUDINARY_BASE) {
    if (clean.includes("/")) {
      return `${CLOUDINARY_BASE}/${clean}`;
    }
    return `${CLOUDINARY_BASE}/products/${clean}`;
  }

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

export function getOrderStatusText(status: string | number): string {
  if (typeof status === "string") return status;
  const map: Record<number, string> = {
    0: "Chờ xác nhận",
    1: "Đã xác nhận",
    2: "Đang đóng gói",
    3: "Đang giao hàng",
    4: "Đã hủy",
    5: "Đã nhận hàng",
  };
  return map[status] || `Trạng thái ${status}`;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  "Chờ xác nhận": "bg-yellow-100 text-yellow-800",
  "Đã xác nhận": "bg-blue-100 text-blue-800",
  "Đang đóng gói": "bg-orange-100 text-orange-800",
  "Đang giao hàng": "bg-purple-100 text-purple-800",
  "Đang giao": "bg-purple-100 text-purple-800",
  "Đã hủy": "bg-red-100 text-red-800",
  "Đã nhận hàng": "bg-green-100 text-green-800",
};

export function getOrderStatusColor(status: string | number): string {
  const text = getOrderStatusText(status);
  return STATUS_COLOR_MAP[text] || "bg-gray-100 text-gray-800";
}

export function getPaymentStatusText(status: string | number): string {
  if (typeof status === "string") return status;
  const map: Record<number, string> = {
    0: "Chưa thanh toán",
    1: "Đã thanh toán",
    2: "Thanh toán thất bại",
  };
  return map[status] || `Trạng thái ${status}`;
}

export function getPaymentMethodText(method: string | number): string {
  if (typeof method === "string") return method;
  const map: Record<number, string> = {
    0: "COD/Tiền mặt",
    1: "VNPAY",
  };
  return map[method] || `Phương thức ${method}`;
}
