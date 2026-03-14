"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CuaHang, ResChiTietSanPhamDTO } from "@/types";
import { cuaHangService } from "@/services/common.service";
import { productVariantService } from "@/services/product.service";
import { getImageUrl } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiMapPin, FiSearch, FiPackage } from "react-icons/fi";

type StoreStockGroup = {
  key: string;
  productName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  status: number;
  imageUrl: string;
};

export default function AdminStoreProductsPage() {
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | "">("");
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    let isMounted = true;
    cuaHangService
      .getAll()
      .then((data) => {
        if (!isMounted) return;
        const normalized = Array.isArray(data) ? data : [];
        setStores(normalized);
        if (normalized.length > 0) {
          setSelectedStoreId(normalized[0].id);
        }
      })
      .catch(() => {
        toast.error("Không thể tải danh sách cửa hàng");
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
    if (!key) return groupedRows;

    return groupedRows.filter((row) => {
      const combined =
        `${row.productName} ${row.colorName} ${row.sizeName}`.toLowerCase();
      return combined.includes(key);
    });
  }, [groupedRows, keyword]);

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
                  <th className="px-4 py-3 text-right font-medium text-muted">
                    Số lượng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {filteredRows.map((row) => {
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
                        <div className="font-medium text-foreground line-clamp-1">
                          {row.productName}
                        </div>
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
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                          <FiPackage size={13} /> {row.quantity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
