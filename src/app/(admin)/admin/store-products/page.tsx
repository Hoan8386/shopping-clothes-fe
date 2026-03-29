"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CuaHang, ResChiTietSanPhamDTO } from "@/types";
import {
  chiTietPhieuNhapService,
  cuaHangService,
  nhaCungCapService,
  phieuNhapService,
} from "@/services/common.service";
import { productVariantService } from "@/services/product.service";
import { getImageUrl } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import {
  FiMapPin,
  FiSearch,
  FiPackage,
  FiEye,
  FiPlus,
  FiX,
} from "react-icons/fi";

const LOW_STOCK_THRESHOLD = 10;

type StockFilter = "all" | "in_stock" | "low_stock" | "out_stock";

type StoreStockGroup = {
  key: string;
  variantIds: number[];
  productName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  status: number;
  imageUrl: string;
};

type SupplierOption = {
  id: number;
  tenNhaCungCap: string;
};

const STOCK_FILTERS: Array<{ label: string; value: StockFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Còn hàng", value: "in_stock" },
  { label: "Gần hết", value: "low_stock" },
  { label: "Hết hàng", value: "out_stock" },
];

export default function AdminStoreProductsPage() {
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | "">("");
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<StoreStockGroup | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importForm, setImportForm] = useState({
    tenPhieuNhap: "",
    nhaCungCapId: 0,
    soLuong: 1,
    ghiTru: "",
  });

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      cuaHangService.getAll().catch(() => []),
      nhaCungCapService.getAll().catch(() => []),
    ])
      .then(([storeData, supplierData]) => {
        if (!isMounted) return;
        const normalizedStores = Array.isArray(storeData) ? storeData : [];
        const normalizedSuppliers = Array.isArray(supplierData)
          ? supplierData.map((item) => ({
              id: item.id,
              tenNhaCungCap: item.tenNhaCungCap,
            }))
          : [];

        setStores(normalizedStores);
        setSuppliers(normalizedSuppliers);
        if (normalizedStores.length > 0) {
          setSelectedStoreId(normalizedStores[0].id);
        }
      })
      .catch(() => {
        toast.error("Không thể tải dữ liệu cửa hàng / nhà cung cấp");
      })
      .finally(() => {
        if (isMounted) setLoadingStores(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchVariants = useCallback(async () => {
    if (!selectedStoreId) {
      setVariants([]);
      return;
    }

    try {
      setLoadingVariants(true);
      const data = await productVariantService.getAll({
        maCuaHang: selectedStoreId,
      });
      setVariants(Array.isArray(data) ? data : []);
    } catch {
      setVariants([]);
      toast.error("Không thể tải sản phẩm theo cửa hàng");
    } finally {
      setLoadingVariants(false);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const groupedRows = useMemo<StoreStockGroup[]>(() => {
    const map = new Map<string, StoreStockGroup>();

    for (const item of variants) {
      const productName = item.tenSanPham || "Không rõ sản phẩm";
      const colorName = item.tenMauSac || "Không rõ màu";
      const sizeName = item.tenKichThuoc || "Không rõ size";
      const key = `${productName}::${colorName}::${sizeName}`;
      const firstImage = (item.hinhAnhUrls && item.hinhAnhUrls[0]) || "";

      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          variantIds: [item.id],
          productName,
          colorName,
          sizeName,
          quantity: Number(item.soLuong || 0),
          status: item.trangThai,
          imageUrl: firstImage,
        });
        continue;
      }

      existing.quantity += Number(item.soLuong || 0);
      existing.variantIds.push(item.id);
      if (!existing.imageUrl && firstImage) {
        existing.imageUrl = firstImage;
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const byProduct = a.productName.localeCompare(b.productName, "vi");
      if (byProduct !== 0) return byProduct;
      const byColor = a.colorName.localeCompare(b.colorName, "vi");
      if (byColor !== 0) return byColor;
      return a.sizeName.localeCompare(b.sizeName, "vi");
    });
  }, [variants]);

  const filteredRows = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return groupedRows.filter((row) => {
      const combined =
        `${row.productName} ${row.colorName} ${row.sizeName}`.toLowerCase();
      const matchesKeyword = !key || combined.includes(key);

      if (!matchesKeyword) return false;

      if (stockFilter === "in_stock") return row.quantity > LOW_STOCK_THRESHOLD;
      if (stockFilter === "low_stock")
        return row.quantity > 0 && row.quantity <= LOW_STOCK_THRESHOLD;
      if (stockFilter === "out_stock") return row.quantity <= 0;
      return true;
    });
  }, [groupedRows, keyword, stockFilter]);

  const selectedDetailVariants = useMemo(() => {
    if (!selectedRow) return [];
    const idSet = new Set(selectedRow.variantIds);
    return variants.filter((item) => idSet.has(item.id));
  }, [selectedRow, variants]);

  const totalQuantity = filteredRows.reduce(
    (sum, row) => sum + row.quantity,
    0,
  );

  const selectedStoreName =
    stores.find((s) => s.id === selectedStoreId)?.tenCuaHang || "Chưa chọn";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(keywordInput);
  };

  const openDetail = (row: StoreStockGroup) => {
    setSelectedRow(row);
    setShowDetailModal(true);
  };

  const openImportModal = (row: StoreStockGroup) => {
    setSelectedRow(row);
    setImportForm({
      tenPhieuNhap: `Nhập bổ sung - ${row.productName} (${row.colorName}/${row.sizeName})`,
      nhaCungCapId: suppliers[0]?.id || 0,
      soLuong: row.quantity <= 0 ? 20 : 10,
      ghiTru: "",
    });
    setShowImportModal(true);
  };

  const handleQuickImport = async () => {
    if (!selectedRow || !selectedStoreId) return;
    if (!importForm.tenPhieuNhap.trim()) {
      toast.error("Vui lòng nhập tên phiếu nhập");
      return;
    }
    if (!importForm.nhaCungCapId) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }
    if (!Number.isFinite(importForm.soLuong) || importForm.soLuong <= 0) {
      toast.error("Số lượng nhập phải lớn hơn 0");
      return;
    }

    const targetVariantId = selectedRow.variantIds[0];
    if (!targetVariantId) {
      toast.error("Không xác định được biến thể sản phẩm để nhập hàng");
      return;
    }

    try {
      setImportSubmitting(true);
      const phieuNhap = await phieuNhapService.create({
        tenPhieuNhap: importForm.tenPhieuNhap.trim(),
        cuaHangId: Number(selectedStoreId),
        nhaCungCapId: importForm.nhaCungCapId,
      });

      await chiTietPhieuNhapService.create({
        phieuNhapId: phieuNhap.id,
        chiTietSanPhamId: targetVariantId,
        soLuong: importForm.soLuong,
        ghiTru: importForm.ghiTru.trim() || null,
        trangThai: 0,
      });

      toast.success("Đã tạo phiếu nhập nhanh cho sản phẩm");
      setShowImportModal(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Không thể nhập hàng nhanh";
      toast.error(message);
    } finally {
      setImportSubmitting(false);
    }
  };

  const getStockBadge = (quantity: number) => {
    if (quantity <= 0) {
      return {
        label: "Hết hàng",
        className: "bg-red-500/15 text-red-500",
      };
    }
    if (quantity <= LOW_STOCK_THRESHOLD) {
      return {
        label: "Gần hết",
        className: "bg-amber-500/15 text-amber-500",
      };
    }
    return {
      label: "Còn hàng",
      className: "bg-green-500/15 text-green-500",
    };
  };

  if (loadingStores) {
    return <Loading />;
  }

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-2xl border border-subtle p-4 lg:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Quản lý sản phẩm theo cửa hàng
          </p>
          <p className="text-sm text-muted mt-1">
            Theo dõi số lượng sản phẩm tại từng chi nhánh theo màu sắc và kích
            thước.
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-section text-muted border border-subtle">
          {loadingVariants ? "Đang tải..." : `${filteredRows.length} biến thể`}{" "}
          · Tồn {totalQuantity}
        </span>
      </div>

      <div className="bg-card rounded-2xl border border-subtle p-4 flex flex-wrap items-end gap-3">
        <div className="min-w-60">
          <label className="text-xs text-muted mb-1.5 flex items-center gap-1.5">
            <FiMapPin size={13} /> Cửa hàng
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) =>
              setSelectedStoreId(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.tenCuaHang}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 min-w-70 flex-1">
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, màu, size..."
            className="border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <button
            type="submit"
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-hover flex items-center gap-1"
          >
            <FiSearch size={14} /> Tìm
          </button>
        </form>

        <div className="w-full flex flex-wrap gap-2">
          {STOCK_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStockFilter(item.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                stockFilter === item.value
                  ? "bg-accent text-white shadow-sm"
                  : "bg-section text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
        <div className="px-4 py-3 border-b border-subtle bg-section text-sm text-muted">
          <span className="font-medium text-foreground">Cửa hàng:</span>{" "}
          {selectedStoreName}
        </div>

        {loadingVariants ? (
          <div className="py-12">
            <Loading />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-14 text-muted text-sm">
            Không có sản phẩm tại cửa hàng này
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-180">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Ảnh
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Màu sắc
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Kích thước
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Tồn kho
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {filteredRows.map((row) => {
                  const stockBadge = getStockBadge(row.quantity);
                  const statusText = row.status === 1 ? "Hiển thị" : "Ẩn";
                  const statusClass =
                    row.status === 1
                      ? "bg-green-500/15 text-green-500"
                      : "bg-red-500/15 text-red-500";

                  return (
                    <tr key={row.key} className="hover:bg-section/60">
                      <td className="px-4 py-3 text-center">
                        {row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(row.imageUrl)}
                            alt={row.productName}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover mx-auto border border-subtle"
                            style={{ width: 48, height: 48 }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-section border border-subtle mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetail(row)}
                          className="font-medium text-foreground line-clamp-1 hover:text-accent transition text-left"
                        >
                          {row.productName}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted">{row.colorName}</td>
                      <td className="px-4 py-3 text-muted">{row.sizeName}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
                        >
                          {statusText}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${stockBadge.className}`}
                        >
                          {stockBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                          <FiPackage size={13} /> {row.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openDetail(row)}
                            className="px-2.5 py-1.5 rounded-lg text-xs border border-subtle text-foreground hover:bg-section transition inline-flex items-center gap-1"
                          >
                            <FiEye size={12} /> Chi tiết
                          </button>
                          <button
                            onClick={() => openImportModal(row)}
                            className="px-2.5 py-1.5 rounded-lg text-xs bg-accent text-white hover:bg-accent-hover transition inline-flex items-center gap-1"
                          >
                            <FiPlus size={12} /> Nhập hàng
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetailModal && selectedRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-subtle sticky top-0 bg-card/95 backdrop-blur z-10 rounded-t-2xl">
              <h2 className="font-bold text-foreground">
                Chi tiết sản phẩm theo cửa hàng
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted">Cửa hàng: </span>
                  <span className="font-medium text-foreground">
                    {selectedStoreName}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Tổng tồn: </span>
                  <span className="font-semibold text-foreground">
                    {selectedRow.quantity}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Sản phẩm: </span>
                  <span className="font-medium text-foreground">
                    {selectedRow.productName}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Biến thể: </span>
                  <span className="font-medium text-foreground">
                    {selectedRow.colorName} / {selectedRow.sizeName}
                  </span>
                </div>
              </div>

              <div className="border border-subtle rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 text-xs font-medium text-muted bg-section border-b border-subtle">
                  Danh sách bản ghi chi tiết ({selectedDetailVariants.length})
                </div>

                {selectedDetailVariants.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted text-center">
                    Không có dữ liệu chi tiết
                  </p>
                ) : (
                  <div className="divide-y divide-subtle">
                    {selectedDetailVariants.map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-3 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.tenSanPham} - {item.tenMauSac} /{" "}
                            {item.tenKichThuoc}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            Mã biến thể: #{item.id}
                            {item.maPhieuNhap
                              ? ` · Mã phiếu nhập: #${item.maPhieuNhap}`
                              : ""}
                          </p>
                          {item.ghiTru && (
                            <p className="text-xs text-muted mt-1">
                              Ghi chú: {item.ghiTru}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                          Tồn: {item.soLuong}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && selectedRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <h2 className="font-bold text-foreground">Nhập hàng nhanh</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-sm bg-section border border-subtle rounded-xl p-3">
                <p className="text-foreground font-medium">
                  {selectedRow.productName}
                </p>
                <p className="text-muted text-xs mt-0.5">
                  {selectedRow.colorName} / {selectedRow.sizeName} · Cửa hàng:{" "}
                  {selectedStoreName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tên phiếu nhập
                </label>
                <input
                  value={importForm.tenPhieuNhap}
                  onChange={(e) =>
                    setImportForm((prev) => ({
                      ...prev,
                      tenPhieuNhap: e.target.value,
                    }))
                  }
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nhà cung cấp
                </label>
                <select
                  value={importForm.nhaCungCapId}
                  onChange={(e) =>
                    setImportForm((prev) => ({
                      ...prev,
                      nhaCungCapId: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value={0}>-- Chọn nhà cung cấp --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tenNhaCungCap}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Số lượng nhập
                </label>
                <input
                  type="number"
                  min={1}
                  value={importForm.soLuong}
                  onChange={(e) =>
                    setImportForm((prev) => ({
                      ...prev,
                      soLuong: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  value={importForm.ghiTru}
                  onChange={(e) =>
                    setImportForm((prev) => ({
                      ...prev,
                      ghiTru: e.target.value,
                    }))
                  }
                  placeholder="Ghi chú thêm (nếu có)..."
                  className="w-full border border-subtle bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-4 py-2.5 border border-subtle rounded-xl text-sm text-foreground hover:bg-section transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleQuickImport}
                  disabled={importSubmitting}
                  className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl text-sm hover:bg-accent-hover disabled:opacity-50 transition"
                >
                  {importSubmitting ? "Đang tạo..." : "Tạo phiếu nhập"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
