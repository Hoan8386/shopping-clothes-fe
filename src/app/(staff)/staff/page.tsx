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
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  green: "bg-green-50 text-green-600",
};

export default function StaffPage() {
  const { data: session } = useSession();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Xin chào, {session?.user?.name ?? "nhân viên"} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Vai trò: {session?.user?.role?.name ?? "–"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4"
          >
            <div className={`p-3 rounded-full ${colorMap[s.color]}`}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-400 text-sm text-center">
          Chọn mục từ thanh bên để bắt đầu làm việc.
        </p>
      </div>
    </div>
  );
}
