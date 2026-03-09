"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FiHome,
  FiBox,
  FiShoppingCart,
  FiPackage,
  FiArrowLeft,
} from "react-icons/fi";

const menuItems = [
  { href: "/staff", label: "Tổng quan", icon: FiHome },
  { href: "/staff/products", label: "Sản phẩm", icon: FiBox },
  { href: "/staff/orders", label: "Đơn hàng", icon: FiShoppingCart },
  { href: "/staff/inventory", label: "Kho hàng", icon: FiPackage },
];

export default function StaffLayout({
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
    const role = session.user?.role?.name;
    if (role !== "ADMIN" && role !== "NHAN_VIEN") {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r shadow-sm flex-shrink-0 hidden lg:block">
        <div className="p-4 border-b">
          <Link
            href="/"
            className="flex items-center gap-2 text-green-600 font-bold text-lg"
          >
            <FiArrowLeft size={16} />
            ShopVN Staff
          </Link>
        </div>
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/staff" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-green-50 text-green-600"
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

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
