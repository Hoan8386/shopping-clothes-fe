"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { LichLamViec, ChiTietLichLam, CaLamViec, CuaHang } from "@/types";
import {
  lichLamViecService,
  chiTietLichLamService,
  caLamViecService,
} from "@/services/schedule.service";
import { cuaHangService } from "@/services/common.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiUpload,
  FiDownload,
  FiX,
  FiCalendar,
  FiUsers,
  FiClock,
  FiMapPin,
} from "react-icons/fi";

const DAYS_VI = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export default function AdminLichLamViecPage() {
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const [schedules, setSchedules] = useState<LichLamViec[]>([]);
  const [shifts, setShifts] = useState<CaLamViec[]>([]);
  const [details, setDetails] = useState<ChiTietLichLam[]>([]);
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
      await lichLamViecService.updateDayStatus(selectedStoreId, dateStr, status);
      toast.success("Cập nhật trạng thái thành công");
      await fetchSchedules();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleShift = async (empId: number, shiftId: number, isAdd: boolean) => {
    if (!selectedStoreId || !selectedDay) return;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    try {
      if (isAdd) {
        await lichLamViecService.addShift(selectedStoreId, empId, shiftId, dateStr);
      } else {
        await lichLamViecService.removeShift(selectedStoreId, empId, shiftId, dateStr);
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
      const data = await lichLamViecService.getByCuaHangAndMonth(
        selectedStoreId,
        currentYear,
        currentMonth
      );
      setSchedules(data ?? []);

      // Load all schedule details in parallel
      const detailResults = await Promise.all(
        (data ?? []).map((lich) =>
          chiTietLichLamService.getByLichLamViec(lich.id).catch(() => [] as ChiTietLichLam[])
        )
      );
      setDetails(detailResults.flat());
    } catch {
      toast.error("Không thể tải lịch làm việc");
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, currentYear, currentMonth]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

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
    const shiftMap = new Map<number, { shift: CaLamViec; employees: { id: number; name: string }[] }>();

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
      const result = await lichLamViecService.importExcel(selectedStoreId, file);
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
      const blob = await lichLamViecService.downloadTemplate(selectedStoreId, currentYear, currentMonth);
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
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === currentYear &&
    today.getMonth() + 1 === currentMonth &&
    today.getDate() === day;

  // Shift color palette
  const shiftColors = [
    "bg-white/90 dark:bg-black/40 text-blue-700 dark:text-blue-300 border-l-4 border-l-blue-500",
    "bg-white/90 dark:bg-black/40 text-emerald-700 dark:text-emerald-300 border-l-4 border-l-emerald-500",
    "bg-white/90 dark:bg-black/40 text-amber-700 dark:text-amber-300 border-l-4 border-l-amber-500",
    "bg-white/90 dark:bg-black/40 text-purple-700 dark:text-purple-300 border-l-4 border-l-purple-500",
    "bg-white/90 dark:bg-black/40 text-rose-700 dark:text-rose-300 border-l-4 border-l-rose-500",
    "bg-white/90 dark:bg-black/40 text-cyan-700 dark:text-cyan-300 border-l-4 border-l-cyan-500",
  ];

  const getShiftColor = (shiftId: number) => {
    const idx = shifts.findIndex((s) => s.id === shiftId);
    return shiftColors[idx % shiftColors.length] || shiftColors[0];
  };

  // Day detail modal data
  const selectedDaySchedules = selectedDay ? getSchedulesForDay(selectedDay) : [];
  const selectedDayShifts = selectedDay ? getDayShiftSummary(selectedDay) : [];

  const selectedStoreName = stores.find((s) => s.id === selectedStoreId)?.tenCuaHang ?? "";
  
  const allEmployeesInMonth = Array.from(
    new Map(
      schedules
        .map((s) => s.nhanVien)
        .filter(Boolean)
        .map((nv) => [nv!.id, nv])
    ).values()
  ).sort((a, b) => (a!.tenNhanVien || "").localeCompare(b!.tenNhanVien || ""));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FiCalendar className="text-accent" size={20} />
            Quản lý lịch làm việc
          </h1>
          <p className="text-sm text-muted mt-1">
            Chọn cửa hàng để xem lịch làm việc nhân viên theo tháng.
          </p>
        </div>
      </div>

      {/* Store Selector */}
      <div className="bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <FiMapPin size={14} className="text-accent" />
          Chọn cửa hàng
        </label>
        {loadingStores ? (
          <Loading />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <select
              value={selectedStoreId ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setSelectedStoreId(val);
              }}
              className="h-10 px-3 rounded-lg bg-section border border-subtle text-sm min-w-72 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="">-- Chọn cửa hàng --</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.tenCuaHang} — {store.diaChi}
                </option>
              ))}
            </select>
            
            {/* Show buttons only if a store is selected */}
            {selectedStoreId && (
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content: Show prompt or calendar */}
      {!selectedStoreId ? (
        <div className="bg-card rounded-2xl border border-subtle p-16 text-center">
          <FiMapPin className="mx-auto text-muted mb-3" size={40} />
          <p className="text-muted text-lg font-medium">Vui lòng chọn cửa hàng để xem lịch làm việc</p>
        </div>
      ) : (
        <>
          {/* Month Navigation + Stats */}
          <div className="bg-card rounded-2xl border border-subtle p-4 lg:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg border border-subtle hover:bg-section transition"
                >
                  <FiChevronLeft size={18} />
                </button>
                <div className="text-center min-w-48">
                  <h2 className="text-lg font-bold text-foreground">
                    Tháng {currentMonth}, {currentYear}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">{selectedStoreName}</p>
                </div>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg border border-subtle hover:bg-section transition"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted">
                  <FiUsers size={14} />
                  <span className="font-semibold text-foreground">
                    {new Set(schedules.map((s) => s.nhanVien?.id).filter(Boolean)).size}
                  </span>{" "}
                  nhân viên
                </div>
                <div className="flex items-center gap-1.5 text-muted">
                  <FiCalendar size={14} />
                  <span className="font-semibold text-foreground">
                    {new Set(schedules.map((s) => s.ngayLamViec)).size}
                  </span>{" "}
                  ngày có lịch
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <Loading />
          ) : (
            <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-subtle">
                {DAYS_VI.map((d, i) => (
                  <div
                    key={d}
                    className={`py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                      i >= 5 ? "text-red-500" : "text-muted"
                    } bg-section border-r border-subtle last:border-r-0`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const day = idx - firstDay + 1;
                  const isValidDay = day >= 1 && day <= daysInMonth;
                  const dayShifts = isValidDay ? getDayShiftSummary(day) : [];
                  const daySchedules = isValidDay ? getSchedulesForDay(day) : [];
                  const hasSchedule = daySchedules.length > 0;
                  
                  const totalWorkingEmployees = new Set(
                    dayShifts.flatMap(s => s.employees)
                  ).size;
                  
                  const isHoliday = daySchedules.some(s => s.trangThai === 0);
                  const isFestival = daySchedules.some(s => s.trangThai === 2);

                  let cellBgClass = "bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-section/50";
                  if (!isValidDay) {
                    cellBgClass = "bg-section/30";
                  } else if (isFestival) {
                    cellBgClass = "bg-red-200 dark:bg-red-900/50 hover:bg-red-300 dark:hover:bg-red-800/60 cursor-pointer";
                  } else if (isHoliday) {
                    cellBgClass = "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer";
                  } else if (hasSchedule) {
                    cellBgClass = "bg-blue-200 dark:bg-blue-900/40 hover:bg-blue-300 dark:hover:bg-blue-800/60 cursor-pointer";
                  }

                  return (
                    <div
                      key={idx}
                      className={`min-h-28 lg:min-h-32 border-r border-b border-subtle last:border-r-0 p-1.5 lg:p-2 transition-colors ${cellBgClass}`}
                      onClick={() => {
                        if (isValidDay && hasSchedule) setSelectedDay(day);
                      }}
                    >
                      {isValidDay && (
                        <>
                          {/* Day number */}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full ${
                                  isToday(day)
                                    ? "bg-accent text-white"
                                    : idx % 7 >= 5
                                      ? "text-red-500"
                                      : "text-foreground"
                                }`}
                              >
                                {day}
                              </span>
                              {isHoliday && (
                                <span className="text-[9px] font-bold text-white bg-gray-500 px-1.5 py-0.5 rounded-sm shadow-sm" title="Ngày nghỉ">
                                  NGHỈ
                                </span>
                              )}
                              {isFestival && (
                                <span className="text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-sm shadow-sm" title="Ngày lễ">
                                  LỄ
                                </span>
                              )}
                            </div>
                            
                            {totalWorkingEmployees > 0 && (
                              <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium">
                                {totalWorkingEmployees} NV
                              </span>
                            )}
                          </div>

                          {/* Shift chips */}
                          <div className="mt-1.5 flex flex-col gap-1">
                            {dayShifts.slice(0, 3).map(({ shift, employees }) => (
                              <div
                                key={shift.id}
                                className={`flex items-center justify-between text-[10px] lg:text-[11px] px-1.5 py-0.5 rounded shadow-sm font-semibold tracking-tight ${getShiftColor(shift.id)}`}
                                title={`${shift.tenCaLam}: ${employees.map(e => e.name).join(", ")}`}
                              >
                                <span className="truncate max-w-[65%]">{shift.tenCaLam}</span>
                                <span className="opacity-80 flex-shrink-0">{employees.length} NV</span>
                              </div>
                            ))}
                            {dayShifts.length > 3 && (
                              <div className="text-[10px] font-medium text-foreground/60 text-center bg-black/5 dark:bg-white/10 rounded py-0.5">
                                +{dayShifts.length - 3} ca khác
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shift Legend */}
          {shifts.length > 0 && (
            <div className="bg-card rounded-2xl border border-subtle p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Chú thích ca làm
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {shifts
                  .filter((s) => s.trangThai === 1)
                  .map((s) => (
                    <div
                      key={s.id}
                      className={`text-xs px-3 py-1.5 rounded-lg shadow-sm font-medium flex items-center gap-2 border-[0.5px] border-black/5 dark:border-white/5 ${getShiftColor(s.id)}`}
                    >
                      <FiClock size={13} className="opacity-70" />
                      <span>
                        {s.tenCaLam} <span className="opacity-70 ml-1 font-normal">({s.gioBatDau?.slice(0, 5)} - {s.gioKetThuc?.slice(0, 5)})</span>
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Day Detail Modal */}
      {selectedDay !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-subtle">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
                  Ngày {selectedDay}/{currentMonth}/{currentYear}
                  {selectedDaySchedules.some(s => s.trangThai === 0) && (
                    <span className="text-xs font-bold text-white bg-gray-500 px-2 py-0.5 rounded-md">NGÀY NGHỈ</span>
                  )}
                  {selectedDaySchedules.some(s => s.trangThai === 2) && (
                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-md">NGÀY LỄ</span>
                  )}
                </h2>
                <p className="text-sm text-muted mt-0.5">{selectedStoreName}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  disabled={updatingStatus}
                  onChange={(e) => handleUpdateDayStatus(Number(e.target.value))}
                  value={selectedDaySchedules[0]?.trangThai ?? 1}
                  className="h-9 px-3 border border-subtle bg-section rounded-lg text-sm focus:outline-none"
                >
                  <option value={1}>Ngày thường</option>
                  <option value={0}>Ngày nghỉ</option>
                  <option value={2}>Ngày lễ</option>
                </select>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-2 text-muted hover:text-foreground hover:bg-section rounded-lg transition"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {/* Add Shift Action */}
              <div className="bg-section/30 p-4 border border-subtle rounded-xl flex gap-3 
items-center flex-wrap">
                <select
                  value={addEmployeeId}
                  onChange={(e) => setAddEmployeeId(Number(e.target.value))}
                  className="h-9 flex-1 min-w-[140px] border border-subtle bg-card rounded-lg px-2 text-sm"
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
                  className="h-9 w-32 border border-subtle bg-card rounded-lg px-2 text-sm"
                >
                  <option value="">-- Chọn ca --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tenCaLam}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleToggleShift(Number(addEmployeeId), Number(addShiftId), true)}
                  disabled={!addEmployeeId || !addShiftId}
                  className="h-9 px-4 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition"
                >
                  Thêm
                </button>
              </div>

              {selectedDayShifts.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <FiCalendar className="mx-auto mb-2" size={32} />
                  <p>Không có nhân viên đi làm ca trong ngày này</p>
                </div>
              ) : (
                selectedDayShifts.map(({ shift, employees }) => (
                  <div
                    key={shift.id}
                    className="rounded-xl border border-subtle overflow-hidden"
                  >
                    {/* Shift header */}
                    <div
                      className={`px-4 py-3 border-b border-subtle flex items-center justify-between shadow-sm ${getShiftColor(shift.id)}`}
                    >
                      <div className="flex items-center gap-2">
                        <FiClock size={14} className="opacity-80" />
                        <span className="font-bold text-sm tracking-wide">{shift.tenCaLam}</span>
                      </div>
                      <span className="text-xs font-semibold opacity-80 bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md">
                        {shift.gioBatDau?.slice(0, 5)} - {shift.gioKetThuc?.slice(0, 5)}
                      </span>
                    </div>

                    {/* Employee list */}
                    <div className="divide-y divide-subtle">
                      {employees.map((emp, i) => (
                        <div
                          key={i}
                          className="px-4 py-2.5 flex items-center justify-between text-sm hover:bg-section/50 transition group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{emp.name}</span>
                          </div>
                          <button
                            onClick={() => handleToggleShift(emp.id, shift.id, false)}
                            className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition"
                            title="Xóa khỏi ca"
                          >
                            <FiX size={15} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Employee count */}
                    <div className="px-4 py-2 bg-section/50 text-xs text-muted">
                      Tổng: {employees.length} nhân viên
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
