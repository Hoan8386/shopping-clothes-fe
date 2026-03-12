"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { FiShoppingCart, FiBox, FiPackage, FiUsers } from "react-icons/fi";

const stats = [
  {
    label: "Đơn hàng hôm nay",
    value: "–",
    icon: FiShoppingCart,
    color: "blue",
  },
  { label: "Sản phẩm", value: "–", icon: FiBox, color: "purple" },
  { label: "Tồn kho thấp", value: "–", icon: FiPackage, color: "orange" },
  { label: "Khách hàng", value: "–", icon: FiUsers, color: "green" },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-500",
  purple: "bg-purple-500/10 text-purple-500",
  orange: "bg-orange-500/10 text-orange-500",
  green: "bg-green-500/10 text-green-500",
};

export default function StaffPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div className="bg-card border border-subtle rounded-2xl p-5 lg:p-6">
        <h2 className="text-xl font-bold text-foreground">
          Xin chào, {session?.user?.name ?? "nhân viên"}
        </h2>
        <p className="text-muted text-sm mt-1">
          Bạn đang đăng nhập với vai trò {session?.user?.role?.name ?? "-"}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-2xl border border-subtle p-5 flex items-center gap-4"
          >
            <div className={`p-3 rounded-full ${colorMap[s.color]}`}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link
          href="/staff/orders"
          className="bg-card rounded-2xl border border-subtle p-5 hover:border-accent/30 hover:bg-section/60 transition"
        >
          <p className="text-sm font-semibold text-foreground">
            Xử lý đơn hàng
          </p>
          <p className="text-sm text-muted mt-1">
            Theo dõi đơn mới, cập nhật trạng thái giao và thanh toán.
          </p>
        </Link>
        <Link
          href="/staff/products"
          className="bg-card rounded-2xl border border-subtle p-5 hover:border-accent/30 hover:bg-section/60 transition"
        >
          <p className="text-sm font-semibold text-foreground">
            Kiểm tra sản phẩm
          </p>
          <p className="text-sm text-muted mt-1">
            Xem danh mục sản phẩm và tồn kho theo màu, kích thước.
          </p>
        </Link>
        <Link
          href="/staff/inventory"
          className="bg-card rounded-2xl border border-subtle p-5 hover:border-accent/30 hover:bg-section/60 transition"
        >
          <p className="text-sm font-semibold text-foreground">
            Quản lý kho nhập
          </p>
          <p className="text-sm text-muted mt-1">
            Tạo phiếu nhập, cập nhật thiếu hàng và thực hiện kiểm kê.
          </p>
        </Link>
      </div>
    </div>
  );
}
