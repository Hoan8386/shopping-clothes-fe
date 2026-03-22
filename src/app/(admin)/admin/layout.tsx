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
  FiRotateCcw,
  FiRepeat,
  FiUsers,
  FiMenu,
  FiLogOut,
  FiExternalLink,
  FiShuffle,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiAlertTriangle,
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
      {
        href: "/admin/store-products",
        label: "SP theo cửa hàng",
        icon: FiMapPin,
      },
      { href: "/admin/variants", label: "Biến thể SP", icon: FiPackage },
      { href: "/admin/orders", label: "Đơn hàng", icon: FiShoppingCart },
      { href: "/admin/returns", label: "Trả hàng", icon: FiRotateCcw },
      // { href: "/admin/exchanges", label: "Đổi hàng", icon: FiRepeat },
      { href: "/admin/inventory", label: "Phiếu nhập", icon: FiClipboard },
      { href: "/admin/stock-checks", label: "Kiểm kê", icon: FiPackage },
      { href: "/admin/stock-check-types", label: "Loại kiểm kê", icon: FiTag },
      { href: "/admin/transfers", label: "Luân chuyển", icon: FiShuffle },
      {
        href: "/admin/transfer-types",
        label: "Loại luân chuyển",
        icon: FiRepeat,
      },
      { href: "/admin/employees", label: "Nhân viên", icon: FiUsers },
    ],
  },
  {
    label: "Quản lý ca & lương",
    items: [
      { href: "/admin/ca-lam-viec", label: "Ca làm việc", icon: FiClock },
      { href: "/admin/lich-lam-viec", label: "Lịch làm việc", icon: FiCalendar },
      { href: "/admin/luong-co-ban", label: "Lương cơ bản", icon: FiDollarSign },
      { href: "/admin/luong-thuong", label: "Lương thưởng", icon: FiGift },
      { href: "/admin/doi-ca", label: "Đổi ca", icon: FiRepeat },
      { href: "/admin/loi-phat-sinh", label: "Lỗi phát sinh", icon: FiAlertTriangle },
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

function AdminSidebarContent({
  pathname,
  session,
  onNavigate,
}: {
  pathname: string;
  session: {
    user?: {
      name?: string | null;
      role?: { name?: string | null };
    };
  };
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="p-5 border-b border-indigo-500/20">
        <Link href="/admin" className="flex items-center gap-3 text-white">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <FiBox className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">LUXE</h1>
            <p className="text-indigo-200 text-[11px]">Admin Panel</p>
          </div>
        </Link>
      </div>

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
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                      isActive
                        ? "bg-white/20 text-white border-white/20"
                        : "text-indigo-100/85 border-transparent hover:bg-white/10 hover:text-white"
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

      <div className="p-3 border-t border-indigo-500/20 bg-white/10 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
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

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center justify-center gap-1.5 text-xs text-white bg-white/10 hover:bg-white/20 rounded-lg py-2 transition"
          >
            <FiExternalLink size={12} /> Xem shop
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center justify-center gap-1.5 text-xs text-white bg-white/10 hover:bg-white/20 rounded-lg py-2 transition"
          >
            <FiLogOut size={12} /> Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout({
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
    if (session.user?.role?.name !== "ADMIN") {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) return null;

  const allItems = menuGroups.flatMap((g) => g.items);
  const currentPage =
    allItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/admin" && pathname.startsWith(item.href)),
    )?.label || "Dashboard";

  const pageDescriptions: Record<string, string> = {
    Dashboard: "Theo dõi nhanh toàn bộ hoạt động vận hành của cửa hàng.",
    "Sản phẩm": "Quản lý danh mục sản phẩm và thông tin bán hàng.",
    "SP theo cửa hàng": "Theo dõi tồn kho sản phẩm tại từng cửa hàng.",
    "Biến thể SP": "Theo dõi biến thể theo màu sắc, kích thước và tồn kho.",
    "Đơn hàng": "Xử lý đơn hàng và theo dõi trạng thái giao nhận.",
    "Phiếu nhập": "Quản lý nhập hàng và kiểm kê kho.",
    "Kiểm kê": "Duyệt phiếu kiểm kê và điều chỉnh tồn kho theo thực tế.",
    "Loại kiểm kê": "Quản lý danh mục loại kiểm kê trong hệ thống.",
    "Thương hiệu": "Quản lý dữ liệu thương hiệu sản phẩm.",
    "Kiểu sản phẩm": "Quản lý nhóm và phân loại sản phẩm.",
    "Bộ sưu tập": "Thiết lập bộ sưu tập hiển thị cho sản phẩm.",
    "Màu sắc": "Quản lý danh mục màu sắc dùng cho biến thể.",
    "Kích thước": "Quản lý danh mục kích thước sản phẩm.",
    "Cửa hàng": "Quản lý thông tin chi nhánh cửa hàng.",
    "Nhà cung cấp": "Quản lý thông tin nhà cung cấp nhập hàng.",
    "Khuyến mãi": "Thiết lập và quản lý các chương trình ưu đãi.",
    "Đánh giá": "Theo dõi và xử lý phản hồi, đánh giá của khách hàng.",
    "Vai trò": "Quản lý vai trò trong hệ thống.",
    "Quyền hạn": "Quản lý quyền truy cập theo vai trò.",
    "Luân chuyển": "Quản lý luân chuyển hàng hóa giữa các cửa hàng.",
    "Loại luân chuyển": "Quản lý loại đơn luân chuyển hàng.",
    "Ca làm việc": "Quản lý các ca làm việc (sáng, chiều, tối) trong hệ thống.",
    "Lịch làm việc": "Quản lý lịch làm việc nhân viên, hỗ trợ import từ Excel.",
    "Lương cơ bản": "Quản lý mức lương cơ bản theo từng nhân viên.",
    "Lương thưởng": "Quản lý bonus và kỳ thưởng của nhân viên.",
    "Đổi ca": "Quản lý yêu cầu đổi ca giữa các nhân viên.",
    "Lỗi phát sinh": "Ghi nhận và xử lý lỗi phát sinh trong ca làm việc.",
  };

  return (
    <div className="flex min-h-screen bg-section/40">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto w-65 h-screen flex flex-col bg-linear-to-b from-indigo-900 via-indigo-800 to-indigo-900 border-r border-indigo-500/20 shrink-0 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <AdminSidebarContent
          pathname={pathname}
          session={session}
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      <main className="flex-1 overflow-x-hidden min-h-screen">
        <div className="lg:hidden sticky top-0 z-30 bg-card border-b border-subtle px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-foreground"
          >
            <FiMenu size={20} />
          </button>
          <span className="text-sm font-semibold text-foreground">
            LUXE Admin
          </span>
        </div>

        <div className="border-b border-subtle bg-card/90 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-5">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">
              {currentPage}
            </h1>
            <p className="text-sm text-muted mt-1">
              {pageDescriptions[currentPage] ||
                "Quản trị dữ liệu và vận hành hệ thống."}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
