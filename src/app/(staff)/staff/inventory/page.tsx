"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PhieuNhap,
  CuaHang,
  NhaCungCap,
  ResChiTietSanPhamDTO,
  ResSanPhamDTO,
  RestResponse,
} from "@/types";
import {
  phieuNhapService,
  ReqPhieuNhapDTO,
  cuaHangService,
  nhaCungCapService,
} from "@/services/common.service";
import {
  productService,
  productVariantService,
} from "@/services/product.service";
import { formatDate } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEye,
  FiEdit,
  FiX,
  FiSearch,
  FiTrash2,
  FiCheckSquare,
} from "react-icons/fi";
import apiClient from "@/lib/api";

const TRANG_THAI_TEXT: Record<number, string> = {
  0: "Đã đặt",
  1: "Đã nhận",
  2: "Chậm giao",
  3: "Hủy",
  4: "Thiếu hàng",
  5: "Hoàn thành",
};

const TRANG_THAI_COLOR: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-700",
  1: "bg-blue-100 text-blue-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-red-100 text-red-600",
  4: "bg-purple-100 text-purple-700",
  5: "bg-green-100 text-green-700",
};

interface NhapItem {
  variantId: number;
  tenSanPham: string;
  mauSac: string;
  kichThuoc: string;
  soLuong: number;
  ghiTru: string;
}

