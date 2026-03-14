"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FiHome,
  FiBox,
  FiShoppingCart,
  FiPackage,
  FiRotateCcw,
  FiRepeat,
  FiUsers,
  FiArrowLeft,
  FiMenu,
  FiX,
} from "react-icons/fi";

const menuItems = [
  { href: "/staff", label: "Tổng quan", icon: FiHome },
  { href: "/staff/products", label: "Sản phẩm", icon: FiBox },
  { href: "/staff/orders", label: "Đơn hàng", icon: FiShoppingCart },
  { href: "/staff/returns", label: "Trả hàng", icon: FiRotateCcw },
  { href: "/staff/exchanges", label: "Đổi hàng", icon: FiRepeat },
  { href: "/staff/inventory", label: "Kho hàng", icon: FiPackage },
  { href: "/staff/employees", label: "Nhân viên", icon: FiUsers },
];

const pageTitles: Record<string, { title: string; description: string }> = {
  "/staff": {
    title: "Bảng điều khiển nhân viên",
    description: "Theo dõi nhanh trạng thái bán hàng và vận hành cửa hàng.",
  },
  "/staff/products": {
    title: "Sản phẩm",
    description: "Tra cứu, kiểm tra tồn kho và thông tin biến thể sản phẩm.",
  },
  "/staff/orders": {
    title: "Đơn hàng",
    description:
      "Xử lý đơn online, đơn tại quầy và cập nhật tiến độ giao hàng.",
  },
  "/staff/returns": {
    title: "Trả hàng",
    description: "Xử lý phiếu trả hàng và phê duyệt yêu cầu từ khách hàng.",
  },
  "/staff/exchanges": {
    title: "Đổi hàng",
    description: "Xử lý phiếu đổi hàng và phê duyệt yêu cầu từ khách hàng.",
  },
  "/staff/inventory": {
    title: "Kho hàng",
    description: "Quản lý phiếu nhập, kiểm kê và theo dõi trạng thái hàng hóa.",
  },
  "/staff/employees": {
    title: "Nhân viên",
    description: "Xem thông tin nhân viên cùng cửa hàng.",
  },
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const currentPage =
    pageTitles[pathname] ||
    pageTitles[
      menuItems.find((item) =>
        item.href !== "/staff" ? pathname.startsWith(item.href) : false,
      )?.href || "/staff"
    ];

  return (
    <div className="flex min-h-screen bg-section/40">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto w-64 h-screen bg-linear-to-b from-indigo-900 via-indigo-800 to-indigo-900 border-r border-indigo-500/20 shrink-0 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-indigo-500/20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white font-bold text-lg"
          >
            <FiArrowLeft size={16} />
            <span>LUXE Staff</span>
          </Link>
          <button
            className="lg:hidden text-indigo-200 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] uppercase tracking-wider text-indigo-300/70 font-semibold">
            Điều hướng
          </p>
        </div>

        <nav className="flex-1 px-3 pb-3 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/staff" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                  isActive
                    ? "bg-white/20 text-white border-white/20"
                    : "text-indigo-100/85 border-transparent hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-500/20 bg-white/10">
          <p className="text-xs text-indigo-200/80 truncate mb-0.5">
            Nhân sự đang đăng nhập
          </p>
          <p className="text-sm text-white font-semibold truncate">
            {session.user?.name ?? "Nhân viên"}
          </p>
          <p className="text-[11px] text-indigo-200 truncate">
            {session.user?.role?.name}
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-card border-b border-subtle px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-foreground"
          >
            <FiMenu size={20} />
          </button>
          <span className="text-sm font-semibold text-foreground">
            LUXE Staff
          </span>
        </div>

        <div className="border-b border-subtle bg-card/90 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-5">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">
              {currentPage.title}
            </h1>
            <p className="text-sm text-muted mt-1">{currentPage.description}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
