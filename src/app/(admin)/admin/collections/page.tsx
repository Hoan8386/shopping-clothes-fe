"use client";

import { useEffect, useState } from "react";
import { BoSuuTap } from "@/types";
import { boSuuTapService } from "@/services/common.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

export default function AdminCollectionsPage() {
  const [items, setItems] = useState<BoSuuTap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BoSuuTap | null>(null);
  const [form, setForm] = useState({ tenSuuTap: "", moTa: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const d = await boSuuTapService.getAll();
      setItems(Array.isArray(d) ? d : []);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await boSuuTapService.update({ id: editing.id, ...form });
        toast.success("Cập nhật thành công");
      } else {
        await boSuuTapService.create(form);
        toast.success("Thêm thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa bộ sưu tập này?")) return;
    try {
      await boSuuTapService.delete(id);
      toast.success("Đã xóa");
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý bộ sưu tập</h1>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ tenSuuTap: "", moTa: "" });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiPlus /> Thêm mới
        </button>
      </div>
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Tên bộ sưu tập</th>
              <th className="px-4 py-3 text-left">Mô tả</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3 font-medium">{item.tenSuuTap}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[300px] truncate">
                  {item.moTa}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setEditing(item);
                        setForm({ tenSuuTap: item.tenSuuTap, moTa: item.moTa });
                        setShowModal(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 p-1"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">
              {editing ? "Sửa" : "Thêm"} bộ sưu tập
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên bộ sưu tập
                </label>
                <input
                  type="text"
                  value={form.tenSuuTap}
                  onChange={(e) =>
                    setForm({ ...form, tenSuuTap: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
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
              <div className="flex gap-3 justify-end">
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
