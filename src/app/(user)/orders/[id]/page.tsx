"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DonHang } from "@/types";
import { orderService } from "@/services/order.service";
import { useAuthStore } from "@/store/auth.store";
import {
  formatCurrency,
  formatDate,
  getOrderStatusText,
  getOrderStatusColor,
  getPaymentStatusText,
  getImageUrl,
} from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function OrderDetailPage() {
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<DonHang | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchOrder();
  }, [isAuthenticated, params.id, router]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getById(Number(params.id));
      setOrder(data);
    } catch {
      toast.error("Không thể tải đơn hàng");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    try {
      await orderService.update({ id: order.id, trangThai: 4 } as DonHang);
      toast.success("Đã hủy đơn hàng");
      fetchOrder();
    } catch {
      toast.error("Không thể hủy đơn hàng");
    }
  };

  if (loading) return <Loading />;
  if (!order) return null;

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">
          Chi tiết đơn hàng
        </h2>
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/orders" className="hover:text-accent">
            Đơn hàng
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">#{order.id}</span>
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground hover:text-accent transition mb-8"
        >
          <FiArrowLeft size={14} /> Quay lại danh sách
        </Link>

        {/* Order Info */}
        <div className="border border-subtle bg-card mb-6">
          <div className="flex items-center justify-between px-6 py-5 border-b border-subtle">
            <h3 className="text-lg font-bold text-foreground">
              Đơn hàng #{order.id}
            </h3>
            <span
              className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${getOrderStatusColor(
                order.trangThai,
              )}`}
            >
              {getOrderStatusText(order.trangThai)}
            </span>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Ngày đặt
                </p>
                <p className="font-semibold text-foreground">
                  {formatDate(order.ngayTao)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Hình thức
                </p>
                <p className="font-semibold text-foreground">
                  {order.hinhThucDonHang === 0 ? "Tại quầy" : "Online"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Thanh toán
                </p>
                <p className="font-semibold text-foreground">
                  {getPaymentStatusText(order.trangThaiThanhToan)}
                </p>
              </div>
              {order.diaChi && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Địa chỉ giao hàng
                  </p>
                  <p className="font-semibold text-foreground">{order.diaChi}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="border border-subtle bg-card mb-6">
          <div className="px-6 py-4 border-b border-subtle">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Chi tiết sản phẩm
            </h3>
          </div>
          <div className="divide-y divide-subtle">
            {order.chiTietDonHangs?.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">
                    {item.chiTietSanPham?.tenSanPham || "Sản phẩm"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.chiTietSanPham?.tenMauSac} /{" "}
                    {item.chiTietSanPham?.tenKichThuoc} × {item.soLuong}
                  </p>
                  {item.giamGia > 0 && (
                    <p className="text-xs text-accent mt-0.5">
                      Giảm giá: {item.giamGia}%
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {formatCurrency(item.thanhTien)}
                  </p>
                  {item.giaGiam > 0 && (
                    <p className="text-xs text-gray-400 line-through">
                      {formatCurrency(item.giaSanPham * item.soLuong)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Totals */}
        <div className="border border-subtle bg-card mb-6">
          <div className="px-6 py-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng tiền hàng</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(order.tongTien)}
                </span>
              </div>
              {order.tienGiam > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(order.tienGiam)}</span>
                </div>
              )}
              {order.tongTienGiam > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Tổng giảm</span>
                  <span>-{formatCurrency(order.tongTienGiam)}</span>
                </div>
              )}
              <div className="border-t border-subtle pt-3 flex justify-between">
                <span className="font-bold text-foreground uppercase text-sm">
                  Tổng thanh toán
                </span>
                <span className="font-bold text-accent text-lg">
                  {formatCurrency(order.tongTienTra || order.tongTien)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {order.trangThai === 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleCancelOrder}
              className="px-8 py-3 bg-accent text-white text-sm font-bold uppercase tracking-wider hover:bg-accent-hover transition"
            >
              Hủy đơn hàng
            </button>
          </div>
        )}
      </div>
    </>
  );
}
