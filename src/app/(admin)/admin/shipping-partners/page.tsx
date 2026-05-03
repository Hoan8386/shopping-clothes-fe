"use client";

import { useEffect, useState } from "react";
import { VanChuyen } from "@/types";
import { vanChuyenService } from "@/services/common.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiEdit, FiPlus, FiTrash2 } from "react-icons/fi";

const PHONE_10_DIGITS_REGEX = /^\d{10}$/;

export default function AdminShippingPartnersPage() {
  const [items, setItems] = useState<VanChuyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<VanChuyen | null>(null);
  const [form, setForm] = useState({
    tenVanChuyen: "",
    soDienThoai: "",
    website: "",
    ghiTru: "",
    trangThai: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await vanChuyenService.getAll();
      setItems(
        Array.isArray(data)
          ? data.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
          : [],
      );
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      tenVanChuyen: "",
      soDienThoai: "",
      website: "",
      ghiTru: "",
      trangThai: 1,
    });
    setShowModal(true);
  };

  const openEdit = (item: VanChuyen) => {
    setEditing(item);
    setForm({
      tenVanChuyen: item.tenVanChuyen || "",
      soDienThoai: item.soDienThoai || "",
      website: item.website || "",
      ghiTru: item.ghiTru || "",
      trangThai: item.trangThai,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phone = form.soDienThoai.trim();
    if (!PHONE_10_DIGITS_REGEX.test(phone)) {
      toast.error("Số điện thoại phải gồm đúng 10 chữ số");
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      soDienThoai: phone,
      website: form.website.trim() || undefined,
      ghiTru: form.ghiTru.trim() || undefined,
    };

    try {
      if (editing) {
        await vanChuyenService.update({ id: editing.id, ...payload });
        toast.success("Cập nhật thành công");
      } else {
        await vanChuyenService.create(payload);
        toast.success("Thêm thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thất bại";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa bên vận chuyển này?")) return;
    setDeleting(true);
    try {
      await vanChuyenService.delete(id);
      toast.success("Đã xóa");
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý bên vận chuyển
          </h1>
          <p className="text-sm text-muted mt-1">
            Danh sách các đơn vị giao hàng dùng khi tạo đơn online
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl hover:bg-accent-hover transition shadow-sm font-medium text-sm"
        >
          <FiPlus size={16} /> Thêm mới
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-section border-b border-subtle">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  ID
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  SĐT
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Website
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
                    {item.tenVanChuyen}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{item.soDienThoai}</td>
                  <td className="px-5 py-3.5 text-muted max-w-60 truncate">
                    {item.website || "—"}
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
                  <td colSpan={6} className="text-center py-12 text-muted">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-subtle rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4 text-foreground">
              {editing ? "Sửa" : "Thêm"} bên vận chuyển
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Tên
                </label>
                <input
                  type="text"
                  value={form.tenVanChuyen}
                  onChange={(e) =>
                    setForm({ ...form, tenVanChuyen: e.target.value })
                  }
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    SĐT
                  </label>
                  <input
                    type="text"
                    value={form.soDienThoai}
                    onChange={(e) =>
                      setForm({ ...form, soDienThoai: e.target.value })
                    }
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                    placeholder="Nhập 10 chữ số"
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
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Website
                </label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Ghi chú
                </label>
                <textarea
                  value={form.ghiTru}
                  onChange={(e) => setForm({ ...form, ghiTru: e.target.value })}
                  rows={3}
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-subtle text-foreground hover:bg-section transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
