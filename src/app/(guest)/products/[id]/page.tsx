"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  productService,
  productVariantService,
} from "@/services/product.service";
import { danhGiaService } from "@/services/common.service";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import {
  ResSanPhamDTO,
  ResChiTietSanPhamDTO,
  ResDanhGiaSanPhamDTO,
} from "@/types";
import { getImageUrl, formatCurrency } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import Barcode128 from "@/components/ui/Barcode128";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  FiShoppingCart,
  FiStar,
  FiMinus,
  FiPlus,
  FiMapPin,
  FiBox,
  FiChevronRight,
  FiCheck,
  FiTruck,
  FiShield,
  FiRefreshCw,
} from "react-icons/fi";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const { setCartCount } = useCartStore();

  const [product, setProduct] = useState<ResSanPhamDTO | null>(null);
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [reviews, setReviews] = useState<ResDanhGiaSanPhamDTO[]>([]);

  const [selectedVariant, setSelectedVariant] =
    useState<ResChiTietSanPhamDTO | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description",
  );

  // Unique colors/sizes
  const uniqueColors = [...new Set(variants.map((v) => v.tenMauSac))];
  const uniqueSizes = [...new Set(variants.map((v) => v.tenKichThuoc))];

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [prod, vars] = await Promise.all([
          productService.getById(Number(id)),
          productVariantService.getByProduct(Number(id)),
        ]);
        setProduct(prod);
        setVariants(vars);
        if (vars.length > 0) {
          setSelectedColor(vars[0].tenMauSac);
          setSelectedSize(vars[0].tenKichThuoc);
        }
      } catch {
        toast.error("Không tìm thấy sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Update selected variant when color/size changes
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const match = variants.find(
        (v) => v.tenMauSac === selectedColor && v.tenKichThuoc === selectedSize,
      );
      setSelectedVariant(match || null);
      setSelectedImageIdx(0);
    }
  }, [selectedColor, selectedSize, variants]);

  // Load reviews
  useEffect(() => {
    if (!id) return;
    danhGiaService
      .getByProduct(Number(id))
      .then((list) => {
        setReviews(list);
      })
      .catch(() => {});
  }, [id]);

  const discountedPrice = product
    ? product.giaGiam > 0
      ? product.giaBan * (1 - product.giaGiam / 100)
      : product.giaBan
    : 0;

  // Stores for the current color+size combination
  const storesForVariant = variants.filter(
    (v) => v.tenMauSac === selectedColor && v.tenKichThuoc === selectedSize,
  );

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }
    if (!selectedVariant) {
      toast.error("Vui lòng chọn phiên bản sản phẩm");
      return;
    }
    if (selectedVariant.soLuong < quantity) {
      toast.error("Số lượng vượt quá tồn kho");
      return;
    }

    setAddingToCart(true);
    try {
      await cartService.addToCart({
        maChiTietSanPham: selectedVariant.id,
        soLuong: quantity,
      });
      const cart = await cartService.getMyCart();
      setCartCount(cart.tongSoLuong);
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi thêm giỏ hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <Loading />;
  if (!product) {
    return (
      <div className="text-center py-20 text-muted">
        Không tìm thấy sản phẩm
      </div>
    );
  }

  const images = selectedVariant?.hinhAnhUrls?.length
    ? selectedVariant.hinhAnhUrls
    : [product.hinhAnhChinh];

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.soSao, 0) / reviews.length
      : 0;

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section border-b border-subtle">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Link href="/" className="hover:text-accent transition-colors">
              Trang chủ
            </Link>
            <FiChevronRight size={12} />
            <Link
              href="/products"
              className="hover:text-accent transition-colors"
            >
              Sản phẩm
            </Link>
            <FiChevronRight size={12} />
            <span className="text-foreground font-medium truncate max-w-50">
              {product.tenSanPham}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* ===== Images ===== */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-section border border-subtle">
              <img
                src={getImageUrl(images[selectedImageIdx])}
                alt={product.tenSanPham}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {product.giaGiam > 0 && (
                <span className="absolute top-4 left-4 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md">
                  -{product.giaGiam}%
                </span>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 ${
                      idx === selectedImageIdx
                        ? "border-accent shadow-md ring-2 ring-accent/20"
                        : "border-subtle hover:border-muted"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== Product Info ===== */}
          <div className="space-y-6">
            {/* Brand + Category */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full">
                {product.tenThuongHieu}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted bg-section px-3 py-1 rounded-full">
                {product.tenKieuSanPham}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              {product.tenSanPham}
            </h1>

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <FiStar
                      key={i}
                      size={14}
                      className={
                        i < Math.round(avgRating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-muted">
                  {avgRating.toFixed(1)} ({reviews.length} đánh giá)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 pb-2">
              <span className="text-3xl font-bold text-accent">
                {formatCurrency(discountedPrice)}
              </span>
              {product.giaGiam > 0 && (
                <span className="text-lg text-muted line-through">
                  {formatCurrency(product.giaBan)}
                </span>
              )}
            </div>

            <div className="h-px bg-subtle" />

            {/* Color selection */}
            {uniqueColors.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  Màu sắc:
                  <span className="font-normal text-muted">
                    {selectedColor}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedColor === color
                          ? "bg-foreground text-background shadow-md"
                          : "bg-section border border-subtle text-foreground hover:border-foreground"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            {uniqueSizes.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  Kích thước:
                  <span className="font-normal text-muted">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => {
                    const variant = variants.find(
                      (v) =>
                        v.tenMauSac === selectedColor &&
                        v.tenKichThuoc === size,
                    );
                    const outOfStock = !variant || variant.soLuong === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => !outOfStock && setSelectedSize(size)}
                        disabled={outOfStock}
                        className={`min-w-12 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          selectedSize === size
                            ? "bg-foreground text-background shadow-md"
                            : outOfStock
                              ? "bg-section border border-subtle text-muted/40 cursor-not-allowed line-through"
                              : "bg-section border border-subtle text-foreground hover:border-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Store availability */}
            {selectedVariant && storesForVariant.length > 0 && (
              <div className="bg-section rounded-xl p-4 border border-subtle">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FiMapPin size={14} className="text-accent" />
                  Có sẵn tại cửa hàng
                </h4>
                <div className="space-y-2">
                  {storesForVariant.map((sv) => (
                    <div
                      key={sv.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                        selectedVariant.id === sv.id
                          ? "bg-accent/10 border border-accent/20"
                          : "bg-card border border-subtle hover:border-muted cursor-pointer"
                      }`}
                      onClick={() => setSelectedVariant(sv)}
                    >
                      <div className="flex items-center gap-2.5">
                        {selectedVariant.id === sv.id && (
                          <FiCheck size={14} className="text-accent shrink-0" />
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {sv.tenCuaHang}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          sv.soLuong > 5
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : sv.soLuong > 0
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {sv.soLuong > 0 ? `Còn ${sv.soLuong} SP` : "Hết hàng"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock info */}
            {selectedVariant && (
              <div className="flex items-center gap-2">
                <FiBox size={14} className="text-muted" />
                <span className="text-sm text-muted">
                  Tồn kho:{" "}
                  <span
                    className={`font-bold ${
                      selectedVariant.soLuong > 5
                        ? "text-green-600 dark:text-green-400"
                        : selectedVariant.soLuong > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-500"
                    }`}
                  >
                    {selectedVariant.soLuong > 0
                      ? `${selectedVariant.soLuong} sản phẩm`
                      : "Hết hàng"}
                  </span>
                </span>
              </div>
            )}

            {selectedVariant && (
              <div className="bg-card border border-subtle rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                  Mã vạch sản phẩm
                </p>
                <Barcode128
                  value={selectedVariant.maVach}
                  className="flex flex-col items-start gap-2"
                />
              </div>
            )}

            <div className="h-px bg-subtle" />

            {/* Quantity + Add to cart */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center rounded-xl border border-subtle overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-3 hover:bg-section transition-colors text-foreground"
                >
                  <FiMinus size={14} />
                </button>
                <span className="px-5 py-3 min-w-14 text-center text-sm font-bold border-x border-subtle bg-card">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedVariant?.soLuong || 1, quantity + 1),
                    )
                  }
                  className="px-3.5 py-3 hover:bg-section transition-colors text-foreground"
                >
                  <FiPlus size={14} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={
                  addingToCart ||
                  !selectedVariant ||
                  selectedVariant.soLuong === 0
                }
                className="flex-1 w-full sm:w-auto bg-accent hover:bg-accent-hover text-white px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-accent/20 hover:shadow-accent/30"
              >
                <FiShoppingCart size={16} />
                {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </button>
            </div>

            {/* Service badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex flex-col items-center gap-1.5 text-center p-3 rounded-xl bg-section border border-subtle">
                <FiTruck size={18} className="text-accent" />
                <span className="text-[11px] font-medium text-muted">
                  Giao hàng nhanh
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center p-3 rounded-xl bg-section border border-subtle">
                <FiShield size={18} className="text-accent" />
                <span className="text-[11px] font-medium text-muted">
                  Hàng chính hãng
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center p-3 rounded-xl bg-section border border-subtle">
                <FiRefreshCw size={18} className="text-accent" />
                <span className="text-[11px] font-medium text-muted">
                  Đổi trả 30 ngày
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Tabs: Description + Reviews ===== */}
        <div className="mt-14">
          {/* Tab buttons */}
          <div className="flex border-b border-subtle">
            <button
              onClick={() => setActiveTab("description")}
              className={`px-6 py-3.5 text-sm font-semibold transition-colors relative ${
                activeTab === "description"
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Mô tả sản phẩm
              {activeTab === "description" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-6 py-3.5 text-sm font-semibold transition-colors relative ${
                activeTab === "reviews"
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Đánh giá ({reviews.length})
              {activeTab === "reviews" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="py-8">
            {activeTab === "description" && (
              <div className="max-w-3xl">
                <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                  {product.moTa || "Chưa có mô tả cho sản phẩm này."}
                </p>
              </div>
            )}

            {activeTab === "reviews" && (
              <>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <FiStar size={40} className="mx-auto text-subtle mb-3" />
                    <p className="text-muted text-sm">
                      Chưa có đánh giá nào cho sản phẩm này
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl">
                    {reviews.map((rv) => (
                      <div
                        key={rv.id}
                        className="bg-card border border-subtle rounded-xl p-5"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                              {rv.tenKhachHang?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-sm text-foreground block">
                                {rv.tenKhachHang}
                              </span>
                              <span className="text-xs text-muted">
                                {new Date(rv.ngayTao).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            {Array.from({ length: 5 }, (_, i) => (
                              <FiStar
                                key={i}
                                size={13}
                                className={
                                  i < rv.soSao
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-gray-300"
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted leading-relaxed">
                          {rv.ghiTru}
                        </p>
                        {rv.hinhAnh && (
                          <img
                            src={getImageUrl(rv.hinhAnh)}
                            alt="review"
                            className="mt-3 w-20 h-20 rounded-lg object-cover border border-subtle"
                          />
                        )}
                        {rv.linkVideo && (
                          <video
                            src={getImageUrl(rv.linkVideo)}
                            controls
                            className="mt-3 w-full max-w-sm rounded-lg border border-subtle"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
