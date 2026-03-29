"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LichLamViec,
  ChiTietLichLam,
  CaLamViec,
  NhanVien,
  DoiCa,
  LichLamViecThangResponse,
  LichLamViecThangNgay,
  LichLamViecThangNhanVienTrongNgay,
  LichLamViecThangChiTietCaLam,
} from "@/types";
import {
  lichLamViecService,
  caLamViecService,
  doiCaService,
} from "@/services/schedule.service";
import { nhanVienService } from "@/services/employee.service";
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
  const [swapReason, setSwapReason] = useState("");
  const [swapping, setSwapping] = useState(false);
  const [swapCandidates, setSwapCandidates] = useState<NhanVien[]>([]);
  const [currentNhanVienId, setCurrentNhanVienId] = useState<number>(0);
  const [daySwapHistory, setDaySwapHistory] = useState<DoiCa[]>([]);
  const [loadingSwapHistory, setLoadingSwapHistory] = useState(false);

  // Store name extracted from schedule data
  const [storeName, setStoreName] = useState("");

  // Load shifts on mount
  useEffect(() => {
    caLamViecService
      .getAll()
      .then((d) => setShifts(d ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setSwapCandidates([]);
      setCurrentNhanVienId(0);
      return;
    }

    nhanVienService
      .getAll()
      .then((d) => {
        const employees = d ?? [];
        const myEmail = (user.email ?? "").toLowerCase();

        const me =
          employees.find((emp) => emp.id === user.nhanVienId) ??
          employees.find((emp) => emp.email?.toLowerCase() === myEmail);

        const resolvedNhanVienId = user.nhanVienId ?? me?.id ?? 0;
        const resolvedCuaHangId = user.cuaHangId ?? me?.cuaHang?.id;

        setCurrentNhanVienId(resolvedNhanVienId);

        if (!resolvedNhanVienId || !resolvedCuaHangId) {
          setSwapCandidates([]);
          return;
        }

        const candidates = employees.filter(
          (emp) =>
            emp.id !== resolvedNhanVienId &&
            emp.cuaHang?.id === resolvedCuaHangId &&
            emp.trangThai === 1,
        );
        setSwapCandidates(candidates);
      })
      .catch(() => {
        setSwapCandidates([]);
      });
  }, [user]);

  // Load schedules — cuaHangId=0 triggers backend SecurityContext resolution
  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await lichLamViecService.getByCuaHangAndMonth(
        0,
        currentYear,
        currentMonth,
      );

      const monthData: LichLamViecThangResponse | null = data ?? null;
      const flattenedSchedules: LichLamViec[] = [];
      const allDetails: ChiTietLichLam[] = [];
      const lichLamMap = new Map<string, LichLamViec>();

      (monthData?.ngayLichLams ?? []).forEach(
        (dayItem: LichLamViecThangNgay) => {
          (dayItem.chiTietNhanViens ?? []).forEach(
            (nvItem: LichLamViecThangNhanVienTrongNgay) => {
              if (nvItem?.nhanVien?.id !== currentNhanVienId) {
                return;
              }

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

              (nvItem.chiTietCaLams ?? []).forEach(
                (caItem: LichLamViecThangChiTietCaLam) => {
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
                },
              );
            },
          );
        },
      );

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

      // Extract store name from first schedule
      if (finalSchedules && finalSchedules.length > 0) {
        const cuaHang = finalSchedules[0].nhanVien?.cuaHang;
        if (cuaHang?.tenCuaHang) {
          setStoreName(cuaHang.tenCuaHang);
        }
      }
    } catch {
      toast.error("Không thể tải lịch làm việc");
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth, currentNhanVienId]);

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
    if (!swapReason.trim()) {
      toast.error("Vui lòng nhập lý do đổi ca");
      return;
    }
    try {
      setSwapping(true);
      await doiCaService.create({
        lichLamViec: { id: swapTarget.llvId },
        chiTietLichLam: { id: swapTarget.ctId },
        nhanVienNhanCa: { id: Number(swapToEmpId) },
        trangThai: 0,
        lyDo: swapReason.trim(),
      });
      toast.success("Đã gửi yêu cầu đổi ca! Chờ Admin duyệt.");
      setSwapTarget(null);
      setSwapToEmpId("");
      setSwapReason("");
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

  useEffect(() => {
    const fetchDaySwapHistory = async () => {
      if (selectedDay === null) {
        setDaySwapHistory([]);
        return;
      }

      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
      const daySchedules = schedules.filter((s) => s.ngayLamViec === dateStr);
      if (daySchedules.length === 0) {
        setDaySwapHistory([]);
        return;
      }

      try {
        setLoadingSwapHistory(true);
        const scheduleIds = Array.from(
          new Set(daySchedules.map((s) => s.id).filter(Boolean)),
        );

        const results = await Promise.all(
          scheduleIds.map((id) => doiCaService.getByLichLamViec(id)),
        );

        const merged = results.flat().filter(Boolean);
        const deduped = Array.from(
          new Map(merged.map((item) => [item.id, item])).values(),
        );
        deduped.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        setDaySwapHistory(deduped);
      } catch {
        setDaySwapHistory([]);
      } finally {
        setLoadingSwapHistory(false);
      }
    };

    fetchDaySwapHistory();
  }, [selectedDay, schedules, currentYear, currentMonth]);

  // All unique employees in this month (for swap target dropdown)
  const allEmployeesInMonth = Array.from(
    new Map(swapCandidates.map((nv) => [nv.id, nv])).values(),
  ).sort((a, b) => (a.tenNhanVien || "").localeCompare(b.tenNhanVien || ""));

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
                  new Set(schedules.map((s) => s.nhanVien?.id).filter(Boolean))
                    .size
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
            <span className="text-sm font-semibold text-rose-900">Ngày lễ</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
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
            {Array.from({ length: totalCells }).map((_, idx) => {
              const day = idx - firstDay + 1;
              const isValidDay = day >= 1 && day <= daysInMonth;
              const dayShifts = isValidDay ? getDayShiftSummary(day) : [];
              const daySchedules = isValidDay ? getSchedulesForDay(day) : [];
              const hasSchedule = daySchedules.length > 0;

              const employeeCount = new Set(
                daySchedules.map((s) => s.nhanVien?.id).filter(Boolean),
              ).size;

              const isHoliday = daySchedules.some((s) => s.trangThai === 0);
              const isFestival = daySchedules.some((s) => s.trangThai === 2);

              // Check if current user is working this day
              const iAmWorking = dayShifts.some((shift) =>
                shift.employees.some((emp) => emp.id === currentNhanVienId),
              );

              const isDayToday = isToday(day);
              let dayBgClass = "bg-white";
              if (!isValidDay) {
                dayBgClass = "bg-white";
              } else if (isFestival) {
                dayBgClass = "bg-rose-300/80";
              } else if (isHoliday) {
                dayBgClass = "bg-gray-200";
              } else if (iAmWorking) {
                dayBgClass = "bg-blue-200/80";
              } else if (hasSchedule) {
                dayBgClass = "bg-sky-200/60";
              }

              return (
                <div
                  key={idx}
                  className={`h-24 md:h-28 rounded-2xl border border-white/60 shadow-sm flex flex-col items-center justify-start gap-1 cursor-pointer transition duration-200 p-2 ${dayBgClass} ${
                    isDayToday ? "ring-2 ring-accent/40" : ""
                  }`}
                  onClick={() => {
                    if (isValidDay && hasSchedule) setSelectedDay(day);
                  }}
                >
                  {isValidDay && (
                    <>
                      <span className="text-base font-semibold text-foreground">
                        {day}
                      </span>
                      {/* {isHoliday && (
                        <span className="text-xs font-semibold text-gray-700">
                          NGHI
                        </span>
                      )}
                      {isFestival && (
                        <span className="text-xs font-semibold text-rose-700">
                          LỄ
                        </span>
                      )} */}
                      {iAmWorking && (
                        <span className="text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded">
                          CA TÔI
                        </span>
                      )}
                      {hasSchedule && (
                        <div className="text-xs text-foreground/70 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">
                              {employeeCount}
                            </span>
                            <span>NV</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">
                              {dayShifts.length}
                            </span>
                            <span>ca</span>
                          </div>
                        </div>
                      )}
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
                  setSwapReason("");
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
                                  Chọn nhân viên bạn muốn đổi ca &quot;
                                  {shift.tenCaLam}&quot;:
                                </p>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={swapToEmpId}
                                    onChange={(e) =>
                                      setSwapToEmpId(
                                        e.target.value
                                          ? Number(e.target.value)
                                          : "",
                                      )
                                    }
                                    className="flex-1 h-9 text-sm border border-amber-200 dark:border-amber-700/50 bg-white dark:bg-card rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                                  >
                                    <option value="">
                                      -- Chọn nhân viên --
                                    </option>
                                    {allEmployeesInMonth
                                      .filter((e) => e.id !== currentNhanVienId)
                                      .map((e) => (
                                        <option key={e.id} value={e.id}>
                                          {e.tenNhanVien}
                                        </option>
                                      ))}
                                  </select>
                                  <input
                                    value={swapReason}
                                    onChange={(e) =>
                                      setSwapReason(e.target.value)
                                    }
                                    placeholder="Nhập lý do đổi ca"
                                    className="flex-1 h-9 text-sm border border-amber-200 dark:border-amber-700/50 bg-white dark:bg-card rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                                  />
                                  <button
                                    onClick={handleSwapSubmit}
                                    disabled={
                                      !swapToEmpId ||
                                      !swapReason.trim() ||
                                      swapping
                                    }
                                    className="h-9 px-4 text-sm font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition shadow-sm"
                                  >
                                    {swapping ? "Đang gửi..." : "Gửi"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSwapTarget(null);
                                      setSwapToEmpId("");
                                      setSwapReason("");
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

              <div className="rounded-xl border border-subtle overflow-hidden">
                <div className="px-4 py-3 bg-section border-b border-subtle">
                  <h3 className="font-semibold text-sm text-foreground">
                    Lịch sử đổi ca trong ngày
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {loadingSwapHistory ? (
                    <p className="text-sm text-muted">
                      Đang tải lịch sử đổi ca...
                    </p>
                  ) : daySwapHistory.length === 0 ? (
                    <p className="text-sm text-muted">
                      Chưa có yêu cầu đổi ca nào trong ngày này.
                    </p>
                  ) : (
                    daySwapHistory.map((item) => {
                      const statusColor =
                        item.trangThai === 1
                          ? "bg-green-100 text-green-700"
                          : item.trangThai === 2
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700";
                      const statusText =
                        item.trangThai === 1
                          ? "Đồng ý"
                          : item.trangThai === 2
                            ? "Từ chối"
                            : "Chờ duyệt";

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-subtle p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              Yêu cầu #{item.id}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}
                            >
                              {statusText}
                            </span>
                          </div>
                          <p className="text-xs text-muted">
                            Nhân viên nhận ca:{" "}
                            <span className="font-medium text-foreground">
                              {item.nhanVienNhanCa?.tenNhanVien ?? "—"}
                            </span>
                          </p>
                          <p className="text-xs text-muted">
                            Lý do:{" "}
                            <span className="font-medium text-foreground">
                              {item.lyDo || "—"}
                            </span>
                          </p>
                          {item.trangThai === 2 && (
                            <p className="text-xs text-muted">
                              Phản hồi:{" "}
                              <span className="font-medium text-foreground">
                                {item.phanHoi || "—"}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
