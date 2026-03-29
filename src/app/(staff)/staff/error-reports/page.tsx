"use client";

import { useEffect, useState, useRef } from "react";
import { LichLamViec, LoiPhatSinh } from "@/types";
import {
  lichLamViecService,
  loiPhatSinhService,
} from "@/services/schedule.service";
import { useAuthStore } from "@/store/auth.store";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiUpload,
  FiX,
  FiAlertCircle,
  FiImage,
} from "react-icons/fi";
import dayjs from "dayjs";

export default function StaffErrorReportPage() {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const [todaySchedules, setTodaySchedules] = useState<LichLamViec[]>([]);
  const [errors, setErrors] = useState<LoiPhatSinh[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | "">("");
  const [tenLoiPhatSinh, setTenLoiPhatSinh] = useState("");
  const [soTienTru, setSoTienTru] = useState("");
  const [hinhAnh, setHinhAnh] = useState<File | null>(null);
  const [hinhAnhPreview, setHinhAnhPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentNhanVienId = user?.id ?? 0;
  const today = dayjs();

  // Fetch today's schedule and errors
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get all schedules for current month
        const data = await lichLamViecService.getByCuaHangAndMonth(
          0,
          currentYear,
          currentMonth,
        );

        const monthData: any = data ?? null;
        const flattenedSchedules: LichLamViec[] = [];
        const lichLamMap = new Map<string, LichLamViec>();

        (monthData?.ngayLichLams ?? []).forEach((dayItem: any) => {
          (dayItem.chiTietNhanViens ?? []).forEach((nvItem: any) => {
            const key = `${dayItem.ngayLamViec}-${nvItem.lichLamViecId}`;

            if (!lichLamMap.has(key)) {
              const lichLam: LichLamViec = {
                id: nvItem.lichLamViecId,
                ngayLamViec: dayItem.ngayLamViec,
                trangThai: nvItem.trangThaiLich,
                nhanVien: nvItem.nhanVien
                  ? {
                      id: nvItem.nhanVien.id,
                      tenNhanVien: nvItem.nhanVien.tenNhanVien,
                      email: nvItem.nhanVien.email ?? "",
                      soDienThoai: nvItem.nhanVien.soDienThoai ?? "",
                      trangThai: 1,
                    }
                  : undefined,
              };
              lichLamMap.set(key, lichLam);
            }
          });
        });

        flattenedSchedules.push(...lichLamMap.values());
        const finalSchedules = Array.from(
          new Map(flattenedSchedules.map((s) => [s.id, s])).values(),
        );

        // Filter today's schedules for current user
        const todayDateStr = today.format("YYYY-MM-DD");
        const userTodaySchedules = finalSchedules.filter(
          (s) =>
            s.ngayLamViec === todayDateStr &&
            s.nhanVien?.id === currentNhanVienId,
        );
        setTodaySchedules(userTodaySchedules);
      } catch {
        toast.error("Không thể tải lịch làm việc");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear, currentMonth, currentNhanVienId]);

  // Fetch errors for current schedule
  useEffect(() => {
    const fetchErrors = async () => {
      if (!selectedScheduleId) {
        setErrors([]);
        return;
      }
      try {
        const data = await loiPhatSinhService.getByLichLamViec(
          Number(selectedScheduleId),
        );
        setErrors(data);
      } catch {
        toast.error("Không thể tải danh sách lỗi");
      }
    };

    fetchErrors();
  }, [selectedScheduleId]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }

    setHinhAnh(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setHinhAnhPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedScheduleId || !tenLoiPhatSinh || !hinhAnh) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const parsedSoTienTru = soTienTru.trim() === "" ? 0 : Number(soTienTru);
    if (Number.isNaN(parsedSoTienTru) || parsedSoTienTru < 0) {
      toast.error("Số tiền trừ không hợp lệ");
      return;
    }

    try {
      setSubmitting(true);

      // Upload image
      const imageUrl = await loiPhatSinhService.uploadImage(hinhAnh);

      // Create error report
      await loiPhatSinhService.create({
        lichLamViec: { id: Number(selectedScheduleId) } as any,
        tenLoiPhatSinh,
        soTienTru: parsedSoTienTru,
        hinhAnh: imageUrl,
        trangThai: 1,
      } as any);

      toast.success("Báo cáo lỗi thành công!");

      // Reset form
      setTenLoiPhatSinh("");
      setSoTienTru("");
      setHinhAnh(null);
      setHinhAnhPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh errors list
      if (selectedScheduleId) {
        const updatedErrors = await loiPhatSinhService.getByLichLamViec(
          Number(selectedScheduleId),
        );
        setErrors(updatedErrors);
      }
    } catch {
      toast.error("Lỗi khi báo cáo sự cố");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-28 h-72 w-72 rounded-full bg-linear-to-br from-red-200/40 via-orange-100/40 to-transparent blur-2xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-linear-to-br from-amber-200/30 via-yellow-100/30 to-transparent blur-2xl" />
      </div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-5 bg-linear-to-r from-section via-card to-section rounded-3xl border border-subtle p-6 lg:p-8 shadow-sm">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-subtle bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted">
              Báo cáo lỗi phát sinh
            </div>
            <h1 className="mt-4 text-3xl font-bold text-foreground flex items-center gap-3 font-sans tracking-tight">
              <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-sm">
                <FiAlertCircle className="text-white" size={22} />
              </div>
              Báo cáo sự cố
            </h1>
            <p className="text-sm text-muted mt-3 leading-relaxed">
              Vui lòng báo cáo mọi sự cố, lỗi, hoặc hư hỏng phát sinh trong quá
              trình làm việc cùng với hình ảnh minh chứng.
            </p>
          </div>
          <div className="rounded-2xl border border-subtle bg-card/80 px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-widest text-muted">
              Hôm nay
            </p>
            <p className="text-lg font-bold text-foreground">
              {today.format("DD/MM/YYYY")}
            </p>
          </div>
        </div>

        {/* Schedule Selection */}
        <div className="bg-card rounded-3xl border border-subtle p-6 lg:p-7 shadow-sm">
          <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
              <FiCheckCircle size={14} className="text-accent" />
            </div>
            Chọn ca làm việc hôm nay
          </label>
          <p className="text-xs text-muted mb-3">
            Chọn ca làm việc mà bạn muốn báo cáo sự cố.
          </p>

          {todaySchedules.length === 0 ? (
            <div className="p-6 text-center bg-section rounded-2xl border border-subtle">
              <FiAlertCircle size={32} className="mx-auto text-muted mb-2" />
              <p className="text-foreground font-semibold">
                Hôm nay không có ca làm việc
              </p>
              <p className="text-sm text-muted mt-1">
                Bạn cần được xếp lịch để báo cáo sự cố.
              </p>
            </div>
          ) : (
            <select
              value={selectedScheduleId}
              onChange={(e) => {
                setSelectedScheduleId(
                  e.target.value ? Number(e.target.value) : "",
                );
              }}
              className="w-full h-12 px-4 rounded-2xl bg-section border border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 font-semibold"
            >
              <option value="">-- Chọn ca làm việc --</option>
              {todaySchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  Mã lịch {schedule.id} - {today.format("HH:mm")}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Error Report Form */}
        {selectedScheduleId && (
          <div className="bg-card rounded-3xl border border-subtle p-6 lg:p-7 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FiUpload size={20} className="text-accent" />
              Báo cáo lỗi mới
            </h2>

            <div className="space-y-4">
              {/* Error Description */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Mô tả lỗi phát sinh <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={tenLoiPhatSinh}
                  onChange={(e) => setTenLoiPhatSinh(e.target.value)}
                  placeholder="Mô tả chi tiết về lỗi, sự cố, hoặc hư hỏng..."
                  className="w-full px-4 py-2 border border-subtle rounded-2xl bg-section text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                  rows={3}
                />
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Số tiền trừ (VND){" "}
                  <span className="text-muted">(không bắt buộc)</span>
                </label>
                <input
                  type="number"
                  value={soTienTru}
                  onChange={(e) => setSoTienTru(e.target.value)}
                  placeholder="Để trống nếu không có"
                  className="w-full px-4 py-2 border border-subtle rounded-2xl bg-section text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                  min="0"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Tải lên ảnh minh chứng <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 border-2 border-dashed border-accent/30 rounded-2xl hover:border-accent/60 transition flex items-center justify-center gap-2 text-sm font-semibold text-accent"
                    >
                      <FiImage size={20} />
                      {hinhAnh ? "Đổi ảnh" : "Chọn ảnh"}
                    </button>
                  </div>
                  {hinhAnhPreview && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-subtle">
                      <img
                        src={hinhAnhPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setHinhAnh(null);
                          setHinhAnhPreview("");
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !tenLoiPhatSinh || !hinhAnh}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-red-500 to-orange-500 text-white font-bold rounded-2xl hover:shadow-lg transition disabled:opacity-50"
                >
                  {submitting ? "Đang gửi..." : "Báo cáo sự cố"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Reports List */}
        {selectedScheduleId && (
          <div className="bg-card rounded-3xl border border-subtle p-6 lg:p-7 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FiCheckCircle size={20} className="text-accent" />
              Lỗi đã báo cáo ({errors.length})
            </h2>

            {errors.length === 0 ? (
              <div className="p-8 text-center bg-section rounded-2xl border border-subtle">
                <FiCheckCircle
                  size={32}
                  className="mx-auto text-accent mb-2 opacity-50"
                />
                <p className="text-foreground">Chưa có lỗi nào được báo cáo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {errors.map((error) => (
                  <div
                    key={error.id}
                    className="p-4 bg-section rounded-2xl border border-subtle hover:shadow-md transition"
                  >
                    <div className="flex gap-4">
                      {error.hinhAnh && (
                        <img
                          src={error.hinhAnh}
                          alt="Error"
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">
                          {error.tenLoiPhatSinh}
                        </p>
                        <p className="text-sm text-muted mt-1">
                          Trừ:{" "}
                          <span className="font-bold text-red-500">
                            {error.soTienTru?.toLocaleString()} VND
                          </span>
                        </p>
                        <p className="text-xs text-muted mt-1">
                          {dayjs(error.ngayTao).format("DD/MM/YYYY HH:mm")}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            error.trangThai === 1
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {error.trangThai === 1 ? "Chờ duyệt" : "Đã duyệt"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
