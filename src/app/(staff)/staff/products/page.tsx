"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ResSanPhamDTO,
  ResChiTietSanPhamDTO,
  KieuSanPham,
  ThuongHieu,
} from "@/types";
import {
  productService,
  productVariantService,
  ProductSearchParams,
} from "@/services/product.service";
import {
  kieuSanPhamService,
  boSuuTapService,
  thuongHieuService,
} from "@/services/common.service";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiSearch, FiX, FiPackage } from "react-icons/fi";

export default function StaffProductsPage() {
  const [products, setProducts] = useState<ResSanPhamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categories, setCategories] = useState<KieuSanPham[]>([]);
  const [brands, setBrands] = useState<ThuongHieu[]>([]);
  const [filterCategory, setFilterCategory] = useState<number | undefined>();
  const [filterBrand, setFilterBrand] = useState<number | undefined>();

  // Detail panel state
  const [selectedProduct, setSelectedProduct] = useState<ResSanPhamDTO | null>(
    null,
  );
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      kieuSanPhamService.getAll().catch(() => []),
      boSuuTapService.getAll().catch(() => []),
      thuongHieuService.getAll().catch(() => []),
    ]).then(([cats, , brs]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setBrands(Array.isArray(brs) ? brs : []);
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: ProductSearchParams = { page, size: 12 };
      if (search) params.tenSanPham = search;
      if (filterCategory) params.kieuSanPhamId = filterCategory;
      if (filterBrand) params.thuongHieuId = filterBrand;
      const data = await productService.getAll(params);
      setProducts(data.result);
      setTotalPages(data.meta.pages);
    } catch {
      toast.error("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategory, filterBrand]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSelectProduct = async (product: ResSanPhamDTO) => {
    setSelectedProduct(product);
    setVariants([]);
    setVariantsLoading(true);
    try {
      const data = await productVariantService.getByProduct(product.id);
      setVariants(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải biến thể sản phẩm");
    } finally {
      setVariantsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const statusText = (s: number) =>
    s === 1 ? "Đang bán" : s === 0 ? "Ngừng bán" : "Không rõ";
  const statusColor = (s: number) =>
    s === 1 ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500";

  // Group variants by color for display
  const variantsByColor = variants.reduce<
    Record<string, ResChiTietSanPhamDTO[]>
  >((acc, v) => {
    const key = v.tenMauSac || "Không rõ";
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  const totalStock = variants.reduce((sum, v) => sum + (v.soLuong || 0), 0);

  return (
    <div className="relative space-y-5">
      {/* Product list — always full width */}
      <div>
        <div className="mb-5 bg-card rounded-2xl border border-subtle p-4 lg:p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Danh sách sản phẩm
            </p>
            <p className="text-sm text-muted mt-1">
              Nhấn vào một dòng để mở chi tiết tồn kho theo màu sắc và kích
              thước.
            </p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full bg-section text-muted border border-subtle">
            {loading
              ? "Đang tải..."
              : `${products.length} sản phẩm trên trang này`}
          </span>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl border border-subtle p-4 mb-6 flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-50">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm tên sản phẩm..."
              className="border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <button
              type="submit"
              className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-hover flex items-center gap-1"
            >
              <FiSearch size={14} /> Tìm
            </button>
          </form>

          <select
            value={filterCategory ?? ""}
            onChange={(e) => {
              setFilterCategory(
                e.target.value ? Number(e.target.value) : undefined,
              );
              setPage(1);
            }}
            className="border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">-- Tất cả loại --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tenKieuSanPham}
              </option>
            ))}
          </select>

          <select
            value={filterBrand ?? ""}
            onChange={(e) => {
              setFilterBrand(
                e.target.value ? Number(e.target.value) : undefined,
              );
              setPage(1);
            }}
            className="border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">-- Tất cả thương hiệu --</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.tenThuongHieu}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted">
            Không có sản phẩm nào
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-205">
                <thead className="bg-section border-b border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-center font-medium text-muted">
                      Hình ảnh
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted">
                      Sản phẩm
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted">
                      Loại
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted">
                      Thương hiệu
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted">
                      Giá bán
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted">
                      Giá giảm
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted">
                      Tồn kho
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() =>
                        selectedProduct?.id === p.id
                          ? setSelectedProduct(null)
                          : handleSelectProduct(p)
                      }
                      className={`cursor-pointer transition ${
                        selectedProduct?.id === p.id
                          ? "bg-accent/10 border-l-2 border-accent"
                          : "hover:bg-section"
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        {p.hinhAnhChinh ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(p.hinhAnhChinh)}
                            alt={p.tenSanPham}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover mx-auto"
                            style={{ width: 48, height: 48 }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-section border border-subtle mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground line-clamp-1">
                          {p.tenSanPham}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {p.tenKieuSanPham}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {p.tenThuongHieu}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(p.giaBan)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-500">
                        {p.giaGiam > 0 ? formatCurrency(p.giaGiam) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">{p.soLuong}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(p.trangThai)}`}
                        >
                          {statusText(p.trangThai)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modal chi tiết sản phẩm */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-subtle shrink-0">
              <h2 className="font-bold text-foreground text-lg line-clamp-1">
                {selectedProduct.tenSanPham}
              </h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-section transition shrink-0"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Product overview */}
              <div className="flex gap-6 p-6 border-b border-subtle">
                {/* Main image */}
                <div className="shrink-0">
                  {selectedProduct.hinhAnhChinh ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageUrl(selectedProduct.hinhAnhChinh)}
                      alt={selectedProduct.tenSanPham}
                      className="rounded-xl object-cover"
                      style={{ width: 160, height: 160 }}
                    />
                  ) : (
                    <div
                      className="rounded-xl bg-section border border-subtle"
                      style={{ width: 160, height: 160 }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <p className="text-xs text-muted">Loại / Thương hiệu</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {selectedProduct.tenKieuSanPham} ·{" "}
                      {selectedProduct.tenThuongHieu}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-section rounded-xl p-3 text-center border border-subtle">
                      <p className="text-xs text-muted mb-1">Giá bán</p>
                      <p className="font-semibold text-foreground text-sm">
                        {formatCurrency(selectedProduct.giaBan)}
                      </p>
                    </div>
                    <div className="bg-section rounded-xl p-3 text-center border border-subtle">
                      <p className="text-xs text-muted mb-1">Giá giảm</p>
                      <p className="font-semibold text-red-500 text-sm">
                        {selectedProduct.giaGiam > 0
                          ? `${selectedProduct.giaGiam}%`
                          : "—"}
                      </p>
                    </div>
                    <div className="bg-section rounded-xl p-3 text-center border border-subtle">
                      <p className="text-xs text-muted mb-1">Tổng tồn kho</p>
                      <p
                        className={`font-bold text-xl ${
                          totalStock === 0
                            ? "text-red-500"
                            : totalStock < 10
                              ? "text-yellow-500"
                              : "text-green-500"
                        }`}
                      >
                        {variantsLoading ? "..." : totalStock}
                      </p>
                    </div>
                  </div>
                  {selectedProduct.moTa && (
                    <div>
                      <p className="text-xs text-muted">Mô tả</p>
                      <p className="text-sm text-foreground mt-0.5 line-clamp-3">
                        {selectedProduct.moTa}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Variants by color */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiPackage size={14} className="text-muted" />
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Chi tiết tồn kho theo màu sắc &amp; kích thước
                  </span>
                </div>

                {variantsLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted text-sm">
                    Đang tải...
                  </div>
                ) : variants.length === 0 ? (
                  <div className="text-center py-8 text-muted text-sm">
                    Chưa có biến thể nào
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(variantsByColor).map(([color, items]) => {
                      // collect all unique images for this color
                      const allImgs = Array.from(
                        new Set(
                          items
                            .flatMap((v) => v.hinhAnhUrls ?? [])
                            .filter(Boolean),
                        ),
                      );
                      return (
                        <div
                          key={color}
                          className="bg-section rounded-xl p-4 border border-subtle"
                        >
                          {/* Color header + images */}
                          <div className="flex items-start gap-4 mb-3">
                            {allImgs.length > 0 ? (
                              <div className="flex gap-2 flex-wrap shrink-0">
                                {allImgs.map((url, idx) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    key={idx}
                                    src={getImageUrl(url)}
                                    alt={`${color} ${idx + 1}`}
                                    className="rounded-lg object-cover border border-subtle"
                                    style={{ width: 64, height: 64 }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div
                                className="rounded-lg bg-card border border-subtle shrink-0"
                                style={{ width: 64, height: 64 }}
                              />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {color}
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                Tổng:{" "}
                                <span className="font-medium text-foreground">
                                  {items.reduce((s, v) => s + v.soLuong, 0)} cái
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Size grid */}
                          <div className="grid grid-cols-4 gap-2">
                            {items.map((v) => (
                              <div
                                key={v.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                                  v.soLuong === 0
                                    ? "border-red-500/20 bg-red-500/5"
                                    : v.soLuong < 5
                                      ? "border-yellow-500/20 bg-yellow-500/5"
                                      : "border-subtle bg-card"
                                }`}
                              >
                                <span className="text-muted">
                                  {v.tenKichThuoc}
                                </span>
                                <span
                                  className={`font-bold ${
                                    v.soLuong === 0
                                      ? "text-red-500"
                                      : v.soLuong < 5
                                        ? "text-yellow-500"
                                        : "text-foreground"
                                  }`}
                                >
                                  {v.soLuong}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            {!variantsLoading && variants.length > 0 && (
              <div className="px-6 py-3 border-t border-subtle flex gap-4 text-xs text-muted shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500/30 inline-block" />
                  Hết hàng
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500/30 inline-block" />
                  Sắp hết (&lt;5)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-500/20 inline-block" />
                  Còn hàng
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