export default function StaffInventoryPage() {
  const [receipts, setReceipts] = useState<PhieuNhap[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<number | undefined>();

  const [stores, setStores] = useState<CuaHang[]>([]);
  const [suppliers, setSuppliers] = useState<NhaCungCap[]>([]);

  // Detail modal
  const [selectedReceipt, setSelectedReceipt] = useState<PhieuNhap | null>(
    null,
  );
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit modal
  const [editReceipt, setEditReceipt] = useState<PhieuNhap | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    tenPhieuNhap: "",
    cuaHangId: 0,
    nhaCungCapId: 0,
    trangThai: 0,
  });
  const [updating, setUpdating] = useState(false);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    tenPhieuNhap: "",
    cuaHangId: 0,
    nhaCungCapId: 0,
  });
  const [nhapItems, setNhapItems] = useState<NhapItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ResSanPhamDTO[]>([]);
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ResSanPhamDTO | null>(
    null,
  );
  const [creating, setCreating] = useState(false);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, size: 15 };
      if (filterStatus !== undefined) params.trangThai = filterStatus;
      const data = await phieuNhapService.getAll(params);
      setReceipts(data.result);
      setTotalPages(data.meta.pages);
    } catch {
      toast.error("Không thể tải phiếu nhập");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  useEffect(() => {
    Promise.all([
      cuaHangService.getAll().catch(() => []),
      nhaCungCapService.getAll().catch(() => []),
    ]).then(([s, n]) => {
      setStores(Array.isArray(s) ? s : []);
      setSuppliers(Array.isArray(n) ? n : []);
    });
  }, []);

  const handleViewDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);
      const data = await phieuNhapService.getById(id);
      setSelectedReceipt(data);
    } catch {
      toast.error("Không thể tải chi tiết phiếu nhập");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (receipt: PhieuNhap) => {
    setEditReceipt(receipt);
    setEditForm({
      tenPhieuNhap: receipt.tenPhieuNhap,
      cuaHangId: receipt.cuaHang?.id || 0,
      nhaCungCapId: receipt.nhaCungCap?.id || 0,
      trangThai: receipt.trangThai,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editReceipt) return;
    try {
      setUpdating(true);
      await phieuNhapService.update({
        id: editReceipt.id,
        tenPhieuNhap: editForm.tenPhieuNhap,
        cuaHangId: editForm.cuaHangId,
        nhaCungCapId: editForm.nhaCungCapId,
        trangThai: editForm.trangThai,
      });
      toast.success("Cập nhật phiếu nhập thành công");
      setShowEditModal(false);
      fetchReceipts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleKiemKe = async (id: number) => {
    if (
      !confirm(
        "Xác nhận kiểm kê phiếu nhập này? Thao tác này sẽ cộng hàng vào kho.",
      )
    )
      return;
    try {
      await phieuNhapService.kiemKe(id);
      toast.success("Kiểm kê thành công");
      fetchReceipts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kiểm kê thất bại";
      toast.error(msg);
    }
  };

  // Product search for create modal
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
    const existing = nhapItems.findIndex((i) => i.variantId === variant.id);
    if (existing !== -1) {
      const updated = [...nhapItems];
      updated[existing].soLuong += 1;
      setNhapItems(updated);
    } else {
      setNhapItems([
        ...nhapItems,
        {
          variantId: variant.id,
          tenSanPham: variant.tenSanPham,
          mauSac: variant.tenMauSac,
          kichThuoc: variant.tenKichThuoc,
          soLuong: 1,
          ghiTru: "",
        },
      ]);
    }
    setVariants([]);
    setSelectedProduct(null);
  };

  const handleRemoveNhapItem = (idx: number) => {
    setNhapItems(nhapItems.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!createForm.tenPhieuNhap.trim()) {
      toast.error("Vui lòng nhập tên phiếu nhập");
      return;
    }
    if (!createForm.cuaHangId || !createForm.nhaCungCapId) {
      toast.error("Vui lòng chọn cửa hàng và nhà cung cấp");
      return;
    }
    try {
      setCreating(true);
      // Step 1: Create the receipt
      const payload: Omit<ReqPhieuNhapDTO, "id" | "trangThai"> = {
        tenPhieuNhap: createForm.tenPhieuNhap,
        cuaHangId: createForm.cuaHangId,
        nhaCungCapId: createForm.nhaCungCapId,
      };
      const receipt = await phieuNhapService.create(payload);

      // Step 2: Add items if any
      if (nhapItems.length > 0 && receipt?.id) {
        const itemPayloads = nhapItems.map((item) => ({
          phieuNhapId: receipt.id,
          chiTietSanPhamId: item.variantId,
          soLuong: item.soLuong,
          ghiTru: item.ghiTru || null,
        }));
        await apiClient
          .post<
            RestResponse<PhieuNhap>
          >("/chi-tiet-phieu-nhap/batch", itemPayloads)
          .catch(() => {
            toast.error("Phiếu nhập đã tạo nhưng không thể thêm sản phẩm");
          });
      }

      toast.success("Tạo phiếu nhập thành công");
      setShowCreateModal(false);
      setCreateForm({ tenPhieuNhap: "", cuaHangId: 0, nhaCungCapId: 0 });
      setNhapItems([]);
      fetchReceipts();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Tạo phiếu nhập thất bại";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    setCreateForm({
      tenPhieuNhap: "",
      cuaHangId: stores[0]?.id || 0,
      nhaCungCapId: suppliers[0]?.id || 0,
    });
    setNhapItems([]);
    setProductSearch("");
    setSearchResults([]);
    setSelectedProduct(null);
    setVariants([]);
    setShowCreateModal(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý kho hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Phiếu nhập hàng từ nhà cung cấp
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
        >
          <FiPlus size={16} /> Tạo phiếu nhập
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-2">
        {[
          { label: "Tất cả", value: undefined },
          { label: "Đã đặt", value: 0 },
          { label: "Đã nhận", value: 1 },
          { label: "Chậm giao", value: 2 },
          { label: "Hủy", value: 3 },
          { label: "Thiếu hàng", value: 4 },
          { label: "Hoàn thành", value: 5 },
        ].map((s) => (
          <button
            key={String(s.value)}
            onClick={() => {
              setFilterStatus(s.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filterStatus === s.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : receipts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Không có phiếu nhập nào
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Tên phiếu nhập
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Cửa hàng
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Nhà cung cấp
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Ngày đặt
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Ngày nhận
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {r.tenPhieuNhap}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.cuaHang?.tenCuaHang || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.nhaCungCap?.tenNhaCungCap || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.ngayTao ? formatDate(r.ngayTao) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.ngayNhanHang ? formatDate(r.ngayNhanHang) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${TRANG_THAI_COLOR[r.trangThai] || "bg-gray-100 text-gray-600"}`}
                    >
                      {TRANG_THAI_TEXT[r.trangThai] || r.trangThai}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleViewDetail(r.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <FiEye size={15} />
                      </button>
                      {r.trangThai !== 3 &&
                        r.trangThai !== 4 &&
                        r.trangThai !== 5 && (
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Cập nhật"
                          >
                            <FiEdit size={15} />
                          </button>
                        )}
                      {r.trangThai === 1 && (
                        <button
                          onClick={() => handleKiemKe(r.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Kiểm kê"
                        >
                          <FiCheckSquare size={15} />
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-lg">Chi tiết phiếu nhập</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4">
              {detailLoading ? (
                <Loading />
              ) : selectedReceipt ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Tên phiếu: </span>
                      <span className="font-medium">
                        {selectedReceipt.tenPhieuNhap}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Trạng thái: </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${TRANG_THAI_COLOR[selectedReceipt.trangThai]}`}
                      >
                        {TRANG_THAI_TEXT[selectedReceipt.trangThai]}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Cửa hàng: </span>
                      <span className="font-medium">
                        {selectedReceipt.cuaHang?.tenCuaHang || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Nhà cung cấp: </span>
                      <span className="font-medium">
                        {selectedReceipt.nhaCungCap?.tenNhaCungCap || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Ngày đặt: </span>
                      <span className="font-medium">
                        {selectedReceipt.ngayTao
                          ? formatDate(selectedReceipt.ngayTao)
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Ngày nhận: </span>
                      <span className="font-medium">
                        {selectedReceipt.ngayNhanHang
                          ? formatDate(selectedReceipt.ngayNhanHang)
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <hr />
                  <h3 className="font-semibold text-sm text-gray-700">
                    Sản phẩm trong phiếu
                  </h3>
                  {(selectedReceipt.chiTietPhieuNhaps || []).length === 0 ? (
                    <p className="text-sm text-gray-400">Chưa có sản phẩm</p>
                  ) : (
                    <div className="space-y-2">
                      {(selectedReceipt.chiTietPhieuNhaps || []).map(
                        (item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm border-b pb-2 last:border-0"
                          >
                            <div>
                              <p className="font-medium">
                                {item.chiTietSanPham?.tenSanPham ||
                                  `Mặt hàng #${idx + 1}`}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {item.chiTietSanPham?.tenMauSac} /{" "}
                                {item.chiTietSanPham?.tenKichThuoc}
                                {item.ghiTru && ` — ${item.ghiTru}`}
                              </p>
                            </div>
                            <span className="font-medium">
                              SL: {item.soLuong}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                  {selectedReceipt.trangThai === 1 && (
                    <button
                      onClick={() => {
                        setShowDetail(false);
                        handleKiemKe(selectedReceipt.id);
                      }}
                      className="w-full mt-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <FiCheckSquare size={16} /> Thực hiện kiểm kê
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold">
                Cập nhật phiếu nhập #{editReceipt.id}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên phiếu nhập
                </label>
                <input
                  value={editForm.tenPhieuNhap}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tenPhieuNhap: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cửa hàng
                </label>
                <select
                  value={editForm.cuaHangId}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      cuaHangId: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tenCuaHang}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhà cung cấp
                </label>
                <select
                  value={editForm.nhaCungCapId}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      nhaCungCapId: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tenNhaCungCap}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={editForm.trangThai}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      trangThai: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(TRANG_THAI_TEXT).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 disabled:opacity-50"
                >
                  {updating ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-lg">Tạo phiếu nhập mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên phiếu nhập *
                </label>
                <input
                  value={createForm.tenPhieuNhap}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      tenPhieuNhap: e.target.value,
                    })
                  }
                  placeholder="VD: Nhập hàng tháng 3 - CN Q.1"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cửa hàng *
                  </label>
                  <select
                    value={createForm.cuaHangId}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        cuaHangId: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={0}>-- Chọn cửa hàng --</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tenCuaHang}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhà cung cấp *
                  </label>
                  <select
                    value={createForm.nhaCungCapId}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        nhaCungCapId: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={0}>-- Chọn nhà cung cấp --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tenNhaCungCap}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thêm sản phẩm{" "}
                  <span className="text-gray-400 font-normal">
                    (không bắt buộc)
                  </span>
                </label>
                <form
                  onSubmit={handleProductSearch}
                  className="flex gap-2 mb-2"
                >
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm tên sản phẩm..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                  >
                    <FiSearch size={14} />
                  </button>
                </form>
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y text-sm">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      >
                        {p.tenSanPham}
                      </button>
                    ))}
                  </div>
                )}
                {variants.length > 0 && selectedProduct && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">
                      Chọn biến thể — {selectedProduct.tenSanPham}
                    </p>
                    <div className="border rounded-lg divide-y text-sm">
                      {variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleAddVariant(v)}
                          className="w-full px-3 py-2 text-left hover:bg-green-50 flex justify-between"
                        >
                          <span>
                            {v.tenMauSac} / {v.tenKichThuoc}
                          </span>
                          <span className="text-gray-400 text-xs">
                            Tồn hiện tại: {v.soLuong}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Items list */}
              {nhapItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Sản phẩm nhập
                  </h3>
                  <div className="space-y-2">
                    {nhapItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm border rounded-lg px-3 py-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.tenSanPham}</p>
                          <p className="text-xs text-gray-400">
                            {item.mauSac} / {item.kichThuoc}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">SL:</span>
                          <input
                            type="number"
                            min={1}
                            value={item.soLuong}
                            onChange={(e) => {
                              const updated = [...nhapItems];
                              updated[idx].soLuong = Math.max(
                                1,
                                Number(e.target.value),
                              );
                              setNhapItems(updated);
                            }}
                            className="w-16 border rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <input
                          value={item.ghiTru}
                          onChange={(e) => {
                            const updated = [...nhapItems];
                            updated[idx].ghiTru = e.target.value;
                            setNhapItems(updated);
                          }}
                          placeholder="Ghi chú..."
                          className="border rounded px-2 py-1 text-xs w-32"
                        />
                        <button
                          onClick={() => handleRemoveNhapItem(idx)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {creating ? "Đang tạo..." : "Tạo phiếu nhập"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
