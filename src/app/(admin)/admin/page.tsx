"use client";

import { useEffect, useState } from "react";
import { orderService } from "@/services/order.service";
import { productService } from "@/services/product.service";
import Link from "next/link";
import {
  FiShoppingCart,
  FiBox,
  FiClock,
  FiPackage,
  FiAlertCircle,
  FiGift,
} from "react-icons/fi";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [ordersData, productsData, pendingData] = await Promise.all([
        orderService.getAll({ page: 1, size: 1 }),
        productService.getAll({ page: 1, size: 1 }),
        orderService.getAll({ page: 1, size: 1, trangThai: 0 }),
      ]);

      setStats({
        totalOrders: ordersData.meta.total,
        totalProducts: productsData.meta.total,
        totalRevenue: 0,
        pendingOrders: pendingData.meta.total,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Tổng đơn hàng",
      value: stats.totalOrders,
      icon: FiShoppingCart,
      color: "bg-blue-500/10 text-blue-500",
      link: "/admin/orders",
    },
    {
      title: "Tổng sản phẩm",
      value: stats.totalProducts,
      icon: FiBox,
      color: "bg-emerald-500/10 text-emerald-500",
      link: "/admin/products",
    },
    {
      title: "Đơn chờ xử lý",
      value: stats.pendingOrders,
      icon: FiClock,
      color: "bg-orange-500/10 text-orange-500",
      link: "/admin/orders",
    },
  ];

  const quickActions = [
    {
      title: "Quản lý sản phẩm",
      desc: "Thêm, sửa, xóa sản phẩm và quản lý chi tiết biến thể",
      icon: FiBox,
      link: "/admin/products",
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Quản lý đơn hàng",
      desc: "Xem, xác nhận, và cập nhật trạng thái đơn hàng",
      icon: FiShoppingCart,
      link: "/admin/orders",
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      title: "Khuyến mãi",
      desc: "Tạo mã khuyến mãi theo hóa đơn và theo điểm tích lũy",
      icon: FiGift,
      link: "/admin/promotions",
      color: "text-accent bg-accent/10",
    },
    {
      title: "Phiếu nhập kho",
      desc: "Quản lý nhập hàng từ nhà cung cấp",
      icon: FiPackage,
      link: "/admin/inventory",
      color: "text-orange-500 bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-subtle rounded-2xl p-5 lg:p-6">
        <h2 className="text-xl font-bold text-foreground">
          Tổng quan quản trị
        </h2>
        <p className="text-sm text-muted mt-1">
          Theo dõi nhanh hoạt động cửa hàng và truy cập các tác vụ quan trọng.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {cards.map((card) => (
          <Link
            href={card.link}
            key={card.title}
            className="group bg-card rounded-2xl border border-subtle p-5 lg:p-6 hover:border-accent/30 hover:bg-section/60 transition"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}
              >
                <card.icon size={22} />
              </div>
              <div>
                <p className="text-sm text-muted mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-foreground">
                  {loading ? (
                    <span className="inline-block w-16 h-8 bg-section rounded animate-pulse" />
                  ) : (
                    card.value.toLocaleString()
                  )}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">
          Truy cập nhanh
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.link}
              className="group bg-card rounded-2xl border border-subtle p-5 hover:border-accent/30 hover:bg-section/60 transition"
            >
              <div
                className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mb-3`}
              >
                <action.icon size={20} />
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-accent transition">
                {action.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {action.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-card border border-subtle rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <FiAlertCircle className="text-accent" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">Mẹo sử dụng</h3>
          <p className="text-sm text-muted leading-relaxed">
            Sử dụng menu bên trái để điều hướng giữa các trang quản lý. Các chức
            năng được nhóm theo danh mục để dễ dàng tìm kiếm.
          </p>
        </div>
      </div>
    </div>
  );
}
