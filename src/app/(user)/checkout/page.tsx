"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ResGioHangDTO,
  KhuyenMaiTheoHoaDon,
  KhuyenMaiTheoDiem,
  ResApDungKhuyenMaiDTO,
} from "@/types";
import { cartService } from "@/services/cart.service";
import { orderService } from "@/services/order.service";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { formatCurrency } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  FiCheckCircle,
  FiMapPin,
  FiPhone,
  FiTag,
  FiUser,
} from "react-icons/fi";

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { setCartCount } = useCartStore();
  const [cart, setCart] = useState<ResGioHangDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [diaChi, setDiaChi] = useState("");
  const [sdt, setSdt] = useState("");
  const [promoHoaDon, setPromoHoaDon] = useState<KhuyenMaiTheoHoaDon[]>([]);
  const [promoDiem, setPromoDiem] = useState<KhuyenMaiTheoDiem[]>([]);
  const [selectedPromoHD, setSelectedPromoHD] = useState<number | undefined>();
  const [selectedPromoDiem, setSelectedPromoDiem] = useState<
    number | undefined
  >();
  const [discountPreview, setDiscountPreview] =
    useState<ResApDungKhuyenMaiDTO | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const parsePromoId = (value: string | null): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  };

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
      const [cartData, promoData] = await Promise.all([
        cartService.getMyCart(),
        cartService
          .getKhuyenMaiHopLe()
          .catch(() => ({ khuyenMaiHoaDon: [], khuyenMaiDiem: [] })),
      ]);
      setCart(cartData);
      setPromoHoaDon(promoData.khuyenMaiHoaDon ?? []);
      setPromoDiem(promoData.khuyenMaiDiem ?? []);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscountPreview = useCallback(
    async (hdId?: number, diemId?: number) => {
      if (!hdId && !diemId) {
        setDiscountPreview(null);
        return;
      }
      setPreviewLoading(true);
      try {
        const preview = await cartService.apDungKhuyenMai({
          maKhuyenMaiHoaDon: hdId,
          maKhuyenMaiDiem: diemId,
        });
        setDiscountPreview(preview);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message;
        toast.error(msg || "Mã khuyến mãi không hợp lệ");
        setDiscountPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    },
    [],
  );

  const handleSelectPromoHD = (value: string) => {
    const id = value ? Number(value) : undefined;
    setSelectedPromoHD(id);
    fetchDiscountPreview(id, selectedPromoDiem);
  };

  const handleSelectPromoDiem = (value: string) => {
    const id = value ? Number(value) : undefined;
    setSelectedPromoDiem(id);
    fetchDiscountPreview(selectedPromoHD, id);
  };

  useEffect(() => {
    const inheritedHdId = parsePromoId(searchParams.get("maKhuyenMaiHoaDon"));
    const inheritedDiemId = parsePromoId(searchParams.get("maKhuyenMaiDiem"));

    setSelectedPromoHD(inheritedHdId);
    setSelectedPromoDiem(inheritedDiemId);
    fetchDiscountPreview(inheritedHdId, inheritedDiemId);
  }, [searchParams, fetchDiscountPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sdt.trim()) {
      toast.error("Vui lòng nhập số điện thoại nhận hàng");
      return;
    }
    if (!diaChi.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao hàng");
      return;
    }
    try {
      setSubmitting(true);
      await orderService.createOnline({
        sdt: sdt.trim(),
        diaChi,
        maKhuyenMaiHoaDon: selectedPromoHD,
        maKhuyenMaiDiem: selectedPromoDiem,
      });
      setCartCount(0);
      toast.success("Đặt hàng thành công!");
      router.push("/orders");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  if (!cart || cart.chiTietGioHangs.length === 0) {
    router.push("/cart");
    return null;
  }

  const finalTotal = discountPreview
    ? discountPreview.tongTienTra
    : cart.tongTien;

  return (
    <>
      <div className="relative overflow-hidden border-b border-subtle">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,197,94,0.15),transparent_38%),radial-gradient(circle_at_82%_14%,rgba(14,165,233,0.18),transparent_34%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold mb-2">
            Checkout Secure
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
            Hoàn tất đơn hàng
          </h2>
          <p className="text-sm text-gray-400">
            <Link href="/" className="hover:text-accent transition">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <Link href="/cart" className="hover:text-accent transition">
              Giỏ hàng
            </Link>
            <span className="mx-2">/</span>
            <span className="text-accent">Thanh toán</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left - Shipping + Promotions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping */}
              <div className="bg-card border border-subtle rounded-2xl p-6 md:p-7">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-5 pb-3 border-b border-subtle">
                  Thông tin giao hàng
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      <FiUser size={13} />
                      Người nhận
                    </label>
                    <input
                      type="text"
                      value={user?.name || ""}
                      disabled
                      className="w-full rounded-xl border border-subtle px-4 py-3 text-sm bg-section text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      <FiPhone size={13} />
                      Số điện thoại nhận hàng{" "}
                      <span className="text-accent">*</span>
                    </label>
                    <input
                      type="tel"
                      value={sdt}
                      onChange={(e) => setSdt(e.target.value)}
                      className="w-full rounded-xl border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-accent transition"
                      placeholder="Nhập số điện thoại..."
                      required
                    />
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      <FiMapPin size={13} />
                      Địa chỉ giao hàng <span className="text-accent">*</span>
                    </label>
                    <textarea
                      value={diaChi}
                      onChange={(e) => setDiaChi(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-accent transition"
                      placeholder="Nhập địa chỉ chi tiết..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Promotions */}
              <div className="bg-card border border-subtle rounded-2xl p-6 md:p-7">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-5 pb-3 border-b border-subtle inline-flex items-center gap-2">
                  <FiTag size={14} />
                  Mã khuyến mãi
                </h3>
                {promoHoaDon.length > 0 && (
                  <div className="mb-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Khuyến mãi hóa đơn
                    </label>
                    <select
                      value={selectedPromoHD || ""}
                      onChange={(e) => handleSelectPromoHD(e.target.value)}
                      className="w-full rounded-xl border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-accent transition"
                    >
                      <option value="">-- Không sử dụng --</option>
                      {promoHoaDon.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.tenKhuyenMai} — Giảm {p.phanTramGiam}% (tối đa{" "}
                          {formatCurrency(p.giamToiDa)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {promoDiem.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Khuyến mãi điểm tích lũy ({user?.diemTichLuy ?? 0} điểm)
                    </label>
                    <select
                      value={selectedPromoDiem || ""}
                      onChange={(e) => handleSelectPromoDiem(e.target.value)}
                      className="w-full rounded-xl border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-accent transition"
                    >
                      <option value="">-- Không sử dụng --</option>
                      {promoDiem.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.tenKhuyenMai} — Giảm {p.phanTramGiam}%
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
              <div className="bg-card border border-subtle rounded-2xl p-6 md:p-7 sticky top-28 shadow-lg shadow-black/10">
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

                {/* Totals */}
                <div className="space-y-2 text-sm border-t border-subtle pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tổng tiền hàng</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(cart.tongTien)}
                    </span>
                  </div>
                  {previewLoading && (
                    <p className="text-xs text-gray-400 text-center py-1">
                      Đang tính giảm giá...
                    </p>
                  )}
                  {discountPreview && !previewLoading && (
                    <>
                      {(discountPreview.tienGiamHoaDon ?? 0) > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span className="flex flex-col">
                            <span>KM hóa đơn</span>
                            <span className="text-xs text-gray-400 font-normal">
                              {discountPreview.tenKhuyenMaiHoaDon}
                            </span>
                          </span>
                          <span>
                            -{formatCurrency(discountPreview.tienGiamHoaDon!)}
                          </span>
                        </div>
                      )}
                      {(discountPreview.tienGiamDiem ?? 0) > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span className="flex flex-col">
                            <span>KM điểm</span>
                            <span className="text-xs text-gray-400 font-normal">
                              {discountPreview.tenKhuyenMaiDiem}
                            </span>
                          </span>
                          <span>
                            -{formatCurrency(discountPreview.tienGiamDiem!)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="border-t border-subtle pt-3 flex justify-between items-center">
                    <span className="font-bold text-foreground uppercase text-sm">
                      Tổng thanh toán
                    </span>
                    <span className="font-bold text-accent text-lg">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-7 w-full rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-white py-3.5 font-semibold text-sm uppercase tracking-wider hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
                </button>

                <p className="mt-4 text-xs text-gray-500 inline-flex items-center gap-2">
                  <FiCheckCircle size={13} className="text-emerald-500" />
                  Thanh toán được bảo mật và mã hóa dữ liệu
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
