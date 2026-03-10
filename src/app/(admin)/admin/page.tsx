"use client";

import { useEffect, useState } from "react";
import { orderService } from "@/services/order.service";
import { productService } from "@/services/product.service";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  FiShoppingCart,
  FiBox,
  FiTrendingUp,
  FiClock,
  FiArrowUpRight,
  FiPackage,
  FiUsers,
  FiAlertCircle,
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
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
      link: "/admin/orders",
    },
    {
      title: "Tổng sản phẩm",
      value: stats.totalProducts,
      icon: FiBox,
      gradient: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
      link: "/admin/products",
    },
    {
      title: "Đơn chờ xử lý",
      value: stats.pendingOrders,
      icon: FiClock,
      gradient: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
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
      icon: FiTrendingUp,
      link: "/admin/promotions",
      color: "text-purple-600 bg-purple-100",
    },
    {
      title: "Phiếu nhập kho",
      desc: "Quản lý nhập hàng từ nhà cung cấp",
      icon: FiPackage,
      link: "/admin/inventory",
      color: "text-amber-600 bg-amber-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            Chào mừng trở lại! 👋
          </h1>
          <p className="text-indigo-200 text-sm lg:text-base max-w-xl">
            Đây là tổng quan hoạt động cửa hàng của bạn. Quản lý mọi thứ từ sản
            phẩm, đơn hàng đến khuyến mãi.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {cards.map((card) => (
          <Link
            href={card.link}
            key={card.title}
            className="group bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg`}
              >
                <card.icon size={22} />
              </div>
              <FiArrowUpRight
                size={18}
                className="text-gray-300 group-hover:text-gray-500 transition"
              />
            </div>
            <p className="text-sm text-gray-500 mb-1">{card.title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                card.value.toLocaleString()
              )}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Truy cập nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.link}
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div
                className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mb-3`}
              >
                <action.icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-indigo-600 transition">
                {action.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {action.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <FiAlertCircle className="text-amber-600" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900 mb-1">Mẹo sử dụng</h3>
          <p className="text-sm text-amber-700 leading-relaxed">
            Sử dụng menu bên trái để điều hướng giữa các trang quản lý. Các chức
            năng được nhóm theo danh mục để dễ dàng tìm kiếm.
          </p>
        </div>
      </div>
    </div>
  );
}
