"use client";

import { useEffect, useMemo, useState } from "react";
import { CuaHang, ResChiTietSanPhamDTO } from "@/types";
import { productVariantService } from "@/services/product.service";
import { cuaHangService } from "@/services/common.service";
import {
  FiLoader,
  FiMapPin,
  FiPackage,
  FiAlertCircle,
  FiNavigation,
} from "react-icons/fi";
import toast from "react-hot-toast";

interface StoreWithInventoryModalProps {
  sanPhamId: number;
  tenSanPham: string;
  isOpen: boolean;
  onClose: () => void;
  currentStoreName?: string;
  variantOptions?: ResChiTietSanPhamDTO[];
  onSubmit: (
    storeVariant: ResChiTietSanPhamDTO,
    quantity: number,
  ) => Promise<void> | void;
}

type UserLocation = { latitude: number; longitude: number };
type StoreItem = {
  variant: ResChiTietSanPhamDTO;
  storeMeta?: CuaHang;
  distanceKm?: number;
};

type VariantChoice = {
  key: string;
  color: string;
  size: string;
};

function toVariantKey(color?: string, size?: string) {
  return `${(color || "").trim().toLowerCase()}||${(size || "").trim().toLowerCase()}`;
}

function distanceKm(
  from: UserLocation,
  to: { latitude: number; longitude: number },
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function StoreWithInventoryModal({
  sanPhamId,
  tenSanPham,
  isOpen,
  onClose,
  currentStoreName,
  variantOptions = [],
  onSubmit,
}: StoreWithInventoryModalProps) {
  const [stores, setStores] = useState<ResChiTietSanPhamDTO[]>([]);
  const [allStores, setAllStores] = useState<CuaHang[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVariantKey, setSelectedVariantKey] = useState<string | null>(
    null,
  );
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const choices = useMemo<VariantChoice[]>(() => {
    const source = variantOptions.length > 0 ? variantOptions : stores;
    const map = new Map<string, VariantChoice>();

    source.forEach((item) => {
      const color = item.tenMauSac || "Không rõ";
      const size = item.tenKichThuoc || "Không rõ";
      const key = toVariantKey(color, size);
      if (!map.has(key)) {
        map.set(key, { key, color, size });
      }
    });

    return Array.from(map.values());
  }, [variantOptions, stores]);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        setLoading(true);
        const [variants, storesMeta] = await Promise.all([
          productVariantService.getStoresWithInventoryForImport(sanPhamId),
          cuaHangService.getAll().catch(() => []),
        ]);

        const filtered = (variants ?? []).filter(
          (item) =>
            (item.soLuong ?? 0) > 0 &&
            (!currentStoreName || item.tenCuaHang !== currentStoreName),
        );

        setStores(filtered);
        setAllStores(Array.isArray(storesMeta) ? storesMeta : []);
        setSelectedStoreId(null);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
        toast.error("Không thể tải danh sách cửa hàng còn tồn kho");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, sanPhamId, currentStoreName]);

  useEffect(() => {
    if (!isOpen || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {
        setUserLocation(null);
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, [isOpen]);

  const storeItems = useMemo<StoreItem[]>(() => {
    if (!selectedVariantKey) {
      return [];
    }

    const filteredByVariant = stores.filter(
      (variant) =>
        toVariantKey(variant.tenMauSac, variant.tenKichThuoc) ===
        selectedVariantKey,
    );

    const items = filteredByVariant.map((variant) => {
      const storeMeta = allStores.find(
        (s) => s.tenCuaHang === variant.tenCuaHang,
      );
      let distance: number | undefined;
      if (
        userLocation &&
        storeMeta &&
        typeof storeMeta.latitude === "number" &&
        typeof storeMeta.longitude === "number"
      ) {
        distance = distanceKm(userLocation, {
          latitude: storeMeta.latitude,
          longitude: storeMeta.longitude,
        });
      }
      return {
        variant,
        storeMeta,
        distanceKm: distance,
      };
    });

    return items.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return (b.variant.soLuong ?? 0) - (a.variant.soLuong ?? 0);
    });
  }, [stores, allStores, userLocation, selectedVariantKey]);

  useEffect(() => {
    if (storeItems.length === 0) {
      setSelectedStoreId(null);
      setQuantity(1);
      return;
    }

    setSelectedStoreId(storeItems[0].variant.id);
    setQuantity(1);
  }, [selectedVariantKey, storeItems]);

  const nearestStoreId = storeItems.find((item) => item.distanceKm != null)
    ?.variant.id;

  const selectedStore = useMemo(
    () =>
      storeItems.find((item) => item.variant.id === selectedStoreId)?.variant,
    [storeItems, selectedStoreId],
  );

  const handleClose = () => {
    setSelectedVariantKey(null);
    setSelectedStoreId(null);
    setQuantity(1);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedStore) {
      toast.error("Vui lòng chọn cửa hàng nguồn");
      return;
    }
    if (!quantity || quantity <= 0) {
      toast.error("Số lượng nhập không hợp lệ");
      return;
    }
    if (quantity > (selectedStore.soLuong ?? 0)) {
      toast.error("Số lượng nhập vượt quá tồn kho cửa hàng nguồn");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(selectedStore, quantity);
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-card z-10 px-6 py-4 border-b border-subtle flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg text-foreground">
              Nhập hàng từ cửa hàng khác
            </h2>
            <p className="text-sm text-muted mt-1">{tenSanPham}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-foreground text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <FiLoader className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="p-4 bg-section border border-subtle rounded-lg">
                <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">
                  1. Chọn màu sắc và kích thước cần luân chuyển
                </p>
                {choices.length === 0 ? (
                  <div className="text-center py-6">
                    <FiAlertCircle className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted">
                      Không có biến thể phù hợp để yêu cầu luân chuyển
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {choices.map((choice) => {
                      const isSelected = selectedVariantKey === choice.key;

                      return (
                        <button
                          key={choice.key}
                          type="button"
                          onClick={() => setSelectedVariantKey(choice.key)}
                          className={`px-3 py-2 rounded-lg border text-left transition ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-subtle bg-card hover:bg-background"
                          }`}
                        >
                          <p className="text-xs text-muted">Màu sắc</p>
                          <p className="text-sm font-semibold text-foreground line-clamp-1">
                            {choice.color}
                          </p>
                          <p className="text-xs text-muted mt-1">Kích thước</p>
                          <p className="text-sm font-semibold text-foreground">
                            {choice.size}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-muted font-semibold">
                  2. Chọn cửa hàng nguồn (ưu tiên gần nhất)
                </p>

                {!selectedVariantKey ? (
                  <div className="text-center py-10 bg-section border border-subtle rounded-lg">
                    <p className="text-sm text-muted">
                      Vui lòng chọn màu sắc và kích thước trước
                    </p>
                  </div>
                ) : storeItems.length === 0 ? (
                  <div className="text-center py-10 bg-section border border-subtle rounded-lg">
                    <FiAlertCircle className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted">
                      Không có cửa hàng nào còn tồn kho biến thể đã chọn
                    </p>
                  </div>
                ) : (
                  <>
                    {storeItems.map((item) => {
                      const isSelected = selectedStoreId === item.variant.id;
                      const isNearest = nearestStoreId === item.variant.id;

                      return (
                        <button
                          key={item.variant.id}
                          type="button"
                          onClick={() => {
                            setSelectedStoreId(item.variant.id);
                            setQuantity(1);
                          }}
                          className={`w-full text-left border rounded-lg p-4 transition ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-subtle hover:bg-section"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FiMapPin className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold text-foreground">
                                  {item.variant.tenCuaHang || "Cửa hàng"}
                                </h3>
                                {isNearest && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                                    Gần nhất
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                  <p className="text-muted text-xs uppercase tracking-wide">
                                    Màu sắc / size
                                  </p>
                                  <p className="font-medium text-foreground">
                                    {item.variant.tenMauSac || "N/A"} /{" "}
                                    {item.variant.tenKichThuoc || "N/A"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-muted text-xs uppercase tracking-wide">
                                    Khoảng cách
                                  </p>
                                  <p className="font-medium text-foreground flex items-center gap-1">
                                    <FiNavigation className="w-4 h-4" />
                                    {item.distanceKm != null
                                      ? `${item.distanceKm.toFixed(2)} km`
                                      : "Chưa xác định"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-muted text-xs uppercase tracking-wide">
                                    Tồn kho
                                  </p>
                                  <p className="font-bold text-primary flex items-center gap-1">
                                    <FiPackage className="w-4 h-4" />
                                    {item.variant.soLuong ?? 0}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              <div className="p-4 bg-section border border-subtle rounded-lg">
                <label className="text-sm font-medium text-foreground block mb-2">
                  3. Số lượng luân chuyển
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedStore?.soLuong ?? 1}
                  value={quantity}
                  onChange={(e) => {
                    const max = selectedStore?.soLuong ?? 1;
                    const next = Number(e.target.value || 1);
                    setQuantity(Math.max(1, Math.min(max, next)));
                  }}
                  className="w-full px-3 py-2 border border-subtle rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted mt-2">
                  Hệ thống sẽ tạo đơn yêu cầu luân chuyển từ cửa hàng nguồn về
                  cửa hàng hiện tại.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-subtle px-6 py-4 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-medium hover:bg-section transition"
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedStore || !selectedVariantKey}
            className="flex-1 py-2.5 bg-primary text-red-800 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang tạo đơn..." : "Tạo yêu cầu luân chuyển"}
          </button>
        </div>
      </div>
    </div>
  );
}
