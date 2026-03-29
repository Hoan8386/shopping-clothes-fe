"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DoiCa,
  LichLamViec,
  ChiTietLichLam,
  NhanVien,
  ReqDoiCaDTO,
} from "@/types";
import {
  doiCaService,
  lichLamViecService,
  chiTietLichLamService,
} from "@/services/schedule.service";
import { nhanVienService } from "@/services/employee.service";
import { formatDate } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiRepeat } from "react-icons/fi";

const EMPTY_FORM: ReqDoiCaDTO = {
  lichLamViec: { id: 0 },
  chiTietLichLam: { id: 0 },
  nhanVienNhanCa: { id: 0 },
  trangThai: 0,
  lyDo: "",
  phanHoi: "",
};

function getStatusColor(t: number) {
  if (t === 1) return "bg-green-100 text-green-800";
  if (t === 2) return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-800";
}
function getStatusLabel(t: number) {
  if (t === 1) return "Đồng ý";
  if (t === 2) return "Từ chối";
  return "Chờ duyệt";
}

export default function AdminDoiCaPage() {
  const [list, setList] = useState<DoiCa[]>([]);
  const [schedules, setSchedules] = useState<LichLamViec[]>([]);
  const [details, setDetails] = useState<ChiTietLichLam[]>([]);
  const [employees, setEmployees] = useState<NhanVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ReqDoiCaDTO>(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await doiCaService.getAll();
      setList(data ?? []);
    } catch {
      toast.error("Không thể tải danh sách đổi ca");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    lichLamViecService
      .getAll()
      .then((d) => setSchedules(d ?? []))
      .catch(() => {});
    nhanVienService
      .getAll()
      .then((d) => setEmployees(d ?? []))
      .catch(() => {});
  }, []);

  const handleScheduleChange = async (lichId: number) => {
    setForm((f) => ({
      ...f,
      lichLamViec: { id: lichId },
      chiTietLichLam: { id: 0 },
    }));
    if (lichId) {
      try {
        setDetails(
          (await chiTietLichLamService.getByLichLamViec(lichId)) ?? [],
        );
      } catch {
        setDetails([]);
      }
    } else {
      setDetails([]);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDetails([]);
    setEditId(null);
    setShowModal(true);
  };
  const openEdit = (item: DoiCa) => {
    setForm({
      id: item.id,
      lichLamViec: { id: item.lichLamViec?.id ?? 0 },
      chiTietLichLam: { id: item.chiTietLichLam?.id ?? 0 },
      nhanVienNhanCa: { id: item.nhanVienNhanCa?.id ?? 0 },
      trangThai: item.trangThai,
      lyDo: item.lyDo ?? "",
      phanHoi: item.phanHoi ?? "",
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (
      !form.lichLamViec.id ||
      !form.chiTietLichLam.id ||
      !form.nhanVienNhanCa.id
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (!form.lyDo?.trim()) {
      toast.error("Vui lòng nhập lý do đổi ca");
      return;
    }
    if (form.trangThai === 2 && !form.phanHoi?.trim()) {
      toast.error("Vui lòng nhập phản hồi khi từ chối");
      return;
    }
    try {
      setSaving(true);
      if (editId) {
        await doiCaService.update(form);
        toast.success("Cập nhật thành công");
      } else {
        await doiCaService.create(form);
        toast.success("Tạo yêu cầu đổi ca thành công");
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error("Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await doiCaService.delete(deleteId);
      toast.success("Đã xóa");
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">Quản lý đổi ca</h1>
          <p className="text-sm text-muted mt-1">
            Quản lý yêu cầu đổi ca giữa các nhân viên.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition"
        >
          <FiPlus size={16} /> Tạo yêu cầu
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tổng", value: list.length, color: "text-foreground" },
          {
            label: "Chờ duyệt",
            value: list.filter((l) => l.trangThai === 0).length,
            color: "text-yellow-600",
          },
          {
            label: "Đồng ý",
            value: list.filter((l) => l.trangThai === 1).length,
            color: "text-green-600",
          },
          {
            label: "Từ chối",
            value: list.filter((l) => l.trangThai === 2).length,
            color: "text-red-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-subtle rounded-xl p-4"
          >
            <p className="text-xs text-muted uppercase tracking-wide">
              {s.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted">
          Chưa có yêu cầu đổi ca nào
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Lịch làm (ID)
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Ca (ID)
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    NV nhận ca
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Lý do
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Phản hồi
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold text-muted">
                      #{item.id}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="flex items-center gap-1.5">
                        <FiRepeat size={13} />#{item.lichLamViec?.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      #{item.chiTietLichLam?.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.nhanVienNhanCa?.tenNhanVien ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-muted max-w-56 truncate"
                      title={item.lyDo ?? ""}
                    >
                      {item.lyDo ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-muted max-w-56 truncate"
                      title={item.phanHoi ?? ""}
                    >
                      {item.phanHoi ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.trangThai)}`}
                      >
                        {getStatusLabel(item.trangThai)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(item.ngayTao ?? "")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <h2 className="font-bold text-lg text-foreground">
                {editId ? "Cập nhật đổi ca" : "Tạo yêu cầu đổi ca"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {!editId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Lịch làm việc *
                    </label>
                    <select
                      value={form.lichLamViec.id || ""}
                      onChange={(e) =>
                        handleScheduleChange(Number(e.target.value))
                      }
                      className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm"
                    >
                      <option value="">Chọn lịch làm việc</option>
                      {schedules.map((s) => (
                        <option key={s.id} value={s.id}>
                          #{s.id} — {s.nhanVien?.tenNhanVien} ({s.ngayLamViec})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Chi tiết ca *
                    </label>
                    <select
                      value={form.chiTietLichLam.id || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          chiTietLichLam: { id: Number(e.target.value) },
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm"
                    >
                      <option value="">Chọn chi tiết ca</option>
                      {details.map((d) => (
                        <option key={d.id} value={d.id}>
                          #{d.id} — {d.caLamViec?.tenCaLam}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Nhân viên nhận ca *
                    </label>
                    <select
                      value={form.nhanVienNhanCa.id || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          nhanVienNhanCa: { id: Number(e.target.value) },
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm"
                    >
                      <option value="">Chọn nhân viên</option>
                      {employees.map((nv) => (
                        <option key={nv.id} value={nv.id}>
                          {nv.tenNhanVien}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Lý do đổi ca *
                </label>
                <textarea
                  value={form.lyDo ?? ""}
                  onChange={(e) => setForm({ ...form, lyDo: e.target.value })}
                  rows={3}
                  placeholder="Nhập lý do đổi ca"
                  className="w-full px-3 py-2 rounded-lg bg-section border border-subtle text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Trạng thái
                </label>
                <select
                  value={form.trangThai}
                  onChange={(e) =>
                    setForm({ ...form, trangThai: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm"
                >
                  <option value={0}>Chờ duyệt</option>
                  <option value={1}>Đồng ý</option>
                  <option value={2}>Từ chối</option>
                </select>
              </div>
              {form.trangThai === 2 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Phản hồi từ chối *
                  </label>
                  <textarea
                    value={form.phanHoi ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, phanHoi: e.target.value })
                    }
                    rows={3}
                    placeholder="Nhập phản hồi cho nhân viên"
                    className="w-full px-3 py-2 rounded-lg bg-section border border-subtle text-sm resize-none"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 p-4 border-t border-subtle">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-subtle rounded-lg text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : editId ? "Cập nhật" : "Tạo yêu cầu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-foreground mb-2">
              Xóa yêu cầu đổi ca?
            </h3>
            <p className="text-sm text-muted mb-5">
              Thao tác này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-subtle rounded-lg text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
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
