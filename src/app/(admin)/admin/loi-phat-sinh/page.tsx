"use client";

import { useEffect, useState, useCallback } from "react";
import { LoiPhatSinh, LichLamViec, ChiTietLichLam, ReqLoiPhatSinhDTO } from "@/types";
import { loiPhatSinhService, lichLamViecService, chiTietLichLamService } from "@/services/schedule.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiAlertTriangle } from "react-icons/fi";

const EMPTY_FORM: ReqLoiPhatSinhDTO = {
  lichLamViec: { id: 0 },
  chiTietLichLam: { id: 0 },
  tenLoiPhatSinh: "",
  soTienTru: 0,
  trangThai: 0,
};

export default function AdminLoiPhatSinhPage() {
  const [list, setList] = useState<LoiPhatSinh[]>([]);
  const [schedules, setSchedules] = useState<LichLamViec[]>([]);
  const [details, setDetails] = useState<ChiTietLichLam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ReqLoiPhatSinhDTO>(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loiPhatSinhService.getAll();
      setList(data ?? []);
    } catch {
      toast.error("Không thể tải danh sách lỗi phát sinh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    lichLamViecService.getAll().then((d) => setSchedules(d ?? [])).catch(() => {});
  }, []);

  const handleScheduleChange = async (lichId: number) => {
    setForm((f) => ({ ...f, lichLamViec: { id: lichId }, chiTietLichLam: { id: 0 } }));
    if (lichId) {
      try { setDetails((await chiTietLichLamService.getByLichLamViec(lichId)) ?? []); }
      catch { setDetails([]); }
    } else { setDetails([]); }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setDetails([]); setEditId(null); setShowModal(true); };
  const openEdit = (item: LoiPhatSinh) => {
    setForm({
      id: item.id,
      lichLamViec: { id: item.lichLamViec?.id ?? 0 },
      chiTietLichLam: { id: item.chiTietLichLam?.id ?? 0 },
      tenLoiPhatSinh: item.tenLoiPhatSinh,
      soTienTru: item.soTienTru,
      trangThai: item.trangThai,
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.tenLoiPhatSinh.trim()) { toast.error("Vui lòng nhập mô tả lỗi"); return; }
    if (!form.lichLamViec.id || !form.chiTietLichLam.id) { toast.error("Vui lòng chọn lịch và ca làm việc"); return; }
    try {
      setSaving(true);
      if (editId) { await loiPhatSinhService.update(form); toast.success("Cập nhật thành công"); }
      else { await loiPhatSinhService.create(form); toast.success("Thêm lỗi phát sinh thành công"); }
      setShowModal(false); fetchData();
    } catch { toast.error("Thao tác thất bại"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await loiPhatSinhService.delete(deleteId);
      toast.success("Đã xóa"); setDeleteId(null); fetchData();
    } catch { toast.error("Xóa thất bại"); } finally { setDeleting(false); }
  };

  const pendingCount = list.filter((l) => l.trangThai === 0).length;
  const resolvedCount = list.filter((l) => l.trangThai === 1).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">Quản lý lỗi phát sinh</h1>
          <p className="text-sm text-muted mt-1">Ghi nhận và xử lý lỗi trong ca làm việc kèm mức phạt.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
          <FiPlus size={16} /> Thêm lỗi
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4"><p className="text-xs text-muted uppercase tracking-wide">Tổng</p><p className="text-2xl font-bold text-foreground mt-1">{list.length}</p></div>
        <div className="bg-card border border-subtle rounded-xl p-4"><p className="text-xs text-muted uppercase tracking-wide">Chờ xử lý</p><p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p></div>
        <div className="bg-card border border-subtle rounded-xl p-4"><p className="text-xs text-muted uppercase tracking-wide">Đã xử lý</p><p className="text-2xl font-bold text-green-600 mt-1">{resolvedCount}</p></div>
      </div>

      {loading ? <Loading /> : list.length === 0 ? (
        <div className="text-center py-16 text-muted">Chưa có lỗi phát sinh nào</div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Mô tả lỗi</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Lịch làm (ID)</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Tiền trừ</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Ngày tạo</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold text-muted">#{item.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-48">
                      <span className="flex items-start gap-1.5">
                        <FiAlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                        <span className="truncate">{item.tenLoiPhatSinh}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">#{item.lichLamViec?.id}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(item.soTienTru)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.trangThai === 1 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {item.trangThai === 1 ? "Đã xử lý" : "Chờ xử lý"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(item.ngayTao ?? "")}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"><FiEdit2 size={15} /></button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"><FiTrash2 size={15} /></button>
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
              <h2 className="font-bold text-lg text-foreground">{editId ? "Cập nhật lỗi phát sinh" : "Thêm lỗi phát sinh"}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground"><FiX size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {!editId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Lịch làm việc *</label>
                    <select value={form.lichLamViec.id || ""} onChange={(e) => handleScheduleChange(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm">
                      <option value="">Chọn lịch làm việc</option>
                      {schedules.map((s) => <option key={s.id} value={s.id}>#{s.id} — {s.nhanVien?.tenNhanVien} ({s.ngayLamViec})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Chi tiết ca *</label>
                    <select value={form.chiTietLichLam.id || ""} onChange={(e) => setForm({ ...form, chiTietLichLam: { id: Number(e.target.value) } })}
                      className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm">
                      <option value="">Chọn chi tiết ca</option>
                      {details.map((d) => <option key={d.id} value={d.id}>#{d.id} — {d.caLamViec?.tenCaLam}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Mô tả lỗi *</label>
                <textarea value={form.tenLoiPhatSinh} onChange={(e) => setForm({ ...form, tenLoiPhatSinh: e.target.value })}
                  rows={3} placeholder="Ví dụ: Đi trễ 30 phút"
                  className="w-full px-3 py-2 rounded-lg bg-section border border-subtle text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Số tiền trừ (VNĐ)</label>
                <input type="number" value={form.soTienTru} onChange={(e) => setForm({ ...form, soTienTru: Number(e.target.value) })}
                  min={0} step={10000} className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Trạng thái</label>
                <select value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm">
                  <option value={0}>Chờ xử lý</option>
                  <option value={1}>Đã xử lý</option>
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
            <h3 className="font-bold text-lg text-foreground mb-2">Xóa lỗi phát sinh?</h3>
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
