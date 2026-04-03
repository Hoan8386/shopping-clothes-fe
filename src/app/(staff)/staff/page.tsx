"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FiPackage,
  FiShoppingCart,
  FiTruck,
  FiRotateCcw,
} from "react-icons/fi";
import { StatCard } from "@/components/dashboard/stat-card";
import { staffDashboardAPI } from "@/services/dashboard.service";

interface StaffDashboardSummary {
  employeeId: number;
  employeeName: string;
  storeName: string;
  ordersNeedProcess: number;
  ordersPacking: number;
  ordersShipping: number;
  ordersReturnExchange: number;
}

export default function StaffPage() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState<StaffDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeId = useMemo(() => {
    const queryEmployeeId = searchParams.get("employeeId");
    if (queryEmployeeId) return queryEmployeeId;
    return (session?.user as { id?: string } | undefined)?.id || "";
  }, [searchParams, session]);

  useEffect(() => {
    if (status === "loading") return;
    if (!employeeId) return;

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const response =
          await staffDashboardAPI.getSummary<StaffDashboardSummary>(employeeId);
        setSummary(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, [employeeId, status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-gray-600">Đang tải phiên đăng nhập...</div>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center max-w-md">
          <h2 className="text-lg font-semibold text-yellow-900">
            Không thể tải dữ liệu
          </h2>
          <p className="text-yellow-700 mt-2">
            Không tìm thấy thông tin nhân viên trong session. Vui lòng đăng nhập
            lại.
          </p>
        </div>
      </div>
    );
  }

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
          Xin chào,{" "}
          {summary?.employeeName || session?.user?.name || "nhân viên"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {summary
            ? `Cửa hàng: ${summary.storeName}`
            : "Đang tải thông tin cửa hàng..."}
        </p>
      </div>

      {loading && !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-lg h-32 animate-pulse"
            />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Đơn cần xử lý"
            value={summary.ordersNeedProcess}
            icon={<FiShoppingCart />}
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Đơn cần đóng gói"
            value={summary.ordersPacking}
            icon={<FiPackage />}
            bgColor="bg-orange-50"
          />
          <StatCard
            title="Đơn cần giao"
            value={summary.ordersShipping}
            icon={<FiTruck />}
            bgColor="bg-emerald-50"
          />
          <StatCard
            title="Đơn đổi/trả"
            value={summary.ordersReturnExchange}
            icon={<FiRotateCcw />}
            bgColor="bg-purple-50"
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-600">
          Không có dữ liệu dashboard.
        </div>
      )}
    </div>
  );
}
