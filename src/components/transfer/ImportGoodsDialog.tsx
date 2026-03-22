"use client";

import { useEffect, useState } from "react";
import { ResChiTietSanPhamDTO } from "@/types";
import { productVariantService } from "@/services/product.service";
import { donLuanChuyenService } from "@/services/transfer.service";
import {
  FiLoader,
  FiMapPin,
  FiPackage,
  FiAlertCircle,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";

interface ImportGoodsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentStoreId?: number | null;
  onSuccess?: () => void;
}

type DialogStep = "select-product" | "select-store" | "confirm";

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

  // Store selection step
  const [storesWithProduct, setStoresWithProduct] = useState<
    ResChiTietSanPhamDTO[]
  >([]);
  const [selectedStore, setSelectedStore] =
    useState<ResChiTietSanPhamDTO | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && step === "select-product") {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          const data = await productVariantService.getAll();
          const uniqueProducts = Array.from(new Map(data.map((p) => [p.sanPhamId, p])).values());
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

  const handleProductSelect = async (product: ResChiTietSanPhamDTO) => {
    try {
      setLoading(true);
      setSelectedProduct(product);

      // Fetch stores with inventory for this product
      const stores =
        await productVariantService.getStoresWithInventoryForImport(
          product.sanPhamId || 0,
        );
      setStoresWithProduct(stores);
      setStep("select-store");
    } catch (error) {
      console.error("Failed to fetch stores:", error);
      toast.error("Không thể tải danh sách cửa hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedStore || !selectedProduct) return;
    if (!currentStoreId) {
      toast.error("Không xác định được cửa hàng của bạn");
      return;
    }
    try {
      setLoading(true);
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
            ghiTru: ""
          }
        ]
      });
      toast.success("Tạo đơn luân chuyển thành công!");
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error("Lỗi tạo đơn luân chuyển", error);
      toast.error("Tạo đơn thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("select-product");
    setSearchTerm("");
    setSelectedProduct(null);
    setSelectedStore(null);
    setQuantity(1);
    setStoresWithProduct([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-6 py-4 border-b border-subtle flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg text-foreground">Nhập hàng</h2>
            <p className="text-xs text-muted mt-0.5">
              {step === "select-product" && "Bước 1: Chọn sản phẩm"}
              {step === "select-store" && "Bước 2: Chọn cửa hàng"}
              {step === "confirm" && "Bước 3: Xác nhận"}
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
        <div className="p-6">
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
                <div className="flex justify-center py-8">
                  <FiLoader className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : productsWithInventory.length === 0 ? (
                <div className="text-center py-12">
                  <FiAlertCircle className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-muted">
                    Chưa có sản phẩm nào. Vui lòng tạo sản phẩm trước.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
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
                        className="p-4 border border-subtle rounded-lg hover:bg-section cursor-pointer transition flex items-center gap-4"
                      >
                        {product.hinhAnhUrls && product.hinhAnhUrls.length > 0 ? (
                          <img src={product.hinhAnhUrls[0]} alt={product.tenSanPham} className="w-12 h-12 rounded-md object-cover border border-subtle shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-section flex justify-center items-center text-xs text-muted border border-subtle shrink-0">
                            No img
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">
                            {product.tenSanPham}
                          </p>
                          <p className="text-sm text-muted mt-1">
                            {product.tenMauSac} / {product.tenKichThuoc}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {step === "select-store" && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <FiLoader className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : storesWithProduct.length === 0 ? (
                <div className="text-center py-12">
                  <FiAlertCircle className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-muted">
                    Không có cửa hàng nào có tồn kho sản phẩm này
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted">
                    Sản phẩm: {selectedProduct?.tenSanPham}
                  </p>
                  {storesWithProduct.map((store) => (
                    <div
                      key={store.id}
                      onClick={() => setSelectedStore(store)}
                      className={`p-4 border rounded-lg cursor-pointer transition flex items-start gap-4 ${
                        selectedStore?.id === store.id
                          ? "border-primary bg-primary/5"
                          : "border-subtle hover:bg-section"
                      }`}
                    >
                      {store.hinhAnhUrls && store.hinhAnhUrls.length > 0 ? (
                        <img src={store.hinhAnhUrls[0]} alt={store.tenSanPham} className="w-16 h-16 rounded-md object-cover border border-subtle shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-section flex justify-center items-center text-xs text-muted border border-subtle shrink-0">
                          No img
                        </div>
                      )}
                      
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="pr-2 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FiMapPin className="w-4 h-4 text-primary shrink-0" />
                            <h3 className="font-semibold text-foreground truncate">
                              {store.tenCuaHang}
                            </h3>
                          </div>
                          <p className="text-sm text-muted truncate">
                            {store.tenMauSac} / {store.tenKichThuoc}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary flex items-center gap-1 justify-end">
                            <FiPackage className="w-4 h-4" />
                            {store.soLuong} có sẵn
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "confirm" && selectedStore && selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 bg-section rounded-lg border border-subtle">
                <p className="text-sm text-muted mb-2">Sản phẩm</p>
                <p className="font-semibold text-foreground">
                  {selectedProduct.tenSanPham}
                </p>
                <p className="text-sm text-muted mt-1">
                  {selectedProduct.tenMauSac} / {selectedProduct.tenKichThuoc}
                </p>
              </div>

              <div className="p-4 bg-section rounded-lg border border-subtle">
                <p className="text-sm text-muted mb-2">Nhập từ cửa hàng</p>
                <p className="font-semibold text-foreground">
                  {selectedStore.tenCuaHang}
                </p>
                <p className="text-sm text-muted mt-1">
                  Có sẵn: {selectedStore.soLuong}
                </p>
              </div>

              <div className="p-4 bg-section rounded-lg border border-subtle">
                <label className="text-sm text-muted mb-2 block">
                  Số lượng nhập
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedStore.soLuong}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.min(
                        parseInt(e.target.value) || 1,
                        selectedStore.soLuong || 1,
                      ),
                    )
                  }
                  className="w-full px-3 py-2 border border-subtle rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <p className="text-xs text-muted">
                Sẽ tạo một đơn luân chuyển mới với số lượng {quantity} sản phẩm
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-subtle px-6 py-4 flex gap-3">
          {step === "select-product" && (
            <>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-medium hover:bg-section transition"
              >
                Hủy
              </button>
            </>
          )}

          {step === "select-store" && (
            <>
              <button
                onClick={() => setStep("select-product")}
                className="flex-1 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-medium hover:bg-section transition"
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={!selectedStore}
                className="flex-1 py-2.5 bg-primary text-red-700 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiếp tục
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <button
                onClick={() => setStep("select-store")}
                className="flex-1 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-medium hover:bg-section transition"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex-1 py-2.5 bg-primary text-red-700 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              >
                Tạo đơn nhập hàng
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
