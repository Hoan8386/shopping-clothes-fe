"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PhieuNhap,
  CuaHang,
  NhaCungCap,
  ChiTietPhieuNhap,
  ResChiTietSanPhamDTO,
  ResSanPhamDTO,
} from "@/types";
import {
  phieuNhapService,
  chiTietPhieuNhapService,
  ReqPhieuNhapDTO,
  PhieuNhapSearchParams,
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
  FiPackage,
  FiAlertTriangle,
  FiCheck,
  FiSave,
} from "react-icons/fi";

const TRANG_THAI_TEXT: Record<number, string> = {
  0: "Đã đặt",
  1: "Đã nhận",
  2: "Chậm giao",
  3: "Hủy",
  4: "Thiếu hàng",
  5: "Hoàn thành",
};

const TRANG_THAI_COLOR: Record<number, string> = {
  0: "bg-yellow-500/15 text-yellow-500",
  1: "bg-blue-500/15 text-blue-500",
  2: "bg-orange-500/15 text-orange-500",
  3: "bg-red-500/15 text-red-500",
  4: "bg-purple-500/15 text-purple-500",
  5: "bg-green-500/15 text-green-500",
};

const CT_TRANG_THAI_TEXT: Record<number, string> = {
  0: "Đủ",
  1: "Thiếu",
};

interface NhapItem {
  variantId: number;
  tenSanPham: string;
  mauSac: string;
  kichThuoc: string;
  soLuong: number;
  ghiTru: string;
}

