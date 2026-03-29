"use client";

import { useEffect, useState, useCallback } from "react";
import { CaLamViec, ReqCaLamViecDTO } from "@/types";
import { caLamViecService } from "@/services/schedule.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiClock } from "react-icons/fi";
import { TimePicker } from "antd";
import dayjs from "dayjs";

const EMPTY_FORM: ReqCaLamViecDTO = {
  tenCaLam: "",
  gioBatDau: "07:00",
  gioKetThuc: "15:00",
  trangThai: 1,
};

export default function AdminCaLamViecPage() {
  const [list, setList] = useState<CaLamViec[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ReqCaLamViecDTO>(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await caLamViecService.getAll();
      setList(data ?? []);
    } catch {
      toast.error("Không thể tải danh sách ca làm việc");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (ca: CaLamViec) => {
    setForm({
      id: ca.id,
      tenCaLam: ca.tenCaLam,
      gioBatDau: ca.gioBatDau.slice(0, 5),
      gioKetThuc: ca.gioKetThuc.slice(0, 5),
      trangThai: ca.trangThai,
    });
    setEditId(ca.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.tenCaLam.trim()) {
      toast.error("Vui lòng nhập tên ca");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        gioBatDau: form.gioBatDau + ":00",
        gioKetThuc: form.gioKetThuc + ":00",
      };
      if (editId) {
        await caLamViecService.update(payload);
        toast.success("Cập nhật ca làm việc thành công");
      } else {
        await caLamViecService.create(payload);
        toast.success("Thêm ca làm việc thành công");
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
      await caLamViecService.delete(deleteId);
      toast.success("Đã xóa ca làm việc");
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = list.filter((c) => c.trangThai === 1).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Quản lý ca làm việc
          </h1>
          <p className="text-sm text-muted mt-1">
            Quản lý các ca làm việc trong hệ thống.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition"
        >
          <FiPlus size={16} /> Thêm ca
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Tổng ca</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {list.length}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Hoạt động
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {activeCount}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Không HĐ</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {list.length - activeCount}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted">
          Chưa có ca làm việc nào
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
                    Tên ca
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Giờ bắt đầu
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Giờ kết thúc
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {list.map((ca) => (
                  <tr key={ca.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold text-muted">
                      #{ca.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {ca.tenCaLam}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="flex items-center gap-1.5">
                        <FiClock size={13} />
                        {ca.gioBatDau?.slice(0, 5)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="flex items-center gap-1.5">
                        <FiClock size={13} />
                        {ca.gioKetThuc?.slice(0, 5)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ca.trangThai === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {ca.trangThai === 1 ? "Hoạt động" : "Không HĐ"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(ca)}
                          className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                          title="Sửa"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(ca.id)}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <h2 className="font-bold text-lg text-foreground">
                {editId ? "Cập nhật ca làm việc" : "Thêm ca làm việc"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Tên ca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.tenCaLam}
                  onChange={(e) =>
                    setForm({ ...form, tenCaLam: e.target.value })
                  }
                  placeholder="Ví dụ: Ca Sáng"
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Giờ bắt đầu
                  </label>
                  <TimePicker
                    value={dayjs(form.gioBatDau, "HH:mm")}
                    onChange={(time) => {
                      if (time) {
                        setForm({
                          ...form,
                          gioBatDau: time.format("HH:mm"),
                        });
                      }
                    }}
                    format="HH:mm"
                    placeholder="Chọn giờ"
                    style={{ width: "100%" }}
                    className="ant-input-custom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Giờ kết thúc
                  </label>
                  <TimePicker
                    value={dayjs(form.gioKetThuc, "HH:mm")}
                    onChange={(time) => {
                      if (time) {
                        setForm({
                          ...form,
                          gioKetThuc: time.format("HH:mm"),
                        });
                      }
                    }}
                    format="HH:mm"
                    placeholder="Chọn giờ"
                    style={{ width: "100%" }}
                    className="ant-input-custom"
                  />
                </div>
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
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value={1}>Hoạt động</option>
                  <option value={0}>Không hoạt động</option>
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
                {saving ? "Đang lưu..." : editId ? "Cập nhật" : "Thêm ca"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-foreground mb-2">
              Xóa ca làm việc?
            </h3>
            <p className="text-sm text-muted mb-5">
              Thao tác này không thể hoàn tác. Ca làm việc sẽ bị xóa khỏi hệ
              thống.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-medium hover:bg-section transition"
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
