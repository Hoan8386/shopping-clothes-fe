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
  FiArrowLeft,
  FiMenu,
  FiX,
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto w-64 h-screen bg-card border-r border-subtle shrink-0 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-subtle flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-accent font-bold text-lg"
          >
            <FiArrowLeft size={16} />
            <span>LUXE Staff</span>
          </Link>
          <button
            className="lg:hidden text-muted hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/staff" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-section hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-subtle">
          <p className="text-xs text-muted truncate">
            {session.user?.name ?? "Nhân viên"}
          </p>
          <p className="text-[11px] text-muted/60 truncate">
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

        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
