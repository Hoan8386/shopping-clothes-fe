"use client";

import { useEffect, useState } from "react";
import { orderService } from "@/services/order.service";
import { productService } from "@/services/product.service";
import { formatCurrency } from "@/lib/utils";
import {
  FiShoppingCart,
  FiBox,
  FiDollarSign,
  FiTrendingUp,
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
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Tổng sản phẩm",
      value: stats.totalProducts,
      icon: FiBox,
      color: "bg-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Đơn chờ xử lý",
      value: stats.pendingOrders,
      icon: FiTrendingUp,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.bgColor} rounded-xl p-6 border`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? "..." : card.value}
                </p>
              </div>
              <div
                className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-white`}
              >
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Hướng dẫn nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800 mb-1">Quản lý sản phẩm</p>
            <p>Thêm, sửa, xóa sản phẩm và quản lý chi tiết biến thể</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800 mb-1">Quản lý đơn hàng</p>
            <p>Xem, xác nhận, và cập nhật trạng thái đơn hàng</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800 mb-1">Khuyến mãi</p>
            <p>Tạo mã khuyến mãi theo hóa đơn và theo điểm tích lũy</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800 mb-1">Phân quyền</p>
            <p>Quản lý vai trò và quyền hạn cho nhân viên</p>
          </div>
        </div>
      </div>
    </div>
  );
}
