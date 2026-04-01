"use client";

import { useEffect, useState, useCallback } from "react";
import { CuaHang, DonHang } from "@/types";
import { orderService, OrderSearchParams } from "@/services/order.service";
import { cuaHangService } from "@/services/common.service";
import {
  formatCurrency,
  formatDate,
  getOrderStatusText,
  getOrderStatusColor,
  getPaymentStatusText,
  getPaymentMethodText,
  getImageUrl,
} from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiEye, FiEdit, FiTrash2, FiX, FiPackage } from "react-icons/fi";

const ORDER_STATUSES = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ xác nhận", value: 0 },
  { label: "Đã xác nhận", value: 1 },
  { label: "Đang đóng gói", value: 2 },
  { label: "Đang giao hàng", value: 3 },
  { label: "Đã hủy", value: 4 },
  { label: "Đã nhận hàng", value: 5 },
];

function getStatusNumber(status: string | number): number {
  if (typeof status === "number") return status;
  const map: Record<string, number> = {
    "Chờ xác nhận": 0,
    "Đã xác nhận": 1,
    "Đang đóng gói": 2,
    "Đang giao hàng": 3,
    "Đã hủy": 4,
    "Đã nhận hàng": 5,
  };
  return map[status] ?? -1;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DonHang[]>([]);
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStoreId, setFilterStoreId] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<number | undefined>();

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<DonHang | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit status modal
  const [editOrder, setEditOrder] = useState<DonHang | null>(null);
  const [newStatus, setNewStatus] = useState<number>(0);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: OrderSearchParams = {
        page,
        size: 15,
        cuaHangId: filterStoreId,
        trangThai: filterStatus,
        hinhThucDonHang: filterType,
      };
      const data = await orderService.getAll(params);
      setOrders(data.result);
      setTotalPages(data.meta.pages);
    } catch {
      toast.error("Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [page, filterStoreId, filterStatus, filterType]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await cuaHangService.getAll();
        setStores(data);
      } catch {
        toast.error("Không thể tải danh sách cửa hàng");
      }
    };

    fetchStores();
  }, []);

  const openDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);
      const data = await orderService.getById(id);
      setSelectedOrder(data);
    } catch {
      toast.error("Không tải được chi tiết");
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = (order: DonHang) => {
    setEditOrder(order);
    setNewStatus(getStatusNumber(order.trangThai));
  };

  const handleUpdateStatus = async () => {
    if (!editOrder) return;
    try {
      setUpdating(true);
      await orderService.update({
        id: editOrder.id,
        trangThai: newStatus,
      } as DonHang);
      toast.success("Cập nhật thành công");
      setEditOrder(null);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa đơn hàng này?")) return;
    try {
      setDeleting(true);
      await orderService.delete(id);
      toast.success("Đã xóa");
      fetchOrders();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý đơn hàng</h1>
        <p className="text-sm text-muted mt-1">
          Xem và xử lý các đơn hàng của khách hàng
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-subtle p-4 flex flex-wrap gap-3 items-center">
        <div className="w-full sm:w-auto sm:min-w-72">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
            Cửa hàng
          </label>
          <select
            value={filterStoreId ?? ""}
            onChange={(e) => {
              setFilterStoreId(
                e.target.value !== "" ? Number(e.target.value) : undefined,
              );
              setPage(1);
            }}
            className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
          >
            <option value="">Tất cả cửa hàng</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.tenCuaHang}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ORDER_STATUSES.map((f) => (
            <button
              key={String(f.value)}
              onClick={() => {
                setFilterStatus(f.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                filterStatus === f.value
                  ? "bg-accent text-white shadow-sm"
                  : "bg-section text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={filterType ?? ""}
          onChange={(e) => {
            setFilterType(
              e.target.value !== "" ? Number(e.target.value) : undefined,
            );
            setPage(1);
          }}
          className="border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
        >
          <option value="">Tất cả hình thức</option>
          <option value="0">COD/Tiền mặt</option>
          <option value="1">VNPAY</option>
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <FiPackage className="mx-auto mb-2" size={24} />
          {filterStoreId
            ? "Không có đơn hàng cho cửa hàng đã chọn"
            : "Không có đơn hàng nào"}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-225">
              <thead>
                <tr className="bg-section border-b border-subtle">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Cửa hàng
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                    Hình thức
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                    Payment Ref
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-section transition">
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      #{o.id}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {o.khachHang?.tenKhachHang || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {o.cuaHang?.tenCuaHang || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {formatDate(o.ngayTao)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-accent">
                      {formatCurrency(o.tongTienTra || o.tongTien)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          o.hinhThucDonHang === 0 ||
                          o.hinhThucDonHang === "COD/Tiền mặt"
                            ? "bg-section text-muted"
                            : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {getPaymentMethodText(o.hinhThucDonHang)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getOrderStatusColor(
                          o.trangThai,
                        )}`}
                      >
                        {getOrderStatusText(o.trangThai)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs text-muted">
                      {getPaymentStatusText(o.trangThaiThanhToan)}
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs text-muted">
                      {o.paymentRef || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetail(o.id)}
                          className="p-2 rounded-lg text-sky-600 hover:bg-sky-500/10 transition"
                          title="Chi tiết"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(o)}
                          className="p-2 rounded-lg text-accent hover:bg-accent/10 transition"
                          title="Sửa trạng thái"
                        >
                          <FiEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(o.id)}
                          disabled={deleting}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-subtle rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-subtle sticky top-0 bg-card/95 backdrop-blur rounded-t-2xl">
              <h2 className="font-bold text-foreground">
                Chi tiết đơn hàng {selectedOrder ? `#${selectedOrder.id}` : ""}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-5">
              {detailLoading ? (
                <Loading />
              ) : selectedOrder ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted">Khách hàng: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.khachHang?.tenKhachHang || "Khách lẻ"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">SĐT: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.sdt ||
                          selectedOrder.khachHang?.sdt ||
                          "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Địa chỉ: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.diaChi || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Nhân viên: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.nhanVien?.tenNhanVien || "Chưa gán"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Cửa hàng: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.cuaHang?.tenCuaHang || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Hình thức: </span>
                      <span className="font-medium text-foreground">
                        {getPaymentMethodText(selectedOrder.hinhThucDonHang)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Trạng thái: </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(selectedOrder.trangThai)}`}
                      >
                        {getOrderStatusText(selectedOrder.trangThai)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Thanh toán: </span>
                      <span className="font-medium text-foreground">
                        {getPaymentStatusText(selectedOrder.trangThaiThanhToan)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Payment Ref: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.paymentRef || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Ngày tạo: </span>
                      <span className="font-medium text-foreground">
                        {formatDate(selectedOrder.ngayTao)}
                      </span>
                    </div>
                    {selectedOrder.ngayCapNhat && (
                      <div>
                        <span className="text-muted">Ngày cập nhật: </span>
                        <span className="font-medium text-foreground">
                          {formatDate(selectedOrder.ngayCapNhat)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Giá */}
                  <hr className="border-subtle" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted">Tổng tiền: </span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(selectedOrder.tongTien)}
                      </span>
                    </div>
                    {selectedOrder.tongTienGiam > 0 && (
                      <div>
                        <span className="text-muted">Tổng giảm: </span>
                        <span className="font-medium text-red-500">
                          -{formatCurrency(selectedOrder.tongTienGiam)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted">Tổng thanh toán: </span>
                      <span className="font-bold text-accent">
                        {formatCurrency(selectedOrder.tongTienTra)}
                      </span>
                    </div>
                  </div>

                  {/* Khuyến mãi */}
                  {(selectedOrder.khuyenMaiHoaDon ||
                    selectedOrder.khuyenMaiDiem) && (
                    <>
                      <hr className="border-subtle" />
                      <h3 className="font-semibold text-sm text-foreground">
                        Khuyến mãi áp dụng
                      </h3>
                      <div className="space-y-1 text-sm">
                        {selectedOrder.khuyenMaiHoaDon && (
                          <div className="flex justify-between">
                            <span className="text-muted">
                              {selectedOrder.khuyenMaiHoaDon.tenKhuyenMai} (-
                              {selectedOrder.khuyenMaiHoaDon.phanTramGiam}%)
                            </span>
                            <span className="text-red-500 font-medium">
                              -
                              {formatCurrency(
                                selectedOrder.khuyenMaiHoaDon.tienDaGiam,
                              )}
                            </span>
                          </div>
                        )}
                        {selectedOrder.khuyenMaiDiem && (
                          <div className="flex justify-between">
                            <span className="text-muted">
                              {selectedOrder.khuyenMaiDiem.tenKhuyenMai} (-
                              {selectedOrder.khuyenMaiDiem.phanTramGiam}%)
                            </span>
                            <span className="text-red-500 font-medium">
                              -
                              {formatCurrency(
                                selectedOrder.khuyenMaiDiem.tienDaGiam,
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Sản phẩm */}
                  <hr className="border-subtle" />
                  <h3 className="font-semibold text-sm text-foreground">
                    Sản phẩm ({(selectedOrder.chiTietDonHangs || []).length})
                  </h3>
                  <div className="space-y-2">
                    {(selectedOrder.chiTietDonHangs || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm border-b border-subtle pb-2"
                      >
                        {item.hinhAnhChinh && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(item.hinhAnhChinh)}
                            alt={item.tenSanPham || ""}
                            className="w-12 h-12 rounded-lg object-cover border border-subtle shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {item.tenSanPham || `SP #${idx + 1}`}
                          </p>
                          <p className="text-muted text-xs">
                            {item.tenMauSac} / {item.tenKichThuoc} ×{" "}
                            {item.soLuong}
                          </p>
                          {item.giamGia > 0 && (
                            <p className="text-xs text-red-500">
                              Giảm {item.giamGia}% (-
                              {formatCurrency(item.giaGiam)})
                            </p>
                          )}
                        </div>
                        <span className="font-medium text-foreground whitespace-nowrap">
                          {formatCurrency(item.thanhTien)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-subtle rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
              <h2 className="font-bold text-foreground">
                Cập nhật đơn #{editOrder.id}
              </h2>
              <button
                onClick={() => setEditOrder(null)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-sm text-muted mb-1">Trạng thái hiện tại</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(editOrder.trangThai)}`}
                >
                  {getOrderStatusText(editOrder.trangThai)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">
                  Trạng thái mới
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(Number(e.target.value))}
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                >
                  <option value={0}>Chờ xác nhận</option>
                  <option value={1}>Đã xác nhận</option>
                  <option value={2}>Đang đóng gói</option>
                  <option value={3}>Đang giao hàng</option>
                  <option value={4}>Đã hủy</option>
                  <option value={5}>Đã nhận hàng</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditOrder(null)}
                  className="px-5 py-2.5 border border-subtle text-foreground rounded-xl hover:bg-section transition font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition shadow-sm font-medium text-sm disabled:opacity-50"
                >
                  {updating ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
