"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Loading from "@/components/ui/Loading";
import { formatDate, getImageUrl } from "@/lib/utils";
import {
  CuaHang,
  KiemKeHangHoa,
  LoaiKiemKe,
  ResChiTietSanPhamDTO,
} from "@/types";
import {
  kiemKeHangHoaService,
  loaiKiemKeService,
} from "@/services/stock-check.service";
import { cuaHangService } from "@/services/common.service";
import { productVariantService } from "@/services/product.service";
import toast from "react-hot-toast";
import {
  FiCheck,
  FiEye,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

const WAITING = 1;
const RECHECK = 2;
const CONFIRMED = 3;

function getStatusColor(status: number) {
  switch (status) {
    case 0:
      return "bg-gray-100 text-gray-700";
    case 1:
      return "bg-yellow-100 text-yellow-800";
    case 2:
      return "bg-orange-100 text-orange-800";
    case 3:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

interface SelectedVariant {
  chiTietSanPhamId: number;
  tenSanPham: string;
  tenMauSac: string;
  tenKichThuoc: string;
  soLuongHeThong: number;
  soLuongThucTe: number;
  ghiChu: string;
}

export default function AdminStockChecksPage() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<KiemKeHangHoa[]>([]);
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [types, setTypes] = useState<LoaiKiemKe[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selected, setSelected] = useState<KiemKeHangHoa | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<number | "ALL">("ALL");
  const [filterStoreId, setFilterStoreId] = useState<number | "ALL">("ALL");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [createStoreId, setCreateStoreId] = useState<number | "" | "ALL">("");
  const [createLoaiKiemKeId, setCreateLoaiKiemKeId] = useState<number | "">(
    "",
  );
  const [createTitle, setCreateTitle] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createNote, setCreateNote] = useState("");

  // --- Product selection state ---
  const [storeVariants, setStoreVariants] = useState<ResChiTietSanPhamDTO[]>(
    [],
  );
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantSearch, setVariantSearch] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>(
    [],
  );

  const waitingCount = useMemo(
    () => checks.filter((item) => item.trangThai === WAITING).length,
    [checks],
  );

  const storeOptions = useMemo(
    () =>
      Array.from(
        new Map(
          checks
            .filter((item) => item.cuaHang?.id && item.cuaHang?.tenCuaHang)
            .map((item) => [item.cuaHang!.id, item.cuaHang!.tenCuaHang]),
        ),
      ).map(([id, tenCuaHang]) => ({ id, tenCuaHang })),
    [checks],
  );

  const filteredChecks = useMemo(() => {
    return checks.filter((item) => {
      if (filterStatus !== "ALL" && item.trangThai !== filterStatus) {
        return false;
      }

      if (filterStoreId !== "ALL" && item.cuaHang?.id !== filterStoreId) {
        return false;
      }

      if (filterFromDate || filterToDate) {
        if (!item.ngayKiemKe) {
          return false;
        }

        const itemDate = new Date(item.ngayKiemKe);
        if (Number.isNaN(itemDate.getTime())) {
          return false;
        }

        if (filterFromDate) {
          const from = new Date(`${filterFromDate}T00:00:00`);
          if (itemDate < from) {
            return false;
          }
        }

        if (filterToDate) {
          const to = new Date(`${filterToDate}T23:59:59`);
          if (itemDate > to) {
            return false;
          }
        }
      }

      return true;
    });
  }, [checks, filterStatus, filterStoreId, filterFromDate, filterToDate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await kiemKeHangHoaService.getAll();
      setChecks(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách phiếu kiểm kê");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [storeData, typeData] = await Promise.all([
          cuaHangService.getAll(),
          loaiKiemKeService.getAll(),
        ]);
        setStores(storeData ?? []);
        setTypes(typeData ?? []);
      } catch {
        setStores([]);
        setTypes([]);
      }
    };
    loadMasterData();
  }, []);

  // Load variants when store changes
  useEffect(() => {
    if (!createStoreId) {
      setStoreVariants([]);
      setSelectedVariants([]);
      return;
    }

    const loadVariants = async () => {
      try {
        setLoadingVariants(true);
        const variants = await productVariantService.getAll(
          createStoreId === "ALL" ? {} : { maCuaHang: Number(createStoreId) },
        );
        setStoreVariants(variants ?? []);
      } catch {
        toast.error("Không thể tải danh sách sản phẩm");
        setStoreVariants([]);
      } finally {
        setLoadingVariants(false);
      }
    };

    loadVariants();
    setSelectedVariants([]);
    setVariantSearch("");
  }, [createStoreId]);

  const filteredVariants = useMemo(() => {
    const q = variantSearch.toLowerCase().trim();
    if (!q) return storeVariants;
    return storeVariants.filter(
      (v) =>
        v.tenSanPham?.toLowerCase().includes(q) ||
        v.tenMauSac?.toLowerCase().includes(q) ||
        v.tenKichThuoc?.toLowerCase().includes(q),
    );
  }, [storeVariants, variantSearch]);

  const isVariantSelected = (id: number) =>
    selectedVariants.some((v) => v.chiTietSanPhamId === id);

  const toggleVariant = (variant: ResChiTietSanPhamDTO) => {
    if (isVariantSelected(variant.id)) {
      setSelectedVariants((prev) =>
        prev.filter((v) => v.chiTietSanPhamId !== variant.id),
      );
    } else {
      setSelectedVariants((prev) => [
        ...prev,
        {
          chiTietSanPhamId: variant.id,
          tenSanPham: variant.tenSanPham ?? "",
          tenMauSac: variant.tenMauSac ?? "",
          tenKichThuoc: variant.tenKichThuoc ?? "",
          soLuongHeThong: variant.soLuong ?? 0,
          soLuongThucTe: variant.soLuong ?? 0,
          ghiChu: "",
        },
      ]);
    }
  };

  const updateVariantThucTe = (id: number, value: number) => {
    setSelectedVariants((prev) =>
      prev.map((v) =>
        v.chiTietSanPhamId === id
          ? { ...v, soLuongThucTe: Math.max(0, value) }
          : v,
      ),
    );
  };

  const updateVariantGhiChu = (id: number, value: string) => {
    setSelectedVariants((prev) =>
      prev.map((v) =>
        v.chiTietSanPhamId === id ? { ...v, ghiChu: value } : v,
      ),
    );
  };

  const removeVariant = (id: number) => {
    setSelectedVariants((prev) =>
      prev.filter((v) => v.chiTietSanPhamId !== id),
    );
  };

  const openDetail = async (id: number) => {
    try {
      const data = await kiemKeHangHoaService.getById(id);
      setSelected(data);
      setShowDetail(true);
    } catch {
      toast.error("Không thể tải chi tiết phiếu kiểm kê");
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Xác nhận duyệt phiếu kiểm kê này và cập nhật tồn kho?"))
      return;

    try {
      setProcessingId(id);
      await kiemKeHangHoaService.duyet(id, "XAC_NHAN");
      toast.success("Đã duyệt phiếu và cập nhật tồn kho");
      fetchData();
      if (selected?.id === id) {
        const refreshed = await kiemKeHangHoaService.getById(id);
        setSelected(refreshed);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Duyệt phiếu thất bại";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestRecheck = async (id: number) => {
    const lyDo = window.prompt("Nhập lý do yêu cầu kiểm kê lại:");
    if (!lyDo || !lyDo.trim()) {
      toast.error("Lý do không được để trống");
      return;
    }

    try {
      setProcessingId(id);
      await kiemKeHangHoaService.duyet(id, "YEU_CAU_KIEM_KE_LAI", lyDo.trim());
      toast.success("Đã gửi yêu cầu kiểm kê lại");
      fetchData();
      if (selected?.id === id) {
        const refreshed = await kiemKeHangHoaService.getById(id);
        setSelected(refreshed);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể yêu cầu kiểm kê lại";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const resetCreateForm = () => {
    setCreateStoreId("");
    setCreateLoaiKiemKeId("");
    setCreateTitle("");
    setCreateDate("");
    setCreateNote("");
    setSelectedVariants([]);
    setStoreVariants([]);
    setVariantSearch("");
  };

  const handleCreateStockCheck = async () => {
    if (!createStoreId) {
      toast.error("Vui lòng chọn cửa hàng");
      return;
    }

    if (!createTitle.trim()) {
      toast.error("Vui lòng nhập tên phiếu kiểm kê");
      return;
    }

    try {
      setCreating(true);
      await kiemKeHangHoaService.create({
        cuaHangId: createStoreId === "ALL" ? undefined : Number(createStoreId),
        loaiKiemKeId: createLoaiKiemKeId
          ? Number(createLoaiKiemKeId)
          : undefined,
        tenPhieuKiemKe: createTitle.trim(),
        ghiChu: createNote.trim() || undefined,
        ngayKiemKe: createDate || undefined,
        chiTietKiemKes: selectedVariants.map((v) => ({
          chiTietSanPhamId: v.chiTietSanPhamId,
          soLuongThucTe: v.soLuongThucTe,
          ghiChu: v.ghiChu || undefined,
        })),
      });

      toast.success(
        "Đã tạo phiếu kiểm kê và gửi cho tất cả quản lý của cửa hàng",
      );
      setShowCreateModal(false);
      resetCreateForm();
      fetchData();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không thể tạo phiếu kiểm kê";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition"
        >
          <FiPlus size={16} /> Tạo kiểm kê
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Tổng phiếu
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {checks.length}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Chờ duyệt
          </p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {waitingCount}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Đã xác nhận
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {checks.filter((item) => item.trangThai === 3).length}
          </p>
        </div>
      </div>

      <div className="bg-card border border-subtle rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Trạng thái</label>
          <select
            value={String(filterStatus)}
            onChange={(e) =>
              setFilterStatus(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value),
              )
            }
            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">Tất cả</option>
            <option value={WAITING}>Chờ duyệt</option>
            <option value={RECHECK}>Yêu cầu kiểm kê lại</option>
            <option value={CONFIRMED}>Đã xác nhận</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Cửa hàng</label>
          <select
            value={String(filterStoreId)}
            onChange={(e) =>
              setFilterStoreId(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value),
              )
            }
            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">Tất cả cửa hàng</option>
            {storeOptions.map((store) => (
              <option key={store.id} value={store.id}>
                {store.tenCuaHang}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Từ ngày</label>
          <input
            type="date"
            value={filterFromDate}
            onChange={(e) => setFilterFromDate(e.target.value)}
            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Đến ngày</label>
          <input
            type="date"
            value={filterToDate}
            onChange={(e) => setFilterToDate(e.target.value)}
            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-225">
            <thead className="bg-section border-b border-subtle">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Tên phiếu
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Cửa hàng
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Người tạo
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Ngày kiểm kê
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
              {filteredChecks.map((item) => (
                <tr key={item.id} className="hover:bg-section transition">
                  <td className="px-4 py-3 font-semibold">#{item.id}</td>
                  <td className="px-4 py-3 text-foreground font-medium max-w-64 truncate">
                    {item.tenPhieuKiemKe}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {item.cuaHang?.tenCuaHang ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {item.nhanVienTao?.tenNhanVien ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(item.ngayKiemKe || "")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.trangThai)}`}
                    >
                      {item.trangThaiText}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => openDetail(item.id)}
                        className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                        title="Xem chi tiết"
                      >
                        <FiEye size={15} />
                      </button>
                      {item.trangThai === WAITING && (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={processingId === item.id}
                            className="p-1.5 text-green-600 hover:bg-green-600/10 rounded disabled:opacity-60"
                            title="Duyệt phiếu"
                          >
                            <FiCheck size={15} />
                          </button>
                          <button
                            onClick={() => handleRequestRecheck(item.id)}
                            disabled={processingId === item.id}
                            className="p-1.5 text-orange-600 hover:bg-orange-600/10 rounded disabled:opacity-60"
                            title="Yêu cầu kiểm kê lại"
                          >
                            <FiRefreshCw size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredChecks.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-muted">
                    Chưa có phiếu kiểm kê nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetail && selected && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-4xl bg-card border border-subtle rounded-2xl">
              <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Duyệt phiếu kiểm kê #{selected.id}
                </h3>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-muted hover:text-foreground"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted">Tên phiếu: </span>
                    <span className="font-medium text-foreground">
                      {selected.tenPhieuKiemKe}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Trạng thái: </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selected.trangThai)}`}
                    >
                      {selected.trangThaiText}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Loại kiểm kê: </span>
                    <span className="font-medium text-foreground">
                      {selected.loaiKiemKe?.tenLoaiKiemKe ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Cửa hàng: </span>
                    <span className="font-medium text-foreground">
                      {selected.cuaHang?.tenCuaHang ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Người tạo: </span>
                    <span className="font-medium text-foreground">
                      {selected.nhanVienTao?.tenNhanVien ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Ngày kiểm kê: </span>
                    <span className="font-medium text-foreground">
                      {formatDate(selected.ngayKiemKe || "")}
                    </span>
                  </div>
                </div>

                {selected.lyDoYeuCauKiemKeLai && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                    <strong>Lý do yêu cầu kiểm kê lại:</strong>{" "}
                    {selected.lyDoYeuCauKiemKeLai}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-180 text-sm">
                    <thead>
                      <tr className="bg-section border-y border-subtle">
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Sản phẩm
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Hệ thống
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Thực tế
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Chênh lệch
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {selected.chiTietKiemKes?.map((ct) => (
                        <tr key={ct.id}>
                          <td className="px-3 py-2 text-foreground">
                            {ct.tenSanPham} - {ct.tenMauSac} - {ct.tenKichThuoc}
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {ct.soLuongHeThong ?? 0}
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {ct.soLuongThucTe ?? 0}
                          </td>
                          <td
                            className={`px-3 py-2 font-medium ${(ct.chenhLech ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {ct.chenhLech ?? 0}
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {ct.ghiChu || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-subtle flex items-center justify-between">
                <button
                  onClick={() => setShowDetail(false)}
                  className="px-4 py-2 border border-subtle rounded-lg text-sm text-foreground hover:bg-section transition"
                >
                  Đóng
                </button>
                {selected.trangThai === WAITING && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestRecheck(selected.id)}
                      disabled={processingId === selected.id}
                      className="px-4 py-2 rounded-lg bg-orange-600 text-red-700 text-sm hover:bg-orange-700 transition"
                    >
                      {processingId === selected.id
                        ? "Đang xử lý..."
                        : "Yêu cầu kiểm kê lại"}
                    </button>
                    <button
                      onClick={() => handleApprove(selected.id)}
                      disabled={processingId === selected.id}
                      className="px-4 py-2 rounded-lg bg-green-600 text-red-700 text-sm hover:bg-green-700 transition"
                    >
                      {processingId === selected.id
                        ? "Đang xử lý..."
                        : "Duyệt và cập nhật tồn kho"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="w-full max-w-4xl bg-card border border-subtle rounded-2xl">
              <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Tạo phiếu kiểm kê
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted hover:text-foreground"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: basic info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cửa hàng <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={String(createStoreId)}
                      onChange={(e) => {
                        setCreateStoreId(
                          e.target.value ? Number(e.target.value) : "",
                        );
                      }}
                      className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Chọn cửa hàng</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.tenCuaHang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Tên phiếu kiểm kê <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      placeholder="Ví dụ: Kiểm kê cuối tháng"
                      className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Loại kiểm kê
                    </label>
                    <select
                      value={String(createLoaiKiemKeId)}
                      onChange={(e) =>
                        setCreateLoaiKiemKeId(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Không chọn</option>
                      {types.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.tenLoaiKiemKe}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Ngày kiểm kê
                    </label>
                    <input
                      type="datetime-local"
                      value={createDate}
                      onChange={(e) => setCreateDate(e.target.value)}
                      className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      rows={3}
                      value={createNote}
                      onChange={(e) => setCreateNote(e.target.value)}
                      className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm resize-none"
                      placeholder="Nhập ghi chú cho đợt kiểm kê"
                    />
                  </div>
                </div>

                {/* Right: product selection */}
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Chọn sản phẩm kiểm kê
                      {selectedVariants.length > 0 && (
                        <span className="ml-2 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                          {selectedVariants.length} đã chọn
                        </span>
                      )}
                    </p>

                    {createStoreId === "" ? (
                      <div className="border border-dashed border-subtle rounded-lg p-6 text-center text-muted text-sm">
                        Vui lòng chọn cửa hàng để xem sản phẩm
                      </div>
                    ) : (
                      <>
                        {/* Search box */}
                        <div className="relative mb-2">
                          <FiSearch
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                          />
                          <input
                            type="text"
                            value={variantSearch}
                            onChange={(e) => setVariantSearch(e.target.value)}
                            placeholder="Tìm theo tên, màu sắc, kích thước..."
                            className="w-full border border-subtle bg-background text-foreground rounded-lg pl-8 pr-3 py-2 text-sm"
                          />
                        </div>

                        {/* Variant list */}
                        <div className="border border-subtle rounded-lg overflow-hidden">
                          <div className="max-h-52 overflow-y-auto divide-y divide-subtle">
                            {loadingVariants ? (
                              <div className="p-4 text-center text-muted text-sm">
                                Đang tải sản phẩm...
                              </div>
                            ) : filteredVariants.length === 0 ? (
                              <div className="p-4 text-center text-muted text-sm">
                                {variantSearch
                                  ? "Không tìm thấy sản phẩm phù hợp"
                                  : "Cửa hàng chưa có sản phẩm"}
                              </div>
                            ) : (
                              filteredVariants.map((v) => {
                                const sel = isVariantSelected(v.id);
                                const thumbUrl = v.hinhAnhUrls?.[0];
                                return (
                                  <div
                                    key={v.id}
                                    onClick={() => toggleVariant(v)}
                                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition ${
                                      sel
                                        ? "bg-accent/5 border-l-2 border-accent"
                                        : "hover:bg-section"
                                    }`}
                                  >
                                    {/* Thumbnail */}
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-subtle flex-shrink-0 bg-section">
                                      {thumbUrl ? (
                                        <img
                                          src={getImageUrl(thumbUrl)}
                                          alt={v.tenSanPham}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted text-xs">?</div>
                                      )}
                                    </div>
                                    <div
                                      className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition ${
                                        sel
                                          ? "bg-accent border-accent"
                                          : "border-subtle"
                                      }`}
                                    >
                                      {sel && (
                                        <FiCheck
                                          size={10}
                                          className="text-white"
                                        />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {v.tenSanPham}
                                      </p>
                                      <p className="text-xs text-muted">
                                        {v.tenMauSac} · {v.tenKichThuoc} · Tồn:{" "}
                                        {v.soLuong ?? 0}
                                        {v.tenCuaHang ? ` · ${v.tenCuaHang}` : ""}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Selected variants table */}
                  {selectedVariants.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Danh sách sản phẩm kiểm kê
                      </p>
                      <div className="border border-subtle rounded-lg overflow-hidden">
                        <div className="max-h-52 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-section border-b border-subtle sticky top-0">
                              <tr>
                                <th className="px-2 py-2 text-left text-muted font-medium">
                                  Sản phẩm
                                </th>
                                <th className="px-2 py-2 text-center text-muted font-medium w-28">
                                  SL thực tế
                                </th>
                                <th className="px-2 py-2 text-left text-muted font-medium">
                                  Ghi chú
                                </th>
                                <th className="px-2 py-2 w-8" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-subtle">
                              {selectedVariants.map((sv) => (
                                <tr key={sv.chiTietSanPhamId}>
                                  <td className="px-2 py-1.5">
                                    <p className="font-medium text-foreground truncate max-w-28">
                                      {sv.tenSanPham}
                                    </p>
                                    <p className="text-muted">
                                      {sv.tenMauSac} · {sv.tenKichThuoc}
                                    </p>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <div className="flex items-center gap-1 justify-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateVariantThucTe(
                                            sv.chiTietSanPhamId,
                                            sv.soLuongThucTe - 1,
                                          )
                                        }
                                        className="p-0.5 rounded hover:bg-section text-muted"
                                      >
                                        <FiMinus size={11} />
                                      </button>
                                      <input
                                        type="number"
                                        min={0}
                                        value={sv.soLuongThucTe}
                                        onChange={(e) =>
                                          updateVariantThucTe(
                                            sv.chiTietSanPhamId,
                                            Number(e.target.value),
                                          )
                                        }
                                        className="w-12 text-center border border-subtle rounded px-1 py-0.5 bg-background text-foreground text-xs"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateVariantThucTe(
                                            sv.chiTietSanPhamId,
                                            sv.soLuongThucTe + 1,
                                          )
                                        }
                                        className="p-0.5 rounded hover:bg-section text-muted"
                                      >
                                        <FiPlus size={11} />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={sv.ghiChu}
                                      onChange={(e) =>
                                        updateVariantGhiChu(
                                          sv.chiTietSanPhamId,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Ghi chú..."
                                      className="w-full border border-subtle rounded px-2 py-0.5 bg-background text-foreground text-xs"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeVariant(sv.chiTietSanPhamId)
                                      }
                                      className="text-red-500 hover:bg-red-50 rounded p-0.5"
                                    >
                                      <FiTrash2 size={13} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-subtle flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="px-4 py-2 border border-subtle rounded-lg text-sm text-foreground hover:bg-section transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateStockCheck}
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition disabled:opacity-60"
                >
                  {creating ? "Đang tạo..." : "Tạo và gửi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
