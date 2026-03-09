"use client";

import Link from "next/link";
import Image from "next/image";
import { ResSanPhamDTO } from "@/types";
import { getImageUrl, formatCurrency } from "@/lib/utils";

interface Props {
  product: ResSanPhamDTO;
}

export default function ProductCard({ product }: Props) {
  const discountedPrice =
    product.giaGiam > 0
      ? product.giaBan * (1 - product.giaGiam / 100)
      : product.giaBan;

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-card overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-section">
          <img
            src={getImageUrl(product.hinhAnhChinh)}
            alt={product.tenSanPham}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.giaGiam > 0 && (
            <span className="absolute top-3 left-3 bg-accent text-white text-[11px] font-bold px-2.5 py-1 uppercase tracking-wider">
              -{product.giaGiam}%
            </span>
          )}
          {product.soLuong === 0 && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="text-white font-bold text-sm uppercase tracking-wider bg-black/50 px-4 py-2">
                Hết hàng
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-4 pb-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            {product.tenThuongHieu}
          </p>
          <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 min-h-[2.5rem] leading-snug">
            {product.tenSanPham}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-foreground font-bold">
              {formatCurrency(discountedPrice)}
            </span>
            {product.giaGiam > 0 && (
              <span className="text-gray-400 line-through text-sm">
                {formatCurrency(product.giaBan)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
