"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DonHang,
  ResGioHangNhanVienDTO,
  ResGioHangNhanVienKhuyenMaiDiemDTO,
  ResGioHangNhanVienKhuyenMaiHoaDonDTO,
  ResChiTietSanPhamDTO,
  ResKhachHangLookupDTO,
  ResSanPhamDTO,
} from "@/types";
import { orderService, OrderSearchParams } from "@/services/order.service";
import { productService } from "@/services/product.service";
import { productVariantService } from "@/services/product.service";
import {
  khuyenMaiDiemService,
  khuyenMaiHoaDonService,
} from "@/services/common.service";
import {
  formatCurrency,
  formatDate,
  getOrderStatusText,
  getOrderStatusColor,
  getPaymentStatusText,
  getPaymentMethodText,
  getImageUrl,
} from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEye,
  FiEdit,
  FiSearch,
  FiX,
  FiTrash2,
  FiPackage,
} from "react-icons/fi";

const ORDER_STATUSES = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ xác nhận", value: 0 },
  { label: "Đã xác nhận", value: 1 },
  { label: "Đang đóng gói", value: 2 },
  { label: "Đang giao hàng", value: 3 },
  { label: "Đã hủy", value: 4 },
  { label: "Đã nhận hàng", value: 5 },
];

// Map status text from API to numeric value
function getStatusNumber(status: string | number): number {
  if (typeof status === "number") return status;
  const map: Record<string, number> = {
    "Chờ xác nhận": 0,
    "Đã xác nhận": 1,
    "Đang đóng gói": 2,
    "Đang giao hàng": 3,
    "Đã hủy": 4,
    "Đã nhận hàng": 5,
  };
  return map[status] ?? -1;
}

// Staff flow: 0→1→2→3, cancel: 0→4, 1→4
function getValidNextStatuses(
  currentStatus: string | number,
): { label: string; value: number }[] {
  const current = getStatusNumber(currentStatus);
  switch (current) {
    case 0:
      return [
        { label: "Đã xác nhận", value: 1 },
        { label: "Đã hủy", value: 4 },
      ];
    case 1:
      return [
        { label: "Đang đóng gói", value: 2 },
        { label: "Đã hủy", value: 4 },
      ];
    case 2:
      return [{ label: "Đang giao hàng", value: 3 }];
    default:
      return [];
  }
}

interface PosItem {
  id: number;
  variantId: number;
  tenSanPham: string;
  mauSac: string;
  kichThuoc: string;
  giaBan: number;
  soLuong: number;
  tonKho: number;
  maVach?: string;
}

