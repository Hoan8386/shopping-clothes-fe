"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import {
  productService,
  ProductSearchParams,
} from "@/services/product.service";
import {
  kieuSanPhamService,
  thuongHieuService,
  boSuuTapService,
} from "@/services/common.service";
import { ResSanPhamDTO, KieuSanPham, ThuongHieu, BoSuuTap } from "@/types";
import { FiFilter, FiX } from "react-icons/fi";

export default function ProductsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<ResSanPhamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);

  const [kieuSanPhams, setKieuSanPhams] = useState<KieuSanPham[]>([]);
  const [thuongHieus, setThuongHieus] = useState<ThuongHieu[]>([]);
  const [boSuuTaps, setBoSuuTaps] = useState<BoSuuTap[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<ProductSearchParams>({
    tenSanPham: searchParams.get("tenSanPham") || "",
    kieuSanPhamId: Number(searchParams.get("kieuSanPhamId")) || undefined,
    thuongHieuId: Number(searchParams.get("thuongHieuId")) || undefined,
    boSuuTapId: Number(searchParams.get("boSuuTapId")) || undefined,
    giaMin: Number(searchParams.get("giaMin")) || undefined,
    giaMax: Number(searchParams.get("giaMax")) || undefined,
    sort: searchParams.get("sort") || "ngayTao,desc",
  });

  // Load filters once
  useEffect(() => {
    Promise.all([
      kieuSanPhamService.getAll(),
      thuongHieuService.getAll(),
      boSuuTapService.getAll(),
    ]).then(([kieu, brand, col]) => {
      setKieuSanPhams(kieu);
      setThuongHieus(brand);
      setBoSuuTaps(col);
    });
  }, []);

  // Load products
  useEffect(() => {
    setLoading(true);
    const params: ProductSearchParams = {
      ...filters,
      page,
      size: 12,
    };
    // Clean up undefined values
    Object.keys(params).forEach((key) => {
      const k = key as keyof ProductSearchParams;
      if (params[k] === undefined || params[k] === "" || params[k] === 0) {
        delete params[k];
      }
    });

    productService
      .getAll(params)
      .then((res) => {
        setProducts(res.result);
        setTotalPages(res.meta.pages);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [filters, page]);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ sort: "ngayTao,desc" });
    setPage(1);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">
          Sáº£n pháº©m
        </h2>
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-accent">
            Trang chá»§
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">Sáº£n pháº©m</span>
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div />
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="md:hidden flex items-center gap-2 text-foreground border border-foreground px-4 py-2 text-xs uppercase tracking-wider font-bold"
          >
            <FiFilter size={14} /> Bá»™ lá»c
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filter */}
          <aside
            className={`${
              showFilter ? "block" : "hidden"
            } md:block w-full md:w-60 flex-shrink-0`}
          >
            <div className="bg-card border border-subtle p-6 space-y-6 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Bá»™ lá»c
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-xs text-accent hover:underline"
                >
                  XÃ³a táº¥t cáº£
                </button>
              </div>

              {/* Search */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">
                  TÃªn sáº£n pháº©m
                </label>
                <input
                  type="text"
                  value={filters.tenSanPham || ""}
                  onChange={(e) =>
                    handleFilterChange("tenSanPham", e.target.value)
                  }
                  placeholder="TÃ¬m kiáº¿m..."
                  className="w-full border border-subtle px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition"
                />
              </div>

              {/* Loáº¡i */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">
                  Kiá»ƒu sáº£n pháº©m
                </label>
                <select
                  value={filters.kieuSanPhamId || ""}
                  onChange={(e) =>
                    handleFilterChange("kieuSanPhamId", Number(e.target.value))
                  }
                  className="w-full border border-subtle px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition"
                >
                  <option value="">Táº¥t cáº£</option>
                  {kieuSanPhams.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.tenKieuSanPham}
                    </option>
                  ))}
                </select>
              </div>

              {/* ThÆ°Æ¡ng hiá»‡u */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">
                  ThÆ°Æ¡ng hiá»‡u
                </label>
                <select
                  value={filters.thuongHieuId || ""}
                  onChange={(e) =>
                    handleFilterChange("thuongHieuId", Number(e.target.value))
                  }
                  className="w-full border border-subtle px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition"
                >
                  <option value="">Táº¥t cáº£</option>
                  {thuongHieus.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tenThuongHieu}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bá»™ sÆ°u táº­p */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">
                  Bá»™ sÆ°u táº­p
                </label>
                <select
                  value={filters.boSuuTapId || ""}
                  onChange={(e) =>
                    handleFilterChange("boSuuTapId", Number(e.target.value))
                  }
                  className="w-full border border-subtle px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition"
                >
                  <option value="">Táº¥t cáº£</option>
                  {boSuuTaps.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.tenSuuTap}
                    </option>
                  ))}
                </select>
              </div>

              {/* GiÃ¡ */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">
                  Khoáº£ng giÃ¡ (VNÄ)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Tá»«"
                    value={filters.giaMin || ""}
                    onChange={(e) =>
                      handleFilterChange("giaMin", Number(e.target.value))
                    }
                    className="w-1/2 border border-subtle px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition"
                  />
                  <input
                    type="number"
                    placeholder="Äáº¿n"
                    value={filters.giaMax || ""}
                    onChange={(e) =>
                      handleFilterChange("giaMax", Number(e.target.value))
                    }
                    className="w-1/2 border border-subtle px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-2">
                  Sáº¯p xáº¿p
                </label>
                <select
                  value={filters.sort || ""}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="w-full border border-subtle px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition"
                >
                  <option value="ngayTao,desc">Má»›i nháº¥t</option>
                  <option value="ngayTao,asc">CÅ© nháº¥t</option>
                  <option value="giaBan,asc">GiÃ¡ tÄƒng dáº§n</option>
                  <option value="giaBan,desc">GiÃ¡ giáº£m dáº§n</option>
                  <option value="giaGiam,desc">Giáº£m giÃ¡ nhiá»u</option>
                </select>
              </div>

              {/* Close button on mobile */}
              <button
                onClick={() => setShowFilter(false)}
                className="md:hidden w-full bg-foreground text-background py-3 text-xs font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition"
              >
                Ãp dá»¥ng
              </button>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <Loading />
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-sm">
                  KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m phÃ¹ há»£p
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-accent text-sm hover:underline"
                >
                  XÃ³a bá»™ lá»c
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
