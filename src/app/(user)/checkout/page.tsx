"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResGioHangDTO, KhuyenMaiTheoHoaDon, KhuyenMaiTheoDiem } from "@/types";
import { cartService } from "@/services/cart.service";
import { orderService } from "@/services/order.service";
import {
  khuyenMaiHoaDonService,
  khuyenMaiDiemService,
} from "@/services/common.service";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { formatCurrency } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import Link from "next/link";

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { setCartCount } = useCartStore();
  const [cart, setCart] = useState<ResGioHangDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [diaChi, setDiaChi] = useState("");
  const [promoHoaDon, setPromoHoaDon] = useState<KhuyenMaiTheoHoaDon[]>([]);
  const [promoDiem, setPromoDiem] = useState<KhuyenMaiTheoDiem[]>([]);
  const [selectedPromoHD, setSelectedPromoHD] = useState<number | undefined>();
  const [selectedPromoDiem, setSelectedPromoDiem] = useState<
    number | undefined
  >();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cartData, promoHD, promoDi] = await Promise.all([
        cartService.getMyCart(),
        khuyenMaiHoaDonService.getAll().catch(() => []),
        khuyenMaiDiemService.getAll().catch(() => []),
      ]);
      setCart(cartData);
      setPromoHoaDon(
        Array.isArray(promoHD) ? promoHD.filter((p) => p.trangThai === 1) : [],
      );
      setPromoDiem(
        Array.isArray(promoDi) ? promoDi.filter((p) => p.trangThai === 1) : [],
      );
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diaChi.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao hàng");
      return;
    }
    try {
      setSubmitting(true);
      await orderService.createOnline({
        diaChi,
        maKhuyenMaiHoaDon: selectedPromoHD,
        maKhuyenMaiDiem: selectedPromoDiem,
      });
      setCartCount(0);
      toast.success("Đặt hàng thành công!");
      router.push("/orders");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  if (!cart || cart.chiTietGioHangs.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">Thanh toán</h2>
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/cart" className="hover:text-accent">
            Giỏ hàng
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">Thanh toán</span>
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left - Shipping + Promotions */}
            <div className="lg:col-span-7 space-y-8">
              {/* Shipping */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-5 pb-3 border-b border-subtle">
                  Thông tin giao hàng
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Người nhận
                    </label>
                    <input
                      type="text"
                      value={user?.name || ""}
                      disabled
                      className="w-full border border-subtle px-4 py-3 text-sm bg-section text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Địa chỉ giao hàng{" "}
                      <span className="text-accent">*</span>
                    </label>
                    <textarea
                      value={diaChi}
                      onChange={(e) => setDiaChi(e.target.value)}
                      rows={3}
                      className="w-full border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-accent transition"
                      placeholder="Nhập địa chỉ chi tiết..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Promotions */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-5 pb-3 border-b border-subtle">
                  Mã khuyến mãi
                </h3>
                {promoHoaDon.length > 0 && (
                  <div className="mb-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Khuyến mãi hóa đơn
                    </label>
                    <select
                      value={selectedPromoHD || ""}
                      onChange={(e) =>
                        setSelectedPromoHD(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      className="w-full border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-accent transition"
                    >
                      <option value="">-- Không sử dụng --</option>
                      {promoHoaDon.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.tenKhuyenMai} - Giảm {p.phanTramGiam}% (tối đa{" "}
                          {formatCurrency(p.giamToiDa)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {promoDiem.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Khuyến mãi điểm tích lũy ({user?.diemTichLuy || 0} điểm)
                    </label>
                    <select
                      value={selectedPromoDiem || ""}
                      onChange={(e) =>
                        setSelectedPromoDiem(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      className="w-full border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-accent transition"
                    >
                      <option value="">-- Không sử dụng --</option>
                      {promoDiem.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.tenKhuyenMai} - Giảm {p.phanTramGiam}%
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {promoHoaDon.length === 0 && promoDiem.length === 0 && (
                  <p className="text-gray-400 text-sm">
                    Không có mã khuyến mãi khả dụng
                  </p>
                )}
              </div>
            </div>

            {/* Right - Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-section p-8 sticky top-32">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6 pb-3 border-b border-subtle">
                  Đơn hàng của bạn
                </h3>
                <div className="space-y-4 max-h-64 overflow-y-auto mb-6">
                  {cart.chiTietGioHangs.map((item) => (
                    <div
                      key={item.maChiTietGioHang}
                      className="flex justify-between text-sm"
                    >
                      <div className="flex-1 pr-4">
                        <p className="font-semibold text-foreground">
                          {item.tenSanPham}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.mauSac} / {item.kichThuoc} × {item.soLuong}
                        </p>
                      </div>
                      <p className="font-semibold text-foreground shrink-0">
                        {formatCurrency(item.thanhTien)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-subtle pt-4 flex justify-between items-center">
                  <span className="font-bold text-foreground uppercase text-sm">
                    Tổng cộng
                  </span>
                  <span className="font-bold text-accent text-lg">
                    {formatCurrency(cart.tongTien)}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-8 w-full bg-foreground text-white py-3.5 font-semibold text-sm uppercase tracking-wider hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
