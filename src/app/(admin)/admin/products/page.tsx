"use client";

import { useEffect, useState } from "react";
import { ResSanPhamDTO, KieuSanPham, BoSuuTap, ThuongHieu } from "@/types";
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
import { FiPlus, FiEdit, FiTrash2, FiSearch } from "react-icons/fi";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ResSanPhamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<KieuSanPham[]>([]);
  const [collections, setCollections] = useState<BoSuuTap[]>([]);
  const [brands, setBrands] = useState<ThuongHieu[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ResSanPhamDTO | null>(null);
  const [form, setForm] = useState({
    tenSanPham: "",
    giaVon: 0,
    giaBan: 0,
    giaGiam: 0,
    moTa: "",
    trangThai: 1,
    kieuSanPhamId: 0,
    boSuuTapId: 0,
    thuongHieuId: 0,
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      kieuSanPhamService.getAll().catch(() => []),
      boSuuTapService.getAll().catch(() => []),
      thuongHieuService.getAll().catch(() => []),
    ]).then(([cats, cols, brs]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setCollections(Array.isArray(cols) ? cols : []);
      setBrands(Array.isArray(brs) ? brs : []);
    });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: ProductSearchParams = {
        page,
        size: 10,
      };
      if (search) params.tenSanPham = search;
      const data = await productService.getAll(params);
      setProducts(data.result);
      setTotalPages(data.meta.pages);
    } catch {
      toast.error("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditing(null);
    setForm({
      tenSanPham: "",
      giaVon: 0,
      giaBan: 0,
      giaGiam: 0,
      moTa: "",
      trangThai: 1,
      kieuSanPhamId: categories[0]?.id || 0,
      boSuuTapId: collections[0]?.id || 0,
      thuongHieuId: brands[0]?.id || 0,
    });
    setFile(null);
    setShowModal(true);
  };

  const openEditModal = (product: ResSanPhamDTO) => {
    setEditing(product);
    setForm({
      tenSanPham: product.tenSanPham,
      giaVon: product.giaVon,
      giaBan: product.giaBan,
      giaGiam: product.giaGiam,
      moTa: product.moTa,
      trangThai: product.trangThai,
      kieuSanPhamId: 0,
      boSuuTapId: 0,
      thuongHieuId: 0,
    });
    setFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    if (editing) fd.append("id", String(editing.id));
    fd.append("tenSanPham", form.tenSanPham);
    fd.append("giaVon", String(form.giaVon));
    fd.append("giaBan", String(form.giaBan));
    fd.append("giaGiam", String(form.giaGiam));
    fd.append("moTa", form.moTa);
    fd.append("trangThai", String(form.trangThai));
    fd.append("kieuSanPhamId", String(form.kieuSanPhamId));
    fd.append("boSuuTapId", String(form.boSuuTapId));
    fd.append("thuongHieuId", String(form.thuongHieuId));
    if (file) fd.append("file", file);

    try {
      if (editing) {
        await productService.update(fd);
        toast.success("Cập nhật thành công");
      } else {
        await productService.create(fd);
        toast.success("Thêm sản phẩm thành công");
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    try {
      await productService.delete(id);
      toast.success("Đã xóa");
      fetchProducts();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý danh sách sản phẩm của cửa hàng
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm font-medium text-sm"
        >
          <FiPlus size={16} /> Thêm mới
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition"
          />
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hình
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tên sản phẩm
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Kiểu
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thương hiệu
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-indigo-50/30 transition">
                    <td className="px-5 py-3.5 text-gray-500">#{p.id}</td>
                    <td className="px-5 py-3.5">
                      <Image
                        src={getImageUrl(p.hinhAnhChinh)}
                        alt={p.tenSanPham}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover ring-1 ring-gray-100"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[200px] truncate">
                      {p.tenSanPham}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-indigo-600">
                      {formatCurrency(p.giaBan)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.soLuong > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                      >
                        {p.soLuong}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {p.tenKieuSanPham}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {p.tenThuongHieu}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                          title="Sửa"
                        >
                          <FiEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                          title="Xóa"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      <FiBox className="mx-auto mb-2" size={24} />
                      Không có sản phẩm nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-gray-900">
              {editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  value={form.tenSanPham}
                  onChange={(e) =>
                    setForm({ ...form, tenSanPham: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giá vốn
                  </label>
                  <input
                    type="number"
                    value={form.giaVon}
                    onChange={(e) =>
                      setForm({ ...form, giaVon: Number(e.target.value) })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giá bán
                  </label>
                  <input
                    type="number"
                    value={form.giaBan}
                    onChange={(e) =>
                      setForm({ ...form, giaBan: Number(e.target.value) })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giảm giá (%)
                  </label>
                  <input
                    type="number"
                    value={form.giaGiam}
                    onChange={(e) =>
                      setForm({ ...form, giaGiam: Number(e.target.value) })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  value={form.moTa}
                  onChange={(e) => setForm({ ...form, moTa: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Kiểu</label>
                  <select
                    value={form.kieuSanPhamId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        kieuSanPhamId: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value={0}>-- Chọn --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tenKieuSanPham}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bộ sưu tập
                  </label>
                  <select
                    value={form.boSuuTapId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        boSuuTapId: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value={0}>-- Chọn --</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tenSuuTap}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Thương hiệu
                  </label>
                  <select
                    value={form.thuongHieuId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        thuongHieuId: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value={0}>-- Chọn --</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.tenThuongHieu}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Hình ảnh
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editing ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
