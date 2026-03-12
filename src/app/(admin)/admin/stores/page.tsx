"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CuaHang } from "@/types";
import { cuaHangService } from "@/services/common.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2, FiMapPin } from "react-icons/fi";

const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-75 rounded-xl bg-section animate-pulse" />,
});

const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

export default function AdminStoresPage() {
  const [items, setItems] = useState<CuaHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CuaHang | null>(null);
  const [form, setForm] = useState({
    tenCuaHang: "",
    diaChi: "",
    viTri: "",
    soDienThoai: "",
    email: "",
    trangThai: 1,
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const d = await cuaHangService.getAll();
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
      tenCuaHang: "",
      diaChi: "",
      viTri: "",
      soDienThoai: "",
      email: "",
      trangThai: 1,
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
    });
    setShowModal(true);
  };
  const openEdit = (item: CuaHang) => {
    setEditing(item);
    const lat = item.latitude ?? DEFAULT_LAT;
    const lng = item.longitude ?? DEFAULT_LNG;
    setForm({
      tenCuaHang: item.tenCuaHang,
      diaChi: item.diaChi,
      viTri: item.viTri,
      soDienThoai: item.soDienThoai,
      email: item.email,
      trangThai: item.trangThai,
      lat,
      lng,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tenCuaHang: form.tenCuaHang,
      diaChi: form.diaChi,
      viTri: `${form.lat},${form.lng}`,
      soDienThoai: form.soDienThoai,
      email: form.email,
      trangThai: form.trangThai,
    };
    try {
      if (editing) {
        await cuaHangService.update({ id: editing.id, ...payload });
        toast.success("Cập nhật thành công");
      } else {
        await cuaHangService.create(payload);
        toast.success("Thêm thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa cửa hàng này?")) return;
    try {
      await cuaHangService.delete(id);
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
            Quản lý cửa hàng
          </h1>
          <p className="text-sm text-muted mt-1">
            Danh sách các cửa hàng trong hệ thống
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
                  Tên cửa hàng
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Vị trí
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  SĐT
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Email
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
                    {item.tenCuaHang}
                  </td>
                  <td className="px-5 py-3.5 text-muted max-w-50 truncate">
                    {item.diaChi}
                  </td>
                  <td className="px-5 py-3.5 text-muted text-xs">
                    {item.latitude && item.longitude ? (
                      <span className="flex items-center gap-1">
                        <FiMapPin size={12} />
                        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{item.soDienThoai}</td>
                  <td className="px-5 py-3.5 text-muted">{item.email}</td>
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
                  <td colSpan={8} className="text-center py-12 text-muted">
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
          <div className="bg-card border border-subtle rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-foreground">
              {editing ? "Sửa" : "Thêm"} cửa hàng
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Tên cửa hàng
                </label>
                <input
                  type="text"
                  value={form.tenCuaHang}
                  onChange={(e) =>
                    setForm({ ...form, tenCuaHang: e.target.value })
                  }
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={form.diaChi}
                  onChange={(e) => setForm({ ...form, diaChi: e.target.value })}
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
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
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Vị trí (click trên bản đồ để chọn)
                </label>
                <MapPicker
                  lat={form.lat}
                  lng={form.lng}
                  onChange={(lat, lng) =>
                    setForm({ ...form, lat, lng, viTri: `${lat},${lng}` })
                  }
                />
                <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                  <FiMapPin size={12} />
                  <span>
                    {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                  </span>
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
