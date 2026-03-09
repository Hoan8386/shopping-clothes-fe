"use client";

import { useEffect, useState } from "react";
import { KhuyenMaiTheoHoaDon } from "@/types";
import { khuyenMaiHoaDonService, khuyenMaiDiemService } from "@/services/common.service";
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

  useEffect(() => { fetchData(); }, [type]);

  const service = type === "hoaDon" ? khuyenMaiHoaDonService : khuyenMaiDiemService;

  const fetchData = async () => {
    try { setLoading(true); const d = await service.getAll(); setItems(Array.isArray(d) ? d : []); } catch { toast.error("Lỗi tải dữ liệu"); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ tenKhuyenMai: "", giamToiDa: 0, hoaDonToiDa: 0, phanTramGiam: 0, hinhThuc: 0, thoiGianBatDau: "", thoiGianKetThuc: "", soLuong: 0, trangThai: 1 });
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
      if (editing) { await service.update({ id: editing.id, ...form }); toast.success("Cập nhật thành công"); }
      else { await service.create(form); toast.success("Thêm thành công"); }
      setShowModal(false); fetchData();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Thất bại"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa?")) return;
    try { await service.delete(id); toast.success("Đã xóa"); fetchData(); } catch { toast.error("Xóa thất bại"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý khuyến mãi</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><FiPlus /> Thêm mới</button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setType("hoaDon")} className={`px-4 py-2 rounded-full text-sm font-medium ${type === "hoaDon" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Theo hóa đơn</button>
        <button onClick={() => setType("diem")} className={`px-4 py-2 rounded-full text-sm font-medium ${type === "diem" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Theo điểm</button>
      </div>

      {loading ? <Loading /> : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Tên KM</th>
                <th className="px-4 py-3 text-left">% Giảm</th>
                <th className="px-4 py-3 text-left">Giảm tối đa</th>
                <th className="px-4 py-3 text-left">Số lượng</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{item.id}</td>
                  <td className="px-4 py-3 font-medium">{item.tenKhuyenMai}</td>
                  <td className="px-4 py-3">{item.phanTramGiam}%</td>
                  <td className="px-4 py-3">{formatCurrency(item.giamToiDa)}</td>
                  <td className="px-4 py-3">{item.soLuong}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${item.trangThai ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {item.trangThai ? "Hoạt động" : "Ngưng"}
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
              {items.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Không có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? "Sửa" : "Thêm"} khuyến mãi</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Tên khuyến mãi</label><input type="text" value={form.tenKhuyenMai} onChange={(e) => setForm({ ...form, tenKhuyenMai: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">% Giảm</label><input type="number" value={form.phanTramGiam} onChange={(e) => setForm({ ...form, phanTramGiam: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Giảm tối đa</label><input type="number" value={form.giamToiDa} onChange={(e) => setForm({ ...form, giamToiDa: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">HĐ tối đa</label><input type="number" value={form.hoaDonToiDa} onChange={(e) => setForm({ ...form, hoaDonToiDa: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Số lượng</label><input type="number" value={form.soLuong} onChange={(e) => setForm({ ...form, soLuong: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Bắt đầu</label><input type="datetime-local" value={form.thoiGianBatDau} onChange={(e) => setForm({ ...form, thoiGianBatDau: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Kết thúc</label><input type="datetime-local" value={form.thoiGianKetThuc} onChange={(e) => setForm({ ...form, thoiGianKetThuc: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Hình thức</label><input type="number" value={form.hinhThuc} onChange={(e) => setForm({ ...form, hinhThuc: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2">
                    <option value={1}>Hoạt động</option><option value={0}>Ngưng</option>
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
