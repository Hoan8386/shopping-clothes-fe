"use client";

import { useEffect, useState, useCallback } from "react";
import { ResSanPhamDTO, KieuSanPham, ThuongHieu } from "@/types";
import {
  productService,
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
import Image from "next/image";
import { FiSearch } from "react-icons/fi";

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const statusText = (s: number) =>
    s === 1 ? "Đang bán" : s === 0 ? "Ngừng bán" : "Không rõ";
  const statusColor = (s: number) =>
    s === 1 ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Danh sách sản phẩm
        </h1>
        <p className="text-sm text-muted mt-1">
          Xem thông tin sản phẩm (chỉ xem)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-subtle p-4 mb-6 flex flex-wrap gap-3 items-center">
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
            setFilterBrand(e.target.value ? Number(e.target.value) : undefined);
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
        <div className="bg-card rounded-xl border border-subtle overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-section border-b border-subtle">
              <tr>
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
                <tr key={p.id} className="hover:bg-section transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.hinhAnhChinh && (
                        <Image
                          src={getImageUrl(p.hinhAnhChinh)}
                          alt={p.tenSanPham}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover"
                        />
                      )}
                      <span className="font-medium text-foreground line-clamp-1">
                        {p.tenSanPham}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.tenKieuSanPham}</td>
                  <td className="px-4 py-3 text-muted">{p.tenThuongHieu}</td>
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
  );
}
