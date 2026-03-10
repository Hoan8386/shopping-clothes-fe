"use client";

import { useEffect, useState } from "react";
import { DonHang } from "@/types";
import { orderService, OrderSearchParams } from "@/services/order.service";
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
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<number | undefined>();

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<DonHang | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Edit status modal
  const [editOrder, setEditOrder] = useState<DonHang | null>(null);
  const [newStatus, setNewStatus] = useState(0);
  const [newPaymentStatus, setNewPaymentStatus] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [page, filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: OrderSearchParams = {
        page,
        size: 10,
        trangThai: filterStatus,
      };
      const data = await orderService.getAll(params);
      setOrders(data.result);
      setTotalPages(data.meta.pages);
    } catch {
      toast.error("Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: number) => {
    try {
      const data = await orderService.getById(id);
      setSelectedOrder(data);
      setShowDetail(true);
    } catch {
      toast.error("Không tải được chi tiết");
    }
  };

  const openEdit = (order: DonHang) => {
    setEditOrder(order);
    setNewStatus(order.trangThai);
    setNewPaymentStatus(order.trangThaiThanhToan);
  };

  const handleUpdateStatus = async () => {
    if (!editOrder) return;
    try {
      await orderService.update({
        id: editOrder.id,
        trangThai: newStatus,
        trangThaiThanhToan: newPaymentStatus,
      } as DonHang);
      toast.success("Cập nhật thành công");
      setEditOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa đơn hàng này?")) return;
    try {
      await orderService.delete(id);
      toast.success("Đã xóa");
      fetchOrders();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem và xử lý các đơn hàng của khách hàng
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Tất cả", value: undefined },
            { label: "Chờ xác nhận", value: 0 },
            { label: "Đã xác nhận", value: 1 },
            { label: "Đang giao", value: 2 },
            { label: "Thành công", value: 3 },
            { label: "Đã hủy", value: 4 },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => {
                setFilterStatus(f.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                filterStatus === f.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hình thức
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-indigo-50/30 transition">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      #{o.id}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {formatDate(o.ngayTao)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-indigo-600">
                      {formatCurrency(o.tongTienTra || o.tongTien)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getOrderStatusColor(
                          o.trangThai,
                        )}`}
                      >
                        {getOrderStatusText(o.trangThai)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {getPaymentStatusText(o.trangThaiThanhToan)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${o.hinhThucDonHang === 0 ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-600"}`}
                      >
                        {o.hinhThucDonHang === 0 ? "Tại quầy" : "Online"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetail(o.id)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition"
                          title="Chi tiết"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(o)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                          title="Sửa trạng thái"
                        >
                          <FiEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(o.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                          title="Xóa"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      <FiShoppingCart className="mx-auto mb-2" size={24} />
                      Không có đơn hàng nào
                    </td>
                  </tr>
                )}
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
      {showDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">
              Chi tiết đơn #{selectedOrder.id}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Khách hàng:</span>{" "}
                  {selectedOrder.khachHang?.tenKhachHang || "—"}
                </div>
                <div>
                  <span className="text-gray-400">Địa chỉ:</span>{" "}
                  {selectedOrder.diaChi || "—"}
                </div>
              </div>
              <h3 className="font-semibold mt-4">Sản phẩm:</h3>
              {selectedOrder.chiTietDonHangs?.map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b">
                  <div>
                    <p>{item.chiTietSanPham?.tenSanPham || "SP"}</p>
                    <p className="text-xs text-gray-400">
                      {item.chiTietSanPham?.tenMauSac} /{" "}
                      {item.chiTietSanPham?.tenKichThuoc} × {item.soLuong}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(item.thanhTien)}
                  </p>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Tổng:</span>
                <span className="text-blue-600">
                  {formatCurrency(
                    selectedOrder.tongTienTra || selectedOrder.tongTien,
                  )}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowDetail(false)}
              className="mt-4 w-full py-2 border rounded-lg hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">
              Cập nhật đơn #{editOrder.id}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Trạng thái đơn hàng
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value={0}>Chờ xác nhận</option>
                  <option value={1}>Đã xác nhận</option>
                  <option value={2}>Đang giao</option>
                  <option value={3}>Thành công</option>
                  <option value={4}>Đã hủy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Trạng thái thanh toán
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value={0}>Chưa thanh toán</option>
                  <option value={1}>Đã thanh toán</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditOrder(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
