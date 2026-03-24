"use client";

import { useEffect, useState, useCallback } from "react";
import { LichLamViec, ChiTietLichLam, CaLamViec, NhanVien } from "@/types";
import {
  lichLamViecService,
  chiTietLichLamService,
  caLamViecService,
  doiCaService,
} from "@/services/schedule.service";
import { useAuthStore } from "@/store/auth.store";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCalendar,
  FiUsers,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";

const DAYS_VI = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export default function StaffLichLamViecPage() {
  const { user } = useAuthStore();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const [schedules, setSchedules] = useState<LichLamViec[]>([]);
  const [shifts, setShifts] = useState<CaLamViec[]>([]);
  const [details, setDetails] = useState<ChiTietLichLam[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Shift swap state
  const [swapTarget, setSwapTarget] = useState<{
    llvId: number;
    ctId: number;
    shiftName: string;
  } | null>(null);
  const [swapToEmpId, setSwapToEmpId] = useState<number | "">(""); 
  const [swapping, setSwapping] = useState(false);

  // Store name extracted from schedule data
  const [storeName, setStoreName] = useState("");

  // The current logged-in employee's ID
  const currentNhanVienId = user?.id ?? 0;

  // Load shifts on mount
  useEffect(() => {
    caLamViecService
      .getAll()
      .then((d) => setShifts(d ?? []))
      .catch(() => {});
  }, []);

  // Load schedules — cuaHangId=0 triggers backend SecurityContext resolution
  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await lichLamViecService.getByCuaHangAndMonth(
        0,
        currentYear,
        currentMonth
      );
      setSchedules(data ?? []);

      // Extract store name from first schedule
      if (data && data.length > 0) {
        const cuaHang = data[0].nhanVien?.cuaHang;
        if (cuaHang && (cuaHang as any).tenCuaHang) {
          setStoreName((cuaHang as any).tenCuaHang);
        }
      }

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
  }, [currentYear, currentMonth]);

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

  // Get unique shift summaries for a day (with llvId + ctId for swap)
  const getDayShiftSummary = (day: number) => {
    const daySchedules = getSchedulesForDay(day);
    const shiftMap = new Map<
      number,
      {
        shift: CaLamViec;
        employees: { id: number; name: string; llvId: number; ctId: number }[];
      }
    >();

    for (const sch of daySchedules) {
      const schDetails = getDetailsForSchedule(sch.id);
      for (const det of schDetails) {
        if (det.caLamViec) {
          const existing = shiftMap.get(det.caLamViec.id);
          const empName = sch.nhanVien?.tenNhanVien ?? "—";
          const empId = sch.nhanVien?.id ?? 0;
          const entry = {
            id: empId,
            name: empName,
            llvId: sch.id,
            ctId: det.id ?? 0,
          };
          if (existing) {
            if (!existing.employees.some((e) => e.id === empId)) {
              existing.employees.push(entry);
            }
          } else {
            shiftMap.set(det.caLamViec.id, {
              shift: det.caLamViec,
              employees: [entry],
            });
          }
        }
      }
    }

    return Array.from(shiftMap.values());
  };

  // Handle shift swap request
  const handleSwapSubmit = async () => {
    if (!swapTarget || !swapToEmpId) return;
    try {
      setSwapping(true);
      await doiCaService.create({
        lichLamViec: { id: swapTarget.llvId },
        chiTietLichLam: { id: swapTarget.ctId },
        nhanVienNhanCa: { id: Number(swapToEmpId) },
        trangThai: 0,
      });
      toast.success("Đã gửi yêu cầu đổi ca! Chờ Admin duyệt.");
      setSwapTarget(null);
      setSwapToEmpId("");
    } catch {
      toast.error("Không thể gửi yêu cầu đổi ca");
    } finally {
      setSwapping(false);
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

  // Shift color palette (same as admin)
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
  const selectedDaySchedules = selectedDay
    ? getSchedulesForDay(selectedDay)
    : [];
  const selectedDayShifts = selectedDay ? getDayShiftSummary(selectedDay) : [];

  // All unique employees in this month (for swap target dropdown)
  const allEmployeesInMonth = Array.from(
    new Map(
      schedules
        .map((s) => s.nhanVien)
        .filter(Boolean)
        .map((nv) => [nv!.id, nv])
    ).values()
  ).sort((a, b) =>
    (a!.tenNhanVien || "").localeCompare(b!.tenNhanVien || "")
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FiCalendar className="text-accent" size={20} />
            Lịch làm việc
          </h1>
          <p className="text-sm text-muted mt-1">
            Xem lịch làm việc của cửa hàng và đổi ca khi cần.
          </p>
        </div>
        {storeName && (
          <div className="text-sm text-muted bg-section px-3 py-1.5 rounded-lg border border-subtle">
            🏪 {storeName}
          </div>
        )}
      </div>

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
              {storeName && (
                <p className="text-xs text-muted mt-0.5">{storeName}</p>
              )}
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
                {
                  new Set(
                    schedules.map((s) => s.nhanVien?.id).filter(Boolean)
                  ).size
                }
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
                dayShifts.flatMap((s) => s.employees.map((e) => e.id))
              ).size;

              const isHoliday = daySchedules.some((s) => s.trangThai === 0);
              const isFestival = daySchedules.some((s) => s.trangThai === 2);

              // Check if current user is working this day
              const iAmWorking = dayShifts.some((shift) =>
                shift.employees.some((emp) => emp.id === currentNhanVienId)
              );

              let cellBgClass =
                "bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-section/50";
              if (!isValidDay) {
                cellBgClass = "bg-section/30";
              } else if (isFestival) {
                cellBgClass =
                  "bg-red-200 dark:bg-red-900/50 hover:bg-red-300 dark:hover:bg-red-800/60 cursor-pointer";
              } else if (isHoliday) {
                cellBgClass =
                  "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer";
              } else if (iAmWorking) {
                cellBgClass =
                  "bg-blue-200 dark:bg-blue-900/40 hover:bg-blue-300 dark:hover:bg-blue-800/60 cursor-pointer ring-2 ring-inset ring-blue-400/50";
              } else if (hasSchedule) {
                cellBgClass =
                  "bg-blue-100/50 dark:bg-blue-900/20 hover:bg-blue-200/60 dark:hover:bg-blue-800/40 cursor-pointer";
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
                            <span
                              className="text-[9px] font-bold text-white bg-gray-500 px-1.5 py-0.5 rounded-sm shadow-sm"
                              title="Ngày nghỉ"
                            >
                              NGHỈ
                            </span>
                          )}
                          {isFestival && (
                            <span
                              className="text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-sm shadow-sm"
                              title="Ngày lễ"
                            >
                              LỄ
                            </span>
                          )}
                        </div>

                        {iAmWorking && (
                          <span className="text-[9px] bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded shadow-sm">
                            CA TÔI
                          </span>
                        )}
                      </div>

                      {totalWorkingEmployees > 0 && (
                        <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium">
                          {totalWorkingEmployees} NV
                        </span>
                      )}

                      {/* Shift chips */}
                      <div className="mt-1.5 flex flex-col gap-1">
                        {dayShifts.slice(0, 3).map(({ shift, employees }) => (
                          <div
                            key={shift.id}
                            className={`flex items-center justify-between text-[10px] lg:text-[11px] px-1.5 py-0.5 rounded shadow-sm font-semibold tracking-tight ${getShiftColor(shift.id)}`}
                            title={`${shift.tenCaLam}: ${employees.map((e) => e.name).join(", ")}`}
                          >
                            <span className="truncate max-w-[65%]">
                              {shift.tenCaLam}
                            </span>
                            <span className="opacity-80 flex-shrink-0">
                              {employees.length} NV
                            </span>
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
                    {s.tenCaLam}{" "}
                    <span className="opacity-70 ml-1 font-normal">
                      ({s.gioBatDau?.slice(0, 5)} - {s.gioKetThuc?.slice(0, 5)}
                      )
                    </span>
                  </span>
                </div>
              ))}
          </div>
        </div>
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
                  {selectedDaySchedules.some((s) => s.trangThai === 0) && (
                    <span className="text-xs font-bold text-white bg-gray-500 px-2 py-0.5 rounded-md">
                      NGÀY NGHỈ
                    </span>
                  )}
                  {selectedDaySchedules.some((s) => s.trangThai === 2) && (
                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-md">
                      NGÀY LỄ
                    </span>
                  )}
                </h2>
                {storeName && (
                  <p className="text-sm text-muted mt-0.5">{storeName}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedDay(null);
                  setSwapTarget(null);
                  setSwapToEmpId("");
                }}
                className="p-2 text-muted hover:text-foreground hover:bg-section rounded-lg transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
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
                        <span className="font-bold text-sm tracking-wide">
                          {shift.tenCaLam}
                        </span>
                      </div>
                      <span className="text-xs font-semibold opacity-80 bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md">
                        {shift.gioBatDau?.slice(0, 5)} -{" "}
                        {shift.gioKetThuc?.slice(0, 5)}
                      </span>
                    </div>

                    {/* Employee list */}
                    <div className="divide-y divide-subtle">
                      {employees.map((emp, i) => {
                        const isMe = emp.id === currentNhanVienId;
                        const isSwapping =
                          swapTarget?.ctId === emp.ctId && isMe;

                        return (
                          <div key={i} className="flex flex-col">
                            <div
                              className={`px-4 py-2.5 flex items-center justify-between text-sm transition group ${
                                isMe
                                  ? "bg-blue-50/50 dark:bg-blue-900/10"
                                  : "hover:bg-section/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isMe ? (
                                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-xs font-bold">
                                    ME
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                                    {emp.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span
                                  className={`font-medium ${isMe ? "text-blue-600 dark:text-blue-300" : "text-foreground"}`}
                                >
                                  {emp.name}
                                  {isMe && (
                                    <span className="ml-1.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                      BẠN
                                    </span>
                                  )}
                                </span>
                              </div>

                              {isMe && !isSwapping && (
                                <button
                                  onClick={() =>
                                    setSwapTarget({
                                      llvId: emp.llvId,
                                      ctId: emp.ctId,
                                      shiftName: shift.tenCaLam,
                                    })
                                  }
                                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/40 transition rounded-lg"
                                >
                                  <FiRefreshCw size={12} />
                                  Đổi ca
                                </button>
                              )}
                            </div>

                            {/* Swap inline form */}
                            {isSwapping && (
                              <div className="px-4 py-3 bg-amber-50/80 dark:bg-amber-900/10 border-t border-amber-200/50 dark:border-amber-800/30 space-y-2">
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                  Chọn nhân viên bạn muốn đổi ca "{shift.tenCaLam}":
                                </p>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={swapToEmpId}
                                    onChange={(e) =>
                                      setSwapToEmpId(Number(e.target.value))
                                    }
                                    className="flex-1 h-9 text-sm border border-amber-200 dark:border-amber-700/50 bg-white dark:bg-card rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                                  >
                                    <option value="">
                                      -- Chọn nhân viên --
                                    </option>
                                    {allEmployeesInMonth
                                      .filter(
                                        (e) => e!.id !== currentNhanVienId
                                      )
                                      .map((e) => (
                                        <option key={e!.id} value={e!.id}>
                                          {e!.tenNhanVien}
                                        </option>
                                      ))}
                                  </select>
                                  <button
                                    onClick={handleSwapSubmit}
                                    disabled={!swapToEmpId || swapping}
                                    className="h-9 px-4 text-sm font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition shadow-sm"
                                  >
                                    {swapping ? "Đang gửi..." : "Gửi"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSwapTarget(null);
                                      setSwapToEmpId("");
                                    }}
                                    className="h-9 px-2 text-muted hover:text-red-500 transition"
                                  >
                                    <FiX size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
