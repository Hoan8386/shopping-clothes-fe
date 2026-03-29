"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LoiPhatSinh,
  LichLamViec,
  ChiTietLichLam,
  ReqLoiPhatSinhDTO,
  CuaHang,
} from "@/types";
import {
  loiPhatSinhService,
  lichLamViecService,
  chiTietLichLamService,
} from "@/services/schedule.service";
import { cuaHangService } from "@/services/common.service";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiAlertTriangle,
  FiEye,
  FiUpload,
  FiImage,
  FiMapPin,
  FiClock,
} from "react-icons/fi";

const EMPTY_FORM: ReqLoiPhatSinhDTO = {
  lichLamViec: { id: 0 },
  chiTietLichLam: { id: 0 },
  tenLoiPhatSinh: "",
  soTienTru: 0,
  hinhAnh: "",
  trangThai: 0,
};

export default function AdminLoiPhatSinhPage() {
  const [list, setList] = useState<LoiPhatSinh[]>([]);
  const [schedules, setSchedules] = useState<LichLamViec[]>([]);
  const [details, setDetails] = useState<ChiTietLichLam[]>([]);
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | "all">("all");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LoiPhatSinh | null>(null);
  const [form, setForm] = useState<ReqLoiPhatSinhDTO>(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInitData = useCallback(async () => {
    // Load stores
    cuaHangService
      .getAll()
      .then((data) => {
        const storeList = Array.isArray(data) ? data : [];
        setStores(storeList);
        if (storeList.length > 0) {
          toast.success(`Đã tải ${storeList.length} cửa hàng`);
        } else {
          console.warn("No stores found in API response");
        }
      })
      .catch((err) => {
        console.error("Store load error:", err);
        toast.error("Lỗi tải danh sách cửa hàng");
      });

    // Load schedules
    lichLamViecService
      .getAll()
      .then((data) => {
        setSchedules(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Schedule load error:", err);
        toast.error("Lỗi tải danh sách lịch làm việc");
      });
  }, []);

  useEffect(() => {
    fetchInitData();
  }, [fetchInitData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data =
        selectedStoreId === "all"
          ? await loiPhatSinhService.getAll()
          : await loiPhatSinhService.getByCuaHang(
              selectedStoreId,
              selectedYear,
              selectedMonth,
            );
      setList(data ?? []);
    } catch {
      toast.error("Không thể tải danh sách lỗi phát sinh");
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleScheduleChange = async (lichId: number) => {
    setForm((f) => ({
      ...f,
      lichLamViec: { id: lichId },
      chiTietLichLam: { id: 0 },
    }));
    if (lichId) {
      try {
        const detailsData =
          await chiTietLichLamService.getByLichLamViec(lichId);
        setDetails(detailsData ?? []);
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
  const openEdit = (item: LoiPhatSinh) => {
    setForm({
      id: item.id,
      lichLamViec: { id: item.lichLamViec?.id ?? 0 },
      chiTietLichLam: { id: item.chiTietLichLam?.id ?? 0 },
      tenLoiPhatSinh: item.tenLoiPhatSinh,
      soTienTru: item.soTienTru,
      hinhAnh: item.hinhAnh ?? "",
      trangThai: item.trangThai,
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const openDetail = (item: LoiPhatSinh) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await loiPhatSinhService.uploadImage(file);
      setForm((f) => ({ ...f, hinhAnh: url }));
      toast.success("Tải ảnh lên thành công");
    } catch {
      toast.error("Tải ảnh lên thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.tenLoiPhatSinh.trim()) {
      toast.error("Vui lòng nhập mô tả lỗi");
      return;
    }
    if (!form.lichLamViec.id || !form.chiTietLichLam.id) {
      toast.error("Vui lòng chọn lịch và ca làm việc");
      return;
    }
    try {
      setSaving(true);
      if (editId) {
        await loiPhatSinhService.update(form);
        toast.success("Cập nhật thành công");
      } else {
        await loiPhatSinhService.create(form);
        toast.success("Thêm lỗi phát sinh thành công");
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
      await loiPhatSinhService.delete(deleteId);
      toast.success("Đã xóa");
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const pendingCount = list.filter((l) => l.trangThai === 0).length;
  const resolvedCount = list.filter((l) => l.trangThai === 1).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Quản lý lỗi phát sinh
          </h1>
          <p className="text-sm text-muted mt-1">
            Ghi nhận và xử lý lỗi trong ca làm việc kèm mức phạt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedStoreId}
            onChange={(e) =>
              setSelectedStoreId(
                e.target.value === "all" ? "all" : Number(e.target.value),
              )
            }
            className="h-10 px-3 rounded-xl bg-section border border-subtle text-sm min-w-40"
          >
            <option value="all">Tất cả cửa hàng</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.tenCuaHang}
              </option>
            ))}
          </select>

          {selectedStoreId !== "all" && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-10 px-3 rounded-xl bg-section border border-subtle text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-10 px-3 rounded-xl bg-section border border-subtle text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  );
                })}
              </select>
            </>
          )}

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition"
          >
            <FiPlus size={16} /> Thêm lỗi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Tổng</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {list.length}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Chờ xử lý
          </p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Đã xử lý</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {resolvedCount}
          </p>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted">
          Chưa có lỗi phát sinh nào
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
                    Mô tả lỗi
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Cửa hàng
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Nhân viên
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted">
                    Tiền trừ
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
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold text-muted">
                      #{item.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-48">
                      <span className="flex items-start gap-1.5">
                        <FiAlertTriangle
                          size={14}
                          className="text-orange-500 shrink-0 mt-0.5"
                        />
                        <span className="truncate">{item.tenLoiPhatSinh}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.lichLamViec?.nhanVien?.cuaHang?.tenCuaHang ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.lichLamViec?.nhanVien?.tenNhanVien ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {formatCurrency(item.soTienTru)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.trangThai === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.trangThai === 1 ? "Đã xử lý" : "Chờ xử lý"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => openDetail(item)}
                          className="p-1.5 text-gray-500 hover:bg-gray-500/10 rounded"
                          title="Xem chi tiết"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                          title="Sửa"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <h2 className="font-bold text-lg text-foreground">
                {editId ? "Cập nhật lỗi phát sinh" : "Thêm lỗi phát sinh"}
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
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Mô tả lỗi *
                </label>
                <textarea
                  value={form.tenLoiPhatSinh}
                  onChange={(e) =>
                    setForm({ ...form, tenLoiPhatSinh: e.target.value })
                  }
                  rows={3}
                  placeholder="Ví dụ: Đi trễ 30 phút"
                  className="w-full px-3 py-2 rounded-lg bg-section border border-subtle text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Số tiền trừ (VNĐ)
                </label>
                <input
                  type="number"
                  value={form.soTienTru}
                  onChange={(e) =>
                    setForm({ ...form, soTienTru: Number(e.target.value) })
                  }
                  min={0}
                  step={10000}
                  className="w-full h-10 px-3 rounded-lg bg-section border border-subtle text-sm"
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
                  <option value={0}>Chờ xử lý</option>
                  <option value={1}>Đã xử lý</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Hình ảnh minh chứng
                </label>
                <div className="flex items-center gap-4">
                  {form.hinhAnh ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-subtle group">
                      <img
                        src={getImageUrl(form.hinhAnh)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setForm((f) => ({ ...f, hinhAnh: "" }))}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-subtle hover:border-accent transition cursor-pointer text-muted hover:text-accent">
                      <FiUpload size={20} />
                      <span className="text-[10px] mt-1">Tải lên</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUploadImage}
                        disabled={uploading}
                      />
                    </label>
                  )}
                  {uploading && (
                    <div className="text-xs text-muted animate-pulse">
                      Đang tải lên...
                    </div>
                  )}
                </div>
              </div>
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
                {saving ? "Đang lưu..." : editId ? "Cập nhật" : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-foreground mb-2">
              Xóa lỗi phát sinh?
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

      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-subtle animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-subtle bg-section">
              <div className="flex items-center gap-2">
                <FiAlertTriangle className="text-orange-500" />
                <h2 className="font-bold text-lg text-foreground">
                  Chi tiết lỗi phát sinh #{selectedItem.id}
                </h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-subtle rounded-full transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1.5">
                    Mô tả lỗi
                  </p>
                  <p className="text-foreground leading-relaxed font-medium">
                    {selectedItem.tenLoiPhatSinh}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1.5">
                      Mức phạt
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(selectedItem.soTienTru)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1.5">
                      Trạng thái
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        selectedItem.trangThai === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {selectedItem.trangThai === 1 ? "Đã xử lý" : "Chờ xử lý"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-subtle">
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <FiMapPin className="shrink-0" />
                    <span>
                      Cửa hàng:{" "}
                      <b className="text-foreground">
                        {selectedItem.lichLamViec?.nhanVien?.cuaHang
                          ?.tenCuaHang || "N/A"}
                      </b>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <FiEye className="shrink-0" />
                    <span>
                      Nhân viên:{" "}
                      <b className="text-foreground">
                        {selectedItem.lichLamViec?.nhanVien?.tenNhanVien ||
                          "N/A"}
                      </b>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <FiClock className="shrink-0" />
                    <span>
                      Ngày tạo:{" "}
                      <b className="text-foreground">
                        {formatDate(selectedItem.ngayTao || "")}
                      </b>
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-section p-6 border-l border-subtle flex flex-col items-center justify-center min-h-75">
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-4 self-start">
                  Ảnh chứng minh
                </p>
                {selectedItem.hinhAnh ? (
                  <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg border border-subtle bg-white">
                    <img
                      src={getImageUrl(selectedItem.hinhAnh)}
                      alt="Lỗi phát sinh"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted">
                    <FiImage size={48} strokeWidth={1} />
                    <p className="text-xs mt-2 italic">
                      Không có ảnh minh chứng
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-section text-right border-t border-subtle">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openEdit(selectedItem);
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
              >
                Chỉnh sửa lỗi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
