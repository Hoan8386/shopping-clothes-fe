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
} from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEye, FiEdit, FiSearch, FiX, FiTrash2 } from "react-icons/fi";

const ORDER_STATUSES = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ xác nhận", value: 0 },
  { label: "Đã xác nhận", value: 1 },
  { label: "Đang đóng gói", value: 2 },
  { label: "Đang giao", value: 3 },
  { label: "Đã hủy", value: 4 },
  { label: "Đã nhận hàng", value: 5 },
];

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
    setEditOrder(order);
    setNewStatus(
      order.trangThai + 1 <= 5 ? order.trangThai + 1 : order.trangThai,
    );
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
      const vars = await productVariantService.getByProduct(product.id);
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
      } as DonHang;
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý đơn hàng
          </h1>
          <p className="text-sm text-muted mt-1">Xem và xử lý đơn hàng</p>
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

      {/* Filters */}
      <div className="bg-card rounded-xl border border-subtle p-4 mb-6 flex flex-wrap gap-3 items-center">
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
          <option value="0">Tại quầy</option>
          <option value="1">Online</option>
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
        <div className="bg-card rounded-xl border border-subtle overflow-hidden">
          <table className="w-full text-sm">
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
                  <td className="px-4 py-3 text-center text-muted">
                    {o.hinhThucDonHang === 0 ? "Tại quầy" : "Online"}
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
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleViewDetail(o.id)}
                        className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                        title="Xem chi tiết"
                      >
                        <FiEye size={15} />
                      </button>
                      {o.trangThai < 5 && o.trangThai !== 4 && (
                        <button
                          onClick={() => handleOpenEdit(o)}
                          className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"
                          title="Cập nhật trạng thái"
                        >
                          <FiEdit size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                        {selectedOrder.khachHang?.tenKhachHang || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">SĐT: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.khachHang?.sdt || "—"}
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
                        {selectedOrder.nhanVien?.tenNhanVien || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Tổng tiền: </span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(
                          selectedOrder.tongTienTra || selectedOrder.tongTien,
                        )}
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
                  </div>
                  <hr className="border-subtle" />
                  <h3 className="font-semibold text-sm text-foreground">
                    Sản phẩm
                  </h3>
                  <div className="space-y-2">
                    {(selectedOrder.chiTietDonHangs || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm border-b border-subtle pb-2"
                      >
                        <div>
                          <p className="font-medium">
                            {item.chiTietSanPham?.tenSanPham ||
                              `SP #${idx + 1}`}
                          </p>
                          <p className="text-muted text-xs">
                            {item.chiTietSanPham?.tenMauSac} /{" "}
                            {item.chiTietSanPham?.tenKichThuoc} × {item.soLuong}
                          </p>
                        </div>
                        <span className="font-medium">
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
                  {ORDER_STATUSES.filter(
                    (s) =>
                      s.value !== undefined && s.value !== editOrder.trangThai,
                  ).map((s) => (
                    <option key={s.value} value={s.value!}>
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
