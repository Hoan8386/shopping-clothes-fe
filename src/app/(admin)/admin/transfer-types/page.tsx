"use client";

import { useEffect, useState } from "react";
import { LoaiDonLuanChuyen } from "@/types";
import { loaiDonLuanChuyenService } from "@/services/transfer.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

export default function AdminTransferTypesPage() {
  const [items, setItems] = useState<LoaiDonLuanChuyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LoaiDonLuanChuyen | null>(null);
  const [form, setForm] = useState({ tenLoai: "", moTa: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await loaiDonLuanChuyenService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ tenLoai: "", moTa: "" });
    setShowModal(true);
  };

  const openEdit = (item: LoaiDonLuanChuyen) => {
    setEditing(item);
    setForm({ tenLoai: item.tenLoai, moTa: item.moTa || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await loaiDonLuanChuyenService.update({ id: editing.id, ...form });
        toast.success("Cập nhật thành công");
      } else {
        await loaiDonLuanChuyenService.create(form);
        toast.success("Thêm thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa loại đơn luân chuyển này?")) return;
    try {
      await loaiDonLuanChuyenService.delete(id);
      toast.success("Đã xóa");
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý loại đơn luân chuyển
          </h1>
          <p className="text-sm text-muted mt-1">
            Danh sách các loại đơn luân chuyển hàng
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
                  Tên loại
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Mô tả
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
                    {item.tenLoai}
                  </td>
                  <td className="px-5 py-3.5 text-muted max-w-72 truncate">
                    {item.moTa}
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
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
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
          <div className="bg-card border border-subtle rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4 text-foreground">
              {editing ? "Sửa loại đơn luân chuyển" : "Thêm loại đơn luân chuyển"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Tên loại
                </label>
                <input
                  type="text"
                  value={form.tenLoai}
                  onChange={(e) =>
                    setForm({ ...form, tenLoai: e.target.value })
                  }
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Mô tả
                </label>
                <textarea
                  value={form.moTa}
                  onChange={(e) =>
                    setForm({ ...form, moTa: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-subtle rounded-xl text-foreground hover:bg-section text-sm font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover text-sm font-medium transition shadow-sm"
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
