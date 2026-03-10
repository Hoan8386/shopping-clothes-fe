"use client";

import { useSession } from "next-auth/react";
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Xin chào, {session?.user?.name ?? "nhân viên"} 👋
        </h1>
        <p className="text-muted text-sm mt-1">
          Vai trò: {session?.user?.role?.name ?? "–"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4"
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

      <div className="bg-card rounded-xl border border-subtle p-6">
        <p className="text-muted text-sm text-center">
          Chọn mục từ thanh bên để bắt đầu làm việc.
        </p>
      </div>
    </div>
  );
}
