"use client";

import { useEffect, useState, useCallback } from "react";
import { LuongThuong, NhanVien, ReqLuongThuongDTO } from "@/types";
import { luongThuongService } from "@/services/schedule.service";
import { nhanVienService } from "@/services/employee.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiGift } from "react-icons/fi";

const now = new Date();
const EMPTY_FORM: ReqLuongThuongDTO = {
  nhanVien: { id: 0 },
  tienThuong: 0,
  ngayBatDau: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 16),
  ngayKetThuc: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString().slice(0, 16),
  trangThai: 0,
};

export default function AdminLuongThuongPage() {
  const [list, setList] = useState<LuongThuong[]>([]);
  const [employees, setEmployees] = useState<NhanVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNhanVienId, setFilterNhanVienId] = useState<number | undefined>();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ReqLuongThuongDTO>(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = filterNhanVienId
        ? await luongThuongService.getByNhanVien(filterNhanVienId)
        : await luongThuongService.getAll();
      setList(data ?? []);
    } catch {
      toast.error("Không thể tải danh sách lương thưởng");
    } finally {
      setLoading(false);
    }
  }, [filterNhanVienId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    nhanVienService.getAll().then((d) => setEmployees(d ?? [])).catch(() => setEmployees([]));
  }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); };
  const openEdit = (item: LuongThuong) => {
    setForm({
      id: item.id,
      nhanVien: { id: item.nhanVien?.id ?? 0 },
      tienThuong: item.tienThuong,
      ngayBatDau: item.ngayBatDau?.slice(0, 16) ?? "",
      ngayKetThuc: item.ngayKetThuc?.slice(0, 16) ?? "",
      trangThai: item.trangThai,
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nhanVien.id) { toast.error("Vui lòng chọn nhân viên"); return; }
    if (!form.tienThuong || form.tienThuong <= 0) { toast.error("Tiền thưởng phải lớn hơn 0"); return; }
    try {
      setSaving(true);
      if (editId) { await luongThuongService.update(form); toast.success("Cập nhật thành công"); }
      else { await luongThuongService.create(form); toast.success("Thêm lương thưởng thành công"); }
      setShowModal(false); fetchData();
    } catch { toast.error("Thao tác thất bại"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await luongThuongService.delete(deleteId);
      toast.success("Đã xóa lương thưởng");
      setDeleteId(null); fetchData();
    } catch { toast.error("Xóa thất bại"); } finally { setDeleting(false); }
  };

  const paidCount = list.filter((l) => l.trangThai === 1).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">Quản lý lương thưởng</h1>
          <p className="text-sm text-muted mt-1">Quản lý bonus theo nhân viên và kỳ thưởng.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
          <FiPlus size={16} /> Thêm thưởng
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Tổng bản ghi</p>
          <p className="text-2xl font-bold text-foreground mt-1">{list.length}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Đã chi</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{paidCount}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Chờ chi</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{list.length - paidCount}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-subtle p-4">
        <select
          value={filterNhanVienId ?? ""}
          onChange={(e) => setFilterNhanVienId(e.target.value ? Number(e.target.value) : undefined)}
          className="h-10 px-3 rounded-lg bg-section border border-subtle text-sm min-w-64"
        >
          <option value="">Tất cả nhân viên</option>
          {employees.map((nv) => <option key={nv.id} value={nv.id}>{nv.tenNhanVien}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : list.length === 0 ? (
        <div className="text-center py-16 text-muted">Chưa có dữ liệu lương thưởng</div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Nhân viên</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Tiền thưởng</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Kỳ thưởng</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Trạng thái</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold text-muted">#{item.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{item.nhanVien?.tenNhanVien ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 font-semibold text-indigo-700">
                        <FiGift size={13} />{formatCurrency(item.tienThuong)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {formatDate(item.ngayBatDau)} → {formatDate(item.ngayKetThuc)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.trangThai === 1 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {item.trangThai === 1 ? "Đã chi" : "Chờ chi"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded" title="Sửa">
                          <FiEdit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded" title="Xóa">
                          <FiTrash2 size={15} />
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
              <h2 className="font-bold text-lg text-foreground">{editId ? "Cập nhật lương thưởng" : "Thêm lương thưởng"}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground"><FiX size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nhân viên <span className="text-red-500">*</span></label>
                <select value={form.nhanVien.id || ""} onChange={(e) => setForm({ ...form, nhanVien: { id: Number(e.target.value) } })}
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm" disabled={!!editId}>
                  <option value="">Chọn nhân viên</option>
                  {employees.map((nv) => <option key={nv.id} value={nv.id}>{nv.tenNhanVien}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tiền thưởng (VNĐ) <span className="text-red-500">*</span></label>
                <input type="number" value={form.tienThuong} onChange={(e) => setForm({ ...form, tienThuong: Number(e.target.value) })}
                  min={0} step={50000} className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Ngày bắt đầu</label>
                  <input type="datetime-local" value={form.ngayBatDau} onChange={(e) => setForm({ ...form, ngayBatDau: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Ngày kết thúc</label>
                  <input type="datetime-local" value={form.ngayKetThuc} onChange={(e) => setForm({ ...form, ngayKetThuc: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Trạng thái</label>
                <select value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm">
                  <option value={0}>Chờ chi</option>
                  <option value={1}>Đã chi</option>
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

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-foreground mb-2">Xóa lương thưởng?</h3>
            <p className="text-sm text-muted mb-5">Thao tác này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-subtle rounded-lg text-sm">Hủy</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
