"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { LichLamViec, NhanVien, ReqLichLamViecDTO } from "@/types";
import {
  lichLamViecService,
} from "@/services/schedule.service";
import { nhanVienService } from "@/services/employee.service";
import { formatDate } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiTrash2,
  FiX,
  FiUpload,
  FiDownload,
  FiCalendar,
} from "react-icons/fi";

const EMPTY_FORM: ReqLichLamViecDTO = {
  nhanVien: { id: 0 },
  ngayLamViec: new Date().toISOString().slice(0, 10),
  trangThai: 1,
};

export default function AdminLichLamViecPage() {
  const [list, setList] = useState<LichLamViec[]>([]);
  const [employees, setEmployees] = useState<NhanVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNhanVienId, setFilterNhanVienId] = useState<number | undefined>();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ReqLichLamViecDTO>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = filterNhanVienId
        ? await lichLamViecService.getByNhanVien(filterNhanVienId)
        : await lichLamViecService.getAll();
      setList(data ?? []);
    } catch {
      toast.error("Không thể tải danh sách lịch làm việc");
    } finally {
      setLoading(false);
    }
  }, [filterNhanVienId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    nhanVienService
      .getAll()
      .then((d) => setEmployees(d ?? []))
      .catch(() => setEmployees([]));
  }, []);

  const handleSave = async () => {
    if (!form.nhanVien.id) {
      toast.error("Vui lòng chọn nhân viên");
      return;
    }
    try {
      setSaving(true);
      await lichLamViecService.create(form);
      toast.success("Thêm lịch làm việc thành công");
      setShowModal(false);
      fetchData();
    } catch {
      toast.error("Thêm thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await lichLamViecService.delete(deleteId);
      toast.success("Đã xóa lịch làm việc");
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const result = await lichLamViecService.importExcel(file);
      toast.success(`Import thành công ${result?.length ?? 0} bản ghi`);
      fetchData();
    } catch {
      toast.error("Import thất bại. Kiểm tra định dạng file Excel.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await lichLamViecService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lich-lam-viec-mau.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể tải file mẫu");
    }
  };

  const workingCount = list.filter((l) => l.trangThai === 1).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">Quản lý lịch làm việc</h1>
          <p className="text-sm text-muted mt-1">
            Quản lý lịch làm việc nhân viên. Hỗ trợ import hàng loạt từ Excel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3 py-2 border border-subtle text-sm rounded-xl hover:bg-section transition"
          >
            <FiDownload size={15} /> Tải mẫu Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition disabled:opacity-60"
          >
            <FiUpload size={15} /> {importing ? "Đang import..." : "Import Excel"}
          </button>
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition"
          >
            <FiPlus size={16} /> Thêm lịch
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Tổng lịch</p>
          <p className="text-2xl font-bold text-foreground mt-1">{list.length}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Đang làm</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{workingCount}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Nghỉ</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{list.length - workingCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-card rounded-2xl border border-subtle p-4">
        <select
          value={filterNhanVienId ?? ""}
          onChange={(e) => {
            setFilterNhanVienId(e.target.value ? Number(e.target.value) : undefined);
          }}
          className="h-10 px-3 rounded-lg bg-section border border-subtle text-sm min-w-64"
        >
          <option value="">Tất cả nhân viên</option>
          {employees.map((nv) => (
            <option key={nv.id} value={nv.id}>
              {nv.tenNhanVien}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted">Chưa có lịch làm việc nào</div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Nhân viên</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Ngày làm</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Ngày tạo</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {list.map((lich) => (
                  <tr key={lich.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold text-muted">#{lich.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {lich.nhanVien?.tenNhanVien ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="flex items-center gap-1.5">
                        <FiCalendar size={13} />
                        {lich.ngayLamViec}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lich.trangThai === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {lich.trangThai === 1 ? "Đang làm" : "Nghỉ"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(lich.ngayTao ?? "")}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setDeleteId(lich.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                          title="Xóa"
                        >
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <h2 className="font-bold text-lg text-foreground">Thêm lịch làm việc</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nhân viên <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.nhanVien.id || ""}
                  onChange={(e) =>
                    setForm({ ...form, nhanVien: { id: Number(e.target.value) } })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map((nv) => (
                    <option key={nv.id} value={nv.id}>
                      {nv.tenNhanVien}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Ngày làm việc
                </label>
                <input
                  type="date"
                  value={form.ngayLamViec}
                  onChange={(e) => setForm({ ...form, ngayLamViec: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Trạng thái
                </label>
                <select
                  value={form.trangThai}
                  onChange={(e) => setForm({ ...form, trangThai: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value={1}>Đang làm</option>
                  <option value={0}>Nghỉ</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-subtle">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-medium hover:bg-section transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Thêm lịch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-foreground mb-2">Xóa lịch làm việc?</h3>
            <p className="text-sm text-muted mb-5">Thao tác này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-subtle text-foreground rounded-lg text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