export default function StaffOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessedVNPayReturnRef = useRef(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"orders" | "draft-carts">(
    "orders",
  );

  const [orders, setOrders] = useState<DonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<number | undefined>();

  // Draft carts tab
  const [draftCarts, setDraftCarts] = useState<ResGioHangNhanVienDTO[]>([]);
  const [loadingDraftCarts, setLoadingDraftCarts] = useState(false);
  const [deletingCartId, setDeletingCartId] = useState<number | null>(null);
  const [selectedDraftCart, setSelectedDraftCart] =
    useState<ResGioHangNhanVienDTO | null>(null);
  const [showDraftCartModal, setShowDraftCartModal] = useState(false);
  const [editingDraftCartItems, setEditingDraftCartItems] = useState<PosItem[]>(
    [],
  );
  const [checkoutingDraftCart, setCheckoutingDraftCart] = useState(false);

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<DonHang | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Update status modal
  const [editOrder, setEditOrder] = useState<DonHang | null>(null);
  const [newStatus, setNewStatus] = useState<number>(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // POS modal
  const [showPosModal, setShowPosModal] = useState(false);
  const [staffCart, setStaffCart] = useState<ResGioHangNhanVienDTO | null>(
    null,
  );
  const [editingCartId, setEditingCartId] = useState<number | null>(null);
  const [posItems, setPosItems] = useState<PosItem[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<ResKhachHangLookupDTO | null>(null);
  const [productDetailCodeInput, setProductDetailCodeInput] = useState("");
  const [selectedHoaDonPromoId, setSelectedHoaDonPromoId] = useState<
    number | undefined
  >();
  const [selectedDiemPromoId, setSelectedDiemPromoId] = useState<
    number | undefined
  >();
  const [hoaDonPromos, setHoaDonPromos] = useState<
    ResGioHangNhanVienKhuyenMaiHoaDonDTO[]
  >([]);
  const [diemPromos, setDiemPromos] = useState<
    ResGioHangNhanVienKhuyenMaiDiemDTO[]
  >([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ResSanPhamDTO[]>([]);
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ResSanPhamDTO | null>(
    null,
  );
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [submittingPos, setSubmittingPos] = useState(false);
  const [uploadingBarcodeImage, setUploadingBarcodeImage] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturingImage, setCapturingImage] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImageFile, setCapturedImageFile] = useState<File | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(
    null,
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const capturedPreviewUrlRef = useRef<string | null>(null);
  const [draftCheckoutPaymentMethod, setDraftCheckoutPaymentMethod] =
    useState(0);

  const [loadingPromoOptions, setLoadingPromoOptions] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: OrderSearchParams = { page, size: 15 };
      if (filterStatus !== undefined) params.trangThai = filterStatus;
      if (filterType !== undefined) params.hinhThucDonHang = filterType;
      const data = await orderService.getAll(params);
      setOrders(data.result);
      setTotalPages(data.meta.pages);
    } catch {
      toast.error("Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchDraftCarts = async () => {
    try {
      setLoadingDraftCarts(true);
      const carts = await orderService.getAllDraftCarts();
      setDraftCarts(carts || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể tải danh sách giỏ hàng";
      toast.error(msg);
      setDraftCarts([]);
    } finally {
      setLoadingDraftCarts(false);
    }
  };

  useEffect(() => {
    if (activeTab === "draft-carts") {
      fetchDraftCarts();
    }
  }, [activeTab]);

  useEffect(() => {
    if (hasProcessedVNPayReturnRef.current) return;

    const txnRef = searchParams.get("vnp_TxnRef");
    if (!txnRef || !txnRef.startsWith("GHNV_")) {
      return;
    }

    hasProcessedVNPayReturnRef.current = true;

    const queryObject = Object.fromEntries(Array.from(searchParams.entries()));

    const processVNPayReturn = async () => {
      try {
        const data = await orderService.confirmVNPayReturn(queryObject);
        const success = data?.success === "true";

        if (success) {
          toast.success("Thanh toán VNPAY thành công, đơn hàng đã được tạo");
          await fetchDraftCarts();
          fetchOrders();
        } else {
          toast.error(
            "Thanh toán VNPAY chưa thành công, đơn hàng chưa được tạo",
          );
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể đồng bộ kết quả thanh toán VNPAY";
        toast.error(msg);
      } finally {
        router.replace("/staff/orders");
      }
    };

    processVNPayReturn();
  }, [searchParams, router, fetchOrders]);

  const handleSelectDraftCart = async (cartId: number) => {
    try {
      const cart = await orderService.getDraftCartById(cartId);
      setSelectedDraftCart(cart);
      setShowDraftCartModal(true);
      setEditingDraftCartItems(
        (cart.chiTietGioHangs || []).map((x) => ({
          id: x.id,
          variantId: x.chiTietSanPhamId,
          tenSanPham: x.tenSanPham || "",
          mauSac: x.tenMauSac || "",
          kichThuoc: x.tenKichThuoc || "",
          giaBan: x.giaBan || 0,
          soLuong: x.soLuong,
          tonKho: x.tonKho,
          maVach: x.maVach,
        })),
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể tải chi tiết giỏ hàng";
      toast.error(msg);
    }
  };

  const handleDeleteDraftCart = async (cartId: number) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa giỏ hàng này?");
    if (!confirmed) return;

    try {
      setDeletingCartId(cartId);
      await orderService.deleteStaffDraftCart(cartId);
      toast.success("Đã xóa giỏ hàng");

      if (selectedDraftCart?.id === cartId) {
        setSelectedDraftCart(null);
        setShowDraftCartModal(false);
      }

      await fetchDraftCarts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể xóa giỏ hàng";
      toast.error(msg);
    } finally {
      setDeletingCartId(null);
    }
  };

  const handleCheckoutDraftCart = async () => {
    if (!selectedDraftCart) return;
    try {
      setCheckoutingDraftCart(true);

      if (draftCheckoutPaymentMethod === 1) {
        const paymentUrl = await orderService.createStaffCartVNPayPaymentUrl(
          selectedDraftCart.id,
        );
        if (!paymentUrl) {
          toast.error("Không thể tạo đường dẫn thanh toán VNPAY");
          return;
        }

        toast.success("Đang chuyển đến cổng thanh toán VNPAY...");
        window.location.href = paymentUrl;
        return;
      }

      await orderService.checkoutStaffCart(
        draftCheckoutPaymentMethod,
        selectedDraftCart.id,
      );
      toast.success("Tạo đơn từ giỏ hàng thành công");
      setShowDraftCartModal(false);
      setSelectedDraftCart(null);
      await fetchDraftCarts();
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tạo đơn thất bại";
      toast.error(msg);
    } finally {
      setCheckoutingDraftCart(false);
    }
  };

  const syncPosUIFromCart = (cart: ResGioHangNhanVienDTO) => {
    setStaffCart(cart);
    setBuyerName(cart.tenKhachHang || cart.tenNguoiMua || "");
    setCustomerPhone(cart.sdt || "");
    setSelectedHoaDonPromoId(cart.maKhuyenMaiHoaDon || undefined);
    setSelectedDiemPromoId(cart.maKhuyenMaiDiem || undefined);

    if (cart.khachHangId) {
      setSelectedCustomer({
        id: cart.khachHangId,
        tenKhachHang: cart.tenKhachHang || "",
        sdt: cart.sdt || "",
        email: cart.emailKhachHang || "",
        diemTichLuy: cart.diemTichLuy || 0,
      });
    } else {
      setSelectedCustomer(null);
    }

    setHoaDonPromos(cart.khuyenMaiHoaDonHopLe || []);
    setDiemPromos(cart.khuyenMaiDiemHopLe || []);

    setPosItems(
      (cart.chiTietGioHangs || []).map((x) => ({
        id: x.id,
        variantId: x.chiTietSanPhamId,
        tenSanPham: x.tenSanPham || "",
        mauSac: x.tenMauSac || "",
        kichThuoc: x.tenKichThuoc || "",
        giaBan: x.giaBan || 0,
        soLuong: x.soLuong,
        tonKho: x.tonKho,
        maVach: x.maVach,
      })),
    );
  };

  const upsertLocalDraftItem = (variant: ResChiTietSanPhamDTO) => {
    setPosItems((prev) => {
      const idx = prev.findIndex((item) => item.variantId === variant.id);
      if (idx >= 0) {
        const cloned = [...prev];
        const existing = cloned[idx];
        const nextQty = Math.min(existing.soLuong + 1, existing.tonKho);
        cloned[idx] = { ...existing, soLuong: nextQty };
        return cloned;
      }

      return [
        ...prev,
        {
          id: -Date.now() - variant.id,
          variantId: variant.id,
          tenSanPham: variant.tenSanPham || "",
          mauSac: variant.tenMauSac || "",
          kichThuoc: variant.tenKichThuoc || "",
          giaBan: variant.giaBan || 0,
          soLuong: 1,
          tonKho: variant.soLuong || 0,
          maVach: variant.maVach,
        },
      ];
    });
  };

  const loadFallbackPromotionsForPreCart = useCallback(async () => {
    if (editingCartId) return;

    try {
      setLoadingPromoOptions(true);
      const now = new Date();
      const tongTien = posItems.reduce(
        (sum, item) => sum + item.giaBan * item.soLuong,
        0,
      );
      const diemKhach = selectedCustomer?.diemTichLuy ?? 0;

      const [hoaDonAll, diemAll] = await Promise.all([
        khuyenMaiHoaDonService.getAll(),
        khuyenMaiDiemService.getAll(),
      ]);

      const hoaDonHopLe = (hoaDonAll || [])
        .filter((promo) => {
          const batDau = promo.thoiGianBatDau
            ? new Date(promo.thoiGianBatDau)
            : null;
          const ketThuc = promo.thoiGianKetThuc
            ? new Date(promo.thoiGianKetThuc)
            : null;
          const hoaDonToiThieu = Number(
            (promo as { hoaDonToiThieu?: number }).hoaDonToiThieu ??
              promo.hoaDonToiDa ??
              0,
          );

          return (
            promo.trangThai === 1 &&
            (promo.soLuong ?? 0) > 0 &&
            (!batDau || now >= batDau) &&
            (!ketThuc || now <= ketThuc) &&
            tongTien >= hoaDonToiThieu
          );
        })
        .map((promo) => ({
          id: promo.id,
          tenKhuyenMai: promo.tenKhuyenMai,
          phanTramGiam: promo.phanTramGiam,
          giamToiDa: promo.giamToiDa,
          hoaDonToiThieu: Number(
            (promo as { hoaDonToiThieu?: number }).hoaDonToiThieu ??
              promo.hoaDonToiDa ??
              0,
          ),
        }));

      const diemHopLe = (diemAll || [])
        .filter((promo) => {
          const batDau = promo.thoiGianBatDau
            ? new Date(promo.thoiGianBatDau)
            : null;
          const ketThuc = promo.thoiGianKetThuc
            ? new Date(promo.thoiGianKetThuc)
            : null;
          const hoaDonToiThieu = Number(
            (promo as { hoaDonToiThieu?: number }).hoaDonToiThieu ??
              promo.hoaDonToiDa ??
              0,
          );
          const diemToiThieu = Number(
            (promo as { diemToiThieu?: number }).diemToiThieu ?? 0,
          );

          return (
            promo.trangThai === 1 &&
            (promo.soLuong ?? 0) > 0 &&
            (!batDau || now >= batDau) &&
            (!ketThuc || now <= ketThuc) &&
            tongTien >= hoaDonToiThieu &&
            selectedCustomer !== null &&
            diemKhach >= diemToiThieu
          );
        })
        .map((promo) => ({
          id: promo.id,
          tenKhuyenMai: promo.tenKhuyenMai,
          phanTramGiam: promo.phanTramGiam,
          giamToiDa: promo.giamToiDa,
          hoaDonToiThieu: Number(
            (promo as { hoaDonToiThieu?: number }).hoaDonToiThieu ??
              promo.hoaDonToiDa ??
              0,
          ),
          diemToiThieu: Number(
            (promo as { diemToiThieu?: number }).diemToiThieu ?? 0,
          ),
        }));

      setHoaDonPromos(hoaDonHopLe);
      setDiemPromos(diemHopLe);
      if (
        selectedHoaDonPromoId &&
        !hoaDonHopLe.some((promo) => promo.id === selectedHoaDonPromoId)
      ) {
        setSelectedHoaDonPromoId(undefined);
      }
      if (
        selectedDiemPromoId &&
        !diemHopLe.some((promo) => promo.id === selectedDiemPromoId)
      ) {
        setSelectedDiemPromoId(undefined);
      }
    } catch {
      // Keep POS flow usable even if fallback promotion source is temporarily unavailable.
    } finally {
      setLoadingPromoOptions(false);
    }
  }, [
    editingCartId,
    posItems,
    selectedCustomer,
    selectedHoaDonPromoId,
    selectedDiemPromoId,
  ]);

  useEffect(() => {
    if (!showPosModal || editingCartId) return;
    loadFallbackPromotionsForPreCart();
  }, [showPosModal, editingCartId, loadFallbackPromotionsForPreCart]);

  const handleLookupCustomer = async () => {
    if (!customerPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại khách hàng");
      return;
    }
    try {
      setLookingUpCustomer(true);
      const customer = await orderService.lookupCustomerByPhone(
        customerPhone.trim(),
      );

      if (customer) {
        setSelectedCustomer(customer);
        setBuyerName(customer.tenKhachHang || "");
        toast.success("Đã tìm thấy khách hàng");
      } else {
        setSelectedCustomer(null);
        toast("Khách hàng mới, vui lòng nhập tên khách hàng");
      }

      if (editingCartId) {
        const cart = await orderService.updateStaffCartCustomer(
          {
            sdt: customerPhone.trim(),
            tenNguoiMua: customer?.tenKhachHang || buyerName || undefined,
          },
          editingCartId,
        );
        syncPosUIFromCart(cart);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể tìm khách hàng";
      toast.error(msg);
    } finally {
      setLookingUpCustomer(false);
    }
  };

  const handleAddByProductDetailCode = async () => {
    const codeText = productDetailCodeInput.trim();
    if (!codeText) {
      toast.error("Vui lòng nhập mã chi tiết sản phẩm");
      return;
    }

    const productDetailId = Number(codeText);
    if (!Number.isInteger(productDetailId) || productDetailId <= 0) {
      toast.error("Mã chi tiết sản phẩm không hợp lệ");
      return;
    }

    try {
      if (editingCartId) {
        const cart = await orderService.addStaffCartItem(
          {
            chiTietSanPhamId: productDetailId,
            soLuong: 1,
          },
          editingCartId,
        );
        syncPosUIFromCart(cart);
      } else {
        const variant = await productVariantService.getById(productDetailId);
        upsertLocalDraftItem(variant);
      }
      setProductDetailCodeInput("");
      toast.success("Đã thêm sản phẩm từ mã chi tiết sản phẩm");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không tìm thấy sản phẩm theo mã chi tiết";
      toast.error(msg);
    }
  };

  const handleCloseCamera = useCallback(() => {
    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setCameraOpen(false);
  }, []);

  const handleOpenCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Trình duyệt không hỗ trợ mở camera");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraOpen(true);
      setCameraReady(false);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {
            toast.error("Không thể phát camera");
          });
        }
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể truy cập camera";
      toast.error(msg);
      handleCloseCamera();
    }
  };

  const clearCapturedPreview = useCallback(() => {
    setCapturedImageFile(null);
    if (capturedPreviewUrlRef.current) {
      URL.revokeObjectURL(capturedPreviewUrlRef.current);
      capturedPreviewUrlRef.current = null;
    }
    setCapturedPreviewUrl(null);
  }, []);

  const setCapturedPreview = useCallback((file: File) => {
    if (capturedPreviewUrlRef.current) {
      URL.revokeObjectURL(capturedPreviewUrlRef.current);
      capturedPreviewUrlRef.current = null;
    }

    const previewUrl = URL.createObjectURL(file);
    capturedPreviewUrlRef.current = previewUrl;
    setCapturedPreviewUrl(previewUrl);
    setCapturedImageFile(file);
  }, []);

  const scanBarcodeFromImageFile = async (file: File) => {
    if (!file || file.size === 0) {
      toast.error("Ảnh chụp chưa hợp lệ, vui lòng chụp lại");
      return;
    }

    try {
      setUploadingBarcodeImage(true);
      const variant = await productVariantService.scanByBarcodeImage(file);
      if (editingCartId) {
        const cart = await orderService.addStaffCartItem(
          {
            chiTietSanPhamId: variant.id,
            soLuong: 1,
          },
          editingCartId,
        );
        syncPosUIFromCart(cart);
      } else {
        upsertLocalDraftItem(variant);
      }
      toast.success("Đã nhận diện ảnh và thêm sản phẩm");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không nhận diện được mã vạch từ ảnh";
      toast.error(msg);
    } finally {
      setUploadingBarcodeImage(false);
    }
  };

  const handleCaptureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("Camera chưa sẵn sàng");
      return;
    }

    if (!cameraReady) {
      toast.error("Camera đang khởi động, vui lòng thử lại");
      return;
    }

    try {
      setCapturingImage(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        toast.error("Chưa nhận được khung hình từ camera");
        return;
      }

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        toast.error("Không thể chụp ảnh từ camera");
        return;
      }

      context.drawImage(video, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), "image/jpeg", 0.92);
      });

      let captureBlob = blob;
      if (!captureBlob || captureBlob.size === 0) {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1];
        if (!base64) {
          toast.error("Không thể tạo ảnh chụp");
          return;
        }
        const binaryString = atob(base64);
        const binaryLength = binaryString.length;
        const buffer = new Uint8Array(binaryLength);
        for (let i = 0; i < binaryLength; i += 1) {
          buffer[i] = binaryString.charCodeAt(i);
        }
        captureBlob = new Blob([buffer], { type: "image/jpeg" });
      }

      if (!captureBlob || captureBlob.size === 0) {
        toast.error("Không thể tạo ảnh chụp");
        return;
      }

      const file = new File([captureBlob], `camera-capture-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      if (!file.size) {
        toast.error("Ảnh chụp rỗng, vui lòng thử lại");
        return;
      }

      setCapturedPreview(file);
      handleCloseCamera();
      toast.success("Đã chụp ảnh, vui lòng xác nhận quét");
    } finally {
      setCapturingImage(false);
    }
  };

  const handleScanCapturedImage = async () => {
    if (!capturedImageFile) {
      toast.error("Chưa có ảnh để quét");
      return;
    }

    await scanBarcodeFromImageFile(capturedImageFile);
    clearCapturedPreview();
  };

  const handleScanBarcodeImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await scanBarcodeFromImageFile(file);
    e.target.value = "";
  };

  useEffect(() => {
    return () => {
      const stream = cameraStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (capturedPreviewUrlRef.current) {
        URL.revokeObjectURL(capturedPreviewUrlRef.current);
      }
    };
  }, []);

  const openPosModal = async () => {
    setShowPosModal(true);
    setEditingCartId(null);
    setStaffCart(null);
    setPosItems([]);
    setBuyerName("");
    setCustomerPhone("");
    setSelectedCustomer(null);
    setSelectedHoaDonPromoId(undefined);
    setSelectedDiemPromoId(undefined);
    setHoaDonPromos([]);
    setDiemPromos([]);
    setProductDetailCodeInput("");
    clearCapturedPreview();
    handleCloseCamera();
    setProductSearch("");
    setSearchResults([]);
    setSelectedProduct(null);
    setVariants([]);
  };

  const openExistingCartForEdit = async (cartId: number) => {
    try {
      const cart = await orderService.getDraftCartById(cartId);
      setShowPosModal(true);
      setEditingCartId(cart.id);
      setProductDetailCodeInput("");
      clearCapturedPreview();
      handleCloseCamera();
      setProductSearch("");
      setSearchResults([]);
      setSelectedProduct(null);
      setVariants([]);
      syncPosUIFromCart(cart);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể mở giỏ hàng";
      toast.error(msg);
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);
      const data = await orderService.getById(id);
      setSelectedOrder(data);
    } catch {
      toast.error("Không thể tải chi tiết đơn hàng");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (order: DonHang) => {
    const validStatuses = getValidNextStatuses(order.trangThai);
    if (validStatuses.length === 0) {
      toast.error("Đơn hàng này không thể cập nhật trạng thái");
      return;
    }
    setEditOrder(order);
    setNewStatus(validStatuses[0].value);
    setShowEditModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!editOrder) return;
    try {
      setUpdating(true);
      await orderService.update({ id: editOrder.id, trangThai: newStatus });
      toast.success("Cập nhật trạng thái thành công");
      setShowEditModal(false);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  // POS product search
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
      const vars = await productVariantService.getByProductCurrentStore(
        product.id,
      );
      setVariants(Array.isArray(vars) ? vars : []);
    } catch {
      toast.error("Không thể tải biến thể sản phẩm");
    }
  };

  const handleAddVariant = async (variant: ResChiTietSanPhamDTO) => {
    try {
      if (editingCartId) {
        const cart = await orderService.addStaffCartItem(
          {
            chiTietSanPhamId: variant.id,
            soLuong: 1,
          },
          editingCartId,
        );
        syncPosUIFromCart(cart);
      } else {
        upsertLocalDraftItem(variant);
      }
      setVariants([]);
      setSelectedProduct(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể thêm sản phẩm";
      toast.error(msg);
    }
  };

  const handleRemoveItem = async (idx: number) => {
    try {
      const target = posItems[idx];
      if (!target) return;
      if (editingCartId) {
        const cart = await orderService.removeStaffCartItem(
          target.id,
          editingCartId,
        );
        syncPosUIFromCart(cart);
      } else {
        setPosItems((prev) => prev.filter((_, i) => i !== idx));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể xóa sản phẩm";
      toast.error(msg);
    }
  };

  const updateItemQty = async (idx: number, qty: number) => {
    if (qty < 1) return;
    try {
      const target = posItems[idx];
      if (!target) return;
      if (qty > target.tonKho) {
        toast.error("Vượt quá tồn kho hiện tại");
        return;
      }
      if (editingCartId) {
        const cart = await orderService.updateStaffCartItemQty(
          target.id,
          qty,
          editingCartId,
        );
        syncPosUIFromCart(cart);
      } else {
        setPosItems((prev) =>
          prev.map((item, i) => (i === idx ? { ...item, soLuong: qty } : item)),
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể cập nhật số lượng";
      toast.error(msg);
    }
  };

  const posTongTien =
    staffCart?.tongTienGoc ||
    posItems.reduce((sum, item) => sum + item.giaBan * item.soLuong, 0);

  const pendingOrders = orders.filter((o) => {
    const n = getStatusNumber(o.trangThai);
    return n >= 0 && n <= 2;
  }).length;
  const onlineOrders = orders.filter(
    (o) => o.hinhThucDonHang === 1 || o.hinhThucDonHang === "VNPAY",
  ).length;

  const handleSubmitPos = async () => {
    try {
      setSubmittingPos(true);

      if (!buyerName.trim() || !customerPhone.trim()) {
        toast.error("Vui lòng nhập đầy đủ tên và số điện thoại");
        return;
      }

      if (posItems.length === 0) {
        toast.error("Vui lòng thêm ít nhất 1 sản phẩm vào giỏ");
        return;
      }

      if (!editingCartId) {
        const created = await orderService.createNewDraftCart();
        const cartId = created.id;

        await orderService.updateStaffCartCustomer(
          {
            tenNguoiMua: buyerName || undefined,
            sdt: customerPhone || undefined,
          },
          cartId,
        );

        for (const item of posItems) {
          await orderService.addStaffCartItem(
            {
              chiTietSanPhamId: item.variantId,
              soLuong: item.soLuong,
            },
            cartId,
          );
        }

        await orderService.updateStaffCartPromotions(
          {
            maKhuyenMaiHoaDon: selectedHoaDonPromoId,
            maKhuyenMaiDiem: selectedDiemPromoId,
          },
          cartId,
        );

        toast.success("Đã tạo giỏ hàng thành công");
      } else {
        const payload = {
          tenNguoiMua: buyerName || undefined,
          sdt: customerPhone || undefined,
        };
        await orderService.updateStaffCartCustomer(payload, editingCartId);
        await orderService.updateStaffCartPromotions(
          {
            maKhuyenMaiHoaDon: selectedHoaDonPromoId,
            maKhuyenMaiDiem: selectedDiemPromoId,
          },
          editingCartId,
        );

        toast.success("Đã lưu cập nhật giỏ hàng");
      }

      setShowPosModal(false);
      setStaffCart(null);
      setPosItems([]);
      setBuyerName("");
      setCustomerPhone("");
      setSelectedCustomer(null);
      setSelectedHoaDonPromoId(undefined);
      setSelectedDiemPromoId(undefined);
      setEditingCartId(null);
      if (activeTab === "draft-carts") {
        await fetchDraftCarts();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Xử lý giỏ hàng thất bại";
      toast.error(msg);
    } finally {
      setSubmittingPos(false);
    }
  };

  const handleClosePosModal = async () => {
    if (editingCartId) {
      try {
        await orderService.updateStaffCartCustomer(
          {
            tenNguoiMua: buyerName || undefined,
            sdt: customerPhone || undefined,
          },
          editingCartId,
        );
        await orderService.updateStaffCartPromotions(
          {
            maKhuyenMaiHoaDon: selectedHoaDonPromoId,
            maKhuyenMaiDiem: selectedDiemPromoId,
          },
          editingCartId,
        );
      } catch {
        // Keep close action non-blocking; cart may already be partially saved by add/update actions.
      }
    }

    handleCloseCamera();
    setShowPosModal(false);
    if (activeTab === "draft-carts") {
      fetchDraftCarts();
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-subtle">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-3 font-medium text-sm transition ${
            activeTab === "orders"
              ? "text-accent border-b-2 border-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          Danh sách đơn hàng
        </button>
        <button
          onClick={() => setActiveTab("draft-carts")}
          className={`px-4 py-3 font-medium text-sm transition ${
            activeTab === "draft-carts"
              ? "text-accent border-b-2 border-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          Đơn hàng tại quầy ({draftCarts.length})
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <>
          <div className="mb-2 bg-card rounded-2xl border border-subtle p-4 lg:p-5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Danh sách đơn hàng
              </p>
              <p className="text-sm text-muted mt-1">
                Theo dõi đơn theo trạng thái và xử lý nghiệp vụ bán hàng tại
                quầy.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-card border border-subtle rounded-xl p-4">
              <p className="text-xs text-muted uppercase tracking-wide">
                Tổng đơn trang
              </p>
              <p className="text-xl font-bold text-foreground mt-1">
                {orders.length}
              </p>
            </div>
            <div className="bg-card border border-subtle rounded-xl p-4">
              <p className="text-xs text-muted uppercase tracking-wide">
                Đơn cần xử lý
              </p>
              <p className="text-xl font-bold text-foreground mt-1">
                {pendingOrders}
              </p>
            </div>
            <div className="bg-card border border-subtle rounded-xl p-4">
              <p className="text-xs text-muted uppercase tracking-wide">
                Đơn VNPAY
              </p>
              <p className="text-xl font-bold text-foreground mt-1">
                {onlineOrders}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl border border-subtle p-4 mb-6 flex flex-wrap gap-3 items-center">
            <div className="flex gap-2 flex-wrap">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={String(s.value)}
                  onClick={() => {
                    setFilterStatus(s.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    filterStatus === s.value
                      ? "bg-accent text-white"
                      : "bg-section text-muted hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <select
              value={filterType ?? ""}
              onChange={(e) => {
                setFilterType(
                  e.target.value !== "" ? Number(e.target.value) : undefined,
                );
                setPage(1);
              }}
              className="border border-subtle bg-background text-foreground rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">Tất cả hình thức</option>
              <option value="0">COD/Tiền mặt</option>
              <option value="1">VNPAY</option>
            </select>
          </div>

          {/* Orders Table */}
          {loading ? (
            <Loading />
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-muted">
              Không có đơn hàng nào
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
              <div className="px-4 py-3 border-b border-subtle bg-section/60 text-xs text-muted flex items-center gap-2">
                <FiPackage size={14} />
                <span>
                  Nhấn biểu tượng mắt để xem chi tiết, biểu tượng bút để cập
                  nhật trạng thái.
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-260">
                  <thead className="bg-section border-b border-subtle">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        Mã đơn
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        Khách hàng
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        Nhân viên
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        Bên vận chuyển
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted">
                        Ngày tạo
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted">
                        Tổng tiền
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted">
                        Hình thức
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted">
                        Thanh toán
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted">
                        Payment Ref
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-section transition">
                        <td className="px-4 py-3 font-semibold">#{o.id}</td>
                        <td className="px-4 py-3 text-muted">
                          {o.khachHang?.tenKhachHang || o.tenNguoiMua || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {o.nhanVien?.tenNhanVien || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {o.vanChuyen?.tenVanChuyen || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {formatDate(o.ngayTao)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">
                          {formatCurrency(o.tongTienTra || o.tongTien)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              o.hinhThucDonHang === 0 ||
                              o.hinhThucDonHang === "COD/Tiền mặt"
                                ? "bg-section text-muted"
                                : "bg-blue-500/10 text-blue-600"
                            }`}
                          >
                            {getPaymentMethodText(o.hinhThucDonHang)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(o.trangThai)}`}
                          >
                            {getOrderStatusText(o.trangThai)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-muted text-xs">
                          {getPaymentStatusText(o.trangThaiThanhToan)}
                        </td>
                        <td className="px-4 py-3 text-center text-muted text-xs">
                          {o.paymentRef || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleViewDetail(o.id)}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                              title="Xem chi tiết"
                            >
                              <FiEye size={15} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(o)}
                              className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"
                              title="Cập nhật trạng thái"
                            >
                              <FiEdit size={15} />
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
        </>
      )}

      {/* Draft Carts Tab */}
      {activeTab === "draft-carts" && (
        <div>
          <div className="mb-3 bg-card rounded-2xl border border-subtle p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Đơn hàng tại quầy
              </p>
              <p className="text-sm text-muted mt-1">
                Quản lý các giỏ hàng đang tạo và thanh toán để tạo hóa đơn.
              </p>
            </div>
            <button
              onClick={openPosModal}
              className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-hover transition"
            >
              <FiPlus size={16} /> Tạo giỏ hàng
            </button>
          </div>

          {loadingDraftCarts ? (
            <Loading />
          ) : draftCarts.length === 0 ? (
            <div className="text-center py-16 text-muted">
              Không có giỏ hàng nào chưa thanh toán
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {draftCarts.map((cart) => (
                <div
                  key={cart.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openExistingCartForEdit(cart.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openExistingCartForEdit(cart.id);
                    }
                  }}
                  className="text-left p-4 bg-card border border-subtle rounded-lg hover:border-accent hover:bg-section transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {cart.tenNguoiMua || "Khách hàng lẻ"} - {cart.sdt}
                      </p>
                      <p className="text-sm text-muted mt-1">
                        {(cart.chiTietGioHangs || []).length} sp •{" "}
                        {formatCurrency(cart.tongTienGoc || 0)}
                      </p>
                      <p className="text-xs text-muted mt-1">
                        Mã giỏ: #{cart.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-accent">
                        {formatCurrency(cart.tongTienThanhToan || 0)}
                      </span>
                      <p className="text-xs text-muted mt-1">Tổng thanh toán</p>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDraftCart(cart.id);
                          }}
                          disabled={deletingCartId === cart.id}
                          className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingCartId === cart.id ? "Đang xóa..." : "Xóa"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDraftCart(cart.id);
                          }}
                          className="text-xs px-2 py-1 rounded border border-subtle hover:bg-section"
                        >
                          Thanh toán
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-subtle sticky top-0 bg-card">
              <h2 className="font-bold text-lg text-foreground">
                Chi tiết đơn hàng {selectedOrder ? `#${selectedOrder.id}` : ""}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4">
              {detailLoading ? (
                <Loading />
              ) : selectedOrder ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted">Khách hàng: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.khachHang?.tenKhachHang ||
                          selectedOrder.tenNguoiMua ||
                          "Khách lẻ"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">SĐT nhận hàng: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.sdt ||
                          selectedOrder.khachHang?.sdt ||
                          "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Địa chỉ: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.diaChi || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Nhân viên: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.nhanVien?.tenNhanVien || "Chưa gán"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Cửa hàng: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.cuaHang?.tenCuaHang || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Bên vận chuyển: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.vanChuyen?.tenVanChuyen || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Hình thức: </span>
                      <span className="font-medium text-foreground">
                        {getPaymentMethodText(selectedOrder.hinhThucDonHang)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Trạng thái: </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(selectedOrder.trangThai)}`}
                      >
                        {getOrderStatusText(selectedOrder.trangThai)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Thanh toán: </span>
                      <span className="font-medium text-foreground">
                        {getPaymentStatusText(selectedOrder.trangThaiThanhToan)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Payment Ref: </span>
                      <span className="font-medium text-foreground">
                        {selectedOrder.paymentRef || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Ngày tạo: </span>
                      <span className="font-medium text-foreground">
                        {formatDate(selectedOrder.ngayTao)}
                      </span>
                    </div>
                    {selectedOrder.ngayCapNhat && (
                      <div>
                        <span className="text-muted">Ngày cập nhật: </span>
                        <span className="font-medium text-foreground">
                          {formatDate(selectedOrder.ngayCapNhat)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thông tin giá */}
                  <hr className="border-subtle" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted">Tổng tiền: </span>
                      <span className="font-medium">
                        {formatCurrency(selectedOrder.tongTien)}
                      </span>
                    </div>
                    {selectedOrder.tongTienGiam > 0 && (
                      <div>
                        <span className="text-muted">Tổng tiền giảm: </span>
                        <span className="font-medium text-red-500">
                          -{formatCurrency(selectedOrder.tongTienGiam)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted">Tổng thanh toán: </span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(selectedOrder.tongTienTra)}
                      </span>
                    </div>
                  </div>

                  {/* Khuyến mãi */}
                  {(selectedOrder.khuyenMaiHoaDon ||
                    selectedOrder.khuyenMaiDiem) && (
                    <>
                      <hr className="border-subtle" />
                      <h3 className="font-semibold text-sm text-foreground">
                        Khuyến mãi áp dụng
                      </h3>
                      <div className="space-y-1 text-sm">
                        {selectedOrder.khuyenMaiHoaDon && (
                          <div className="flex justify-between">
                            <span className="text-muted">
                              {selectedOrder.khuyenMaiHoaDon.tenKhuyenMai} (-
                              {selectedOrder.khuyenMaiHoaDon.phanTramGiam}%)
                            </span>
                            <span className="text-red-500 font-medium">
                              -
                              {formatCurrency(
                                selectedOrder.khuyenMaiHoaDon.tienDaGiam,
                              )}
                            </span>
                          </div>
                        )}
                        {selectedOrder.khuyenMaiDiem && (
                          <div className="flex justify-between">
                            <span className="text-muted">
                              {selectedOrder.khuyenMaiDiem.tenKhuyenMai} (-
                              {selectedOrder.khuyenMaiDiem.phanTramGiam}%)
                            </span>
                            <span className="text-red-500 font-medium">
                              -
                              {formatCurrency(
                                selectedOrder.khuyenMaiDiem.tienDaGiam,
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Sản phẩm */}
                  <hr className="border-subtle" />
                  <h3 className="font-semibold text-sm text-foreground">
                    Sản phẩm ({(selectedOrder.chiTietDonHangs || []).length})
                  </h3>
                  <div className="space-y-2">
                    {(selectedOrder.chiTietDonHangs || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm border-b border-subtle pb-2"
                      >
                        {item.hinhAnhChinh && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(item.hinhAnhChinh)}
                            alt={item.tenSanPham || ""}
                            className="w-12 h-12 rounded-lg object-cover border border-subtle shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {item.tenSanPham || `SP #${idx + 1}`}
                          </p>
                          <p className="text-muted text-xs">
                            {item.tenMauSac} / {item.tenKichThuoc} ×{" "}
                            {item.soLuong}
                          </p>
                          {item.giamGia > 0 && (
                            <p className="text-xs text-red-500">
                              Giảm {item.giamGia}% (-
                              {formatCurrency(item.giaGiam)})
                            </p>
                          )}
                        </div>
                        <span className="font-medium whitespace-nowrap">
                          {formatCurrency(item.thanhTien)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {showEditModal && editOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <h2 className="font-bold text-foreground">
                Cập nhật trạng thái đơn #{editOrder.id}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-muted mb-1">Trạng thái hiện tại</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(editOrder.trangThai)}`}
                >
                  {getOrderStatusText(editOrder.trangThai)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Trạng thái mới
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(Number(e.target.value))}
                  className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                >
                  {getValidNextStatuses(editOrder.trangThai).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-subtle rounded-lg text-sm text-foreground hover:bg-section"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover disabled:opacity-50"
                >
                  {updating ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Cart Edit Modal */}
      {showDraftCartModal && selectedDraftCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-subtle sticky top-0 bg-card">
              <h2 className="font-bold text-lg text-foreground">
                Chi tiết giỏ hàng tại quầy
              </h2>
              <button
                onClick={() => setShowDraftCartModal(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted">Tên khách:</span>
                  <p className="font-medium text-foreground">
                    {selectedDraftCart.tenNguoiMua || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-muted">SĐT:</span>
                  <p className="font-medium text-foreground">
                    {selectedDraftCart.sdt || "—"}
                  </p>
                </div>
              </div>

              <hr className="border-subtle" />

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2">
                  Sản phẩm ({editingDraftCartItems.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {editingDraftCartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-section rounded-lg text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.tenSanPham}</p>
                        <p className="text-xs text-muted">
                          {item.mauSac} / {item.kichThuoc}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.soLuong} x</p>
                        <p className="text-xs text-muted">
                          {formatCurrency(item.giaBan)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-subtle pt-3">
                <div className="flex justify-between font-bold">
                  <span>Tổng thanh toán</span>
                  <span className="text-accent text-lg">
                    {formatCurrency(selectedDraftCart.tongTienThanhToan || 0)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDraftCartModal(false)}
                  className="flex-1 px-4 py-2 border border-subtle rounded-lg text-sm text-foreground hover:bg-section"
                >
                  Đóng
                </button>
                <select
                  value={draftCheckoutPaymentMethod}
                  onChange={(e) =>
                    setDraftCheckoutPaymentMethod(Number(e.target.value))
                  }
                  className="flex-1 border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                >
                  <option value={0}>COD/Tiền mặt</option>
                  <option value={1}>VNPAY</option>
                </select>
                <button
                  onClick={handleCheckoutDraftCart}
                  disabled={checkoutingDraftCart}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover disabled:opacity-50"
                >
                  {checkoutingDraftCart
                    ? "Đang tạo đơn..."
                    : "Thanh toán & Tạo đơn"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Modal */}
      {showPosModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-subtle sticky top-0 bg-card">
              <h2 className="font-bold text-lg text-foreground">
                {editingCartId
                  ? "Cập nhật giỏ hàng tại quầy"
                  : "Tạo giỏ hàng tại quầy"}
              </h2>
              <button
                onClick={handleClosePosModal}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 space-y-5">
              {/* Buyer info */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tên người mua <span className="text-red-500">*</span>
                </label>
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Nhập tên người mua..."
                  className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  disabled={!!selectedCustomer}
                />
                {selectedCustomer && (
                  <p className="text-xs text-muted mt-1">
                    Khách hàng đã đăng ký, hệ thống tự dùng tên từ tài khoản.
                  </p>
                )}
              </div>

              {/* Customer phone lookup */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Số điện thoại người mua{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Nhập số điện thoại người mua..."
                    className="flex-1 border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <button
                    type="button"
                    onClick={handleLookupCustomer}
                    disabled={lookingUpCustomer}
                    className="px-3 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
                  >
                    {lookingUpCustomer ? "Đang tìm..." : "Tìm"}
                  </button>
                </div>
                {selectedCustomer && (
                  <div className="mt-2 p-2.5 rounded-lg bg-accent/10 border border-accent/20 text-sm">
                    <p className="font-medium text-foreground">
                      {selectedCustomer.tenKhachHang}
                    </p>
                    <p className="text-muted text-xs">
                      {selectedCustomer.sdt} - Điểm tích lũy:{" "}
                      {selectedCustomer.diemTichLuy ?? 0}
                    </p>
                  </div>
                )}
              </div>

              {/* Promotions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Khuyến mãi theo hóa đơn
                  </label>
                  <select
                    disabled={loadingPromoOptions}
                    value={selectedHoaDonPromoId ?? ""}
                    onChange={async (e) => {
                      const next = e.target.value
                        ? Number(e.target.value)
                        : undefined;
                      setSelectedHoaDonPromoId(next);
                      if (!editingCartId) return;
                      try {
                        const cart =
                          await orderService.updateStaffCartPromotions(
                            {
                              maKhuyenMaiHoaDon: next,
                              maKhuyenMaiDiem: selectedDiemPromoId,
                            },
                            editingCartId ?? undefined,
                          );
                        syncPosUIFromCart(cart);
                      } catch (err: unknown) {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : "Không thể áp dụng khuyến mãi";
                        toast.error(msg);
                      }
                    }}
                    className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Không áp dụng</option>
                    {hoaDonPromos.map((promo) => (
                      <option key={promo.id} value={promo.id}>
                        {promo.tenKhuyenMai} (-{promo.phanTramGiam}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Khuyến mãi theo điểm
                  </label>
                  <select
                    disabled={loadingPromoOptions}
                    value={selectedDiemPromoId ?? ""}
                    onChange={async (e) => {
                      const next = e.target.value
                        ? Number(e.target.value)
                        : undefined;
                      setSelectedDiemPromoId(next);
                      if (!editingCartId) return;
                      try {
                        const cart =
                          await orderService.updateStaffCartPromotions(
                            {
                              maKhuyenMaiHoaDon: selectedHoaDonPromoId,
                              maKhuyenMaiDiem: next,
                            },
                            editingCartId ?? undefined,
                          );
                        syncPosUIFromCart(cart);
                      } catch (err: unknown) {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : "Không thể áp dụng khuyến mãi";
                        toast.error(msg);
                      }
                    }}
                    className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Không áp dụng</option>
                    {diemPromos.map((promo) => (
                      <option key={promo.id} value={promo.id}>
                        {promo.tenKhuyenMai} (-{promo.phanTramGiam}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product detail code and image scan */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nhập mã chi tiết sản phẩm để thêm nhanh
                </label>
                <div className="flex gap-2">
                  <input
                    value={productDetailCodeInput}
                    onChange={(e) => setProductDetailCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddByProductDetailCode();
                      }
                    }}
                    placeholder="Ví dụ: 100245"
                    className="flex-1 border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddByProductDetailCode}
                    className="px-3 py-2 rounded-lg bg-foreground text-background text-sm hover:opacity-90"
                  >
                    Thêm
                  </button>
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-muted mb-1">
                    Tải ảnh hoặc chụp bằng camera để quét mã vạch từ ảnh
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScanBarcodeImage}
                      disabled={uploadingBarcodeImage || capturingImage}
                      className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-xs file:mr-3 file:border-0 file:bg-accent file:text-white file:px-2 file:py-1 file:rounded file:cursor-pointer disabled:opacity-50"
                    />
                    {!cameraOpen ? (
                      <button
                        type="button"
                        onClick={handleOpenCamera}
                        disabled={uploadingBarcodeImage || capturingImage}
                        className="px-3 py-2 rounded-lg border border-subtle text-sm hover:bg-section disabled:opacity-50"
                      >
                        Mở camera
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCloseCamera}
                        disabled={capturingImage}
                        className="px-3 py-2 rounded-lg border border-subtle text-sm hover:bg-section disabled:opacity-50"
                      >
                        Đóng camera
                      </button>
                    )}
                  </div>

                  {cameraOpen && (
                    <div className="mt-2 rounded-lg border border-subtle p-2 space-y-2">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedData={() => setCameraReady(true)}
                        className="w-full max-h-64 rounded-md bg-black object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <button
                        type="button"
                        onClick={handleCaptureFromCamera}
                        disabled={
                          uploadingBarcodeImage ||
                          capturingImage ||
                          !cameraReady
                        }
                        className="w-full px-3 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
                      >
                        {capturingImage
                          ? "Đang chụp ảnh..."
                          : cameraReady
                            ? "Chụp ảnh để quét"
                            : "Đang khởi động camera..."}
                      </button>
                    </div>
                  )}

                  {capturedPreviewUrl && (
                    <div className="mt-2 rounded-lg border border-subtle p-2 space-y-2">
                      <p className="text-xs text-muted">
                        Ảnh đã chụp (preview)
                      </p>
                      <Image
                        src={capturedPreviewUrl}
                        alt="Ảnh chụp mã vạch"
                        width={1280}
                        height={720}
                        unoptimized
                        className="w-full max-h-64 rounded-md object-cover border border-subtle"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleScanCapturedImage}
                          disabled={uploadingBarcodeImage || capturingImage}
                          className="px-3 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
                        >
                          Quét ảnh này
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            clearCapturedPreview();
                            handleOpenCamera();
                          }}
                          disabled={uploadingBarcodeImage || capturingImage}
                          className="px-3 py-2 rounded-lg border border-subtle text-sm hover:bg-section disabled:opacity-50"
                        >
                          Chụp lại
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadingBarcodeImage && (
                    <p className="text-xs text-muted mt-1">
                      Đang tải ảnh và quét mã vạch trên server...
                    </p>
                  )}
                </div>
              </div>

              {/* Product Search */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Thêm sản phẩm
                </label>
                <form
                  onSubmit={handleProductSearch}
                  className="flex gap-2 mb-2"
                >
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm tên sản phẩm..."
                    className="flex-1 border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <button
                    type="submit"
                    className="bg-accent text-white px-3 py-2 rounded-lg text-sm hover:bg-accent-hover flex items-center gap-1"
                  >
                    <FiSearch size={14} />
                  </button>
                </form>
                {searchResults.length > 0 && (
                  <div className="border border-subtle rounded-lg divide-y divide-subtle text-sm">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="w-full px-3 py-2 text-left hover:bg-section flex justify-between"
                      >
                        <span>{p.tenSanPham}</span>
                        <span className="text-blue-600 font-medium">
                          {formatCurrency(p.giaBan)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {variants.length > 0 && selectedProduct && (
                  <div className="mt-2">
                    <p className="text-xs text-muted mb-1">
                      Chọn biến thể — {selectedProduct.tenSanPham}
                    </p>
                    <div className="border border-subtle rounded-lg divide-y divide-subtle text-sm">
                      {variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleAddVariant(v)}
                          className="w-full px-3 py-2 text-left hover:bg-accent/10 flex justify-between"
                        >
                          <span>
                            {v.tenMauSac} / {v.tenKichThuoc}
                          </span>
                          <span className="text-muted text-xs">
                            Tồn: {v.soLuong}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              {posItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Danh sách sản phẩm
                  </h3>
                  <div className="space-y-2">
                    {posItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm border border-subtle rounded-lg px-3 py-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.tenSanPham}</p>
                          <p className="text-xs text-muted">
                            {item.mauSac} / {item.kichThuoc}
                          </p>
                          <p className="text-xs text-muted">
                            {item.maVach
                              ? `Mã vạch: ${item.maVach}`
                              : "Không có mã vạch"}{" "}
                            - Tồn: {item.tonKho}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateItemQty(idx, item.soLuong - 1)}
                            className="w-6 h-6 rounded border border-subtle text-center text-foreground"
                          >
                            −
                          </button>
                          <span className="w-6 text-center">
                            {item.soLuong}
                          </span>
                          <button
                            onClick={() => updateItemQty(idx, item.soLuong + 1)}
                            className="w-6 h-6 rounded border border-subtle text-center text-foreground"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-medium w-28 text-right text-blue-600">
                          {formatCurrency(item.giaBan * item.soLuong)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-subtle font-bold">
                    <span>Tổng tiền hàng</span>
                    <span className="text-blue-600 text-lg">
                      {formatCurrency(posTongTien)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm space-y-1">
                    <div className="flex justify-between text-muted">
                      <span>Giảm giá theo hóa đơn</span>
                      <span>
                        -{formatCurrency(staffCart?.tienGiamHoaDon || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Giảm giá theo điểm</span>
                      <span>
                        -{formatCurrency(staffCart?.tienGiamDiem || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-subtle mt-1">
                      <span>Tổng thanh toán</span>
                      <span className="text-accent">
                        {formatCurrency(
                          staffCart?.tongTienThanhToan || posTongTien,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleClosePosModal}
                  className="flex-1 px-4 py-2 border border-subtle rounded-lg text-sm text-foreground hover:bg-section"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitPos}
                  disabled={
                    submittingPos || !customerPhone.trim() || !buyerName.trim()
                  }
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover disabled:opacity-50"
                >
                  {submittingPos
                    ? "Đang xử lý..."
                    : editingCartId
                      ? "Lưu cập nhật giỏ"
                      : "Tạo giỏ hàng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
