"use client";

import { useEffect, useState } from "react";
import { NhaCungCap } from "@/types";
import { nhaCungCapService } from "@/services/common.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

export default function AdminSuppliersPage() {
  const [items, setItems] = useState<NhaCungCap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NhaCungCap | null>(null);
  const [form, setForm] = useState({
    tenNhaCungCap: "",
    soDienThoai: "",
    email: "",
    diaChi: "",
    ghiTru: "",
    trangThai: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const d = await nhaCungCapService.getAll();
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
      tenNhaCungCap: "",
      soDienThoai: "",
      email: "",
      diaChi: "",
      ghiTru: "",
      trangThai: 1,
    });
    setShowModal(true);
  };
  const openEdit = (item: NhaCungCap) => {
    setEditing(item);
    setForm({
      tenNhaCungCap: item.tenNhaCungCap,
      soDienThoai: item.soDienThoai,
      email: item.email,
      diaChi: item.diaChi,
      ghiTru: item.ghiTru,
      trangThai: item.trangThai,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await nhaCungCapService.update({ id: editing.id, ...form });
        toast.success("Cập nhật thành công");
      } else {
        await nhaCungCapService.create(form);
        toast.success("Thêm thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa nhà cung cấp này?")) return;
    try {
      await nhaCungCapService.delete(id);
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
        <h1 className="text-2xl font-bold">Quản lý nhà cung cấp</h1>
        <button
          onClick={openCreate}
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
              <th className="px-4 py-3 text-left">Tên NCC</th>
              <th className="px-4 py-3 text-left">SĐT</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Địa chỉ</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3 font-medium">{item.tenNhaCungCap}</td>
                <td className="px-4 py-3">{item.soDienThoai}</td>
                <td className="px-4 py-3">{item.email}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">
                  {item.diaChi}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${item.trangThai ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {item.trangThai ? "Hoạt động" : "Ngưng"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEdit(item)}
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
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">
              {editing ? "Sửa" : "Thêm"} nhà cung cấp
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên NCC
                </label>
                <input
                  type="text"
                  value={form.tenNhaCungCap}
                  onChange={(e) =>
                    setForm({ ...form, tenNhaCungCap: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">SĐT</label>
                  <input
                    type="text"
                    value={form.soDienThoai}
                    onChange={(e) =>
                      setForm({ ...form, soDienThoai: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={form.diaChi}
                  onChange={(e) => setForm({ ...form, diaChi: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={form.ghiTru}
                  onChange={(e) => setForm({ ...form, ghiTru: e.target.value })}
                  rows={2}
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
