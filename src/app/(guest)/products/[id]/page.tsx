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
import Pagination from "@/components/ui/Pagination";
import toast from "react-hot-toast";
import Link from "next/link";
import { FiShoppingCart, FiStar, FiMinus, FiPlus } from "react-icons/fi";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const { setCartCount } = useCartStore();

  const [product, setProduct] = useState<ResSanPhamDTO | null>(null);
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [reviews, setReviews] = useState<ResDanhGiaSanPhamDTO[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);

  const [selectedVariant, setSelectedVariant] =
    useState<ResChiTietSanPhamDTO | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

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
      .getByProduct(Number(id), reviewPage, 5)
      .then((res) => {
        setReviews(res?.result ?? []);
        setReviewTotalPages(res?.meta?.pages ?? 1);
      })
      .catch(() => {});
  }, [id, reviewPage]);

  const discountedPrice = product
    ? product.giaGiam > 0
      ? product.giaBan * (1 - product.giaGiam / 100)
      : product.giaBan
    : 0;

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
      <div className="text-center py-20 text-gray-500">
        Không tìm thấy sản phẩm
      </div>
    );
  }

  const images = selectedVariant?.hinhAnhUrls?.length
    ? selectedVariant.hinhAnhUrls
    : [product.hinhAnhChinh];

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">
          Chi tiết sản phẩm
        </h2>
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-accent">
            Sản phẩm
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">{product.tenSanPham}</span>
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Images */}
          <div>
            <div className="aspect-square overflow-hidden bg-section mb-4">
              <img
                src={getImageUrl(images[selectedImageIdx])}
                alt={product.tenSanPham}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-20 overflow-hidden border-2 flex-shrink-0 ${
                      idx === selectedImageIdx
                        ? "border-foreground"
                        : "border-subtle"
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

          {/* Product Info */}
          <div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">
              {product.tenSanPham}
            </h1>

            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 mb-6">
              <span>{product.tenThuongHieu}</span>
              <span>|</span>
              <span>{product.tenKieuSanPham}</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-2xl font-bold text-foreground">
                {formatCurrency(discountedPrice)}
              </span>
              {product.giaGiam > 0 && (
                <>
                  <span className="text-base text-gray-300 line-through">
                    {formatCurrency(product.giaBan)}
                  </span>
                  <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 uppercase tracking-wider">
                    -{product.giaGiam}%
                  </span>
                </>
              )}
            </div>

            {/* Color selection */}
            {uniqueColors.length > 0 && (
              <div className="mb-5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 block">
                  Màu sắc
                </label>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border text-sm transition ${
                        selectedColor === color
                          ? "border-foreground bg-foreground text-white"
                          : "border-subtle hover:border-foreground"
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
              <div className="mb-5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 block">
                  Kích thước
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
                        className={`px-4 py-2 border text-sm transition ${
                          selectedSize === size
                            ? "border-foreground bg-foreground text-white"
                            : outOfStock
                              ? "border-subtle text-gray-200 cursor-not-allowed line-through"
                              : "border-subtle hover:border-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock info */}
            {selectedVariant && (
              <p className="text-xs text-gray-400 mb-5 uppercase tracking-wider">
                Còn lại:{" "}
                <span className="font-bold text-foreground">
                  {selectedVariant.soLuong}
                </span>{" "}
                sản phẩm
              </p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-8">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Số lượng
              </label>
              <div className="flex items-center border border-subtle">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2.5 hover:bg-section transition"
                >
                  <FiMinus size={14} />
                </button>
                <span className="px-4 py-2.5 min-w-[3rem] text-center text-sm font-bold border-x border-subtle">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedVariant?.soLuong || 1, quantity + 1),
                    )
                  }
                  className="px-3 py-2.5 hover:bg-section transition"
                >
                  <FiPlus size={14} />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={
                addingToCart ||
                !selectedVariant ||
                selectedVariant.soLuong === 0
              }
              className="bg-foreground text-white px-10 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <FiShoppingCart size={16} />
              {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </button>

            {/* Description */}
            <div className="mt-10 border-t border-subtle pt-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                Mô tả sản phẩm
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {product.moTa || "Chưa có mô tả"}
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-14 border-t border-subtle pt-10">
          <h2 className="text-xl font-extrabold text-foreground mb-1">
            Đánh giá sản phẩm
          </h2>
          <div className="w-12 h-[3px] bg-accent mb-8"></div>
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm">Chưa có đánh giá nào</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rv) => (
                <div
                  key={rv.id}
                  className="border border-subtle bg-card px-6 py-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-foreground">
                        {rv.tenKhachHang}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <FiStar
                            key={i}
                            size={12}
                            className={
                              i < rv.soSao
                                ? "text-accent fill-accent"
                                : "text-gray-200"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-300 uppercase tracking-wider">
                      {new Date(rv.ngayTao).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{rv.ghiChu}</p>
                  {rv.hinhAnh && (
                    <img
                      src={getImageUrl(rv.hinhAnh)}
                      alt="review"
                      className="mt-3 w-20 h-20 object-cover border border-subtle"
                    />
                  )}
                </div>
              ))}
              <Pagination
                currentPage={reviewPage}
                totalPages={reviewTotalPages}
                onPageChange={setReviewPage}
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
