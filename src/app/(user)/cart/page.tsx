"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResGioHangDTO, ResChiTietGioHang } from "@/types";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { formatCurrency } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  FiShoppingBag,
  FiArrowLeft,
  FiX,
  FiMinus,
  FiPlus,
  FiLock,
} from "react-icons/fi";

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const { setCartCount } = useCartStore();
  const [cart, setCart] = useState<ResGioHangDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchCart();
  }, [isAuthenticated, router]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await cartService.getMyCart();
      setCart(data);
      setCartCount(data.tongSoLuong);
    } catch {
      toast.error("Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (maChiTietGioHang: number) => {
    try {
      await cartService.removeCartItem(maChiTietGioHang);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
      fetchCart();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  if (loading) return <Loading />;

  if (!cart || cart.chiTietGioHangs.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <FiShoppingBag className="text-gray-600 mb-6" size={80} />
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Giỏ hàng trống
        </h3>
        <p className="text-gray-500 mb-8">
          Hãy thêm sản phẩm vào giỏ hàng của bạn
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm px-8 py-3.5 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          <FiArrowLeft size={14} /> Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
          Giỏ hàng
        </h1>
        <p className="text-gray-500 mt-2">
          {cart.tongSoLuong} sản phẩm trong giỏ hàng
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.chiTietGioHangs.map((item: ResChiTietGioHang) => (
            <div
              key={item.maChiTietGioHang}
              className="bg-card border border-subtle rounded-xl p-5 flex items-start gap-5"
            >
              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground text-base">
                      {item.tenSanPham}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Kích thước: {item.kichThuoc}{" "}
                      <span className="mx-1">|</span> Màu: {item.mauSac}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.maChiTietGioHang)}
                    className="text-gray-500 hover:text-red-400 transition p-1 shrink-0"
                    title="Xóa"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                {/* Quantity + Price */}
                <div className="flex items-center justify-between mt-5">
                  <div className="inline-flex items-center border border-subtle rounded-lg overflow-hidden">
                    <button className="px-3 py-2 text-gray-400 hover:text-foreground hover:bg-section transition">
                      <FiMinus size={14} />
                    </button>
                    <span className="px-4 py-2 text-sm font-semibold text-foreground min-w-10 text-center">
                      {item.soLuong}
                    </span>
                    <button className="px-3 py-2 text-gray-400 hover:text-foreground hover:bg-section transition">
                      <FiPlus size={14} />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      {formatCurrency(item.thanhTien)}
                    </div>
                    {item.soLuong > 1 && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(item.giaBan)} / sản phẩm
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Continue Shopping */}
          <div className="pt-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition"
            >
              <FiArrowLeft size={14} /> Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-card border border-subtle rounded-xl p-6 sticky top-24">
            <h3 className="text-lg font-bold text-foreground mb-6">
              Tóm tắt đơn hàng
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(cart.tongTien)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span className="font-semibold text-green-400">Miễn phí</span>
              </div>
              <div className="border-t border-subtle pt-4 flex justify-between">
                <span className="font-bold text-foreground text-base">
                  Tổng cộng
                </span>
                <span className="font-bold text-foreground text-xl">
                  {formatCurrency(cart.tongTien)}
                </span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-foreground mb-2">
                Mã giảm giá
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã"
                  className="flex-1 bg-section border border-subtle rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
                <button className="bg-section border border-subtle rounded-lg px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-purple-500/10 hover:border-purple-500 transition">
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              className="mt-6 block w-full text-center bg-linear-to-r from-purple-500 to-pink-500 text-white py-4 font-bold text-sm rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
            >
              Tiến hành đặt hàng
            </Link>

            {/* Secure Checkout */}
            <div className="mt-5 flex items-center justify-center gap-2 text-gray-500 text-xs">
              <FiLock size={12} />
              <span>Thanh toán an toàn & bảo mật</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
