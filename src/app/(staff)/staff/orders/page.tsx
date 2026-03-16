"use client";

import { useEffect, useState, useCallback } from "react";
import { DonHang, ResChiTietSanPhamDTO, ResSanPhamDTO } from "@/types";
import { orderService, OrderSearchParams } from "@/services/order.service";
import { productService } from "@/services/product.service";
import { productVariantService } from "@/services/product.service";
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
import {
  FiPlus,
  FiEye,
  FiEdit,
  FiSearch,
  FiX,
  FiTrash2,
  FiPackage,
} from "react-icons/fi";

const ORDER_STATUSES = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ xác nhận", value: 0 },
  { label: "Đã xác nhận", value: 1 },
  { label: "Đang đóng gói", value: 2 },
  { label: "Đang giao hàng", value: 3 },
  { label: "Đã hủy", value: 4 },
  { label: "Đã nhận hàng", value: 5 },
];

// Map status text from API to numeric value
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

// Staff flow: 0→1→2→3, cancel: 0→4, 1→4
function getValidNextStatuses(
  currentStatus: string | number,
): { label: string; value: number }[] {
  const current = getStatusNumber(currentStatus);
  switch (current) {
    case 0:
      return [
        { label: "Đã xác nhận", value: 1 },
        { label: "Đã hủy", value: 4 },
      ];
    case 1:
      return [
        { label: "Đang đóng gói", value: 2 },
        { label: "Đã hủy", value: 4 },
      ];
    case 2:
      return [{ label: "Đang giao hàng", value: 3 }];
    default:
      return [];
  }
}

