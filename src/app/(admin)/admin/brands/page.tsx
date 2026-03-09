"use client";

import { useEffect, useState } from "react";
import { ThuongHieu } from "@/types";
import { thuongHieuService } from "@/services/common.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

export default function AdminBrandsPage() {
  const [items, setItems] = useState<ThuongHieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ThuongHieu | null>(null);
  const [form, setForm] = useState({ tenThuongHieu: "", trangThaiHoatDong: 1, trangThaiHienThi: 1 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await thuongHieuService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ tenThuongHieu: "", trangThaiHoatDong: 1, trangThaiHienThi: 1 });
    setShowModal(true);
  };

  const openEdit = (item: ThuongHieu) => {
    setEditing(item);
    setForm({ tenThuongHieu: item.tenThuongHieu, trangThaiHoatDong: item.trangThaiHoatDong, trangThaiHienThi: item.trangThaiHienThi });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await thuongHieuService.update({ id: editing.id, ...form });
        toast.success("Cập nhật thành công");
      } else {
        await thuongHieuService.create(form);
        toast.success("Thêm thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa thương hiệu này?")) return;
    try {
      await thuongHieuService.delete(id);
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
        <h1 className="text-2xl font-bold">Quản lý thương hiệu</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <FiPlus /> Thêm mới
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Tên thương hiệu</th>
              <th className="px-4 py-3 text-left">Hoạt động</th>
              <th className="px-4 py-3 text-left">Hiển thị</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3 font-medium">{item.tenThuongHieu}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${item.trangThaiHoatDong ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.trangThaiHoatDong ? "Hoạt động" : "Ngưng"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${item.trangThaiHienThi ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.trangThaiHienThi ? "Hiển thị" : "Ẩn"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700 p-1"><FiEdit size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-1"><FiTrash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? "Sửa thương hiệu" : "Thêm thương hiệu"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên thương hiệu</label>
                <input type="text" value={form.tenThuongHieu} onChange={(e) => setForm({ ...form, tenThuongHieu: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Hoạt động</label>
                  <select value={form.trangThaiHoatDong} onChange={(e) => setForm({ ...form, trangThaiHoatDong: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2">
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Ngưng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hiển thị</label>
                  <select value={form.trangThaiHienThi} onChange={(e) => setForm({ ...form, trangThaiHienThi: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2">
                    <option value={1}>Hiển thị</option>
                    <option value={0}>Ẩn</option>
                  </select>
                </div>
              </div>
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
