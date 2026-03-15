"use client";

import { useEffect, useState, useCallback } from "react";
import { DonLuanChuyen } from "@/types";
import { donLuanChuyenService } from "@/services/transfer.service";
import { formatDate } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiEye, FiCheck, FiX, FiTruck, FiArrowRight } from "react-icons/fi";

const TRANSFER_STATUSES = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ xử lý", value: "Chờ xử lý" },
  { label: "Đang giao", value: "Đang giao" },
  { label: "Đã nhận", value: "Đã nhận" },
  { label: "Từ chối", value: "Từ chối" },
];

function getTransferStatusColor(status: string) {
  switch (status) {
    case "Chờ xử lý":
      return "bg-yellow-100 text-yellow-800";
    case "Đang giao":
      return "bg-blue-100 text-blue-800";
    case "Đã nhận":
      return "bg-green-100 text-green-800";
    case "Từ chối":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState<DonLuanChuyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  // Detail modal
  const [selected, setSelected] = useState<DonLuanChuyen | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Confirm action modal
  const [actionItem, setActionItem] = useState<DonLuanChuyen | null>(null);
  const [actionType, setActionType] = useState<1 | 2 | 3>(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await donLuanChuyenService.getAll(page, 15);
      let result = data.result || [];
      if (filterStatus) {
        result = result.filter((r: DonLuanChuyen) => r.trangThai === filterStatus);
      }
      setTransfers(result);
      setTotalPages(data.meta?.pages || 1);
    } catch {
      toast.error("Không thể tải danh sách đơn luân chuyển");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleViewDetail = async (id: number) => {
    try {
      const data = await donLuanChuyenService.getById(id);
      setSelected(data);
      setShowDetail(true);
    } catch {
      toast.error("Không thể tải chi tiết đơn luân chuyển");
    }
  };

  const openAction = (item: DonLuanChuyen, type: 1 | 2 | 3) => {
    setActionItem(item);
    setActionType(type);
    setShowConfirm(true);
  };

  const handleConfirmAction = async () => {
    if (!actionItem) return;
    try {
      setUpdating(true);
      await donLuanChuyenService.updateStatus(actionItem.id, actionType);
      const msgs: Record<number, string> = {
        1: "Đã chuyển sang trạng thái Đang giao",
        2: "Đã xác nhận nhận hàng",
        3: "Đã từ chối đơn luân chuyển",
      };
      toast.success(msgs[actionType]);
      setShowConfirm(false);
      fetchTransfers();
    } catch {
      toast.error("Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const pendingCount = transfers.filter((r) => r.trangThai === "Chờ xử lý").length;
  const shippingCount = transfers.filter((r) => r.trangThai === "Đang giao").length;
  const receivedCount = transfers.filter((r) => r.trangThai === "Đã nhận").length;
  const rejectedCount = transfers.filter((r) => r.trangThai === "Từ chối").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Quản lý đơn luân chuyển
          </h1>
          <p className="text-sm text-muted mt-1">
            Quản lý luân chuyển hàng hóa giữa các cửa hàng.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <FiTruck size={16} />
          Tổng: {transfers.length} đơn
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Tổng đơn</p>
          <p className="text-2xl font-bold text-foreground mt-1">{transfers.length}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Chờ xử lý</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Đang giao</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{shippingCount}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Đã nhận</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{receivedCount}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Từ chối</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-subtle p-4 flex flex-wrap gap-2">
        {TRANSFER_STATUSES.map((s) => (
          <button
            key={String(s.value)}
            onClick={() => {
              setFilterStatus(s.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filterStatus === s.value
                ? "bg-accent text-white"
                : "bg-section text-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : transfers.length === 0 ? (
        <div className="text-center py-16 text-muted">
          Không có đơn luân chuyển nào
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-225">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Tên đơn</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">CH Gửi → CH Nhận</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Loại</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Ngày tạo</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Trạng thái</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {transfers.map((r) => (
                  <tr key={r.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold">#{r.id}</td>
                    <td className="px-4 py-3 text-foreground font-medium max-w-48 truncate">
                      {r.tenDon}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{r.tenCuaHangGui}</span>
                        <FiArrowRight size={12} className="text-muted" />
                        <span className="font-medium text-foreground">{r.tenCuaHangDat}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{r.tenLoaiDonLuanChuyen}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(r.ngayTao)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getTransferStatusColor(r.trangThai)}`}
                      >
                        {r.trangThai}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => handleViewDetail(r.id)}
                          className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                          title="Xem chi tiết"
                        >
                          <FiEye size={15} />
                        </button>
                        {r.trangThai === "Chờ xử lý" && (
                          <>
                            <button
                              onClick={() => openAction(r, 1)}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                              title="Đang giao"
                            >
                              <FiTruck size={15} />
                            </button>
                            <button
                              onClick={() => openAction(r, 3)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                              title="Từ chối"
                            >
                              <FiX size={15} />
                            </button>
                          </>
                        )}
                        {r.trangThai === "Đang giao" && (
                          <button
                            onClick={() => openAction(r, 2)}
                            className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"
                            title="Xác nhận nhận hàng"
                          >
                            <FiCheck size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-subtle sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg text-foreground">
                Đơn luân chuyển #{selected.id}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted">Tên đơn: </span>
                  <span className="font-medium text-foreground">{selected.tenDon}</span>
                </div>
                <div>
                  <span className="text-muted">Trạng thái: </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTransferStatusColor(selected.trangThai)}`}>
                    {selected.trangThai}
                  </span>
                </div>
                <div>
                  <span className="text-muted">CH Gửi: </span>
                  <span className="font-medium text-foreground">{selected.tenCuaHangGui}</span>
                </div>
                <div>
                  <span className="text-muted">CH Nhận: </span>
                  <span className="font-medium text-foreground">{selected.tenCuaHangDat}</span>
                </div>
                <div>
                  <span className="text-muted">Loại đơn: </span>
                  <span className="font-medium text-foreground">{selected.tenLoaiDonLuanChuyen}</span>
                </div>
                <div>
                  <span className="text-muted">Ngày tạo: </span>
                  <span className="font-medium text-foreground">{formatDate(selected.ngayTao)}</span>
                </div>
                {selected.thoiGianGiao && (
                  <div>
                    <span className="text-muted">Thời gian giao: </span>
                    <span className="font-medium text-foreground">{formatDate(selected.thoiGianGiao)}</span>
                  </div>
                )}
                {selected.thoiGianNhan && (
                  <div>
                    <span className="text-muted">Thời gian nhận: </span>
                    <span className="font-medium text-foreground">{formatDate(selected.thoiGianNhan)}</span>
                  </div>
                )}
                {selected.ghiTru && (
                  <div className="col-span-2">
                    <span className="text-muted">Ghi chú: </span>
                    <span className="font-medium text-foreground">{selected.ghiTru}</span>
                  </div>
                )}
                {selected.ghiTruKiemHang && (
                  <div className="col-span-2">
                    <span className="text-muted">Ghi chú kiểm hàng: </span>
                    <span className="font-medium text-foreground">{selected.ghiTruKiemHang}</span>
                  </div>
                )}
              </div>

              <hr className="border-subtle" />
              <h3 className="text-sm font-semibold text-foreground">
                Chi tiết sản phẩm ({selected.chiTietDonLuanChuyens?.length || 0})
              </h3>
              <div className="space-y-3">
                {selected.chiTietDonLuanChuyens?.map((ct) => (
                  <div
                    key={ct.id}
                    className="p-3 bg-section rounded-lg border border-subtle"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {ct.tenSanPham}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {ct.mauSac} / {ct.kichThuoc}
                        </p>
                        {ct.ghiTru && (
                          <p className="text-xs text-orange-600 mt-1">
                            Ghi chú: {ct.ghiTru}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-bold text-foreground">
                          SL: {ct.soLuong}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTransferStatusColor(ct.trangThai)}`}>
                          {ct.trangThai}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selected.trangThai === "Chờ xử lý" && (
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      openAction(selected, 1);
                    }}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <FiTruck size={16} /> Chuyển sang Đang giao
                  </button>
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      openAction(selected, 3);
                    }}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <FiX size={16} /> Từ chối
                  </button>
                </div>
              )}
              {selected.trangThai === "Đang giao" && (
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      openAction(selected, 2);
                    }}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <FiCheck size={16} /> Xác nhận nhận hàng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {showConfirm && actionItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-foreground mb-2">
              {actionType === 1 && "Chuyển sang Đang giao?"}
              {actionType === 2 && "Xác nhận đã nhận hàng?"}
              {actionType === 3 && "Từ chối đơn luân chuyển?"}
            </h3>
            <p className="text-sm text-muted mb-1">
              Đơn: <span className="font-medium">#{actionItem.id}</span> — {actionItem.tenDon}
            </p>
            <p className="text-sm text-muted mb-4">
              {actionItem.tenCuaHangGui} → {actionItem.tenCuaHangDat}
            </p>
            {actionType === 1 && (
              <p className="text-sm text-blue-700 bg-blue-50 rounded-lg p-3 mb-4">
                Đơn sẽ chuyển sang trạng thái Đang giao. Cửa hàng gửi sẽ bắt đầu vận chuyển hàng.
              </p>
            )}
            {actionType === 2 && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3 mb-4">
                Xác nhận đã nhận đủ hàng từ cửa hàng gửi.
              </p>
            )}
            {actionType === 3 && (
              <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-4">
                Sau khi từ chối, đơn luân chuyển sẽ bị hủy. Hành động này không thể hoàn tác.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-medium hover:bg-section transition"
                disabled={updating}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={updating}
                className={`flex-1 py-2.5 text-white rounded-lg text-sm font-medium transition ${
                  actionType === 1
                    ? "bg-blue-600 hover:bg-blue-700"
                    : actionType === 2
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {updating
                  ? "Đang xử lý..."
                  : actionType === 1
                  ? "Xác nhận giao"
                  : actionType === 2
                  ? "Xác nhận nhận"
                  : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
