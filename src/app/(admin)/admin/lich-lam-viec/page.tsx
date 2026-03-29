"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  LichLamViec,
  ChiTietLichLam,
  CaLamViec,
  CuaHang,
  NhanVien,
  LichLamViecThangResponse,
} from "@/types";
import {
  lichLamViecService,
  caLamViecService,
} from "@/services/schedule.service";
import { cuaHangService } from "@/services/common.service";
import { nhanVienService } from "@/services/employee.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiUpload,
  FiDownload,
  FiX,
  FiCalendar,
  FiClock,
  FiMapPin,
} from "react-icons/fi";
import dayjs from "dayjs";

export default function AdminLichLamViecPage() {
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const [schedules, setSchedules] = useState<LichLamViec[]>([]);
  const [shifts, setShifts] = useState<CaLamViec[]>([]);
  const [details, setDetails] = useState<ChiTietLichLam[]>([]);
  const [storeEmployees, setStoreEmployees] = useState<NhanVien[]>([]);
  const [dayStatusByDate, setDayStatusByDate] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addEmployeeId, setAddEmployeeId] = useState<number | "">("");
  const [addShiftId, setAddShiftId] = useState<number | "">("");

  const handleUpdateDayStatus = async (status: number) => {
    if (!selectedStoreId || !selectedDay) return;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    try {
      setUpdatingStatus(true);
      await lichLamViecService.updateDayStatus(
        selectedStoreId,
        dateStr,
        status,
      );
      toast.success("Cập nhật trạng thái thành công");
      await fetchSchedules();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleShift = async (
    empId: number,
    shiftId: number,
    isAdd: boolean,
  ) => {
    if (!selectedStoreId || !selectedDay) return;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    try {
      if (isAdd) {
        await lichLamViecService.addShift(
          selectedStoreId,
          empId,
          shiftId,
          dateStr,
        );
      } else {
        await lichLamViecService.removeShift(
          selectedStoreId,
          empId,
          shiftId,
          dateStr,
        );
      }
      toast.success(isAdd ? "Thêm ca thành công" : "Xóa ca thành công");
      if (isAdd) {
        setAddEmployeeId("");
        setAddShiftId("");
      }
      await fetchSchedules();
    } catch {
      toast.error("Lỗi khi cập nhật ca");
    }
  };

  // Load stores on mount
  useEffect(() => {
    cuaHangService
      .getAll()
      .then((d) => setStores(d ?? []))
      .catch(() => toast.error("Không thể tải danh sách cửa hàng"))
      .finally(() => setLoadingStores(false));

    caLamViecService
      .getAll()
      .then((d) => setShifts(d ?? []))
      .catch(() => {});
  }, []);

  // Load schedules when store/month changes
  const fetchSchedules = useCallback(async () => {
    if (!selectedStoreId) return;
    try {
      setLoading(true);
      // Gọi 1 API duy nhất, LichLamViec đã kèm theo chi tiết
      const data = await lichLamViecService.getByCuaHangAndMonth(
        selectedStoreId,
        currentYear,
        currentMonth,
      );

      const monthData: LichLamViecThangResponse | null = data ?? null;
      const flattenedSchedules: LichLamViec[] = [];
      const allDetails: ChiTietLichLam[] = [];
      const nextDayStatusByDate: Record<string, number> = {};
      const lichLamMap = new Map<string, LichLamViec>();

      (monthData?.ngayLichLams ?? []).forEach((dayItem) => {
        nextDayStatusByDate[dayItem.ngayLamViec] = dayItem.trangThaiNgay;

        (dayItem.chiTietNhanViens ?? []).forEach((nvItem) => {
          const key = `${dayItem.ngayLamViec}-${nvItem.lichLamViecId}`;

          // Chỉ tạo 1 LichLamViec duy nhất cho mỗi ngày + lichLamViecId
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

          (nvItem.chiTietCaLams ?? []).forEach((caItem) => {
            allDetails.push({
              id: caItem.id,
              trangThai: caItem.trangThai,
              lichLamViec: { id: nvItem.lichLamViecId } as LichLamViec,
              caLamViec: caItem.caLamViec
                ? {
                    id: caItem.caLamViec.id,
                    tenCaLam: caItem.caLamViec.tenCaLam,
                    gioBatDau: caItem.caLamViec.gioBatDau,
                    gioKetThuc: caItem.caLamViec.gioKetThuc,
                    trangThai: caItem.caLamViec.trangThai,
                  }
                : undefined,
            });
          });
        });
      });

      flattenedSchedules.push(...lichLamMap.values());

      // Dedup lần cuối dựa vào id để loại bỏ trùng lặp hoàn toàn
      const finalSchedules = Array.from(
        new Map(flattenedSchedules.map((s) => [s.id, s])).values(),
      );
      // Dedup details dựa vào id
      const finalDetails = Array.from(
        new Map(allDetails.map((d) => [d.id, d])).values(),
      );

      setSchedules(finalSchedules);
      setDetails(finalDetails);
      setDayStatusByDate(nextDayStatusByDate);
    } catch {
      toast.error("Không thể tải lịch làm việc");
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, currentYear, currentMonth]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchSchedules();
    }
  }, [selectedStoreId, fetchSchedules]);

  useEffect(() => {
    if (!selectedStoreId) {
      setStoreEmployees([]);
      return;
    }

    nhanVienService
      .getAll()
      .then((employees) => {
        const filtered = (employees ?? [])
          .filter(
            (emp) => emp.cuaHang?.id === selectedStoreId && emp.trangThai === 1,
          )
          .sort((a, b) =>
            (a.tenNhanVien || "").localeCompare(b.tenNhanVien || "", "vi"),
          );
        setStoreEmployees(filtered);
      })
      .catch(() => {
        toast.error("Không thể tải danh sách nhân viên của cửa hàng");
      });
  }, [selectedStoreId]);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Group schedules by day
  const getSchedulesForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return schedules.filter((s) => s.ngayLamViec === dateStr);
  };

  const getDetailsForSchedule = (scheduleId: number) => {
    return details.filter((d) => d.lichLamViec?.id === scheduleId);
  };

  // Get unique shift summaries for a day
  const getDayShiftSummary = (day: number) => {
    const daySchedules = getSchedulesForDay(day);
    const shiftMap = new Map<
      number,
      { shift: CaLamViec; employees: { id: number; name: string }[] }
    >();

    for (const sch of daySchedules) {
      const schDetails = getDetailsForSchedule(sch.id);
      for (const det of schDetails) {
        if (det.caLamViec) {
          const existing = shiftMap.get(det.caLamViec.id);
          const empName = sch.nhanVien?.tenNhanVien ?? "—";
          const empId = sch.nhanVien?.id ?? 0;
          if (existing) {
            if (!existing.employees.some((e) => e.id === empId)) {
              existing.employees.push({ id: empId, name: empName });
            }
          } else {
            shiftMap.set(det.caLamViec.id, {
              shift: det.caLamViec,
              employees: [{ id: empId, name: empName }],
            });
          }
        }
      }
    }

    return Array.from(shiftMap.values());
  };

  // Import/Download handlers
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedStoreId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const result = await lichLamViecService.importExcel(
        selectedStoreId,
        file,
      );
      toast.success(`Import thành công ${result?.length ?? 0} bản ghi`);
      fetchSchedules();
    } catch {
      toast.error("Import thất bại. Kiểm tra định dạng file Excel.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedStoreId) return;
    try {
      const blob = await lichLamViecService.downloadTemplate(
        selectedStoreId,
        currentYear,
        currentMonth,
      );
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

  // Calendar grid calculations
  const dayjsDate = dayjs(
    `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`,
  );
  const daysInMonth = dayjsDate.daysInMonth();
  const startWeekday = dayjsDate.day();
  const totalCells = startWeekday + daysInMonth;
  const calendarCells = Array.from({ length: totalCells }, (_, idx) => {
    if (idx < startWeekday) return null;
    return idx - startWeekday + 1;
  });
  const today = dayjs();
  const isToday = (day: number) => {
    const checkDate = dayjs(
      `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
    return checkDate.isSame(today, "day");
  };

  // Shift color palette - Better colors for each shift
  const shiftColors = [
    "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-l-blue-500",
    "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-l-4 border-l-emerald-500",
    "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-l-4 border-l-amber-500",
    "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-l-4 border-l-purple-500",
    "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-l-4 border-l-rose-500",
    "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-l-4 border-l-cyan-500",
  ];

  const getShiftColor = (shiftId: number) => {
    const idx = shifts.findIndex((s) => s.id === shiftId);
    return shiftColors[idx % shiftColors.length] || shiftColors[0];
  };

  // Day detail modal data
  const selectedDayShifts = selectedDay ? getDayShiftSummary(selectedDay) : [];

  const selectedDateKey = selectedDay
    ? `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : "";

  const selectedDayStatus = selectedDateKey
    ? (dayStatusByDate[selectedDateKey] ?? 1)
    : 1;

  const selectedStoreName =
    stores.find((s) => s.id === selectedStoreId)?.tenCuaHang ?? "";

  const allEmployeesInMonth = storeEmployees;

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-28 h-72 w-72 rounded-full bg-linear-to-br from-rose-200/40 via-orange-100/40 to-transparent blur-2xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-linear-to-br from-emerald-200/30 via-teal-100/30 to-transparent blur-2xl" />
      </div>
      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-5 bg-linear-to-r from-section via-card to-section rounded-3xl border border-subtle p-6 lg:p-8 shadow-sm">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-subtle bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted">
              Bang dieu phoi lich lam viec
            </div>
            <h1 className="mt-4 text-3xl font-bold text-foreground flex items-center gap-3 font-sans tracking-tight">
              <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-accent to-accent/60 flex items-center justify-center shadow-sm">
                <FiCalendar className="text-white" size={22} />
              </div>
              Quản lý lịch làm việc
            </h1>
            <p className="text-sm text-muted mt-3 leading-relaxed">
              Theo dõi ca làm, cập nhật trạng thái ngày và điều phối nhân viên
              theo từng cửa hàng trong tháng.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-subtle bg-card/80 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-widest text-muted">
                Thang hien tai
              </p>
              <p className="text-lg font-bold text-foreground">
                {currentMonth}/{currentYear}
              </p>
            </div>
            <div className="rounded-2xl border border-subtle bg-card/80 px-4 py-3 shadow-sm min-w-48">
              <p className="text-[11px] uppercase tracking-widest text-muted">
                Cua hang
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {selectedStoreName || "Chua chon"}
              </p>
            </div>
          </div>
        </div>

        {/* Store Selector */}
        <div className="bg-card rounded-3xl border border-subtle p-6 lg:p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <label className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FiMapPin size={14} className="text-accent" />
                </div>
                Chọn cửa hàng
              </label>
              <p className="text-xs text-muted">
                Lựa chọn cửa hàng để xem và quản lý lịch làm việc theo tháng.
              </p>
            </div>
            {selectedStoreId && (
              <div className="inline-flex items-center gap-2 rounded-full border border-subtle bg-section/60 px-3 py-1 text-xs font-semibold text-muted">
                <FiCalendar size={14} />
                Dang xem thang {currentMonth}/{currentYear}
              </div>
            )}
          </div>
          {loadingStores ? (
            <Loading />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <select
                  value={selectedStoreId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedStoreId(val);
                  }}
                  className="h-12 px-4 rounded-2xl bg-section border border-subtle text-sm min-w-80 focus:outline-none focus:ring-2 focus:ring-accent/40 font-semibold"
                >
                  <option value="">-- Chọn cửa hàng --</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.tenCuaHang} — {store.diaChi}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted">
                  Chua chon? Hay bat dau bang viec chon mot chi nhanh.
                </span>
              </div>

              {/* Show buttons only if a store is selected */}
              {selectedStoreId && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-4 py-2.5 border border-subtle text-sm font-semibold rounded-2xl hover:bg-section transition duration-200"
                  >
                    <FiDownload size={16} className="text-muted" /> Tải mẫu
                    Excel
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
                    className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-2xl hover:shadow-lg transition duration-200 disabled:opacity-60"
                  >
                    <FiUpload size={16} />{" "}
                    {importing ? "Đang import..." : "Import Excel"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content: Show prompt or calendar */}
        {!selectedStoreId ? (
          <div className="bg-linear-to-br from-card via-section to-card rounded-3xl border border-subtle p-16 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <FiMapPin className="text-accent" size={32} />
            </div>
            <p className="text-foreground text-lg font-semibold">
              Vui lòng chọn cửa hàng
            </p>
            <p className="text-muted text-sm mt-2">
              để xem lịch làm việc của nhân viên
            </p>
          </div>
        ) : (
          <>
            {/* Month Navigation + Stats */}
            <div className="bg-card rounded-3xl border border-subtle p-5 lg:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevMonth}
                    className="p-3 rounded-2xl border border-subtle hover:bg-section transition duration-200"
                    title="Tháng trước"
                  >
                    <FiChevronLeft size={20} className="text-foreground" />
                  </button>
                  <div className="text-center min-w-56">
                    <h2 className="text-xl font-bold text-foreground">
                      Tháng {currentMonth}, {currentYear}
                    </h2>
                    <p className="text-xs text-muted mt-1 font-medium">
                      {selectedStoreName}
                    </p>
                  </div>
                  <button
                    onClick={nextMonth}
                    className="p-3 rounded-2xl border border-subtle hover:bg-section transition duration-200"
                    title="Tháng sau"
                  >
                    <FiChevronRight size={20} className="text-foreground" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-900/20 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                    <span className="text-sm font-semibold text-foreground">
                      {
                        new Set(
                          schedules.map((s) => s.nhanVien?.id).filter(Boolean),
                        ).size
                      }
                    </span>
                    <span className="text-xs text-muted">nhân viên</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-sm font-semibold text-foreground">
                      {new Set(schedules.map((s) => s.ngayLamViec)).size}
                    </span>
                    <span className="text-xs text-muted">ngày có lịch</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Day Status Legend */}
            <div className="bg-card rounded-2xl border border-subtle p-5 lg:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-lg bg-linear-to-br from-accent to-accent/60" />
                <p className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Chú thích trạng thái ngày
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-sky-200/80 rounded-xl border border-sky-300">
                  <div className="w-3 h-3 rounded-full bg-sky-600" />
                  <span className="text-sm font-semibold text-sky-900">
                    Ngày thường
                  </span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-200 rounded-xl border border-gray-300">
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    Ngày nghỉ
                  </span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-rose-300/80 rounded-xl border border-rose-400">
                  <div className="w-3 h-3 rounded-full bg-rose-600" />
                  <span className="text-sm font-semibold text-rose-900">
                    Ngày lễ
                  </span>
                </div>
              </div>
            </div>

            {/* Calendar */}
            {loading ? (
              <Loading />
            ) : (
              <div className="bg-card rounded-3xl border border-subtle p-4 lg:p-6 overflow-hidden shadow-sm">
                <div className="grid grid-cols-7 gap-3">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div
                      key={d}
                      className="text-center text-sm font-semibold text-muted"
                    >
                      {d}
                    </div>
                  ))}
                  {calendarCells.map((day, idx) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="h-24 md:h-28 rounded-2xl bg-white"
                        />
                      );
                    }

                    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayStatus = dayStatusByDate[dateStr];
                    const daySchedules = getSchedulesForDay(day);
                    const dayShiftSummary = getDayShiftSummary(day);
                    const employeeNames = Array.from(
                      new Set(
                        daySchedules
                          .map((s) => s.nhanVien?.tenNhanVien?.trim())
                          .filter((name): name is string => Boolean(name)),
                      ),
                    );

                    let dayStatusAttr:
                      | "festival"
                      | "workday"
                      | "offday"
                      | "none" = "none";
                    if (dayStatus === 2) {
                      dayStatusAttr = "festival";
                    } else if (dayStatus === 1) {
                      dayStatusAttr = "workday";
                    } else if (dayStatus === 0) {
                      dayStatusAttr = "offday";
                    }

                    const isDayToday = isToday(day);
                    const dayBgClass =
                      dayStatusAttr === "festival"
                        ? "bg-rose-300/80"
                        : dayStatusAttr === "offday"
                          ? "bg-gray-200"
                          : dayStatusAttr === "workday"
                            ? "bg-sky-200/80"
                            : "bg-white";

                    return (
                      <div
                        key={dateStr}
                        className={`h-24 md:h-28 rounded-2xl border border-white/60 shadow-sm flex flex-col items-center justify-start gap-1 cursor-pointer transition duration-200 p-2 ${dayBgClass} ${
                          isDayToday ? "ring-2 ring-accent/40" : ""
                        }`}
                        onClick={() => setSelectedDay(day)}
                      >
                        <span className="text-base font-semibold text-foreground">
                          {day}
                        </span>
                        {dayStatusAttr === "offday" && (
                          <span className="text-xs font-semibold text-gray-700">
                            NGHI
                          </span>
                        )}
                        {dayStatusAttr === "festival" && (
                          <span className="text-xs font-semibold text-rose-700">
                            LỄ
                          </span>
                        )}
                        {daySchedules.length > 0 && (
                          <div className="text-xs text-foreground/70 space-y-0.5">
                            {employeeNames.slice(0, 2).map((name) => (
                              <div
                                key={name}
                                className="max-w-20 truncate font-semibold"
                                title={name}
                              >
                                {name}
                              </div>
                            ))}
                            {employeeNames.length > 2 && (
                              <div className="text-[10px] text-muted font-medium">
                                +{employeeNames.length - 2} nhân viên
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="font-semibold">
                                {dayShiftSummary.length}
                              </span>
                              <span>ca</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shift Legend */}
            {shifts.length > 0 && (
              <div className="bg-card rounded-2xl border border-subtle p-5 lg:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-lg bg-linear-to-br from-accent to-accent/60" />
                  <p className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Chú thích ca làm việc
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {shifts
                    .filter((s) => s.trangThai === 1)
                    .map((s) => (
                      <div
                        key={s.id}
                        className={`px-4 py-3 rounded-xl border-l-4 transition-all hover:shadow-md ${getShiftColor(s.id)}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                              <FiClock size={14} className="text-accent" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">
                                {s.tenCaLam}
                              </p>
                              <p className="text-xs text-muted font-medium">
                                {s.gioBatDau?.slice(0, 5)} -{" "}
                                {s.gioKetThuc?.slice(0, 5)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Day Detail Modal */}
        {selectedDay !== null && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-subtle bg-linear-to-r from-section via-card to-section">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FiCalendar size={16} className="text-accent" />
                    </div>
                    <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
                      {selectedDay}/{currentMonth}/{currentYear}
                    </h2>
                  </div>
                  <p className="text-sm text-muted mt-1 font-medium">
                    {selectedStoreName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    disabled={updatingStatus}
                    onChange={(e) =>
                      handleUpdateDayStatus(Number(e.target.value))
                    }
                    value={selectedDayStatus}
                    className="h-9 px-3 border border-subtle bg-section rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 font-semibold"
                  >
                    <option value={1}>Ngày thường</option>
                    <option value={0}>Ngày nghỉ</option>
                    <option value={2}>Ngày lễ</option>
                  </select>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-2 text-muted hover:text-foreground hover:bg-section rounded-xl transition duration-200"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-6 space-y-4 flex-1">
                {/* Add Shift Action */}
                <div className="bg-linear-to-r from-accent/5 to-accent/10 p-4 border border-accent/20 rounded-2xl flex gap-2 items-center flex-wrap">
                  <select
                    value={addEmployeeId}
                    onChange={(e) => setAddEmployeeId(Number(e.target.value))}
                    className="h-10 flex-1 min-w-40 border border-subtle bg-white dark:bg-section rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {allEmployeesInMonth.map((emp) => (
                      <option key={emp!.id} value={emp!.id}>
                        {emp!.tenNhanVien}
                      </option>
                    ))}
                  </select>
                  <select
                    value={addShiftId}
                    onChange={(e) => setAddShiftId(Number(e.target.value))}
                    className="h-10 w-44 border border-subtle bg-white dark:bg-section rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <option value="">-- Chọn ca --</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tenCaLam}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      handleToggleShift(
                        Number(addEmployeeId),
                        Number(addShiftId),
                        true,
                      )
                    }
                    disabled={!addEmployeeId || !addShiftId}
                    className="h-10 px-4 bg-linear-to-r from-accent to-accent/80 text-white rounded-xl text-sm font-bold hover:shadow-lg transition duration-200 disabled:opacity-50"
                  >
                    + Thêm
                  </button>
                </div>

                {selectedDayShifts.length === 0 ? (
                  <div className="text-center py-12 text-muted">
                    <div className="w-12 h-12 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-3">
                      <FiClock size={24} className="text-muted/40" />
                    </div>
                    <p className="font-medium">Không có lịch làm việc</p>
                    <p className="text-xs mt-1">
                      Chọn nhân viên và ca để thêm lịch
                    </p>
                  </div>
                ) : (
                  selectedDayShifts.map(({ shift, employees }) => (
                    <div
                      key={shift.id}
                      className="rounded-2xl border border-subtle overflow-hidden hover:shadow-lg transition duration-200"
                    >
                      {/* Shift header */}
                      <div
                        className={`px-4 py-3 border-b border-subtle flex items-center justify-between ${getShiftColor(shift.id)}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <FiClock size={16} className="opacity-80" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">
                              {shift.tenCaLam}
                            </p>
                            <p className="text-xs opacity-80">
                              {shift.gioBatDau?.slice(0, 5)} -{" "}
                              {shift.gioKetThuc?.slice(0, 5)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold bg-black/10 px-2 py-1 rounded-full">
                          {employees.length} NV
                        </span>
                      </div>

                      {/* Employee list */}
                      <div className="divide-y divide-subtle bg-linear-to-b from-white/60 to-transparent dark:from-section/60">
                        {employees.map((emp, i) => (
                          <div
                            key={i}
                            className="px-4 py-3 flex items-center justify-between hover:bg-section/50 transition duration-200 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-linear-to-br from-accent to-accent/60 flex items-center justify-center text-white text-xs font-bold">
                                {emp.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-foreground text-sm">
                                {emp.name}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                handleToggleShift(emp.id, shift.id, false)
                              }
                              className="p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition duration-200"
                              title="Xóa khỏi ca"
                            >
                              <FiX size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
