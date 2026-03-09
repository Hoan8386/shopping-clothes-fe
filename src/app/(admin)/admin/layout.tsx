"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FiHome,
  FiBox,
  FiShoppingCart,
  FiUsers,
  FiTag,
  FiGrid,
  FiLayers,
  FiMapPin,
  FiTruck,
  FiGift,
  FiStar,
  FiShield,
  FiKey,
  FiArrowLeft,
} from "react-icons/fi";

const menuItems = [
  { href: "/admin", label: "Tổng quan", icon: FiHome },
  { href: "/admin/products", label: "Sản phẩm", icon: FiBox },
  { href: "/admin/orders", label: "Đơn hàng", icon: FiShoppingCart },
  { href: "/admin/brands", label: "Thương hiệu", icon: FiTag },
  { href: "/admin/categories", label: "Kiểu sản phẩm", icon: FiGrid },
  { href: "/admin/collections", label: "Bộ sưu tập", icon: FiLayers },
  { href: "/admin/colors", label: "Màu sắc", icon: FiTag },
  { href: "/admin/sizes", label: "Kích thước", icon: FiTag },
  { href: "/admin/stores", label: "Cửa hàng", icon: FiMapPin },
  { href: "/admin/suppliers", label: "Nhà cung cấp", icon: FiTruck },
  { href: "/admin/promotions", label: "Khuyến mãi", icon: FiGift },
  { href: "/admin/reviews", label: "Đánh giá", icon: FiStar },
  { href: "/admin/roles", label: "Vai trò", icon: FiShield },
  { href: "/admin/permissions", label: "Quyền hạn", icon: FiKey },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (session.user?.role?.name !== "ADMIN") {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm flex-shrink-0 hidden lg:block">
        <div className="p-4 border-b">
          <Link
            href="/"
            className="flex items-center gap-2 text-blue-600 font-bold text-lg"
          >
            <FiArrowLeft size={16} />
            ShopVN Admin
          </Link>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-64px)]">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
