"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PhieuNhap,
  CuaHang,
  NhaCungCap,
  ChiTietPhieuNhap,
  ResChiTietSanPhamDTO,
  ResSanPhamDTO,
  InventorySuggestionItem,
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

const RECEIPT_STATUS_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

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
  const [activeTab, setActiveTab] = useState<"receipts" | "suggestions">(
    "receipts",
  );
  const [receipts, setReceipts] = useState<PhieuNhap[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStoreId, setFilterStoreId] = useState<number | undefined>();
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
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

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
  const [kiemKeProcessingId, setKiemKeProcessingId] = useState<number | null>(
    null,
  );
  const [deletingReceiptId, setDeletingReceiptId] = useState<number | null>(
    null,
  );

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

  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<InventorySuggestionItem[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState<
    "SAP_HET" | "CON_HANG" | "DA_HET"
  >("SAP_HET");
  const [suggestionStoreId, setSuggestionStoreId] = useState<
    number | undefined
  >();
  const [nearOutThreshold, setNearOutThreshold] = useState(10);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const params: PhieuNhapSearchParams = { page, size: 15 };
      if (filterStoreId !== undefined) params.cuaHangId = filterStoreId;
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
  }, [page, filterStoreId, filterStatus, searchName]);

  const fetchSuggestions = useCallback(async () => {
    try {
      setSuggestionLoading(true);
      const data = await phieuNhapService.getInventorySuggestions({
        status: suggestionStatus,
        nearOutThreshold,
        cuaHangId: suggestionStoreId,
      });
      setSuggestions(data?.items ?? []);
    } catch {
      toast.error("Không thể tải gợi ý nhập hàng");
    } finally {
      setSuggestionLoading(false);
    }
  }, [suggestionStatus, suggestionStoreId, nearOutThreshold]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  useEffect(() => {
    if (activeTab === "suggestions") {
      fetchSuggestions();
    }
  }, [activeTab, fetchSuggestions]);

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
      setDeletingReceiptId(id);
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
    } finally {
      setDeletingReceiptId(null);
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
    if (itemEditForm.trangThai === 1) {
      if (
        !Number.isFinite(itemEditForm.soLuongThieu) ||
        itemEditForm.soLuongThieu <= 0
      ) {
        toast.error("Số lượng thiếu phải lớn hơn 0");
        return;
      }
      if (itemEditForm.soLuongThieu > item.soLuong) {
        toast.error("Số lượng thiếu không được vượt quá số lượng đặt");
        return;
      }
    }
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
    if (!Number.isFinite(addItemForm.soLuong) || addItemForm.soLuong <= 0) {
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }
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
      setDeletingItemId(itemId);
      await chiTietPhieuNhapService.delete(itemId);
      toast.success("Đã xóa mặt hàng");
      await refreshDetailItems(selectedReceipt.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa mặt hàng thất bại";
      toast.error(msg);
    } finally {
      setDeletingItemId(null);
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
      setKiemKeProcessingId(id);
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
    } finally {
      setKiemKeProcessingId(null);
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
    const hasInvalidQuantity = nhapItems.some(
      (item) => !Number.isFinite(item.soLuong) || item.soLuong <= 0,
    );
    if (hasInvalidQuantity) {
      toast.error("Tất cả số lượng nhập phải lớn hơn 0");
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

  const handleQuickImportFromSuggestion = (item: InventorySuggestionItem) => {
    const defaultStoreId = item.maCuaHang || stores[0]?.id || 0;
    const defaultSupplierId = suppliers[0]?.id || 0;

    if (!defaultStoreId) {
      toast.error("Không tìm thấy cửa hàng để tạo phiếu nhập");
      return;
    }
    if (!defaultSupplierId) {
      toast.error("Chưa có nhà cung cấp, vui lòng tạo nhà cung cấp trước");
      return;
    }

    const goiYSoLuong =
      item.trangThaiTonKho === "DA_HET"
        ? Math.max(nearOutThreshold, 10)
        : Math.max(nearOutThreshold - item.soLuong + 5, 1);

    setCreateForm({
      tenPhieuNhap: `Nhập hàng gợi ý - ${item.tenSanPham || "Sản phẩm"}`,
      cuaHangId: defaultStoreId,
      nhaCungCapId: defaultSupplierId,
    });
    setNhapItems([
      {
        variantId: item.chiTietSanPhamId,
        tenSanPham: item.tenSanPham || "Sản phẩm",
        mauSac: item.tenMauSac || "--",
        kichThuoc: item.tenKichThuoc || "--",
        soLuong: goiYSoLuong,
        ghiTru: "Tạo từ gợi ý nhập hàng",
      },
    ]);
    setProductSearch("");
    setSearchResults([]);
    setSelectedProduct(null);
    setVariants([]);

    setActiveTab("receipts");
    setShowCreateModal(true);
  };

  // Helper functions
  const canManageItems = (status: number) => status === 0 || status === 2;
  const canInspectItems = (status: number) => status === 1;
  const canChangeStatus = (currentStatus: number) =>
    currentStatus === 0 || currentStatus === 2 || currentStatus === 4;
  const isStatusOptionDisabled = (
    currentStatus: number,
    optionStatus: number,
  ) => {
    if (currentStatus === 4) {
      return optionStatus !== 4 && optionStatus !== 5;
    }

    if (!canChangeStatus(currentStatus)) {
      return optionStatus !== currentStatus;
    }

    return false;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {activeTab === "receipts"
              ? "Quản lý phiếu nhập"
              : "Gợi ý nhập hàng"}
          </h1>
          <p className="text-sm text-muted mt-1">
            {activeTab === "receipts"
              ? "Phiếu nhập hàng từ nhà cung cấp"
              : "Danh sách biến thể sắp hết hoặc hết hàng để admin nhập thêm"}
          </p>
        </div>
        {activeTab === "receipts" && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl text-sm hover:bg-accent-hover transition shadow-sm font-medium"
          >
            <FiPlus size={16} /> Tạo phiếu nhập
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-subtle p-2 inline-flex gap-2">
        <button
          onClick={() => setActiveTab("receipts")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "receipts"
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground hover:bg-section"
          }`}
        >
          Phiếu nhập
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === "suggestions"
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground hover:bg-section"
          }`}
        >
          Gợi ý nhập hàng
        </button>
      </div>

      {activeTab === "receipts" && (
        <>
          {/* Filters */}
          <div className="bg-card rounded-2xl border border-subtle p-4 space-y-3">
            <div className="w-full sm:max-w-sm">
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
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.tenCuaHang}
                  </option>
                ))}
              </select>
            </div>
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
                      ? "bg-accent text-white shadow-sm"
                      : "bg-section text-muted hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FiSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  size={14}
                />
                <input
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Tìm theo tên phiếu nhập..."
                  className="w-full pl-10 pr-3 py-2.5 border border-subtle bg-background text-foreground rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
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
                className="bg-accent text-white px-4 py-2.5 rounded-xl text-sm hover:bg-accent-hover transition"
              >
                <FiSearch size={14} />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <Loading />
          ) : receipts.length === 0 ? (
            <div className="text-center py-16 text-muted">
              {filterStoreId
                ? "Không có phiếu nhập cho cửa hàng đã chọn"
                : "Không có phiếu nhập nào"}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-section border-b border-subtle">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Tên phiếu nhập
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Cửa hàng
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Nhà cung cấp
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Ngày đặt
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Ngày nhận
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {receipts.map((r) => (
                      <tr key={r.id} className="hover:bg-section transition">
                        <td className="px-5 py-3.5 text-muted">{r.id}</td>
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          {r.tenPhieuNhap}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {r.cuaHang?.tenCuaHang || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {r.nhaCungCap?.tenNhaCungCap || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {r.ngayDatHang ? formatDate(r.ngayDatHang) : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {r.ngayNhanHang ? formatDate(r.ngayNhanHang) : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${TRANG_THAI_COLOR[r.trangThai] || "bg-section text-muted"}`}
                          >
                            {TRANG_THAI_TEXT[r.trangThai] || r.trangThai}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleViewDetail(r.id)}
                              className="p-2 rounded-lg text-sky-600 hover:bg-sky-500/10 transition"
                              title="Xem chi tiết"
                            >
                              <FiEye size={15} />
                            </button>
                            {r.trangThai !== 3 &&
                              r.trangThai !== 4 &&
                              r.trangThai !== 5 && (
                                <button
                                  onClick={() => handleOpenEdit(r)}
                                  className="p-2 rounded-lg text-amber-500 hover:bg-amber-500/10 transition"
                                  title="Cập nhật"
                                >
                                  <FiEdit size={15} />
                                </button>
                              )}
                            {r.trangThai === 1 && (
                              <button
                                onClick={() => handleKiemKe(r.id)}
                                disabled={kiemKeProcessingId === r.id}
                                className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition disabled:opacity-50"
                                title="Kiểm kê"
                              >
                                <FiCheckSquare
                                  size={15}
                                  className={
                                    kiemKeProcessingId === r.id
                                      ? "animate-spin"
                                      : ""
                                  }
                                />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteReceipt(r.id)}
                              disabled={deletingReceiptId === r.id}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition disabled:opacity-50"
                              title="Xóa phiếu nhập"
                            >
                              <FiTrash2
                                size={15}
                                className={
                                  deletingReceiptId === r.id
                                    ? "animate-pulse"
                                    : ""
                                }
                              />
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-subtle sticky top-0 bg-card/95 backdrop-blur z-10 rounded-t-2xl">
                  <h2 className="font-bold text-foreground">
                    Chi tiết phiếu nhập
                  </h2>
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      setEditingItemId(null);
                      setShowAddItem(false);
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <div className="px-6 py-5">
                  {detailLoading ? (
                    <Loading />
                  ) : selectedReceipt ? (
                    <div className="space-y-5">
                      {/* Receipt info */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted">Tên phiếu: </span>
                          <span className="font-medium text-foreground">
                            {selectedReceipt.tenPhieuNhap}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted">Trạng thái: </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-medium ${TRANG_THAI_COLOR[selectedReceipt.trangThai]}`}
                          >
                            {selectedReceipt.trangThaiText ||
                              TRANG_THAI_TEXT[selectedReceipt.trangThai]}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted">Cửa hàng: </span>
                          <span className="font-medium text-foreground">
                            {selectedReceipt.cuaHang?.tenCuaHang || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted">Nhà cung cấp: </span>
                          <span className="font-medium text-foreground">
                            {selectedReceipt.nhaCungCap?.tenNhaCungCap || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted">Ngày đặt hàng: </span>
                          <span className="font-medium text-foreground">
                            {selectedReceipt.ngayDatHang
                              ? formatDate(selectedReceipt.ngayDatHang)
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted">Ngày nhận hàng: </span>
                          <span className="font-medium text-foreground">
                            {selectedReceipt.ngayNhanHang
                              ? formatDate(selectedReceipt.ngayNhanHang)
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted">Ngày tạo: </span>
                          <span className="font-medium text-foreground">
                            {selectedReceipt.ngayTao
                              ? formatDate(selectedReceipt.ngayTao)
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted">Cập nhật: </span>
                          <span className="font-medium text-foreground">
                            {selectedReceipt.ngayCapNhat
                              ? formatDate(selectedReceipt.ngayCapNhat)
                              : "—"}
                          </span>
                        </div>
                      </div>

                      <hr className="border-subtle" />

                      {/* Items header */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
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
                            className="flex items-center gap-1 text-xs bg-accent text-white px-3 py-1.5 rounded-xl hover:bg-accent-hover transition"
                          >
                            <FiPlus size={12} /> Thêm SP
                          </button>
                        )}
                      </div>

                      {/* Inspection hint */}
                      {canInspectItems(selectedReceipt.trangThai) && (
                        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-400">
                          <FiAlertTriangle
                            size={14}
                            className="mt-0.5 shrink-0"
                          />
                          <span>
                            Phiếu nhập đã nhận hàng. Bạn có thể cập nhật số
                            lượng thiếu và ghi chú kiểm hàng cho từng sản phẩm
                            trước khi kiểm kê.
                          </span>
                        </div>
                      )}

                      {/* Add item form */}
                      {showAddItem &&
                        canManageItems(selectedReceipt.trangThai) && (
                          <div className="bg-section border border-subtle rounded-xl p-3 space-y-3">
                            <p className="text-xs font-medium text-foreground">
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
                                    className="flex-1 border border-subtle bg-background text-foreground rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                                  />
                                  <button
                                    type="submit"
                                    className="bg-accent text-white px-3 py-2 rounded-xl text-xs hover:bg-accent-hover transition"
                                  >
                                    <FiSearch size={12} />
                                  </button>
                                </form>
                                {addSearchResults.length > 0 && (
                                  <div className="border border-subtle rounded-xl divide-y divide-subtle text-xs">
                                    {addSearchResults.map((p) => (
                                      <button
                                        key={p.id}
                                        onClick={() =>
                                          handleAddSelectProduct(p)
                                        }
                                        className="w-full px-3 py-2 text-left hover:bg-section text-foreground"
                                      >
                                        {p.tenSanPham}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {addVariants.length > 0 &&
                                  addSelectedProduct && (
                                    <div>
                                      <p className="text-xs text-muted mb-1">
                                        Chọn biến thể —{" "}
                                        {addSelectedProduct.tenSanPham}
                                      </p>
                                      <div className="border border-subtle rounded-xl divide-y divide-subtle text-xs">
                                        {addVariants.map((v) => (
                                          <button
                                            key={v.id}
                                            onClick={() =>
                                              handleAddSelectVariant(v)
                                            }
                                            className="w-full px-3 py-2 text-left hover:bg-section flex justify-between text-foreground"
                                          >
                                            <span>
                                              {v.tenMauSac} / {v.tenKichThuoc}
                                            </span>
                                            <span className="text-muted">
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
                                      soLuong: Number(e.target.value),
                                    })
                                  }
                                  className="w-20 border border-subtle bg-background text-foreground rounded-xl px-2 py-1.5 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
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
                                  className="flex-1 border border-subtle bg-background text-foreground rounded-xl px-2 py-1.5 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
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
                                  className="text-muted hover:text-foreground text-xs px-2"
                                >
                                  Hủy
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Items list */}
                      {detailItems.length === 0 ? (
                        <p className="text-sm text-muted py-4 text-center">
                          Chưa có sản phẩm trong phiếu nhập
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {detailItems.map((item) => (
                            <div
                              key={item.id}
                              className="border border-subtle rounded-xl p-3 text-sm"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground">
                                    {item.chiTietSanPham?.tenSanPham ||
                                      `Mặt hàng #${item.id}`}
                                  </p>
                                  <p className="text-muted text-xs mt-0.5">
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
                                  <span className="text-foreground font-medium">
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
                                <div className="mt-2 flex gap-4 text-xs text-muted bg-section rounded-lg px-2 py-1.5">
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
                                      <span className="text-foreground">
                                        {item.ghiTruKiemHang}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Inline edit for inspection (status=1) */}
                              {canInspectItems(selectedReceipt.trangThai) &&
                                editingItemId === item.id && (
                                  <div className="mt-2 bg-section rounded-xl p-2 space-y-2">
                                    <div className="flex gap-2 items-center flex-wrap">
                                      <label className="text-xs text-muted">
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
                                        className="border border-subtle bg-background text-foreground rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                                      >
                                        <option value={0}>Đủ</option>
                                        <option value={1}>Thiếu</option>
                                      </select>
                                      {itemEditForm.trangThai === 1 && (
                                        <>
                                          <label className="text-xs text-muted">
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
                                                soLuongThieu: Number(
                                                  e.target.value,
                                                ),
                                              })
                                            }
                                            className="w-16 border border-subtle bg-background text-foreground rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
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
                                        className="flex-1 border border-subtle bg-background text-foreground rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
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
                                        className="text-muted hover:text-foreground text-xs px-2 py-1"
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
                                      className="text-xs text-accent hover:text-accent-hover flex items-center gap-1"
                                    >
                                      <FiEdit size={11} /> Kiểm hàng
                                    </button>
                                  )}
                                {canManageItems(selectedReceipt.trangThai) && (
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    disabled={deletingItemId === item.id}
                                    className="text-xs text-red-500 hover:text-red-500/80 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <FiTrash2 size={11} />{" "}
                                    {deletingItemId === item.id
                                      ? "Đang xóa..."
                                      : "Xóa"}
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
                          disabled={kiemKeProcessingId === selectedReceipt.id}
                          className="w-full mt-2 py-2.5 bg-accent text-white rounded-xl text-sm hover:bg-accent-hover flex items-center justify-center gap-2 font-medium transition"
                        >
                          <FiCheckSquare
                            size={16}
                            className={
                              kiemKeProcessingId === selectedReceipt.id
                                ? "animate-spin"
                                : ""
                            }
                          />
                          {kiemKeProcessingId === selectedReceipt.id
                            ? "Đang kiểm kê..."
                            : "Thực hiện kiểm kê"}
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
                              <FiCheck size={16} /> Phiếu nhập đã kiểm kê hoàn
                              thành — tất cả sản phẩm đầy đủ
                            </>
                          ) : (
                            <>
                              <FiAlertTriangle size={16} /> Phiếu nhập đã kiểm
                              kê — có sản phẩm thiếu hàng
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-subtle">
                  <h2 className="font-bold text-foreground">
                    Cập nhật phiếu nhập #{editReceipt.id}
                  </h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Tên phiếu nhập
                    </label>
                    <input
                      value={editForm.tenPhieuNhap}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          tenPhieuNhap: e.target.value,
                        })
                      }
                      className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
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
                      className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.tenCuaHang}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
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
                      className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.tenNhaCungCap}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Trạng thái
                      {!canChangeStatus(editReceipt.trangThai) && (
                        <span className="text-xs text-muted font-normal ml-2">
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
                      className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition disabled:opacity-50"
                    >
                      {RECEIPT_STATUS_OPTIONS.map((val) => (
                        <option
                          key={val}
                          value={val}
                          disabled={isStatusOptionDisabled(
                            editReceipt.trangThai,
                            val,
                          )}
                        >
                          {TRANG_THAI_TEXT[val]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-4 py-2.5 border border-subtle rounded-xl text-sm text-foreground hover:bg-section transition"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={updating}
                      className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl text-sm hover:bg-accent-hover disabled:opacity-50 transition"
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-subtle sticky top-0 bg-card/95 backdrop-blur z-10">
                  <h2 className="font-bold text-lg text-foreground">
                    Tạo phiếu nhập mới
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
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
                      className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
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
                        className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
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
                      <label className="block text-sm font-medium text-foreground mb-1">
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
                        className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
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
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Thêm sản phẩm{" "}
                      <span className="text-muted font-normal">
                        (không bắt buộc)
                      </span>
                    </label>
                    <form
                      onSubmit={handleProductSearch}
                      className="flex gap-2 mb-2"
                    >
                      <div className="relative flex-1">
                        <FiSearch
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                          size={14}
                        />
                        <input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Tìm tên sản phẩm..."
                          className="w-full pl-10 pr-3 py-2.5 border border-subtle bg-background text-foreground rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-accent text-white px-3 py-2.5 rounded-xl text-sm hover:bg-accent-hover transition"
                      >
                        <FiSearch size={14} />
                      </button>
                    </form>
                    {searchResults.length > 0 && (
                      <div className="border border-subtle rounded-xl divide-y divide-subtle text-sm">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleSelectProduct(p)}
                            className="w-full px-3 py-2 text-left hover:bg-section text-foreground"
                          >
                            {p.tenSanPham}
                          </button>
                        ))}
                      </div>
                    )}
                    {variants.length > 0 && selectedProduct && (
                      <div className="mt-2">
                        <p className="text-xs text-muted mb-1">
                          Chọn biến thể — {selectedProduct.tenSanPham}
                        </p>
                        <div className="border border-subtle rounded-xl divide-y divide-subtle text-sm">
                          {variants.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => handleAddVariant(v)}
                              className="w-full px-3 py-2 text-left hover:bg-section flex justify-between text-foreground"
                            >
                              <span>
                                {v.tenMauSac} / {v.tenKichThuoc}
                              </span>
                              <span className="text-muted text-xs">
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
                      <h3 className="text-sm font-medium text-foreground mb-2">
                        Sản phẩm nhập
                      </h3>
                      <div className="space-y-2">
                        {nhapItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 text-sm border border-subtle rounded-xl px-3 py-2"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {item.tenSanPham}
                              </p>
                              <p className="text-xs text-muted">
                                {item.mauSac} / {item.kichThuoc}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted">SL:</span>
                              <input
                                type="number"
                                min={1}
                                value={item.soLuong}
                                onChange={(e) => {
                                  const updated = [...nhapItems];
                                  updated[idx].soLuong = Number(e.target.value);
                                  setNhapItems(updated);
                                }}
                                className="w-16 border border-subtle bg-background text-foreground rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
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
                              className="border border-subtle bg-background text-foreground rounded-lg px-2 py-1 text-xs w-32 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
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
                      className="flex-1 px-4 py-2.5 border border-subtle rounded-xl text-sm text-foreground hover:bg-section transition"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={creating}
                      className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl text-sm hover:bg-accent-hover disabled:opacity-50 transition"
                    >
                      {creating ? "Đang tạo..." : "Tạo phiếu nhập"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "suggestions" && (
        <>
          <div className="bg-card rounded-2xl border border-subtle p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Trạng thái tồn kho
                </label>
                <select
                  value={suggestionStatus}
                  onChange={(e) =>
                    setSuggestionStatus(
                      e.target.value as "SAP_HET" | "CON_HANG" | "DA_HET",
                    )
                  }
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                >
                  <option value="SAP_HET">Sắp hết</option>
                  <option value="CON_HANG">Còn hàng</option>
                  <option value="DA_HET">Đã hết</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Cửa hàng
                </label>
                <select
                  value={suggestionStoreId ?? ""}
                  onChange={(e) =>
                    setSuggestionStoreId(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                >
                  <option value="">Tất cả cửa hàng</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tenCuaHang}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Ngưỡng sắp hết
                </label>
                <input
                  type="number"
                  min={0}
                  value={nearOutThreshold}
                  onChange={(e) => setNearOutThreshold(Number(e.target.value))}
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={fetchSuggestions}
                className="bg-accent text-white px-4 py-2 rounded-xl text-sm hover:bg-accent-hover transition"
              >
                Tải gợi ý
              </button>
            </div>
          </div>

          {suggestionLoading ? (
            <Loading />
          ) : suggestions.length === 0 ? (
            <div className="text-center py-16 text-muted bg-card rounded-2xl border border-subtle">
              Không có sản phẩm phù hợp với bộ lọc hiện tại
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-section border-b border-subtle">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Biến thể
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                        Cửa hàng
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                        Tồn kho
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                        Nhập hàng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {suggestions.map((item) => (
                      <tr
                        key={`${item.chiTietSanPhamId}-${item.maCuaHang ?? 0}`}
                        className="hover:bg-section transition"
                      >
                        <td className="px-5 py-3.5 text-foreground font-medium">
                          {item.tenSanPham || "--"}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {item.tenMauSac || "--"} / {item.tenKichThuoc || "--"}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {item.tenCuaHang || "--"}
                        </td>
                        <td className="px-5 py-3.5 text-center text-foreground">
                          {item.soLuong}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                              item.trangThaiTonKho === "DA_HET"
                                ? "bg-red-500/15 text-red-500"
                                : item.trangThaiTonKho === "SAP_HET"
                                  ? "bg-yellow-500/15 text-yellow-500"
                                  : "bg-green-500/15 text-green-600"
                            }`}
                          >
                            {item.trangThaiTonKho === "DA_HET"
                              ? "Đã hết"
                              : item.trangThaiTonKho === "SAP_HET"
                                ? "Sắp hết"
                                : "Còn hàng"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() =>
                              handleQuickImportFromSuggestion(item)
                            }
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent-hover transition"
                          >
                            Nhập hàng
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