export default function AdminInventoryPage() {
  const [receipts, setReceipts] = useState<PhieuNhap[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [searchName, setSearchName] = useState("");

  const [stores, setStores] = useState<CuaHang[]>([]);
  const [suppliers, setSuppliers] = useState<NhaCungCap[]>([]);

  // Detail modal
  const [selectedReceipt, setSelectedReceipt] = useState<PhieuNhap | null>(
    null,
  );
  const [detailItems, setDetailItems] = useState<ChiTietPhieuNhap[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Detail - item editing (for pre-kiểm kê)
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemEditForm, setItemEditForm] = useState({
    soLuongThieu: 0,
    ghiTruKiemHang: "",
    trangThai: 0,
  });
  const [savingItem, setSavingItem] = useState(false);

  // Detail - add item
  const [showAddItem, setShowAddItem] = useState(false);
  const [addProductSearch, setAddProductSearch] = useState("");
  const [addSearchResults, setAddSearchResults] = useState<ResSanPhamDTO[]>([]);
  const [addVariants, setAddVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [addSelectedProduct, setAddSelectedProduct] =
    useState<ResSanPhamDTO | null>(null);
  const [addItemForm, setAddItemForm] = useState({
    variantId: 0,
    soLuong: 1,
    ghiTru: "",
  });
  const [addingItem, setAddingItem] = useState(false);

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
      const params: PhieuNhapSearchParams = { page, size: 15 };
      if (filterStatus !== undefined) params.trangThai = filterStatus;
      if (searchName.trim()) params.tenPhieuNhap = searchName.trim();
      const data = await phieuNhapService.getAll(params);
      setReceipts(data.result);
      setTotalPages(data.meta.pages);
    } catch {
      toast.error("Không thể tải phiếu nhập");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, searchName]);

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

  // ==================== VIEW DETAIL ====================
  const handleViewDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);
      setEditingItemId(null);
      setShowAddItem(false);
      const [receipt, items] = await Promise.all([
        phieuNhapService.getById(id),
        chiTietPhieuNhapService.getByPhieuNhap(id),
      ]);
      setSelectedReceipt(receipt);
      setDetailItems(Array.isArray(items) ? items : []);
    } catch {
      toast.error("Không thể tải chi tiết phiếu nhập");
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetailItems = async (phieuNhapId: number) => {
    try {
      const items = await chiTietPhieuNhapService.getByPhieuNhap(phieuNhapId);
      setDetailItems(Array.isArray(items) ? items : []);
    } catch {
      /* ignore */
    }
  };

  // ==================== DELETE PHIEU NHAP (ADMIN ONLY) ====================
  const handleDeleteReceipt = async (id: number) => {
    if (!confirm("Xác nhận xóa phiếu nhập này? Thao tác không thể hoàn tác."))
      return;
    try {
      await phieuNhapService.delete(id);
      toast.success("Đã xóa phiếu nhập");
      if (showDetail && selectedReceipt?.id === id) {
        setShowDetail(false);
        setSelectedReceipt(null);
      }
      fetchReceipts();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Xóa phiếu nhập thất bại";
      toast.error(msg);
    }
  };

  // ==================== DETAIL - EDIT ITEM (pre-kiểm kê) ====================
  const startEditItem = (item: ChiTietPhieuNhap) => {
    setEditingItemId(item.id);
    setItemEditForm({
      soLuongThieu: item.soLuongThieu ?? 0,
      ghiTruKiemHang: item.ghiTruKiemHang ?? "",
      trangThai: item.trangThai,
    });
  };

  const handleSaveItemEdit = async (item: ChiTietPhieuNhap) => {
    if (!selectedReceipt) return;
    try {
      setSavingItem(true);
      await chiTietPhieuNhapService.update({
        id: item.id,
        phieuNhapId: selectedReceipt.id,
        chiTietSanPhamId: item.chiTietSanPham?.id || 0,
        soLuong: item.soLuong,
        soLuongThieu:
          itemEditForm.trangThai === 1 ? itemEditForm.soLuongThieu : null,
        ghiTru: item.ghiTru,
        ghiTruKiemHang: itemEditForm.ghiTruKiemHang || null,
        trangThai: itemEditForm.trangThai,
      });
      toast.success("Cập nhật mặt hàng thành công");
      setEditingItemId(null);
      await refreshDetailItems(selectedReceipt.id);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Cập nhật mặt hàng thất bại";
      toast.error(msg);
    } finally {
      setSavingItem(false);
    }
  };

  // ==================== DETAIL - ADD ITEM ====================
  const handleAddProductSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addProductSearch.trim()) return;
    try {
      const data = await productService.getAll({
        tenSanPham: addProductSearch,
        size: 5,
      });
      setAddSearchResults(data.result);
    } catch {
      toast.error("Không tìm thấy sản phẩm");
    }
  };

  const handleAddSelectProduct = async (product: ResSanPhamDTO) => {
    setAddSelectedProduct(product);
    setAddSearchResults([]);
    setAddProductSearch("");
    try {
      const vars = await productVariantService.getByProduct(product.id);
      setAddVariants(Array.isArray(vars) ? vars : []);
    } catch {
      toast.error("Không thể tải biến thể sản phẩm");
    }
  };

  const handleAddSelectVariant = (v: ResChiTietSanPhamDTO) => {
    setAddItemForm({ variantId: v.id, soLuong: 1, ghiTru: "" });
    setAddVariants([]);
    setAddSelectedProduct(null);
  };

  const handleConfirmAddItem = async () => {
    if (!selectedReceipt || !addItemForm.variantId) return;
    try {
      setAddingItem(true);
      await chiTietPhieuNhapService.create({
        phieuNhapId: selectedReceipt.id,
        chiTietSanPhamId: addItemForm.variantId,
        soLuong: addItemForm.soLuong,
        ghiTru: addItemForm.ghiTru || null,
        trangThai: 0,
      });
      toast.success("Thêm mặt hàng thành công");
      setShowAddItem(false);
      setAddItemForm({ variantId: 0, soLuong: 1, ghiTru: "" });
      await refreshDetailItems(selectedReceipt.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thêm mặt hàng thất bại";
      toast.error(msg);
    } finally {
      setAddingItem(false);
    }
  };

  // ==================== DETAIL - DELETE ITEM ====================
  const handleDeleteItem = async (itemId: number) => {
    if (!selectedReceipt) return;
    if (!confirm("Xác nhận xóa mặt hàng này?")) return;
    try {
      await chiTietPhieuNhapService.delete(itemId);
      toast.success("Đã xóa mặt hàng");
      await refreshDetailItems(selectedReceipt.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa mặt hàng thất bại";
      toast.error(msg);
    }
  };

  // ==================== EDIT RECEIPT ====================
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
      const canChange =
        editReceipt.trangThai === 0 || editReceipt.trangThai === 2;
      const payload: ReqPhieuNhapDTO & { id: number } = {
        id: editReceipt.id,
        tenPhieuNhap: editForm.tenPhieuNhap,
        cuaHangId: editForm.cuaHangId,
        nhaCungCapId: editForm.nhaCungCapId,
        trangThai: canChange ? editForm.trangThai : editReceipt.trangThai,
      };
      await phieuNhapService.update(payload);
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

  // ==================== KIEM KE ====================
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
      if (showDetail && selectedReceipt?.id === id) {
        const receipt = await phieuNhapService.getById(id);
        setSelectedReceipt(receipt);
        await refreshDetailItems(id);
      }
      fetchReceipts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kiểm kê thất bại";
      toast.error(msg);
    }
  };

  // ==================== CREATE RECEIPT ====================
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
      const receipt = await phieuNhapService.create({
        tenPhieuNhap: createForm.tenPhieuNhap,
        cuaHangId: createForm.cuaHangId,
        nhaCungCapId: createForm.nhaCungCapId,
      });

      if (nhapItems.length > 0 && receipt?.id) {
        let failCount = 0;
        for (const item of nhapItems) {
          try {
            await chiTietPhieuNhapService.create({
              phieuNhapId: receipt.id,
              chiTietSanPhamId: item.variantId,
              soLuong: item.soLuong,
              ghiTru: item.ghiTru || null,
              trangThai: 0,
            });
          } catch {
            failCount++;
          }
        }
        if (failCount > 0) {
          toast.error(
            `Phiếu nhập đã tạo nhưng ${failCount} sản phẩm không thể thêm`,
          );
        }
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

  // Helper functions
  const canManageItems = (status: number) => status === 0 || status === 2;
  const canInspectItems = (status: number) => status === 1;
  const canChangeStatus = (currentStatus: number) =>
    currentStatus === 0 || currentStatus === 2;
  const getAvailableStatuses = (currentStatus: number): number[] => {
    if (currentStatus === 0) return [0, 1, 2, 3];
    if (currentStatus === 2) return [1, 2, 3];
    return [currentStatus];
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý phiếu nhập
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Phiếu nhập hàng từ nhà cung cấp
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition shadow-sm font-medium"
        >
          <FiPlus size={16} /> Tạo phiếu nhập
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                filterStatus === s.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Tìm theo tên phiếu nhập..."
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  fetchReceipts();
                }
              }}
            />
          </div>
          <button
            onClick={() => {
              setPage(1);
              fetchReceipts();
            }}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition"
          >
            <FiSearch size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : receipts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Không có phiếu nhập nào
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tên phiếu nhập
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cửa hàng
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ngày đặt
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ngày nhận
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-indigo-50/30 transition">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {r.tenPhieuNhap}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {r.cuaHang?.tenCuaHang || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {r.nhaCungCap?.tenNhaCungCap || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {r.ngayDatHang ? formatDate(r.ngayDatHang) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {r.ngayNhanHang ? formatDate(r.ngayNhanHang) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${TRANG_THAI_COLOR[r.trangThai] || "bg-gray-100 text-gray-600"}`}
                      >
                        {TRANG_THAI_TEXT[r.trangThai] || r.trangThai}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleViewDetail(r.id)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                          title="Xem chi tiết"
                        >
                          <FiEye size={15} />
                        </button>
                        {r.trangThai !== 3 &&
                          r.trangThai !== 4 &&
                          r.trangThai !== 5 && (
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition"
                              title="Cập nhật"
                            >
                              <FiEdit size={15} />
                            </button>
                          )}
                        {r.trangThai === 1 && (
                          <button
                            onClick={() => handleKiemKe(r.id)}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                            title="Kiểm kê"
                          >
                            <FiCheckSquare size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReceipt(r.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                          title="Xóa phiếu nhập"
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
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* ==================== DETAIL MODAL ==================== */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg text-gray-900">
                Chi tiết phiếu nhập
              </h2>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setEditingItemId(null);
                  setShowAddItem(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4">
              {detailLoading ? (
                <Loading />
              ) : selectedReceipt ? (
                <div className="space-y-5">
                  {/* Receipt info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Tên phiếu: </span>
                      <span className="font-medium text-gray-900">
                        {selectedReceipt.tenPhieuNhap}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Trạng thái: </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium ${TRANG_THAI_COLOR[selectedReceipt.trangThai]}`}
                      >
                        {selectedReceipt.trangThaiText ||
                          TRANG_THAI_TEXT[selectedReceipt.trangThai]}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cửa hàng: </span>
                      <span className="font-medium text-gray-900">
                        {selectedReceipt.cuaHang?.tenCuaHang || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Nhà cung cấp: </span>
                      <span className="font-medium text-gray-900">
                        {selectedReceipt.nhaCungCap?.tenNhaCungCap || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Ngày đặt hàng: </span>
                      <span className="font-medium text-gray-900">
                        {selectedReceipt.ngayDatHang
                          ? formatDate(selectedReceipt.ngayDatHang)
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Ngày nhận hàng: </span>
                      <span className="font-medium text-gray-900">
                        {selectedReceipt.ngayNhanHang
                          ? formatDate(selectedReceipt.ngayNhanHang)
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Ngày tạo: </span>
                      <span className="font-medium text-gray-900">
                        {selectedReceipt.ngayTao
                          ? formatDate(selectedReceipt.ngayTao)
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cập nhật: </span>
                      <span className="font-medium text-gray-900">
                        {selectedReceipt.ngayCapNhat
                          ? formatDate(selectedReceipt.ngayCapNhat)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Items header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                      <FiPackage size={16} /> Sản phẩm trong phiếu (
                      {detailItems.length})
                    </h3>
                    {canManageItems(selectedReceipt.trangThai) && (
                      <button
                        onClick={() => {
                          setShowAddItem(!showAddItem);
                          setAddProductSearch("");
                          setAddSearchResults([]);
                          setAddVariants([]);
                          setAddSelectedProduct(null);
                          setAddItemForm({
                            variantId: 0,
                            soLuong: 1,
                            ghiTru: "",
                          });
                        }}
                        className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition"
                      >
                        <FiPlus size={12} /> Thêm SP
                      </button>
                    )}
                  </div>

                  {/* Inspection hint */}
                  {canInspectItems(selectedReceipt.trangThai) && (
                    <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-400">
                      <FiAlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <span>
                        Phiếu nhập đã nhận hàng. Bạn có thể cập nhật số lượng
                        thiếu và ghi chú kiểm hàng cho từng sản phẩm trước khi
                        kiểm kê.
                      </span>
                    </div>
                  )}

                  {/* Add item form */}
                  {showAddItem && canManageItems(selectedReceipt.trangThai) && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-3">
                      <p className="text-xs font-medium text-gray-900">
                        Thêm sản phẩm mới
                      </p>
                      {addItemForm.variantId === 0 ? (
                        <>
                          <form
                            onSubmit={handleAddProductSearch}
                            className="flex gap-2"
                          >
                            <input
                              value={addProductSearch}
                              onChange={(e) =>
                                setAddProductSearch(e.target.value)
                              }
                              placeholder="Tìm tên sản phẩm..."
                              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                            />
                            <button
                              type="submit"
                              className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs hover:bg-indigo-700 transition"
                            >
                              <FiSearch size={12} />
                            </button>
                          </form>
                          {addSearchResults.length > 0 && (
                            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 text-xs">
                              {addSearchResults.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => handleAddSelectProduct(p)}
                                  className="w-full px-3 py-2 text-left hover:bg-indigo-50/30 text-gray-700"
                                >
                                  {p.tenSanPham}
                                </button>
                              ))}
                            </div>
                          )}
                          {addVariants.length > 0 && addSelectedProduct && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Chọn biến thể — {addSelectedProduct.tenSanPham}
                              </p>
                              <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 text-xs">
                                {addVariants.map((v) => (
                                  <button
                                    key={v.id}
                                    onClick={() => handleAddSelectVariant(v)}
                                    className="w-full px-3 py-2 text-left hover:bg-indigo-50/30 flex justify-between text-gray-700"
                                  >
                                    <span>
                                      {v.tenMauSac} / {v.tenKichThuoc}
                                    </span>
                                    <span className="text-gray-400">
                                      Tồn: {v.soLuong}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min={1}
                            value={addItemForm.soLuong}
                            onChange={(e) =>
                              setAddItemForm({
                                ...addItemForm,
                                soLuong: Math.max(1, Number(e.target.value)),
                              })
                            }
                            className="w-20 border border-gray-200 rounded-xl px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            placeholder="SL"
                          />
                          <input
                            value={addItemForm.ghiTru}
                            onChange={(e) =>
                              setAddItemForm({
                                ...addItemForm,
                                ghiTru: e.target.value,
                              })
                            }
                            placeholder="Ghi chú..."
                            className="flex-1 border border-gray-200 rounded-xl px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          />
                          <button
                            onClick={handleConfirmAddItem}
                            disabled={addingItem}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                          >
                            {addingItem ? "..." : "Thêm"}
                          </button>
                          <button
                            onClick={() =>
                              setAddItemForm({
                                variantId: 0,
                                soLuong: 1,
                                ghiTru: "",
                              })
                            }
                            className="text-gray-400 hover:text-gray-600 text-xs px-2"
                          >
                            Hủy
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items list */}
                  {detailItems.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">
                      Chưa có sản phẩm trong phiếu nhập
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detailItems.map((item) => (
                        <div
                          key={item.id}
                          className="border border-gray-100 rounded-xl p-3 text-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">
                                {item.chiTietSanPham?.tenSanPham ||
                                  `Mặt hàng #${item.id}`}
                              </p>
                              <p className="text-gray-500 text-xs mt-0.5">
                                {item.chiTietSanPham?.tenMauSac} /{" "}
                                {item.chiTietSanPham?.tenKichThuoc}
                                {item.ghiTru && (
                                  <span className="ml-2 italic">
                                    — {item.ghiTru}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-gray-700 font-medium">
                                SL: {item.soLuong}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-xs font-medium ${
                                  item.trangThai === 0
                                    ? "bg-green-500/15 text-green-600"
                                    : "bg-red-500/15 text-red-500"
                                }`}
                              >
                                {item.trangThaiText ||
                                  CT_TRANG_THAI_TEXT[item.trangThai] ||
                                  item.trangThai}
                              </span>
                            </div>
                          </div>

                          {/* Show inspection info */}
                          {(item.soLuongThieu != null ||
                            item.ghiTruKiemHang) && (
                            <div className="mt-2 flex gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5">
                              {item.soLuongThieu != null && (
                                <span>
                                  SL thiếu:{" "}
                                  <span className="text-red-500 font-medium">
                                    {item.soLuongThieu}
                                  </span>
                                </span>
                              )}
                              {item.ghiTruKiemHang && (
                                <span>
                                  Kiểm hàng:{" "}
                                  <span className="text-gray-700">
                                    {item.ghiTruKiemHang}
                                  </span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Inline edit for inspection (status=1) */}
                          {canInspectItems(selectedReceipt.trangThai) &&
                            editingItemId === item.id && (
                              <div className="mt-2 bg-gray-50 rounded-xl p-2 space-y-2">
                                <div className="flex gap-2 items-center flex-wrap">
                                  <label className="text-xs text-gray-500">
                                    Trạng thái:
                                  </label>
                                  <select
                                    value={itemEditForm.trangThai}
                                    onChange={(e) =>
                                      setItemEditForm({
                                        ...itemEditForm,
                                        trangThai: Number(e.target.value),
                                      })
                                    }
                                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                  >
                                    <option value={0}>Đủ</option>
                                    <option value={1}>Thiếu</option>
                                  </select>
                                  {itemEditForm.trangThai === 1 && (
                                    <>
                                      <label className="text-xs text-gray-500">
                                        SL thiếu:
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={item.soLuong}
                                        value={itemEditForm.soLuongThieu}
                                        onChange={(e) =>
                                          setItemEditForm({
                                            ...itemEditForm,
                                            soLuongThieu: Math.max(
                                              0,
                                              Number(e.target.value),
                                            ),
                                          })
                                        }
                                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                      />
                                    </>
                                  )}
                                </div>
                                <div className="flex gap-2 items-center">
                                  <input
                                    value={itemEditForm.ghiTruKiemHang}
                                    onChange={(e) =>
                                      setItemEditForm({
                                        ...itemEditForm,
                                        ghiTruKiemHang: e.target.value,
                                      })
                                    }
                                    placeholder="Ghi chú kiểm hàng..."
                                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                  />
                                  <button
                                    onClick={() => handleSaveItemEdit(item)}
                                    disabled={savingItem}
                                    className="bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1 transition"
                                  >
                                    <FiSave size={10} />{" "}
                                    {savingItem ? "..." : "Lưu"}
                                  </button>
                                  <button
                                    onClick={() => setEditingItemId(null)}
                                    className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            )}

                          {/* Action buttons */}
                          <div className="mt-2 flex gap-2">
                            {canInspectItems(selectedReceipt.trangThai) &&
                              editingItemId !== item.id && (
                                <button
                                  onClick={() => startEditItem(item)}
                                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                >
                                  <FiEdit size={11} /> Kiểm hàng
                                </button>
                              )}
                            {canManageItems(selectedReceipt.trangThai) && (
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                              >
                                <FiTrash2 size={11} /> Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Kiểm kê button */}
                  {selectedReceipt.trangThai === 1 && (
                    <button
                      onClick={() => handleKiemKe(selectedReceipt.id)}
                      className="w-full mt-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium transition"
                    >
                      <FiCheckSquare size={16} /> Thực hiện kiểm kê
                    </button>
                  )}

                  {/* Status summary for completed/missing */}
                  {(selectedReceipt.trangThai === 4 ||
                    selectedReceipt.trangThai === 5) && (
                    <div
                      className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                        selectedReceipt.trangThai === 5
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}
                    >
                      {selectedReceipt.trangThai === 5 ? (
                        <>
                          <FiCheck size={16} /> Phiếu nhập đã kiểm kê hoàn thành
                          — tất cả sản phẩm đầy đủ
                        </>
                      ) : (
                        <>
                          <FiAlertTriangle size={16} /> Phiếu nhập đã kiểm kê —
                          có sản phẩm thiếu hàng
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT MODAL ==================== */}
      {showEditModal && editReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                Cập nhật phiếu nhập #{editReceipt.id}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
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
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
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
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
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
                  {!canChangeStatus(editReceipt.trangThai) && (
                    <span className="text-xs text-gray-400 font-normal ml-2">
                      (không thể thay đổi)
                    </span>
                  )}
                </label>
                <select
                  value={editForm.trangThai}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      trangThai: Number(e.target.value),
                    })
                  }
                  disabled={!canChangeStatus(editReceipt.trangThai)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition disabled:opacity-50"
                >
                  {getAvailableStatuses(editReceipt.trangThai).map((val) => (
                    <option key={val} value={val}>
                      {TRANG_THAI_TEXT[val]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {updating ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE MODAL ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-lg text-gray-900">
                Tạo phiếu nhập mới
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
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
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
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
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
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
                  <div className="relative flex-1">
                    <FiSearch
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={14}
                    />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Tìm tên sản phẩm..."
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-3 py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition"
                  >
                    <FiSearch size={14} />
                  </button>
                </form>
                {searchResults.length > 0 && (
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 text-sm">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="w-full px-3 py-2 text-left hover:bg-indigo-50/30 text-gray-700"
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
                    <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 text-sm">
                      {variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleAddVariant(v)}
                          className="w-full px-3 py-2 text-left hover:bg-indigo-50/30 flex justify-between"
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
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Sản phẩm nhập
                  </h3>
                  <div className="space-y-2">
                    {nhapItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm border border-gray-100 rounded-xl px-3 py-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.tenSanPham}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.mauSac} / {item.kichThuoc}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">SL:</span>
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
                            className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
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
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-32 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                        <button
                          onClick={() => handleRemoveNhapItem(idx)}
                          className="text-red-400 hover:text-red-600 transition"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
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
