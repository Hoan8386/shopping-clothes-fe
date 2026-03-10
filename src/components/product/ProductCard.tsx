"use client";

import Link from "next/link";
import { ResSanPhamDTO } from "@/types";
import { getImageUrl, formatCurrency } from "@/lib/utils";
import { FiShoppingBag, FiEye, FiHeart } from "react-icons/fi";

interface Props {
  product: ResSanPhamDTO;
}

export default function ProductCard({ product }: Props) {
  const discountedPrice =
    product.giaGiam > 0
      ? product.giaBan * (1 - product.giaGiam / 100)
      : product.giaBan;

  const isOutOfStock = product.soLuong === 0;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-card rounded-2xl overflow-hidden border border-subtle hover:border-accent/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/8 dark:hover:shadow-black/25 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-3/4 overflow-hidden bg-section">
          <img
            src={getImageUrl(product.hinhAnhChinh)}
            alt={product.tenSanPham}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />

          {/* Top badges row */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            {/* Discount badge */}
            {product.giaGiam > 0 ? (
              <span className="bg-accent text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md">
                -{product.giaGiam}%
              </span>
            ) : (
              <span />
            )}

            {/* Wishlist button */}
            {!isOutOfStock && (
              <span className="w-8 h-8 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-accent hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 duration-300">
                <FiHeart size={14} />
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-white font-semibold text-xs uppercase tracking-widest bg-black/50 px-5 py-2.5 rounded-lg border border-white/10">
                Hết hàng
              </span>
            </div>
          )}

          {/* Hover action bar */}
          {!isOutOfStock && (
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
              <div className="flex gap-2">
                <span className="flex-1 flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2.5 rounded-lg shadow-lg transition-colors cursor-pointer">
                  <FiShoppingBag size={14} />
                  Thêm vào giỏ
                </span>
                <span className="w-10 flex items-center justify-center bg-white/90 dark:bg-white/10 backdrop-blur-sm text-foreground hover:bg-accent hover:text-white rounded-lg shadow-lg transition-colors cursor-pointer">
                  <FiEye size={14} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted font-medium uppercase tracking-wider">
              {product.tenThuongHieu}
            </span>
            {product.tenKieuSanPham && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-muted" />
                <span className="text-[11px] text-muted/60 uppercase tracking-wider">
                  {product.tenKieuSanPham}
                </span>
              </>
            )}
          </div>

          <h3 className="text-sm font-medium text-foreground line-clamp-2 min-h-10 leading-snug group-hover:text-accent transition-colors duration-200">
            {product.tenSanPham}
          </h3>

          <div className="flex items-baseline gap-2 pt-1">
            {product.giaGiam > 0 ? (
              <>
                <span className="text-accent font-bold text-[15px]">
                  {formatCurrency(discountedPrice)}
                </span>
                <span className="text-muted line-through text-xs">
                  {formatCurrency(product.giaBan)}
                </span>
              </>
            ) : (
              <span className="text-foreground font-bold text-[15px]">
                {formatCurrency(product.giaBan)}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {!isOutOfStock && product.soLuong <= 5 && (
            <p className="text-[11px] text-amber-500 font-medium">
              Chỉ còn {product.soLuong} sản phẩm
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
