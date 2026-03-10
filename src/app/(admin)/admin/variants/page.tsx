"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ResChiTietSanPhamDTO,
  ResSanPhamDTO,
  MauSac,
  KichThuoc,
  CuaHang,
} from "@/types";
import {
  productService,
  productVariantService,
} from "@/services/product.service";
import {
  mauSacService,
  kichThuocService,
  cuaHangService,
} from "@/services/common.service";
import { getImageUrl } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import Image from "next/image";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX } from "react-icons/fi";

export default function AdminVariantsPage() {
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ResSanPhamDTO[]>([]);
  const [colors, setColors] = useState<MauSac[]>([]);
  const [sizes, setSizes] = useState<KichThuoc[]>([]);
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [filterProductId, setFilterProductId] = useState<number | "">("");
  const [search, setSearch] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ResChiTietSanPhamDTO | null>(null);
  const [form, setForm] = useState({
    sanPhamId: 0,
    mauSacId: 0,
    kichThuocId: 0,
    maCuaHang: 0,
    soLuong: 0,
    trangThai: 1,
    moTa: "",
    ghiTru: "",
  });
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    Promise.all([
      productService
        .getAll({ page: 1, size: 1000 })
        .catch(() => ({ result: [], meta: { pages: 0 } })),
      mauSacService.getAll().catch(() => []),
      kichThuocService.getAll().catch(() => []),
      cuaHangService.getAll().catch(() => []),
    ]).then(([prodData, cols, szs, sts]) => {
      setProducts(Array.isArray(prodData.result) ? prodData.result : []);
      setColors(Array.isArray(cols) ? cols : []);
      setSizes(Array.isArray(szs) ? szs : []);
      setStores(Array.isArray(sts) ? sts : []);
    });
  }, []);

  const fetchVariants = useCallback(async () => {
    try {
      setLoading(true);
      if (filterProductId) {
        const data = await productVariantService.getByProduct(
          Number(filterProductId),
        );
        setVariants(Array.isArray(data) ? data : []);
      } else {
        // Get all variants via the API
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/chi-tiet-san-pham`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          },
        );
        const json = await res.json();
        setVariants(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      toast.error("Không thể tải biến thể");
    } finally {
      setLoading(false);
    }
  }, [filterProductId]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({
      sanPhamId: products[0]?.id || 0,
      mauSacId: colors[0]?.id || 0,
      kichThuocId: sizes[0]?.id || 0,
      maCuaHang: stores[0]?.id || 0,
      soLuong: 0,
      trangThai: 1,
      moTa: "",
      ghiTru: "",
    });
    setFiles(null);
    setShowModal(true);
  };

  const openEditModal = (variant: ResChiTietSanPhamDTO) => {
    setEditing(variant);
    setForm({
      sanPhamId: 0,
      mauSacId: 0,
      kichThuocId: 0,
      maCuaHang: 0,
      soLuong: variant.soLuong,
      trangThai: variant.trangThai,
      moTa: variant.moTa || "",
      ghiTru: variant.ghiTru || "",
    });
    setFiles(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      if (editing) {
        formData.append("id", editing.id.toString());
      }
      if (form.sanPhamId)
        formData.append("sanPhamId", form.sanPhamId.toString());
      if (form.mauSacId) formData.append("mauSacId", form.mauSacId.toString());
      if (form.kichThuocId)
        formData.append("kichThuocId", form.kichThuocId.toString());
      if (form.maCuaHang)
        formData.append("maCuaHang", form.maCuaHang.toString());
      formData.append("soLuong", form.soLuong.toString());
      formData.append("trangThai", form.trangThai.toString());
      if (form.moTa) formData.append("moTa", form.moTa);
      if (form.ghiTru) formData.append("ghiTru", form.ghiTru);
      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i]);
        }
      }

      if (editing) {
        await productVariantService.update(formData);
        toast.success("Cập nhật biến thể thành công");
      } else {
        await productVariantService.create(formData);
        toast.success("Tạo biến thể thành công");
      }
      setShowModal(false);
      fetchVariants();
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa biến thể này?")) return;
    try {
      await productVariantService.delete(id);
      toast.success("Đã xóa biến thể");
      fetchVariants();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const filteredVariants = search
    ? variants.filter(
        (v) =>
          v.tenSanPham?.toLowerCase().includes(search.toLowerCase()) ||
          v.tenMauSac?.toLowerCase().includes(search.toLowerCase()) ||
          v.tenKichThuoc?.toLowerCase().includes(search.toLowerCase()),
      )
    : variants;

  if (loading && variants.length === 0) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý biến thể sản phẩm
          </h1>
          <p className="text-sm text-gray-500 mt-1">Chi tiết sản phẩm theo màu sắc, kích thước</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm text-sm font-medium"
        >
          <FiPlus size={16} /> Thêm biến thể
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
            />
          </div>
          <select
            value={filterProductId}
            onChange={(e) =>
              setFilterProductId(e.target.value ? Number(e.target.value) : "")
            }
            className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
          >
            <option value="">Tất cả sản phẩm</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.tenSanPham}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"><div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ảnh</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Màu sắc</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kích thước</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cửa hàng</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Số lượng</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredVariants.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  Không có biến thể nào
                </td>
              </tr>
            ) : (
              filteredVariants.map((v) => (
                <tr key={v.id} className="hover:bg-indigo-50/30 transition">
                  <td className="px-5 py-3.5 text-gray-500">#{v.id}</td>
                  <td className="px-5 py-3.5">
                    {v.hinhAnhUrls?.[0] ? (
                      <Image
                        src={getImageUrl(v.hinhAnhUrls[0])}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {v.tenSanPham}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{v.tenMauSac}</td>
                  <td className="px-5 py-3.5 text-gray-600">{v.tenKichThuoc}</td>
                  <td className="px-5 py-3.5 text-gray-600">{v.tenCuaHang}</td>
                  <td className="px-5 py-3.5"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs font-semibold">{v.soLuong}</span></td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
                        v.trangThai === 1
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {v.trangThai === 1 ? "Hiển thị" : "Ẩn"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(v)}
                        className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        <FiEdit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="font-bold text-gray-900">
                {editing ? "Cập nhật biến thể" : "Tạo biến thể mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sản phẩm
                </label>
                <select
                  value={form.sanPhamId}
                  onChange={(e) =>
                    setForm({ ...form, sanPhamId: Number(e.target.value) })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  disabled={!!editing}
                >
                  <option value={0}>-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.tenSanPham}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Màu sắc
                </label>
                <select
                  value={form.mauSacId}
                  onChange={(e) =>
                    setForm({ ...form, mauSacId: Number(e.target.value) })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                >
                  <option value={0}>-- Chọn màu --</option>
                  {colors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tenMauSac}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kích thước
                </label>
                <select
                  value={form.kichThuocId}
                  onChange={(e) =>
                    setForm({ ...form, kichThuocId: Number(e.target.value) })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                >
                  <option value={0}>-- Chọn size --</option>
                  {sizes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tenKichThuoc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Store */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cửa hàng
                </label>
                <select
                  value={form.maCuaHang}
                  onChange={(e) =>
                    setForm({ ...form, maCuaHang: Number(e.target.value) })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                >
                  <option value={0}>-- Chọn cửa hàng --</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tenCuaHang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.soLuong}
                  onChange={(e) =>
                    setForm({ ...form, soLuong: Number(e.target.value) })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={form.trangThai}
                  onChange={(e) =>
                    setForm({ ...form, trangThai: Number(e.target.value) })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                >
                  <option value={1}>Hiển thị</option>
                  <option value={0}>Ẩn</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={form.moTa}
                  onChange={(e) => setForm({ ...form, moTa: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={form.ghiTru}
                  onChange={(e) => setForm({ ...form, ghiTru: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFiles(e.target.files)}
                  className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm font-medium text-sm"
              >
                {editing ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
