"use client";

import { useEffect, useState } from "react";
import { LoaiKiemKe, ReqLoaiKiemKeDTO } from "@/types";
import { loaiKiemKeService } from "@/services/stock-check.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

export default function AdminStockCheckTypesPage() {
  const [items, setItems] = useState<LoaiKiemKe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LoaiKiemKe | null>(null);
  const [form, setForm] = useState<ReqLoaiKiemKeDTO>({
    tenLoaiKiemKe: "",
    moTa: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await loaiKiemKeService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải loại kiểm kê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ tenLoaiKiemKe: "", moTa: "" });
    setShowModal(true);
  };

  const openEdit = (item: LoaiKiemKe) => {
    setEditing(item);
    setForm({
      id: item.id,
      tenLoaiKiemKe: item.tenLoaiKiemKe,
      moTa: item.moTa ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (!form.tenLoaiKiemKe.trim()) {
      toast.error("Vui lòng nhập tên loại kiểm kê");
      setSaving(false);
      return;
    }

    try {
      if (editing) {
        await loaiKiemKeService.update({
          id: editing.id,
          tenLoaiKiemKe: form.tenLoaiKiemKe.trim(),
          moTa: form.moTa?.trim() || "",
        });
        toast.success("Cập nhật loại kiểm kê thành công");
      } else {
        await loaiKiemKeService.create({
          tenLoaiKiemKe: form.tenLoaiKiemKe.trim(),
          moTa: form.moTa?.trim() || "",
        });
        toast.success("Tạo loại kiểm kê thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Thao tác thất bại";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa loại kiểm kê này?")) return;
    setDeleting(true);
    try {
      await loaiKiemKeService.delete(id);
      toast.success("Đã xóa loại kiểm kê");
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Loại kiểm kê</h2>
          <p className="text-sm text-muted mt-1">
            Danh mục loại kiểm kê dùng khi tạo phiếu kiểm kê.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <FiPlus size={16} /> Thêm loại kiểm kê
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-225">
            <thead className="bg-section border-b border-subtle">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Tên loại kiểm kê
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Mô tả
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-section transition">
                  <td className="px-4 py-3 font-semibold">#{item.id}</td>
                  <td className="px-4 py-3 text-foreground font-medium">
                    {item.tenLoaiKiemKe}
                  </td>
                  <td className="px-4 py-3 text-muted max-w-80 truncate">
                    {item.moTa || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition"
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
                  <td colSpan={4} className="text-center py-12 text-muted">
                    Chưa có loại kiểm kê nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-subtle rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {editing ? "Cập nhật loại kiểm kê" : "Thêm loại kiểm kê"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">
                  Tên loại kiểm kê
                </label>
                <input
                  value={form.tenLoaiKiemKe}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      tenLoaiKiemKe: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-subtle bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Mô tả</label>
                <textarea
                  value={form.moTa ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, moTa: e.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-lg border border-subtle bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-subtle text-sm text-foreground hover:bg-section transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-red-700 text-sm hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