interface PosItem {
  variantId: number;
  tenSanPham: string;
  mauSac: string;
  kichThuoc: string;
  giaBan: number;
  soLuong: number;
}

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<DonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<number | undefined>();

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<DonHang | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Update status modal
  const [editOrder, setEditOrder] = useState<DonHang | null>(null);
  const [newStatus, setNewStatus] = useState<number>(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // POS modal
  const [showPosModal, setShowPosModal] = useState(false);
  const [posItems, setPosItems] = useState<PosItem[]>([]);
  const [posCustomerId, setPosCustomerId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ResSanPhamDTO[]>([]);
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ResSanPhamDTO | null>(
    null,
  );
  const [submittingPos, setSubmittingPos] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: OrderSearchParams = { page, size: 15 };
      if (filterStatus !== undefined) params.trangThai = filterStatus;
      if (filterType !== undefined) params.hinhThucDonHang = filterType;
      const data = await orderService.getAll(params);
      setOrders(data.result);
      setTotalPages(data.meta.pages);
    } catch {
      toast.error("Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);
      const data = await orderService.getById(id);
      setSelectedOrder(data);
    } catch {
      toast.error("Không thể tải chi tiết đơn hàng");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (order: DonHang) => {
    const validStatuses = getValidNextStatuses(order.trangThai);
    if (validStatuses.length === 0) {
      toast.error("Đơn hàng này không thể cập nhật trạng thái");
      return;
    }
    setEditOrder(order);
    setNewStatus(validStatuses[0].value);
    setShowEditModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!editOrder) return;
    try {
      setUpdating(true);
      await orderService.update({ id: editOrder.id, trangThai: newStatus });
      toast.success("Cập nhật trạng thái thành công");
      setShowEditModal(false);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  // POS product search
  const handleProductSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productSearch.trim()) return;
    try {
      const data = await productService.getAll({
        tenSanPham: productSearch,
        size: 5,
      });
      setSearchResults(data.result);
    } catch {
      toast.error("Không tìm thấy sản phẩm");
    }
  };

  const handleSelectProduct = async (product: ResSanPhamDTO) => {
    setSelectedProduct(product);
    setSearchResults([]);
    setProductSearch("");
    try {
      const vars = await productVariantService.getByProductCurrentStore(
        product.id,
      );
      setVariants(Array.isArray(vars) ? vars : []);
    } catch {
      toast.error("Không thể tải biến thể sản phẩm");
    }
  };

  const handleAddVariant = (variant: ResChiTietSanPhamDTO) => {
    const existing = posItems.findIndex((i) => i.variantId === variant.id);
    if (existing !== -1) {
      const updated = [...posItems];
      updated[existing].soLuong += 1;
      setPosItems(updated);
    } else {
      setPosItems([
        ...posItems,
        {
          variantId: variant.id,
          tenSanPham: variant.tenSanPham,
          mauSac: variant.tenMauSac,
          kichThuoc: variant.tenKichThuoc,
          giaBan: selectedProduct?.giaBan || 0,
          soLuong: 1,
        },
      ]);
    }
    setVariants([]);
    setSelectedProduct(null);
  };

  const handleRemoveItem = (idx: number) => {
    setPosItems(posItems.filter((_, i) => i !== idx));
  };

  const updateItemQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...posItems];
    updated[idx].soLuong = qty;
    setPosItems(updated);
  };

  const posTongTien = posItems.reduce(
    (sum, i) => sum + i.giaBan * i.soLuong,
    0,
  );

  const pendingOrders = orders.filter((o) => {
    const n = getStatusNumber(o.trangThai);
    return n >= 0 && n <= 2;
  }).length;
  const onlineOrders = orders.filter(
    (o) => o.hinhThucDonHang === 1 || o.hinhThucDonHang === "VNPAY",
  ).length;

  const handleSubmitPos = async () => {
    if (posItems.length === 0) {
      toast.error("Vui lòng thêm sản phẩm");
      return;
    }
    try {
      setSubmittingPos(true);
      const payload = {
        diaChi: "Mua tại cửa hàng",
        tongTien: posTongTien,
        tienGiam: 0,
        tongTienGiam: 0,
        tongTienTra: posTongTien,
        trangThai: 5,
        trangThaiThanhToan: 1,
        chiTietDonHangs: posItems.map((item) => ({
          chiTietSanPham: { id: item.variantId },
          giaSanPham: item.giaBan,
          giamGia: 0,
          giaGiam: 0,
          soLuong: item.soLuong,
          thanhTien: item.giaBan * item.soLuong,
        })),
      } as unknown as DonHang;
      if (posCustomerId) {
        payload.khachHang = {
          id: Number(posCustomerId),
        } as DonHang["khachHang"];
      }
      await orderService.createPOS(payload);
      toast.success("Tạo đơn tại quầy thành công");
      setShowPosModal(false);
      setPosItems([]);
      setPosCustomerId("");
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tạo đơn thất bại";
      toast.error(msg);
    } finally {
      setSubmittingPos(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="mb-2 bg-card rounded-2xl border border-subtle p-4 lg:p-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Danh sách đơn hàng
          </p>
          <p className="text-sm text-muted mt-1">
            Theo dõi đơn theo trạng thái và xử lý nghiệp vụ bán hàng tại quầy.
          </p>
        </div>
        <button
          onClick={() => {
            setPosItems([]);
            setPosCustomerId("");
            setProductSearch("");
            setSearchResults([]);
            setSelectedProduct(null);
            setVariants([]);
            setShowPosModal(true);
          }}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-hover transition"
        >
          <FiPlus size={16} /> Tạo đơn tại quầy
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Tổng đơn trang
          </p>
          <p className="text-xl font-bold text-foreground mt-1">
            {orders.length}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Đơn cần xử lý
          </p>
          <p className="text-xl font-bold text-foreground mt-1">
            {pendingOrders}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Đơn VNPAY
          </p>
          <p className="text-xl font-bold text-foreground mt-1">
            {onlineOrders}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-subtle p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {ORDER_STATUSES.map((s) => (
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
        <select
          value={filterType ?? ""}
          onChange={(e) => {
            setFilterType(
              e.target.value !== "" ? Number(e.target.value) : undefined,
            );
            setPage(1);
          }}
          className="border border-subtle bg-background text-foreground rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Tất cả hình thức</option>
          <option value="0">COD/Tiền mặt</option>
          <option value="1">VNPAY</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted">
          Không có đơn hàng nào
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="px-4 py-3 border-b border-subtle bg-section/60 text-xs text-muted flex items-center gap-2">
            <FiPackage size={14} />
            <span>
              Nhấn biểu tượng mắt để xem chi tiết, biểu tượng bút để cập nhật
              trạng thái.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-225">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Hình thức
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Thanh toán
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Payment Ref
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold">#{o.id}</td>
                    <td className="px-4 py-3 text-muted">
                      {o.khachHang?.tenKhachHang || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(o.ngayTao)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">
                      {formatCurrency(o.tongTienTra || o.tongTien)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          o.hinhThucDonHang === 0 ||
                          o.hinhThucDonHang === "COD/Tiền mặt"
                            ? "bg-section text-muted"
                            : "bg-blue-500/10 text-blue-600"
                        }`}
                      >
                        {getPaymentMethodText(o.hinhThucDonHang)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(o.trangThai)}`}
                      >
                        {getOrderStatusText(o.trangThai)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted text-xs">
                      {getPaymentStatusText(o.trangThaiThanhToan)}
                    </td>
                    <td className="px-4 py-3 text-center text-muted text-xs">
                      {o.paymentRef || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleViewDetail(o.id)}
                          className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                          title="Xem chi tiết"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(o)}
                          className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"
                          title="Cập nhật trạng thái"
                        >
                          <FiEdit size={15} />
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
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-subtle sticky top-0 bg-card">
              <h2 className="font-bold text-lg text-foreground">
                Chi tiết đơn hàng {selectedOrder ? `#${selectedOrder.id}` : ""}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4">
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
                      <span className="text-muted">SĐT nhận hàng: </span>
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

                  {/* Thông tin giá */}
                  <hr className="border-subtle" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted">Tổng tiền: </span>
                      <span className="font-medium">
                        {formatCurrency(selectedOrder.tongTien)}
                      </span>
                    </div>
                    {selectedOrder.tongTienGiam > 0 && (
                      <div>
                        <span className="text-muted">Tổng tiền giảm: </span>
                        <span className="font-medium text-red-500">
                          -{formatCurrency(selectedOrder.tongTienGiam)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted">Tổng thanh toán: </span>
                      <span className="font-bold text-blue-600">
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
                          <p className="font-medium truncate">
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
                        <span className="font-medium whitespace-nowrap">
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
      {showEditModal && editOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <h2 className="font-bold text-foreground">
                Cập nhật trạng thái đơn #{editOrder.id}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-muted mb-1">Trạng thái hiện tại</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(editOrder.trangThai)}`}
                >
                  {getOrderStatusText(editOrder.trangThai)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Trạng thái mới
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(Number(e.target.value))}
                  className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                >
                  {getValidNextStatuses(editOrder.trangThai).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-subtle rounded-lg text-sm text-foreground hover:bg-section"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover disabled:opacity-50"
                >
                  {updating ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Modal */}
      {showPosModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-subtle sticky top-0 bg-card">
              <h2 className="font-bold text-lg text-foreground">
                Tạo đơn hàng tại quầy
              </h2>
              <button
                onClick={() => setShowPosModal(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 space-y-5">
              {/* Customer ID */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Mã khách hàng{" "}
                  <span className="text-muted font-normal">
                    (không bắt buộc)
                  </span>
                </label>
                <input
                  type="number"
                  value={posCustomerId}
                  onChange={(e) => setPosCustomerId(e.target.value)}
                  placeholder="Nhập ID khách hàng..."
                  className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {/* Product Search */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Thêm sản phẩm
                </label>
                <form
                  onSubmit={handleProductSearch}
                  className="flex gap-2 mb-2"
                >
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm tên sản phẩm..."
                    className="flex-1 border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <button
                    type="submit"
                    className="bg-accent text-white px-3 py-2 rounded-lg text-sm hover:bg-accent-hover flex items-center gap-1"
                  >
                    <FiSearch size={14} />
                  </button>
                </form>
                {searchResults.length > 0 && (
                  <div className="border border-subtle rounded-lg divide-y divide-subtle text-sm">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="w-full px-3 py-2 text-left hover:bg-section flex justify-between"
                      >
                        <span>{p.tenSanPham}</span>
                        <span className="text-blue-600 font-medium">
                          {formatCurrency(p.giaBan)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {variants.length > 0 && selectedProduct && (
                  <div className="mt-2">
                    <p className="text-xs text-muted mb-1">
                      Chọn biến thể — {selectedProduct.tenSanPham}
                    </p>
                    <div className="border border-subtle rounded-lg divide-y divide-subtle text-sm">
                      {variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleAddVariant(v)}
                          className="w-full px-3 py-2 text-left hover:bg-accent/10 flex justify-between"
                        >
                          <span>
                            {v.tenMauSac} / {v.tenKichThuoc}
                          </span>
                          <span className="text-muted text-xs">
                            Tồn: {v.soLuong}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              {posItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Danh sách sản phẩm
                  </h3>
                  <div className="space-y-2">
                    {posItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm border border-subtle rounded-lg px-3 py-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.tenSanPham}</p>
                          <p className="text-xs text-muted">
                            {item.mauSac} / {item.kichThuoc}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateItemQty(idx, item.soLuong - 1)}
                            className="w-6 h-6 rounded border border-subtle text-center text-foreground"
                          >
                            −
                          </button>
                          <span className="w-6 text-center">
                            {item.soLuong}
                          </span>
                          <button
                            onClick={() => updateItemQty(idx, item.soLuong + 1)}
                            className="w-6 h-6 rounded border border-subtle text-center text-foreground"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-medium w-28 text-right text-blue-600">
                          {formatCurrency(item.giaBan * item.soLuong)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-subtle font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-blue-600 text-lg">
                      {formatCurrency(posTongTien)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPosModal(false)}
                  className="flex-1 px-4 py-2 border border-subtle rounded-lg text-sm text-foreground hover:bg-section"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitPos}
                  disabled={submittingPos || posItems.length === 0}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover disabled:opacity-50"
                >
                  {submittingPos ? "Đang tạo..." : "Xác nhận đơn hàng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
