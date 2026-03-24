"use client";

import { useEffect, useMemo, useState } from "react";
import { ResChiTietSanPhamDTO, CuaHang } from "@/types";
import { productVariantService } from "@/services/product.service";
import { donLuanChuyenService } from "@/services/transfer.service";
import { cuaHangService } from "@/services/common.service";
import {
  FiLoader,
  FiMapPin,
  FiPackage,
  FiAlertCircle,
  FiSearch,
  FiNavigation,
} from "react-icons/fi";
import toast from "react-hot-toast";

interface ImportGoodsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentStoreId?: number | null;
  onSuccess?: () => void;
}

type DialogStep = "select-product" | "select-store-variant";

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

export function ImportGoodsDialog({
  isOpen,
  onClose,
  currentStoreId,
  onSuccess,
}: ImportGoodsDialogProps) {
  const [step, setStep] = useState<DialogStep>("select-product");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Product selection step
  const [selectedProduct, setSelectedProduct] =
    useState<ResChiTietSanPhamDTO | null>(null);
  const [productsWithInventory, setProductsWithInventory] = useState<
    ResChiTietSanPhamDTO[]
  >([]);

  // Store & Variant selection step
  const [storesWithProduct, setStoresWithProduct] = useState<
    ResChiTietSanPhamDTO[]
  >([]);
  const [allStores, setAllStores] = useState<CuaHang[]>([]);
  const [selectedVariantKey, setSelectedVariantKey] = useState<string | null>(
    null,
  );
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load master products on open
  useEffect(() => {
    if (isOpen && step === "select-product") {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          const data = await productVariantService.getAll();
          const uniqueProducts = Array.from(
            new Map(data.map((p) => [p.sanPhamId, p])).values(),
          );
          setProductsWithInventory(uniqueProducts);
        } catch (error) {
          toast.error("Không thể tải danh sách sản phẩm");
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [isOpen, step]);

  // Load geolocation
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

  const handleProductSelect = async (product: ResChiTietSanPhamDTO) => {
    try {
      setLoading(true);
      setSelectedProduct(product);

      const [stores, storesMeta] = await Promise.all([
        productVariantService.getStoresWithInventoryForImport(
          product.sanPhamId || 0,
        ),
        cuaHangService.getAll().catch(() => []),
      ]);

      const filtered = (stores ?? []).filter(
        (item) =>
          (item.soLuong ?? 0) > 0 &&
          (!currentStoreId || item.maCuaHang !== currentStoreId),
      );

      setStoresWithProduct(filtered);
      setAllStores(Array.isArray(storesMeta) ? storesMeta : []);
      setSelectedVariantKey(null);
      setSelectedStoreId(null);
      setQuantity(1);
      setStep("select-store-variant");
    } catch (error) {
      console.error("Failed to fetch stores:", error);
      toast.error("Không thể tải danh sách cửa hàng");
    } finally {
      setLoading(false);
    }
  };

  const choices = useMemo<VariantChoice[]>(() => {
    if (step !== "select-store-variant") return [];
    const map = new Map<string, VariantChoice>();

    storesWithProduct.forEach((item) => {
      const color = item.tenMauSac || "Không rõ";
      const size = item.tenKichThuoc || "Không rõ";
      const key = toVariantKey(color, size);
      if (!map.has(key)) {
        map.set(key, { key, color, size });
      }
    });

    return Array.from(map.values());
  }, [storesWithProduct, step]);

  const storeItems = useMemo<StoreItem[]>(() => {
    if (!selectedVariantKey || step !== "select-store-variant") {
      return [];
    }

    const filteredByVariant = storesWithProduct.filter(
      (variant) =>
        toVariantKey(variant.tenMauSac, variant.tenKichThuoc) ===
        selectedVariantKey,
    );

    const items = filteredByVariant.map((variant) => {
      const storeMeta = allStores.find(
        (s) => s.id === variant.maCuaHang || s.tenCuaHang === variant.tenCuaHang,
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
  }, [storesWithProduct, allStores, userLocation, selectedVariantKey, step]);

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

  const handleConfirmImport = async () => {
    if (!selectedStore || !selectedProduct) {
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

    if (!currentStoreId) {
      toast.error("Không xác định được cửa hàng của bạn");
      return;
    }
    try {
      setSubmitting(true);
      await donLuanChuyenService.create({
        cuaHangDatId: currentStoreId,
        cuaHangGuiId: selectedStore.maCuaHang,
        loaiDonLuanChuyenId: 1,
        tenDon: "Nhập hàng: " + selectedProduct.tenSanPham,
        ghiTru: "",
        chiTietDonLuanChuyens: [
          {
            chiTietSanPhamId: selectedStore.id,
            soLuong: quantity,
            ghiTru: "",
          },
        ],
      });
      toast.success("Tạo đơn luân chuyển thành công!");
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error("Lỗi tạo đơn luân chuyển", error);
      toast.error("Tạo đơn thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("select-product");
    setSearchTerm("");
    setSelectedProduct(null);
    setSelectedStoreId(null);
    setSelectedVariantKey(null);
    setQuantity(1);
    setStoresWithProduct([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-6 py-4 border-b border-subtle flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-lg text-foreground">
              Tạo đơn nhập luân chuyển
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {step === "select-product" && "Bước 1: Chọn sản phẩm"}
              {step === "select-store-variant" && "Bước 2 & 3: Chọn phân loại và cửa hàng nguồn"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-foreground text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-background">
          {step === "select-product" && (
            <div className="space-y-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-subtle rounded-lg bg-section text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <FiLoader className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : productsWithInventory.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-subtle">
                  <FiAlertCircle className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-muted">
                    Chưa có sản phẩm nào. Vui lòng tạo sản phẩm trước.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
                  {productsWithInventory
                    .filter((p) =>
                      p.tenSanPham
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                    )
                    .map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className="group bg-card rounded-xl overflow-hidden border border-subtle hover:border-primary/50 transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 block"
                      >
                        <div className="relative aspect-square sm:aspect-3/4 overflow-hidden bg-section">
                          {product.hinhAnhUrls && product.hinhAnhUrls.length > 0 ? (
                            <img
                              src={product.hinhAnhUrls[0]}
                              alt={product.tenSanPham}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full flex justify-center items-center text-xs text-muted">No image</div>
                          )}
                        </div>
                        <div className="p-3 space-y-1.5">
                          <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
                            {product.tenSanPham}
                          </h3>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {step === "select-store-variant" && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-subtle relative overflow-hidden">
                {selectedProduct && selectedProduct.hinhAnhUrls && selectedProduct.hinhAnhUrls.length > 0 ? (
                   <img src={selectedProduct.hinhAnhUrls[0]} alt={selectedProduct.tenSanPham} className="w-16 h-16 rounded-md object-cover border border-subtle shrink-0" />
                ) : (
                   <div className="w-16 h-16 rounded-md bg-section flex justify-center items-center text-xs text-muted border border-subtle shrink-0">No Img</div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-lg">{selectedProduct?.tenSanPham}</h3>
                  <p className="text-sm text-muted">Vui lòng chọn thông số luân chuyển bên dưới</p>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <FiLoader className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="p-4 bg-card border border-subtle rounded-xl shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">
                      1. Chọn phân loại cần luân chuyển
                    </p>
                    {choices.length === 0 ? (
                      <div className="text-center py-6">
                        <FiAlertCircle className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted">
                          Không có biến thể phù hợp để yêu cầu luân chuyển
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {choices.map((choice) => {
                          const isSelected = selectedVariantKey === choice.key;
                          return (
                            <button
                              key={choice.key}
                              type="button"
                              onClick={() => setSelectedVariantKey(choice.key)}
                              className={`px-4 py-3 rounded-xl border text-left transition relative overflow-hidden group ${
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                                  : "border-subtle bg-section hover:bg-background hover:shadow-sm"
                              }`}
                            >
                              <p className="text-xs text-muted mb-0.5">Màu sắc</p>
                              <p className="text-sm font-semibold text-foreground line-clamp-1 mb-2">
                                {choice.color}
                              </p>
                              <p className="text-xs text-muted mb-0.5">Kích thước</p>
                              <p className="text-sm font-semibold text-foreground">
                                {choice.size}
                              </p>
                              {isSelected && (
                                <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
                              )}
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
                      <div className="text-center py-10 bg-card border border-subtle rounded-xl shadow-sm">
                        <p className="text-sm text-muted">
                          Vui lòng chọn màu sắc và kích thước ở bước 1
                        </p>
                      </div>
                    ) : storeItems.length === 0 ? (
                      <div className="text-center py-10 bg-card border border-subtle rounded-xl shadow-sm">
                        <FiAlertCircle className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted">
                          Không có cửa hàng nào còn tồn kho biến thể đã chọn
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
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
                              className={`w-full text-left border rounded-xl p-4 transition shadow-sm bg-card ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                  : "border-subtle hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary/20 text-primary' : 'bg-section text-muted'}`}>
                                      <FiMapPin className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-foreground">
                                      {item.variant.tenCuaHang || "Cửa hàng"}
                                    </h3>
                                    {isNearest && (
                                      <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold border border-green-200">
                                        Gần nhất
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-subtle/50">
                                    <div>
                                      <p className="text-muted text-xs uppercase tracking-wider mb-1">
                                        Khoảng cách
                                      </p>
                                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                                        <FiNavigation className="w-4 h-4 text-primary/70" />
                                        {item.distanceKm != null
                                          ? `${item.distanceKm.toFixed(2)} km`
                                          : "Chưa xác định"}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-muted text-xs uppercase tracking-wider mb-1">
                                        Tồn kho hiện tại
                                      </p>
                                      <p className="font-bold text-primary flex items-center gap-1.5">
                                        <FiPackage className="w-4 h-4" />
                                        {item.variant.soLuong ?? 0} có sẵn
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-card border border-subtle rounded-xl shadow-sm">
                    <label className="text-sm font-semibold text-foreground block mb-2">
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
                      className="w-full lg:w-1/3 px-4 py-2.5 border border-subtle rounded-lg bg-section text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                      disabled={!selectedStore}
                    />
                    <p className="text-xs text-muted mt-2">
                      Bạn có thể yêu cầu tối đa <span className="font-bold text-foreground">{selectedStore?.soLuong || 0}</span> sản phẩm từ cửa hàng này.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-subtle px-6 py-4 flex gap-3 shrink-0">
          {step === "select-product" && (
            <button
              onClick={handleClose}
              className="px-6 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-bold hover:bg-section transition"
            >
              Hủy
            </button>
          )}

          {step === "select-store-variant" && (
            <>
              <button
                onClick={() => setStep("select-product")}
                className="px-6 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-bold hover:bg-section transition"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={submitting || !selectedStore || !selectedVariantKey}
                className="flex-1 py-2.5 bg-primary text-red-700 rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận tạo yêu cầu luân chuyển"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
