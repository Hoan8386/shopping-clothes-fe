"use client";

import { useEffect, useState } from "react";
import { KhuyenMaiTheoHoaDon } from "@/types";
import {
  khuyenMaiHoaDonService,
  khuyenMaiDiemService,
} from "@/services/common.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

type PromoType = "hoaDon" | "diem";

export default function AdminPromotionsPage() {
  const [type, setType] = useState<PromoType>("hoaDon");
  const [items, setItems] = useState<KhuyenMaiTheoHoaDon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<KhuyenMaiTheoHoaDon | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    tenKhuyenMai: "",
    giamToiDa: 0,
    hoaDonToiDa: 0,
    phanTramGiam: 0,
    hinhThuc: 0,
    thoiGianBatDau: "",
    thoiGianKetThuc: "",
    soLuong: 0,
    trangThai: 1,
  });

  useEffect(() => {
    fetchData();
  }, [type]);

  const service =
    type === "hoaDon" ? khuyenMaiHoaDonService : khuyenMaiDiemService;

  const fetchData = async () => {
    try {
      setLoading(true);
      const d = await service.getAll();
      setItems(Array.isArray(d) ? d : []);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      tenKhuyenMai: "",
      giamToiDa: 0,
      hoaDonToiDa: 0,
      phanTramGiam: 0,
      hinhThuc: 0,
      thoiGianBatDau: "",
      thoiGianKetThuc: "",
      soLuong: 0,
      trangThai: 1,
    });
    setShowModal(true);
  };

  const openEdit = (item: KhuyenMaiTheoHoaDon) => {
    setEditing(item);
    setForm({
      tenKhuyenMai: item.tenKhuyenMai,
      giamToiDa: item.giamToiDa,
      hoaDonToiDa: item.hoaDonToiDa,
      phanTramGiam: item.phanTramGiam,
      hinhThuc: item.hinhThuc,
      thoiGianBatDau: item.thoiGianBatDau?.slice(0, 16) || "",
      thoiGianKetThuc: item.thoiGianKetThuc?.slice(0, 16) || "",
      soLuong: item.soLuong,
      trangThai: item.trangThai,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) {
        await service.update({ id: editing.id, ...form });
        toast.success("Cập nhật thành công");
      } else {
        await service.create(form);
        toast.success("Thêm thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa?")) return;
    try {
      setDeleting(true);
      await service.delete(id);
      toast.success("Đã xóa");
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý khuyến mãi
          </h1>
          <p className="text-sm text-muted mt-1">
            Chương trình khuyến mãi theo hóa đơn và điểm
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl hover:bg-accent-hover transition shadow-sm font-medium text-sm"
        >
          <FiPlus size={16} /> Thêm mới
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setType("hoaDon")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${type === "hoaDon" ? "bg-accent text-white shadow-sm" : "bg-card border border-subtle text-muted hover:bg-section"}`}
        >
          Theo hóa đơn
        </button>
        <button
          onClick={() => setType("diem")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${type === "diem" ? "bg-accent text-white shadow-sm" : "bg-card border border-subtle text-muted hover:bg-section"}`}
        >
          Theo điểm
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-section border-b border-subtle">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Tên KM
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    % Giảm
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Giảm tối đa
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-section transition">
                    <td className="px-5 py-3.5 text-muted">#{item.id}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {item.tenKhuyenMai}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-accent font-semibold">
                        {item.phanTramGiam}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {formatCurrency(item.giamToiDa)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-section text-foreground px-2 py-0.5 rounded-md text-xs font-medium">
                        {item.soLuong}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${item.trangThai ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}
                      >
                        {item.trangThai ? "Hoạt động" : "Ngưng"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg text-accent hover:bg-accent/10 transition"
                        >
                          <FiEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-subtle rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4 text-foreground">
              {editing ? "Sửa" : "Thêm"} khuyến mãi
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Tên khuyến mãi
                </label>
                <input
                  type="text"
                  value={form.tenKhuyenMai}
                  onChange={(e) =>
                    setForm({ ...form, tenKhuyenMai: e.target.value })
                  }
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    % Giảm
                  </label>
                  <input
                    type="number"
                    value={form.phanTramGiam}
                    onChange={(e) =>
                      setForm({ ...form, phanTramGiam: Number(e.target.value) })
                    }
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    Giảm tối đa
                  </label>
                  <input
                    type="number"
                    value={form.giamToiDa}
                    onChange={(e) =>
                      setForm({ ...form, giamToiDa: Number(e.target.value) })
                    }
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    HĐ tối đa
                  </label>
                  <input
                    type="number"
                    value={form.hoaDonToiDa}
                    onChange={(e) =>
                      setForm({ ...form, hoaDonToiDa: Number(e.target.value) })
                    }
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    value={form.soLuong}
                    onChange={(e) =>
                      setForm({ ...form, soLuong: Number(e.target.value) })
                    }
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    Bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={form.thoiGianBatDau}
                    onChange={(e) =>
                      setForm({ ...form, thoiGianBatDau: e.target.value })
                    }
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    Kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={form.thoiGianKetThuc}
                    onChange={(e) =>
                      setForm({ ...form, thoiGianKetThuc: e.target.value })
                    }
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    Hình thức
                  </label>
                  <input
                    type="number"
                    value={form.hinhThuc}
                    onChange={(e) =>
                      setForm({ ...form, hinhThuc: Number(e.target.value) })
                    }
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    Trạng thái
                  </label>
                  <select
                    value={form.trangThai}
                    onChange={(e) =>
                      setForm({ ...form, trangThai: Number(e.target.value) })
                    }
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Ngưng</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-subtle rounded-xl text-foreground hover:bg-section transition font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition shadow-sm font-medium text-sm"
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
