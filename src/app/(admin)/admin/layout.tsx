"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  FiHome,
  FiBox,
  FiShoppingCart,
  FiTag,
  FiGrid,
  FiLayers,
  FiMapPin,
  FiTruck,
  FiGift,
  FiStar,
  FiShield,
  FiKey,
  FiPackage,
  FiClipboard,
  FiMenu,
  FiX,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiExternalLink,
} from "react-icons/fi";

const menuGroups = [
  {
    label: "Tổng quan",
    items: [{ href: "/admin", label: "Dashboard", icon: FiHome }],
  },
  {
    label: "Quản lý bán hàng",
    items: [
      { href: "/admin/products", label: "Sản phẩm", icon: FiBox },
      { href: "/admin/variants", label: "Biến thể SP", icon: FiPackage },
      { href: "/admin/orders", label: "Đơn hàng", icon: FiShoppingCart },
      { href: "/admin/inventory", label: "Phiếu nhập", icon: FiClipboard },
    ],
  },
  {
    label: "Danh mục",
    items: [
      { href: "/admin/brands", label: "Thương hiệu", icon: FiTag },
      { href: "/admin/categories", label: "Kiểu sản phẩm", icon: FiGrid },
      { href: "/admin/collections", label: "Bộ sưu tập", icon: FiLayers },
      { href: "/admin/colors", label: "Màu sắc", icon: FiTag },
      { href: "/admin/sizes", label: "Kích thước", icon: FiTag },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/admin/stores", label: "Cửa hàng", icon: FiMapPin },
      { href: "/admin/suppliers", label: "Nhà cung cấp", icon: FiTruck },
      { href: "/admin/promotions", label: "Khuyến mãi", icon: FiGift },
      { href: "/admin/reviews", label: "Đánh giá", icon: FiStar },
    ],
  },
  {
    label: "Phân quyền",
    items: [
      { href: "/admin/roles", label: "Vai trò", icon: FiShield },
      { href: "/admin/permissions", label: "Quyền hạn", icon: FiKey },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (status === "loading" || !session) return null;

  const currentPage =
    menuGroups
      .flatMap((g) => g.items)
      .find(
        (item) =>
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href)),
      )?.label || "Dashboard";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-indigo-500/20">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <FiBox className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              ShopVN
            </h1>
            <p className="text-indigo-200 text-[11px]">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-indigo-300/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white/20 text-white shadow-lg shadow-indigo-900/20"
                        : "text-indigo-100/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon
                      size={18}
                      className={isActive ? "text-white" : ""}
                    />
                    {item.label}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-indigo-500/20">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
            {session?.user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name || "Admin"}
            </p>
            <p className="text-[11px] text-indigo-200 truncate">
              {session?.user?.role?.name || "ADMIN"}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50/80">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[260px] flex-col bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <FiMenu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{currentPage}</h2>
              <p className="text-xs text-gray-400 hidden sm:block">
                Quản trị hệ thống ShopVN
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition px-3 py-2 rounded-lg hover:bg-indigo-50"
            >
              <FiExternalLink size={14} />
              Xem shop
            </Link>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                  {session?.user?.name?.[0]?.toUpperCase() || "A"}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {session?.user?.name || "Admin"}
                </span>
                <FiChevronDown size={14} className="text-gray-400" />
              </button>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {session?.user?.email || "admin@shopvn.vn"}
                      </p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      <FiUser size={14} />
                      Tài khoản
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <FiLogOut size={14} />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
