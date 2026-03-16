"use client";

import { useEffect, useState, useCallback } from "react";
import { TraHang } from "@/types";
import { traHangService } from "@/services/return.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiEye, FiCheck, FiX, FiRotateCcw } from "react-icons/fi";

const RETURN_STATUSES = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ xử lý", value: "Chờ xử lý" },
  { label: "Đã duyệt", value: "Đã duyệt" },
  { label: "Từ chối", value: "Từ chối" },
];

function getReturnStatusColor(status: string) {
  switch (status) {
    case "Chờ xử lý":
      return "bg-yellow-100 text-yellow-800";
    case "Đã duyệt":
      return "bg-green-100 text-green-800";
    case "Từ chối":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<TraHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  // Detail modal
  const [selected, setSelected] = useState<TraHang | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Confirm action modal
  const [actionItem, setActionItem] = useState<TraHang | null>(null);
  const [actionType, setActionType] = useState<1 | 2>(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      const data = await traHangService.getAll(page, 15);
      let result = data.result || [];
      if (filterStatus) {
        result = result.filter((r: TraHang) => r.trangThai === filterStatus);
      }
      setReturns(result);
      setTotalPages(data.meta?.pages || 1);
    } catch {
      toast.error("Không thể tải danh sách trả hàng");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleViewDetail = async (id: number) => {
    try {
      const data = await traHangService.getById(id);
      setSelected(data);
      setShowDetail(true);
    } catch {
      toast.error("Không thể tải chi tiết phiếu trả");
    }
  };

  const openAction = (item: TraHang, type: 1 | 2) => {
    setActionItem(item);
    setActionType(type);
    setShowConfirm(true);
  };

  const handleConfirmAction = async () => {
    if (!actionItem) return;
    try {
      setUpdating(true);
      await traHangService.updateStatus(actionItem.id, actionType);
      toast.success(
        actionType === 1
          ? "Đã duyệt phiếu trả hàng"
          : "Đã từ chối phiếu trả hàng",
      );
      setShowConfirm(false);
      fetchReturns();
    } catch {
      toast.error("Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const pendingCount = returns.filter(
    (r) => r.trangThai === "Chờ xử lý",
  ).length;
  const approvedCount = returns.filter(
    (r) => r.trangThai === "Đã duyệt",
  ).length;
  const rejectedCount = returns.filter((r) => r.trangThai === "Từ chối").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Quản lý trả hàng
          </h1>
          <p className="text-sm text-muted mt-1">
            Quản lý tất cả phiếu trả hàng từ khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <FiRotateCcw size={16} />
          Tổng: {returns.length} phiếu
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Tổng phiếu
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {returns.length}
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
          <p className="text-xs text-muted uppercase tracking-wide">Đã duyệt</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {approvedCount}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Từ chối</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-subtle p-4 flex flex-wrap gap-2">
        {RETURN_STATUSES.map((s) => (
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
      ) : returns.length === 0 ? (
        <div className="text-center py-16 text-muted">
          Không có phiếu trả hàng nào
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-225">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Đơn hàng
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Lý do
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Cập nhật
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Hoàn tiền
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Payment ref
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
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold">#{r.id}</td>
                    <td className="px-4 py-3 text-muted">Đơn #{r.donHangId}</td>
                    <td className="px-4 py-3 text-muted max-w-48 truncate">
                      {r.lyDoTraHang}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(r.ngayTao)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(r.ngayCapNhat)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">
                      {formatCurrency(r.tongTien)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {r.phuongThucHoanTien}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {r.paymentRef || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getReturnStatusColor(r.trangThai)}`}
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
                              className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"
                              title="Duyệt"
                            >
                              <FiCheck size={15} />
                            </button>
                            <button
                              onClick={() => openAction(r, 2)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                              title="Từ chối"
                            >
                              <FiX size={15} />
                            </button>
                          </>
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
                Phiếu trả hàng #{selected.id}
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
                  <span className="text-muted">Đơn hàng: </span>
                  <span className="font-medium text-foreground">
                    #{selected.donHangId}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Trạng thái: </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getReturnStatusColor(selected.trangThai)}`}
                  >
                    {selected.trangThai}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Ngày tạo: </span>
                  <span className="font-medium text-foreground">
                    {formatDate(selected.ngayTao)}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Tổng tiền: </span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(selected.tongTien)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted">Phương thức hoàn tiền: </span>
                  <span className="font-medium text-foreground">
                    {selected.phuongThucHoanTien}
                    {selected.thongTinChuyenKhoan
                      ? ` - ${selected.thongTinChuyenKhoan}`
                      : ""}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted">Payment ref: </span>
                  <span className="font-medium text-foreground">
                    {selected.paymentRef || "-"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted">Lý do: </span>
                  <span className="font-medium text-foreground">
                    {selected.lyDoTraHang}
                  </span>
                </div>
                {selected.linkAnh && (
                  <div className="col-span-2">
                    <span className="text-muted block mb-1">Ảnh trả hàng:</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.linkAnh}
                      alt={`Ảnh trả hàng #${selected.id}`}
                      className="rounded border border-subtle object-cover"
                      style={{ width: 120, height: 120 }}
                    />
                  </div>
                )}
              </div>

              <hr className="border-subtle" />
              <h3 className="text-sm font-semibold text-foreground">
                Sản phẩm trả ({selected.chiTietTraHangs?.length || 0})
              </h3>
              <div className="overflow-x-auto rounded-lg border border-subtle">
                <table className="w-full text-sm min-w-170">
                  <thead className="bg-section border-b border-subtle">
                    <tr>
                      <th className="px-3 py-2 text-left text-muted font-medium">
                        Sản phẩm
                      </th>
                      <th className="px-3 py-2 text-left text-muted font-medium">
                        Phân loại
                      </th>
                      <th className="px-3 py-2 text-right text-muted font-medium">
                        Giá gốc
                      </th>
                      <th className="px-3 py-2 text-right text-muted font-medium">
                        Giá sản phẩm (giảm)
                      </th>
                      <th className="px-3 py-2 text-right text-muted font-medium">
                        Số lượng
                      </th>
                      <th className="px-3 py-2 text-right text-muted font-medium">
                        Thành tiền
                      </th>
                      <th className="px-3 py-2 text-center text-muted font-medium">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {selected.chiTietTraHangs?.map((ct) => (
                      <tr key={ct.id} className="hover:bg-section/60">
                        <td className="px-3 py-2">
                          <p className="font-medium text-foreground text-sm truncate max-w-50">
                            {ct.tenSanPham}
                          </p>
                          {ct.ghiTru && (
                            <p className="text-xs text-orange-600 mt-0.5">
                              Ghi chú: {ct.ghiTru}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted">
                          {ct.tenMauSac} / {ct.tenKichThuoc}
                        </td>
                        <td className="px-3 py-2 text-right text-muted">
                          {formatCurrency(ct.giaSanPham)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-foreground">
                          {formatCurrency(ct.giaSanPhamGiam ?? 0)}
                        </td>
                        <td className="px-3 py-2 text-right text-muted">
                          {ct.soLuong}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-blue-600">
                          {formatCurrency(ct.thanhTien)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getReturnStatusColor(ct.trangThai)}`}
                          >
                            {ct.trangThai}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selected.trangThai === "Chờ xử lý" && (
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      openAction(selected, 1);
                    }}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <FiCheck size={16} /> Duyệt phiếu trả
                  </button>
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      openAction(selected, 2);
                    }}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <FiX size={16} /> Từ chối
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
              {actionType === 1
                ? "Duyệt phiếu trả hàng?"
                : "Từ chối phiếu trả hàng?"}
            </h3>
            <p className="text-sm text-muted mb-1">
              Phiếu: <span className="font-medium">#{actionItem.id}</span> — Đơn
              hàng: <span className="font-medium">#{actionItem.donHangId}</span>
            </p>
            <p className="text-sm text-muted mb-4">
              Tổng tiền:{" "}
              <span className="font-medium text-blue-600">
                {formatCurrency(actionItem.tongTien)}
              </span>
            </p>
            <p className="text-sm text-muted mb-4">
              Hoàn tiền:{" "}
              <span className="font-medium">
                {actionItem.phuongThucHoanTien}
              </span>
              {actionItem.thongTinChuyenKhoan
                ? ` - ${actionItem.thongTinChuyenKhoan}`
                : ""}
            </p>
            {actionType === 1 ? (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3 mb-4">
                Sau khi duyệt, yêu cầu trả hàng sẽ được chấp nhận và khách hàng
                sẽ được hoàn tiền.
              </p>
            ) : (
              <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-4">
                Sau khi từ chối, yêu cầu trả hàng sẽ bị hủy. Hành động này không
                thể hoàn tác.
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
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {updating
                  ? "Đang xử lý..."
                  : actionType === 1
                    ? "Xác nhận duyệt"
                    : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
