"use client";

import { useEffect, useState, useCallback } from "react";
import { DoiHang } from "@/types";
import { doiHangService } from "@/services/exchange.service";
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiEye, FiCheck, FiX, FiRepeat } from "react-icons/fi";

const EXCHANGE_STATUSES = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ xử lý", value: "Chờ xử lý" },
  { label: "Đã duyệt", value: "Đã duyệt" },
  { label: "Từ chối", value: "Từ chối" },
];

function getExchangeStatusColor(status: string) {
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

export default function StaffExchangesPage() {
  const [exchanges, setExchanges] = useState<DoiHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  // Detail modal
  const [selected, setSelected] = useState<DoiHang | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Confirm action modal
  const [actionItem, setActionItem] = useState<DoiHang | null>(null);
  const [actionType, setActionType] = useState<1 | 2>(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchExchanges = useCallback(async () => {
    try {
      setLoading(true);
      const data = await doiHangService.getAll(page, 15);
      let result = data.result || [];
      if (filterStatus) {
        result = result.filter((r: DoiHang) => r.trangThai === filterStatus);
      }
      setExchanges(result);
      setTotalPages(data.meta?.pages || 1);
    } catch {
      toast.error("Không thể tải danh sách đổi hàng");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const handleViewDetail = async (id: number) => {
    try {
      const data = await doiHangService.getById(id);
      setSelected(data);
      setShowDetail(true);
    } catch {
      toast.error("Không thể tải chi tiết phiếu đổi");
    }
  };

  const openAction = (item: DoiHang, type: 1 | 2) => {
    setActionItem(item);
    setActionType(type);
    setShowConfirm(true);
  };

  const handleConfirmAction = async () => {
    if (!actionItem) return;
    try {
      setUpdating(true);
      await doiHangService.updateStatus(actionItem.id, actionType);
      toast.success(
        actionType === 1
          ? "Đã duyệt phiếu đổi hàng"
          : "Đã từ chối phiếu đổi hàng",
      );
      setShowConfirm(false);
      fetchExchanges();
    } catch {
      toast.error("Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const pendingCount = exchanges.filter(
    (r) => r.trangThai === "Chờ xử lý",
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Quản lý đổi hàng
          </h1>
          <p className="text-sm text-muted mt-1">
            Xử lý các phiếu đổi hàng từ khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <FiRepeat size={16} />
          Chờ xử lý: {pendingCount}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-subtle p-4 flex flex-wrap gap-2">
        {EXCHANGE_STATUSES.map((s) => (
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
      ) : exchanges.length === 0 ? (
        <div className="text-center py-16 text-muted">
          Không có phiếu đổi hàng nào
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
                  <th className="px-4 py-3 text-right font-medium text-muted">
                    Tổng tiền
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
                {exchanges.map((r) => (
                  <tr key={r.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold">#{r.id}</td>
                    <td className="px-4 py-3 text-muted">Đơn #{r.donHangId}</td>
                    <td className="px-4 py-3 text-muted max-w-48 truncate">
                      {r.ghiTru}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(r.ngayTao)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">
                      {formatCurrency(r.tongTien)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getExchangeStatusColor(r.trangThai)}`}
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
                Phiếu đổi hàng #{selected.id}
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
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getExchangeStatusColor(selected.trangThai)}`}
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
                {selected.ghiTru && (
                  <div className="col-span-2">
                    <span className="text-muted">Lý do: </span>
                    <span className="font-medium text-foreground">
                      {selected.ghiTru}
                    </span>
                  </div>
                )}
              </div>

              <hr className="border-subtle" />
              <h3 className="text-sm font-semibold text-foreground">
                Chi tiết đổi hàng ({selected.chiTietDoiHangs?.length || 0})
              </h3>
              <div className="space-y-4">
                {selected.chiTietDoiHangs?.map((ct) => (
                  <div
                    key={ct.id}
                    className="p-3 bg-section rounded-lg border border-subtle space-y-3"
                  >
                    {/* Sản phẩm trả */}
                    <div className="flex gap-3">
                      {ct.hinhAnhSanPhamTra ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getImageUrl(ct.hinhAnhSanPhamTra)}
                          alt={ct.tenSanPhamTra}
                          className="rounded object-cover shrink-0 border border-subtle"
                          style={{ width: 48, height: 48 }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-200 border border-subtle shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-red-500 font-bold uppercase">
                          Sản phẩm trả
                        </p>
                        <p className="font-medium text-foreground text-sm truncate">
                          {ct.tenSanPhamTra}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {ct.mauSacTra} / {ct.kichThuocTra} — SL:{" "}
                          {ct.soLuongTra}
                        </p>
                        <p className="text-xs text-muted">
                          Giá: {formatCurrency(ct.giaSanPhamTra)}
                        </p>
                      </div>
                    </div>
                    {/* Sản phẩm đổi */}
                    <div className="flex gap-3">
                      {ct.hinhAnhSanPhamDoi ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getImageUrl(ct.hinhAnhSanPhamDoi)}
                          alt={ct.tenSanPhamDoi}
                          className="rounded object-cover shrink-0 border border-subtle"
                          style={{ width: 48, height: 48 }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-200 border border-subtle shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-green-600 font-bold uppercase">
                          Sản phẩm đổi
                        </p>
                        <p className="font-medium text-foreground text-sm truncate">
                          {ct.tenSanPhamDoi}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {ct.mauSacDoi} / {ct.kichThuocDoi} — SL:{" "}
                          {ct.soLuongTra}
                        </p>
                        <p className="text-xs text-muted">
                          Giá: {formatCurrency(ct.giaSanPhamDoi)}
                        </p>
                      </div>
                    </div>
                    {/* Chênh lệch */}
                    <div className="text-right text-sm border-t border-subtle pt-2">
                      <span className="text-muted">Chênh lệch: </span>
                      <span
                        className={`font-bold ${ct.chenhLechGia > 0 ? "text-red-500" : ct.chenhLechGia < 0 ? "text-green-600" : "text-gray-500"}`}
                      >
                        {ct.chenhLechGia > 0 ? "+" : ""}
                        {formatCurrency(ct.chenhLechGia)}
                      </span>
                    </div>
                    {ct.ghiTru && (
                      <p className="text-xs text-orange-600">
                        Ghi chú: {ct.ghiTru}
                      </p>
                    )}
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
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <FiCheck size={16} /> Duyệt phiếu đổi
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
                ? "Duyệt phiếu đổi hàng?"
                : "Từ chối phiếu đổi hàng?"}
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
            {actionType === 1 ? (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3 mb-4">
                Sau khi duyệt, yêu cầu đổi hàng sẽ được chấp nhận.
              </p>
            ) : (
              <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-4">
                Sau khi từ chối, yêu cầu đổi hàng sẽ bị hủy.
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
