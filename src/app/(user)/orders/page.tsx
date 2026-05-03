"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DonHang } from "@/types";
import { orderService } from "@/services/order.service";
import { useAuthStore } from "@/store/auth.store";
import {
  formatCurrency,
  formatDate,
  getOrderStatusText,
  getPaymentMethodText,
} from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import Pagination from "@/components/ui/Pagination";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiBox,
} from "react-icons/fi";

const statusConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  "Chờ xác nhận": {
    icon: <FiClock size={14} />,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
  "Đã xác nhận": {
    icon: <FiCheckCircle size={14} />,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  "Đang đóng gói": {
    icon: <FiBox size={14} />,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
  "Đang giao hàng": {
    icon: <FiTruck size={14} />,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
  },
  "Đã hủy": {
    icon: <FiXCircle size={14} />,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  "Đã nhận hàng": {
    icon: <FiCheckCircle size={14} />,
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/20",
  },
};

function getStatusStyle(status: string | number) {
  const key = typeof status === "string" ? status : String(status);
  return (
    statusConfig[key] || {
      icon: <FiPackage size={14} />,
      color: "text-gray-400",
      bg: "bg-gray-400/10",
      border: "border-gray-400/20",
    }
  );
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<DonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);
  const router = useRouter();

  const fetchOrders = useCallback(
    async (showPageLoading = false) => {
      try {
        if (showPageLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const data = await orderService.getAll({
          page,
          size: 10,
          trangThai: filterStatus,
        });
        setOrders(data.result);
        setTotalPages(data.meta.pages);
      } catch {
        toast.error("Không thể tải đơn hàng");
      } finally {
        if (showPageLoading) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [page, filterStatus],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const shouldShowPageLoading = !hasLoadedRef.current;
    fetchOrders(shouldShowPageLoading);
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
    }
  }, [isAuthenticated, router, fetchOrders]);

  const handleConfirmReceived = async (
    e: React.MouseEvent,
    orderId: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Xác nhận bạn đã nhận được hàng?")) return;
    try {
      setConfirmingId(orderId);
      await orderService.update({ id: orderId, trangThai: 5 } as DonHang);
      toast.success("Đã xác nhận nhận hàng thành công!");
      fetchOrders(false);
    } catch {
      toast.error("Không thể xác nhận nhận hàng");
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading && orders.length === 0) return <Loading />;

  const statusTabs = [
    { label: "Tất cả", value: undefined },
    { label: "Chờ xác nhận", value: 0 },
    { label: "Đã xác nhận", value: 1 },
    { label: "Đang đóng gói", value: 2 },
    { label: "Đang giao", value: 3 },
    { label: "Đã hủy", value: 4 },
    { label: "Đã nhận hàng", value: 5 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
          Đơn hàng của tôi
        </h1>
        <p className="text-gray-500 mt-2">Theo dõi và quản lý đơn hàng</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {statusTabs.map((f) => (
          <button
            key={f.label}
            onClick={() => {
              setFilterStatus(f.value);
              setPage(1);
            }}
            className={`px-5 py-2.5 text-xs font-semibold rounded-full transition-all ${
              filterStatus === f.value
                ? "bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-card border border-subtle text-gray-400 hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* {refreshing && (
        <p className="text-xs text-gray-500 mb-4">Đang cập nhật danh sách...</p>
      )} */}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <FiPackage className="mx-auto text-gray-600 mb-6" size={64} />
          <h3 className="text-lg font-bold text-foreground mb-2">
            Không có đơn hàng nào
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Bạn chưa có đơn hàng nào trong mục này
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm px-8 py-3.5 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const style = getStatusStyle(order.trangThai);
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-card border border-subtle rounded-xl hover:border-purple-500/30 transition-all group"
              >
                {/* Order Top */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">
                      #{order.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(order.ngayTao)}
                    </span>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${style.color} ${style.bg} ${style.border}`}
                  >
                    {style.icon}
                    {getOrderStatusText(order.trangThai)}
                  </div>
                </div>

                {/* Order Body */}
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-6 flex-1">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tổng tiền</p>
                      <p className="text-base font-bold text-foreground">
                        {formatCurrency(order.tongTienTra || order.tongTien)}
                      </p>
                    </div>
                    {order.tienGiam > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Giảm giá</p>
                        <p className="text-base font-semibold text-green-400">
                          -{formatCurrency(order.tienGiam)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Hình thức</p>
                      <p className="text-sm font-medium text-foreground">
                        {getPaymentMethodText(order.hinhThucDonHang)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payment ref</p>
                      <p className="text-sm font-medium text-foreground">
                        {order.paymentRef || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Bên vận chuyển
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {order.vanChuyen?.tenVanChuyen || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Địa chỉ</p>
                      <p className="text-sm font-medium text-foreground truncate max-w-50">
                        {order.diaChi || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Số điện thoại
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {order.sdt || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {(order.trangThai === "Đang giao hàng" ||
                      order.trangThai === 3) && (
                      <button
                        onClick={(e) => handleConfirmReceived(e, order.id)}
                        disabled={confirmingId === order.id}
                        className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-full hover:bg-green-600 transition disabled:opacity-50"
                      >
                        {confirmingId === order.id
                          ? "Đang xử lý..."
                          : "Đã nhận hàng"}
                      </button>
                    )}
                    <FiChevronRight
                      size={20}
                      className="text-gray-500 group-hover:text-purple-400 transition"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
