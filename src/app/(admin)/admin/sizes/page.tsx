"use client";

import { useEffect, useState } from "react";
import { KichThuoc } from "@/types";
import { kichThuocService } from "@/services/common.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

export default function AdminSizesPage() {
  const [items, setItems] = useState<KichThuoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<KichThuoc | null>(null);
  const [name, setName] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { setLoading(true); const d = await kichThuocService.getAll(); setItems(Array.isArray(d) ? d : []); } catch { toast.error("Lỗi tải dữ liệu"); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await kichThuocService.update({ id: editing.id, tenKichThuoc: name }); toast.success("Cập nhật thành công"); }
      else { await kichThuocService.create({ tenKichThuoc: name }); toast.success("Thêm thành công"); }
      setShowModal(false); fetchData();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Thất bại"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa?")) return;
    try { await kichThuocService.delete(id); toast.success("Đã xóa"); fetchData(); } catch { toast.error("Xóa thất bại"); }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý kích thước</h1>
        <button onClick={() => { setEditing(null); setName(""); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><FiPlus /> Thêm mới</button>
      </div>
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left">ID</th><th className="px-4 py-3 text-left">Tên kích thước</th><th className="px-4 py-3 text-center">Thao tác</th></tr></thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3 font-medium">{item.tenKichThuoc}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => { setEditing(item); setName(item.tenKichThuoc); setShowModal(true); }} className="text-blue-500 hover:text-blue-700 p-1"><FiEdit size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-1"><FiTrash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-gray-400">Không có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? "Sửa" : "Thêm"} kích thước</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên kích thước" className="w-full border rounded-lg px-3 py-2" required />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? "Cập nhật" : "Thêm mới"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
