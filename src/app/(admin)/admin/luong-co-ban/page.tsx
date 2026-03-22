"use client";

import { useEffect, useState, useCallback } from "react";
import { LuongCoBan, NhanVien, ReqLuongCoBanDTO } from "@/types";
import { luongCoBanService } from "@/services/schedule.service";
import { nhanVienService } from "@/services/employee.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiX, FiDollarSign } from "react-icons/fi";

const EMPTY_FORM: ReqLuongCoBanDTO = {
  nhanVien: { id: 0 },
  luongCoBan: 0,
  ngayApDung: new Date().toISOString().slice(0, 16),
  trangThai: 1,
};

export default function AdminLuongCoBanPage() {
  const [list, setList] = useState<LuongCoBan[]>([]);
  const [employees, setEmployees] = useState<NhanVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNhanVienId, setFilterNhanVienId] = useState<number | undefined>();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ReqLuongCoBanDTO>(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = filterNhanVienId
        ? await luongCoBanService.getByNhanVien(filterNhanVienId)
        : await luongCoBanService.getAll();
      setList(data ?? []);
    } catch {
      toast.error("Không thể tải danh sách lương cơ bản");
    } finally {
      setLoading(false);
    }
  }, [filterNhanVienId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    nhanVienService.getAll().then((d) => setEmployees(d ?? [])).catch(() => setEmployees([]));
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (item: LuongCoBan) => {
    setForm({
      id: item.id,
      nhanVien: { id: item.nhanVien?.id ?? 0 },
      luongCoBan: item.luongCoBan,
      ngayApDung: item.ngayApDung?.slice(0, 16) ?? "",
      trangThai: item.trangThai,
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nhanVien.id) { toast.error("Vui lòng chọn nhân viên"); return; }
    if (!form.luongCoBan || form.luongCoBan <= 0) { toast.error("Lương cơ bản phải lớn hơn 0"); return; }
    try {
      setSaving(true);
      if (editId) {
        await luongCoBanService.update(form);
        toast.success("Cập nhật lương cơ bản thành công");
      } else {
        await luongCoBanService.create(form);
        toast.success("Thêm lương cơ bản thành công");
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error("Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = list.filter((l) => l.trangThai === 1).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">Quản lý lương cơ bản</h1>
          <p className="text-sm text-muted mt-1">Quản lý mức lương cơ bản theo từng nhân viên.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition"
        >
          <FiPlus size={16} /> Thêm lương
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Tổng bản ghi</p>
          <p className="text-2xl font-bold text-foreground mt-1">{list.length}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Đang áp dụng</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Hết hiệu lực</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{list.length - activeCount}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-subtle p-4">
        <select
          value={filterNhanVienId ?? ""}
          onChange={(e) => setFilterNhanVienId(e.target.value ? Number(e.target.value) : undefined)}
          className="h-10 px-3 rounded-lg bg-section border border-subtle text-sm min-w-64"
        >
          <option value="">Tất cả nhân viên</option>
          {employees.map((nv) => (
            <option key={nv.id} value={nv.id}>{nv.tenNhanVien}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted">Chưa có dữ liệu lương cơ bản</div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Nhân viên</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Lương cơ bản</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Ngày áp dụng</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Trạng thái</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold text-muted">#{item.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.nhanVien?.tenNhanVien ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 font-semibold text-green-700">
                        <FiDollarSign size={13} />
                        {formatCurrency(item.luongCoBan)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(item.ngayApDung)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.trangThai === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                      }`}>
                        {item.trangThai === 1 ? "Đang áp dụng" : "Hết hiệu lực"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                          title="Sửa"
                        >
                          <FiEdit2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <h2 className="font-bold text-lg text-foreground">
                {editId ? "Cập nhật lương cơ bản" : "Thêm lương cơ bản"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nhân viên <span className="text-red-500">*</span></label>
                <select
                  value={form.nhanVien.id || ""}
                  onChange={(e) => setForm({ ...form, nhanVien: { id: Number(e.target.value) } })}
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm"
                  disabled={!!editId}
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map((nv) => <option key={nv.id} value={nv.id}>{nv.tenNhanVien}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Lương cơ bản (VNĐ) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={form.luongCoBan}
                  onChange={(e) => setForm({ ...form, luongCoBan: Number(e.target.value) })}
                  min={0}
                  step={100000}
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Ngày áp dụng</label>
                <input
                  type="datetime-local"
                  value={form.ngayApDung}
                  onChange={(e) => setForm({ ...form, ngayApDung: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Trạng thái</label>
                <select
                  value={form.trangThai}
                  onChange={(e) => setForm({ ...form, trangThai: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm"
                >
                  <option value={1}>Đang áp dụng</option>
                  <option value={0}>Hết hiệu lực</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-subtle">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-subtle rounded-lg text-sm">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60">
                {saving ? "Đang lưu..." : editId ? "Cập nhật" : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
