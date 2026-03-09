"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { productService } from "@/services/product.service";
import { boSuuTapService } from "@/services/common.service";
import { ResSanPhamDTO, BoSuuTap } from "@/types";
import Loading from "@/components/ui/Loading";
import {
  FiArrowRight,
  FiTruck,
  FiShield,
  FiRefreshCw,
  FiHeadphones,
  FiGift,
  FiCheckCircle,
  FiChevronDown,
} from "react-icons/fi";

export default function HomePage() {
  const [newProducts, setNewProducts] = useState<ResSanPhamDTO[]>([]);
  const [saleProducts, setSaleProducts] = useState<ResSanPhamDTO[]>([]);
  const [collections, setCollections] = useState<BoSuuTap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newRes, saleRes, colRes] = await Promise.all([
          productService.getAll({ page: 1, size: 8, sort: "ngayTao,desc" }),
          productService.getAll({ page: 1, size: 8, sort: "giaGiam,desc" }),
          boSuuTapService.getAll(),
        ]);
        setNewProducts(newRes.result);
        setSaleProducts(saleRes.result.filter((p) => p.giaGiam > 0));
        setCollections(colRes);
      } catch (error) {
        console.error("Error fetching home data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/background.jpg')" }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 md:py-32 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-yellow-400">✨</span>
              <span className="text-white/90 text-sm font-medium">
                Bộ sưu tập mới nhất
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              <span className="text-white">Nâng Tầm</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent italic">
                Phong Cách
              </span>
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-base md:text-lg mb-8 max-w-md leading-relaxed">
              Khám phá bộ sưu tập thời trang cao cấp và phong cách sống. Thiết
              kế vượt thời gian dành cho bạn.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm px-8 py-4 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
              >
                Mua sắm ngay <FiArrowRight size={16} />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition-all"
              >
                Danh mục sản phẩm
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-10 mt-16">
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-white">
                50K+
              </div>
              <div className="text-gray-400 text-sm mt-1">Khách hàng</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-1">
                4.9 <span className="text-yellow-400 text-xl">★</span>
              </div>
              <div className="text-gray-400 text-sm mt-1">Đánh giá</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-white">
                500+
              </div>
              <div className="text-gray-400 text-sm mt-1">Sản phẩm</div>
            </div>
          </div>
        </div>

        {/* Floating Cards - Right side */}
        <div className="hidden lg:flex flex-col gap-4 absolute right-8 top-1/2 -translate-y-1/2 z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <FiGift className="text-white" size={18} />
            </div>
            <div>
              <div className="text-white font-bold text-sm">
                Miễn phí vận chuyển
              </div>
              <div className="text-gray-400 text-xs">Đơn hàng trên 500K</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <FiCheckCircle className="text-green-400" size={18} />
            </div>
            <div>
              <div className="text-white font-bold text-sm">
                Thanh toán an toàn
              </div>
              <div className="text-gray-400 text-xs">Bảo mật 100%</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/50 text-xs uppercase tracking-widest flex flex-col items-center gap-2">
          <span>Scroll</span>
          <FiChevronDown className="animate-bounce" size={16} />
        </div>
      </section>

      {/* Features - Shopper Style */}
      <section className="border-b border-subtle">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: <FiTruck size={28} />,
                title: "Miễn phí vận chuyển",
                desc: "Đơn hàng trên 500K",
              },
              {
                icon: <FiShield size={28} />,
                title: "Bảo hành chính hãng",
                desc: "100% sản phẩm chính hãng",
              },
              {
                icon: <FiRefreshCw size={28} />,
                title: "Đổi trả dễ dàng",
                desc: "Trong vòng 30 ngày",
              },
              {
                icon: <FiHeadphones size={28} />,
                title: "Hỗ trợ 24/7",
                desc: "Tận tâm phục vụ",
              },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <div className="text-foreground shrink-0">{f.icon}</div>
                <div>
                  <div className="font-bold text-sm text-foreground">
                    {f.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections - Shopper Style */}
      {collections.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-14">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-foreground mb-2">
              Bộ sưu tập
            </h2>
            <div className="w-16 h-[3px] bg-accent mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {collections.slice(0, 4).map((col) => (
              <Link
                key={col.id}
                href={`/products?boSuuTapId=${col.id}`}
                className="group relative bg-section p-8 text-center hover:bg-foreground transition-colors duration-300"
              >
                <h3 className="font-bold text-lg text-foreground group-hover:text-background transition-colors">
                  {col.tenSuuTap}
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-300 mt-2 transition-colors">
                  {col.moTa}
                </p>
                <span className="inline-block mt-4 text-xs font-semibold uppercase tracking-wider text-accent group-hover:text-accent">
                  Xem ngay →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Products - Shopper Style */}
      <section className="bg-card">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-foreground mb-2">
                Sản phẩm mới
              </h2>
              <div className="w-16 h-[3px] bg-accent" />
            </div>
            <Link
              href="/products?sort=ngayTao,desc"
              className="text-sm font-semibold uppercase tracking-wider text-foreground hover:text-accent transition flex items-center gap-1"
            >
              Xem tất cả <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Sale Products - Shopper Style */}
      {saleProducts.length > 0 && (
        <section className="bg-section">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-extrabold text-accent mb-2">
                  Giảm giá sốc
                </h2>
                <div className="w-16 h-[3px] bg-accent" />
              </div>
              <Link
                href="/products?sort=giaGiam,desc"
                className="text-sm font-semibold uppercase tracking-wider text-foreground hover:text-accent transition flex items-center gap-1"
              >
                Xem tất cả <FiArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {saleProducts.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
