"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Loading from "@/components/ui/Loading";
import { formatDate } from "@/lib/utils";
import { KiemKeHangHoa } from "@/types";
import { kiemKeHangHoaService } from "@/services/stock-check.service";
import toast from "react-hot-toast";
import { FiCheck, FiEye, FiRefreshCw, FiX } from "react-icons/fi";

const WAITING = 1;
const RECHECK = 2;
const CONFIRMED = 3;

function getStatusColor(status: number) {
  switch (status) {
    case 0:
      return "bg-gray-100 text-gray-700";
    case 1:
      return "bg-yellow-100 text-yellow-800";
    case 2:
      return "bg-orange-100 text-orange-800";
    case 3:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminStockChecksPage() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<KiemKeHangHoa[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<KiemKeHangHoa | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<number | "ALL">("ALL");
  const [filterStoreId, setFilterStoreId] = useState<number | "ALL">("ALL");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  const waitingCount = useMemo(
    () => checks.filter((item) => item.trangThai === WAITING).length,
    [checks],
  );

  const storeOptions = useMemo(
    () =>
      Array.from(
        new Map(
          checks
            .filter((item) => item.cuaHang?.id && item.cuaHang?.tenCuaHang)
            .map((item) => [item.cuaHang!.id, item.cuaHang!.tenCuaHang]),
        ),
      ).map(([id, tenCuaHang]) => ({ id, tenCuaHang })),
    [checks],
  );

  const filteredChecks = useMemo(() => {
    return checks.filter((item) => {
      if (filterStatus !== "ALL" && item.trangThai !== filterStatus) {
        return false;
      }

      if (filterStoreId !== "ALL" && item.cuaHang?.id !== filterStoreId) {
        return false;
      }

      if (filterFromDate || filterToDate) {
        if (!item.ngayKiemKe) {
          return false;
        }

        const itemDate = new Date(item.ngayKiemKe);
        if (Number.isNaN(itemDate.getTime())) {
          return false;
        }

        if (filterFromDate) {
          const from = new Date(`${filterFromDate}T00:00:00`);
          if (itemDate < from) {
            return false;
          }
        }

        if (filterToDate) {
          const to = new Date(`${filterToDate}T23:59:59`);
          if (itemDate > to) {
            return false;
          }
        }
      }

      return true;
    });
  }, [checks, filterStatus, filterStoreId, filterFromDate, filterToDate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await kiemKeHangHoaService.getAll();
      setChecks(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách phiếu kiểm kê");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDetail = async (id: number) => {
    try {
      const data = await kiemKeHangHoaService.getById(id);
      setSelected(data);
      setShowDetail(true);
    } catch {
      toast.error("Không thể tải chi tiết phiếu kiểm kê");
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Xác nhận duyệt phiếu kiểm kê này và cập nhật tồn kho?"))
      return;

    try {
      setProcessingId(id);
      await kiemKeHangHoaService.duyet(id, "XAC_NHAN");
      toast.success("Đã duyệt phiếu và cập nhật tồn kho");
      fetchData();
      if (selected?.id === id) {
        const refreshed = await kiemKeHangHoaService.getById(id);
        setSelected(refreshed);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Duyệt phiếu thất bại";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestRecheck = async (id: number) => {
    const lyDo = window.prompt("Nhập lý do yêu cầu kiểm kê lại:");
    if (!lyDo || !lyDo.trim()) {
      toast.error("Lý do không được để trống");
      return;
    }

    try {
      setProcessingId(id);
      await kiemKeHangHoaService.duyet(id, "YEU_CAU_KIEM_KE_LAI", lyDo.trim());
      toast.success("Đã gửi yêu cầu kiểm kê lại");
      fetchData();
      if (selected?.id === id) {
        const refreshed = await kiemKeHangHoaService.getById(id);
        setSelected(refreshed);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể yêu cầu kiểm kê lại";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Tổng phiếu
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {checks.length}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Chờ duyệt
          </p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {waitingCount}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Đã xác nhận
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {checks.filter((item) => item.trangThai === 3).length}
          </p>
        </div>
      </div>

      <div className="bg-card border border-subtle rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Trạng thái</label>
          <select
            value={String(filterStatus)}
            onChange={(e) =>
              setFilterStatus(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value),
              )
            }
            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">Tất cả</option>
            <option value={WAITING}>Chờ duyệt</option>
            <option value={RECHECK}>Yêu cầu kiểm kê lại</option>
            <option value={CONFIRMED}>Đã xác nhận</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Cửa hàng</label>
          <select
            value={String(filterStoreId)}
            onChange={(e) =>
              setFilterStoreId(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value),
              )
            }
            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">Tất cả cửa hàng</option>
            {storeOptions.map((store) => (
              <option key={store.id} value={store.id}>
                {store.tenCuaHang}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Từ ngày</label>
          <input
            type="date"
            value={filterFromDate}
            onChange={(e) => setFilterFromDate(e.target.value)}
            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Đến ngày</label>
          <input
            type="date"
            value={filterToDate}
            onChange={(e) => setFilterToDate(e.target.value)}
            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-225">
            <thead className="bg-section border-b border-subtle">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Tên phiếu
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Cửa hàng
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Người tạo
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Ngày kiểm kê
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
              {filteredChecks.map((item) => (
                <tr key={item.id} className="hover:bg-section transition">
                  <td className="px-4 py-3 font-semibold">#{item.id}</td>
                  <td className="px-4 py-3 text-foreground font-medium max-w-64 truncate">
                    {item.tenPhieuKiemKe}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {item.cuaHang?.tenCuaHang ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {item.nhanVienTao?.tenNhanVien ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(item.ngayKiemKe || "")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.trangThai)}`}
                    >
                      {item.trangThaiText}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => openDetail(item.id)}
                        className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                        title="Xem chi tiết"
                      >
                        <FiEye size={15} />
                      </button>
                      {item.trangThai === WAITING && (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={processingId === item.id}
                            className="p-1.5 text-green-600 hover:bg-green-600/10 rounded disabled:opacity-60"
                            title="Duyệt phiếu"
                          >
                            <FiCheck size={15} />
                          </button>
                          <button
                            onClick={() => handleRequestRecheck(item.id)}
                            disabled={processingId === item.id}
                            className="p-1.5 text-orange-600 hover:bg-orange-600/10 rounded disabled:opacity-60"
                            title="Yêu cầu kiểm kê lại"
                          >
                            <FiRefreshCw size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredChecks.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-muted">
                    Chưa có phiếu kiểm kê nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetail && selected && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-4xl bg-card border border-subtle rounded-2xl">
              <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Duyệt phiếu kiểm kê #{selected.id}
                </h3>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-muted hover:text-foreground"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted">Tên phiếu: </span>
                    <span className="font-medium text-foreground">
                      {selected.tenPhieuKiemKe}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Trạng thái: </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selected.trangThai)}`}
                    >
                      {selected.trangThaiText}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Loại kiểm kê: </span>
                    <span className="font-medium text-foreground">
                      {selected.loaiKiemKe?.tenLoaiKiemKe ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Cửa hàng: </span>
                    <span className="font-medium text-foreground">
                      {selected.cuaHang?.tenCuaHang ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Người tạo: </span>
                    <span className="font-medium text-foreground">
                      {selected.nhanVienTao?.tenNhanVien ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Ngày kiểm kê: </span>
                    <span className="font-medium text-foreground">
                      {formatDate(selected.ngayKiemKe || "")}
                    </span>
                  </div>
                </div>

                {selected.lyDoYeuCauKiemKeLai && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                    <strong>Lý do yêu cầu kiểm kê lại:</strong>{" "}
                    {selected.lyDoYeuCauKiemKeLai}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-180 text-sm">
                    <thead>
                      <tr className="bg-section border-y border-subtle">
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Sản phẩm
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Hệ thống
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Thực tế
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Chênh lệch
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {selected.chiTietKiemKes?.map((ct) => (
                        <tr key={ct.id}>
                          <td className="px-3 py-2 text-foreground">
                            {ct.tenSanPham} - {ct.tenMauSac} - {ct.tenKichThuoc}
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {ct.soLuongHeThong ?? 0}
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {ct.soLuongThucTe ?? 0}
                          </td>
                          <td
                            className={`px-3 py-2 font-medium ${(ct.chenhLech ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {ct.chenhLech ?? 0}
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {ct.ghiChu || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-subtle flex items-center justify-between">
                <button
                  onClick={() => setShowDetail(false)}
                  className="px-4 py-2 border border-subtle rounded-lg text-sm text-foreground hover:bg-section transition"
                >
                  Đóng
                </button>
                {selected.trangThai === WAITING && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestRecheck(selected.id)}
                      disabled={processingId === selected.id}
                      className="px-4 py-2 rounded-lg bg-orange-600 text-red-700 text-sm hover:bg-orange-700 transition"
                    >
                      {processingId === selected.id
                        ? "Đang xử lý..."
                        : "Yêu cầu kiểm kê lại"}
                    </button>
                    <button
                      onClick={() => handleApprove(selected.id)}
                      disabled={processingId === selected.id}
                      className="px-4 py-2 rounded-lg bg-green-600 text-red-700 text-sm hover:bg-green-700 transition"
                    >
                      {processingId === selected.id
                        ? "Đang xử lý..."
                        : "Duyệt và cập nhật tồn kho"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
