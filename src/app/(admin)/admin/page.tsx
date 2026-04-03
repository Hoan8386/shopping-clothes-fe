"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarChart } from "@/components/dashboard/chart-bar";
import { LineChart } from "@/components/dashboard/line-chart";
import { TopProductsTable } from "@/components/dashboard/table-top-products";
import { adminDashboardAPI } from "@/services/dashboard.service";

interface DailyStat {
  date: string;
  revenue: number;
  orderCount: number;
}

interface TopProductStat {
  productId: number;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  profitMargin: number;
}

interface AdminDashboardSummary {
  todayRevenue: number;
  monthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowthPercent: number;
  monthlyOrders: number;
  newCustomers: number;
  productsSold: number;
  totalCustomers: number;
  revenueByDay: DailyStat[];
  ordersByDay: DailyStat[];
  topProducts: TopProductStat[];
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const response =
          await adminDashboardAPI.getSummary<AdminDashboardSummary>();
        setSummary(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <h2 className="text-lg font-semibold text-red-900">
            Lỗi tải dữ liệu
          </h2>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:p-6 shadow-sm">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Dashboard quản trị
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Doanh thu, đơn hàng, khách hàng và sản phẩm bán chạy trong tháng này.
        </p>
      </div>

      {loading && !summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-lg h-32 animate-pulse"
            />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard
              title="Doanh thu hôm nay"
              value={formatCurrency(summary.todayRevenue)}
              bgColor="bg-blue-50"
            />
            <StatCard
              title="Doanh thu tháng này"
              value={formatCurrency(summary.monthRevenue)}
              trend={Math.round(summary.revenueGrowthPercent)}
              trendUp={summary.revenueGrowthPercent >= 0}
              bgColor="bg-emerald-50"
            />
            <StatCard
              title="Số đơn hàng"
              value={summary.monthlyOrders}
              subtitle="trong tháng"
              bgColor="bg-orange-50"
            />
            <StatCard
              title="Khách hàng mới"
              value={summary.newCustomers}
              bgColor="bg-purple-50"
            />
            <StatCard
              title="Sản phẩm đã bán"
              value={summary.productsSold}
              bgColor="bg-pink-50"
            />
            <StatCard
              title="Tổng số khách"
              value={summary.totalCustomers}
              bgColor="bg-indigo-50"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <LineChart
              title="Doanh thu theo ngày"
              data={summary.revenueByDay.map((item) => ({
                label: item.date.slice(5),
                value: Math.round(item.revenue / 1000000),
              }))}
            />
            <BarChart
              title="Đơn hàng theo ngày"
              data={summary.ordersByDay.map((item) => ({
                label: item.date.slice(5),
                value: item.orderCount,
                color: "bg-emerald-500",
              }))}
            />
          </div>

          <TopProductsTable data={summary.topProducts} isLoading={loading} />
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-600">
          Không có dữ liệu dashboard.
        </div>
      )}
    </div>
  );
}
