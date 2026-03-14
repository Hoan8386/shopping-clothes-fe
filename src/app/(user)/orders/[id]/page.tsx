"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  type ChangeEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { DonHang, TraHang, DoiHang, ResChiTietSanPhamDTO } from "@/types";
import { orderService } from "@/services/order.service";
import { traHangService } from "@/services/return.service";
import { doiHangService } from "@/services/exchange.service";
import { productVariantService } from "@/services/product.service";
import { danhGiaService } from "@/services/common.service";
import { useAuthStore } from "@/store/auth.store";
import {
  formatCurrency,
  formatDate,
  getOrderStatusText,
  getOrderStatusColor,
  getPaymentStatusText,
  getImageUrl,
} from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  FiArrowLeft,
  FiStar,
  FiX,
  FiCamera,
  FiVideo,
  FiRotateCcw,
  FiRepeat,
} from "react-icons/fi";

export default function OrderDetailPage() {
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<DonHang | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Review state
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewItemId, setReviewItemId] = useState<number | null>(null);
  const [reviewItemName, setReviewItemName] = useState("");
  const [reviewItemImage, setReviewItemImage] = useState<string | undefined>();
  const [reviewSoSao, setReviewSoSao] = useState(5);
  const [reviewGhiChu, setReviewGhiChu] = useState("");
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [reviewPreview, setReviewPreview] = useState<string | null>(null);
  const [reviewVideoFile, setReviewVideoFile] = useState<File | null>(null);
  const [reviewVideoPreview, setReviewVideoPreview] = useState<string | null>(
    null,
  );
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedItems, setReviewedItems] = useState<Set<number>>(new Set());
  const [confirmingReceive, setConfirmingReceive] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Return state
  const [returnModal, setReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnImageFile, setReturnImageFile] = useState<File | null>(null);
  const [returnImagePreview, setReturnImagePreview] = useState<string | null>(
    null,
  );
  const [returnItems, setReturnItems] = useState<
    {
      chiTietDonHangId: number;
      ghiTru: string;
      selected: boolean;
      tenSanPham: string;
    }[]
  >([]);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnHistory, setReturnHistory] = useState<TraHang[]>([]);
  const returnImageInputRef = useRef<HTMLInputElement>(null);

  // Exchange state
  const [exchangeModal, setExchangeModal] = useState(false);
  const [exchangeItem, setExchangeItem] = useState<{
    chiTietDonHangId: number;
    sanPhamId: number;
    tenSanPham: string;
    hinhAnhChinh?: string;
    tenMauSac?: string;
    tenKichThuoc?: string;
    giaSanPham: number;
    soLuong: number;
  } | null>(null);
  const [exchangeVariants, setExchangeVariants] = useState<
    ResChiTietSanPhamDTO[]
  >([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [exchangeNote, setExchangeNote] = useState("");
  const [exchangeReason, setExchangeReason] = useState("");
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const [exchangeLoadingVariants, setExchangeLoadingVariants] = useState(false);
  const [exchangeHistory, setExchangeHistory] = useState<DoiHang[]>([]);

  const returnedItemIds = useMemo(() => {
    const set = new Set<number>();
    const isRejectedStatus = (status?: string) =>
      status?.toLowerCase().includes("từ chối") ||
      status?.toLowerCase().includes("tu choi");

    for (const ret of returnHistory) {
      if (isRejectedStatus(ret.trangThai)) continue;
      for (const detail of ret.chiTietTraHangs || []) {
        if (detail.chiTietDonHangId) {
          set.add(detail.chiTietDonHangId);
        }
      }
    }

    return set;
  }, [returnHistory]);

  const hasReturnableItems = useMemo(() => {
    return !!order?.chiTietDonHangs?.some(
      (item) => item.id && !returnedItemIds.has(item.id),
    );
  }, [order?.chiTietDonHangs, returnedItemIds]);

  const fetchOrder = useCallback(
    async (showPageLoading = true) => {
      try {
        if (showPageLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const data = await orderService.getById(Number(params.id));
        setOrder(data);
        // Check which items already have reviews
        if (data.trangThai === "Đã nhận hàng" && data.chiTietDonHangs) {
          const reviewed = new Set<number>();
          for (const item of data.chiTietDonHangs) {
            if (item.id) {
              try {
                const reviews = await danhGiaService.getByChiTietDonHang(
                  item.id,
                );
                if (reviews.length > 0) reviewed.add(item.id);
              } catch {
                // No review exists for this item
              }
            }
          }
          setReviewedItems(reviewed);
        }

        // Fetch return history for completed orders
        if (data.trangThai === "Đã nhận hàng") {
          try {
            const returns = await traHangService.getByDonHangId(
              Number(params.id),
            );
            setReturnHistory(returns);
          } catch {
            // No returns yet
          }
          try {
            const exchanges = await doiHangService.getByDonHangId(
              Number(params.id),
            );
            setExchangeHistory(exchanges);
          } catch {
            // No exchanges yet
          }
        }
      } catch {
        toast.error("Không thể tải đơn hàng");
        router.push("/orders");
      } finally {
        if (showPageLoading) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [params.id, router],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchOrder();
  }, [isAuthenticated, params.id, router, fetchOrder]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    try {
      await orderService.update({ id: order.id, trangThai: 4 } as DonHang);
      toast.success("Đã hủy đơn hàng");
      fetchOrder(false);
    } catch {
      toast.error("Không thể hủy đơn hàng");
    }
  };

  const handleConfirmReceived = async () => {
    if (!order) return;
    if (!confirm("Xác nhận bạn đã nhận được hàng?")) return;
    try {
      setConfirmingReceive(true);
      await orderService.update({ id: order.id, trangThai: 5 } as DonHang);
      toast.success("Đã xác nhận nhận hàng thành công!");
      fetchOrder(false);
    } catch {
      toast.error("Không thể xác nhận nhận hàng");
    } finally {
      setConfirmingReceive(false);
    }
  };

  const openReviewModal = (
    chiTietDonHangId: number,
    productName: string,
    productImage?: string,
  ) => {
    setReviewItemId(chiTietDonHangId);
    setReviewItemName(productName);
    setReviewItemImage(productImage);
    setReviewSoSao(5);
    setReviewGhiChu("");
    setReviewFile(null);
    setReviewPreview(null);
    setReviewVideoFile(null);
    setReviewVideoPreview(null);
    setReviewModal(true);
  };

  const handleReviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReviewFile(file);
      setReviewPreview(URL.createObjectURL(file));
    }
  };

  const handleReviewVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReviewVideoFile(file);
      setReviewVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewItemId) return;
    if (reviewSoSao < 1 || reviewSoSao > 5) {
      toast.error("Số sao phải từ 1 đến 5");
      return;
    }
    setReviewSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("chiTietDonHangId", reviewItemId.toString());
      formData.append("soSao", reviewSoSao.toString());
      if (reviewGhiChu) formData.append("ghiTru", reviewGhiChu);
      if (reviewFile) formData.append("file", reviewFile);
      if (reviewVideoFile) formData.append("videoFile", reviewVideoFile);
      await danhGiaService.create(formData);
      toast.success("Đánh giá thành công!");
      setReviewModal(false);
      setReviewedItems((prev) => new Set(prev).add(reviewItemId));
    } catch {
      toast.error("Không thể tạo đánh giá");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ===== RETURN HANDLERS =====
  const openReturnModal = () => {
    if (!order) return;
    const items = order.chiTietDonHangs
      .filter((item) => item.id && !returnedItemIds.has(item.id))
      .map((item) => ({
        chiTietDonHangId: item.id!,
        ghiTru: "",
        selected: false,
        tenSanPham: item.tenSanPham || "Sản phẩm",
      }));

    if (items.length === 0) {
      toast("Tất cả sản phẩm trong đơn đã có yêu cầu trả hàng");
      return;
    }

    setReturnItems(items);
    setReturnReason("");
    setReturnImageFile(null);
    setReturnImagePreview(null);
    setReturnModal(true);
  };

  const handleSelectReturnImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    if (returnImagePreview) {
      URL.revokeObjectURL(returnImagePreview);
    }

    setReturnImageFile(file);
    setReturnImagePreview(URL.createObjectURL(file));
  };

  const handleClearReturnImage = () => {
    if (returnImagePreview) {
      URL.revokeObjectURL(returnImagePreview);
    }
    setReturnImagePreview(null);
    setReturnImageFile(null);
    if (returnImageInputRef.current) {
      returnImageInputRef.current.value = "";
    }
  };

  const toggleReturnItem = (idx: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const updateReturnItemNote = (idx: number, note: string) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ghiTru: note } : item)),
    );
  };

  const handleSubmitReturn = async () => {
    if (!order) return;
    const selected = returnItems.filter((i) => i.selected);
    if (selected.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để trả");
      return;
    }
    if (!returnReason.trim()) {
      toast.error("Vui lòng nhập lý do trả hàng");
      return;
    }
    setReturnSubmitting(true);
    try {
      await traHangService.create(
        {
          donHangId: order.id,
          lyDoTraHang: returnReason,
          chiTietTraHangs: selected.map((i) => ({
            chiTietDonHangId: i.chiTietDonHangId,
            ghiTru: i.ghiTru || undefined,
          })),
        },
        returnImageFile,
      );
      toast.success("Tạo phiếu trả hàng thành công!");
      setReturnModal(false);
      handleClearReturnImage();
      fetchOrder(false);
    } catch {
      toast.error("Không thể tạo phiếu trả hàng");
    } finally {
      setReturnSubmitting(false);
    }
  };

  const getReturnStatusColor = (status: string) => {
    switch (status) {
      case "Chờ xử lý":
        return "bg-yellow-100 text-yellow-800";
      case "Đã duyệt":
        return "bg-green-100 text-green-800";
      case "Từ chối":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ===== EXCHANGE HANDLERS =====
  const openExchangeModal = async (item: {
    chiTietDonHangId: number;
    sanPhamId: number;
    tenSanPham: string;
    hinhAnhChinh?: string;
    tenMauSac?: string;
    tenKichThuoc?: string;
    giaSanPham: number;
    soLuong: number;
    chiTietSanPhamId: number;
  }) => {
    setExchangeItem(item);
    setSelectedVariantId(null);
    setExchangeNote("");
    setExchangeReason("");
    setExchangeModal(true);
    setExchangeLoadingVariants(true);

    try {
      const variants = await productVariantService.getByProduct(item.sanPhamId);
      // Filter out the current variant and show only variants with stock
      const available = variants.filter(
        (v) => v.id !== item.chiTietSanPhamId && v.soLuong > 0,
      );
      setExchangeVariants(available);
    } catch {
      toast.error("Không thể tải danh sách sản phẩm đổi");
      setExchangeVariants([]);
    } finally {
      setExchangeLoadingVariants(false);
    }
  };

  const handleSubmitExchange = async () => {
    if (!order || !exchangeItem || !selectedVariantId) return;
    if (!exchangeReason.trim()) {
      toast.error("Vui lòng nhập lý do đổi hàng");
      return;
    }
    setExchangeSubmitting(true);
    try {
      await doiHangService.create({
        donHangId: order.id,
        ghiTru: exchangeReason,
        chiTietDoiHangs: [
          {
            chiTietDonHangId: exchangeItem.chiTietDonHangId,
            chiTietSanPhamId: selectedVariantId,
            ghiTru: exchangeNote || undefined,
          },
        ],
      });
      toast.success("Tạo phiếu đổi hàng thành công!");
      setExchangeModal(false);
      fetchOrder(false);
    } catch {
      toast.error("Không thể tạo phiếu đổi hàng");
    } finally {
      setExchangeSubmitting(false);
    }
  };

  const getSelectedVariantPrice = () => {
    if (!selectedVariantId) return 0;
    const v = exchangeVariants.find((v) => v.id === selectedVariantId);
    return v?.giaBan || 0;
  };

  if (loading) return <Loading />;
  if (!order) return null;

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">
          Chi tiết đơn hàng
        </h2>
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/orders" className="hover:text-accent">
            Đơn hàng
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">#{order.id}</span>
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground hover:text-accent transition mb-8"
        >
          <FiArrowLeft size={14} /> Quay lại danh sách
        </Link>

        {refreshing && (
          <p className="text-xs text-gray-500 mb-4">
            Đang cập nhật đơn hàng...
          </p>
        )}

        {/* Order Info */}
        <div className="border border-subtle bg-card mb-6">
          <div className="flex items-center justify-between px-6 py-5 border-b border-subtle">
            <h3 className="text-lg font-bold text-foreground">
              Đơn hàng #{order.id}
            </h3>
            <span
              className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${getOrderStatusColor(
                order.trangThai,
              )}`}
            >
              {getOrderStatusText(order.trangThai)}
            </span>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Ngày đặt
                </p>
                <p className="font-semibold text-foreground">
                  {formatDate(order.ngayTao)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Hình thức
                </p>
                <p className="font-semibold text-foreground">
                  {String(order.hinhThucDonHang)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Thanh toán
                </p>
                <p className="font-semibold text-foreground">
                  {getPaymentStatusText(order.trangThaiThanhToan)}
                </p>
              </div>
              {order.nhanVien && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Nhân viên xử lý
                  </p>
                  <p className="font-semibold text-foreground">
                    {order.nhanVien.tenNhanVien}
                  </p>
                </div>
              )}
              {order.diaChi && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Địa chỉ giao hàng
                  </p>
                  <p className="font-semibold text-foreground">
                    {order.diaChi}
                  </p>
                </div>
              )}
              {order.sdt && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Số điện thoại
                  </p>
                  <p className="font-semibold text-foreground">{order.sdt}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="border border-subtle bg-card mb-6">
          <div className="px-6 py-4 border-b border-subtle">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Chi tiết sản phẩm
            </h3>
          </div>
          <div className="divide-y divide-subtle">
            {order.chiTietDonHangs?.map((item, idx) => {
              const isReturned = !!item.id && returnedItemIds.has(item.id);

              return (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between px-6 py-4 gap-3"
                >
                  {/* Product image */}
                  {item.hinhAnhChinh ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageUrl(item.hinhAnhChinh)}
                      alt={item.tenSanPham}
                      className="rounded-lg object-cover shrink-0 border border-subtle"
                      style={{ width: 56, height: 56 }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-section border border-subtle shrink-0" />
                  )}

                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">
                      {item.tenSanPham || "Sản phẩm"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.tenMauSac} / {item.tenKichThuoc} × {item.soLuong}
                    </p>
                    {isReturned && (
                      <p className="text-xs font-medium text-orange-600 mt-1">
                        Đã trả hàng
                      </p>
                    )}
                    {item.giamGia > 0 && (
                      <p className="text-xs text-accent mt-0.5">
                        Giảm giá: {item.giamGia}%
                      </p>
                    )}
                    {/* Review & Exchange buttons for delivered orders */}
                    {order.trangThai === "Đã nhận hàng" &&
                      item.id &&
                      !isReturned && (
                        <div className="mt-2 flex items-center gap-3">
                          {reviewedItems.has(item.id) ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                              <FiStar size={12} className="fill-green-600" /> Đã
                              đánh giá
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                openReviewModal(
                                  item.id!,
                                  item.tenSanPham || "Sản phẩm",
                                  item.hinhAnhChinh,
                                )
                              }
                              className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                            >
                              <FiStar size={12} /> Đánh giá sản phẩm
                            </button>
                          )}
                          {/* Tích năng đổi hàng */}
                          {/* {item.chiTietSanPhamId && item.sanPhamId && (
                            <button
                              onClick={() =>
                                openExchangeModal({
                                  chiTietDonHangId: item.id!,
                                  sanPhamId: item.sanPhamId!,
                                  tenSanPham: item.tenSanPham || "Sản phẩm",
                                  hinhAnhChinh: item.hinhAnhChinh,
                                  tenMauSac: item.tenMauSac,
                                  tenKichThuoc: item.tenKichThuoc,
                                  giaSanPham: item.giaSanPham,
                                  soLuong: item.soLuong,
                                  chiTietSanPhamId: item.chiTietSanPhamId!,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                            >
                              <FiRepeat size={12} /> Đổi hàng
                            </button>
                          )} */}
                        </div>
                      )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-foreground">
                      {formatCurrency(item.thanhTien)}
                    </p>
                    {item.giaGiam > 0 && (
                      <p className="text-xs text-gray-400 line-through">
                        {formatCurrency(item.giaSanPham * item.soLuong)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Totals */}
        <div className="border border-subtle bg-card mb-6">
          <div className="px-6 py-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng tiền hàng</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(order.tongTien)}
                </span>
              </div>
              {order.tienGiam > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Giảm giá sản phẩm</span>
                  <span>-{formatCurrency(order.tienGiam)}</span>
                </div>
              )}
              {order.khuyenMaiHoaDon && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span className="flex flex-col">
                    <span>Khuyến mãi hóa đơn</span>
                    <span className="text-xs text-gray-400 font-normal">
                      {order.khuyenMaiHoaDon.tenKhuyenMai}
                    </span>
                  </span>
                  <span>
                    -{formatCurrency(order.khuyenMaiHoaDon.tienDaGiam)}
                  </span>
                </div>
              )}
              {order.khuyenMaiDiem && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span className="flex flex-col">
                    <span>Khuyến mãi điểm</span>
                    <span className="text-xs text-gray-400 font-normal">
                      {order.khuyenMaiDiem.tenKhuyenMai}
                    </span>
                  </span>
                  <span>-{formatCurrency(order.khuyenMaiDiem.tienDaGiam)}</span>
                </div>
              )}
              {order.tongTienGiam > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Tổng giảm</span>
                  <span>-{formatCurrency(order.tongTienGiam)}</span>
                </div>
              )}
              <div className="border-t border-subtle pt-3 flex justify-between">
                <span className="font-bold text-foreground uppercase text-sm">
                  Tổng thanh toán
                </span>
                <span className="font-bold text-accent text-lg">
                  {formatCurrency(order.tongTienTra || order.tongTien)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {(order.trangThai === "Chờ xác nhận" ||
          order.trangThai === "Đang giao hàng" ||
          order.trangThai === "Đã nhận hàng" ||
          order.trangThai === 3) && (
          <div className="flex justify-end gap-3 mb-6">
            {order.trangThai === "Chờ xác nhận" && (
              <button
                onClick={handleCancelOrder}
                className="px-8 py-3 bg-accent text-white text-sm font-bold uppercase tracking-wider hover:bg-accent-hover transition"
              >
                Hủy đơn hàng
              </button>
            )}
            {(order.trangThai === "Đang giao hàng" ||
              order.trangThai === 3) && (
              <button
                onClick={handleConfirmReceived}
                disabled={confirmingReceive}
                className="px-8 py-3 bg-green-500 text-white text-sm font-bold uppercase tracking-wider hover:bg-green-600 transition disabled:opacity-50"
              >
                {confirmingReceive ? "Đang xử lý..." : "Đã nhận hàng"}
              </button>
            )}
            {order.trangThai === "Đã nhận hàng" && hasReturnableItems && (
              <button
                onClick={openReturnModal}
                className="px-8 py-3 bg-orange-500 text-white text-sm font-bold uppercase tracking-wider hover:bg-orange-600 transition inline-flex items-center gap-2"
              >
                <FiRotateCcw size={16} /> Trả hàng
              </button>
            )}
          </div>
        )}

        {/* Return History */}
        {returnHistory.length > 0 && (
          <div className="border border-subtle bg-card mb-6">
            <div className="px-6 py-4 border-b border-subtle">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Lịch sử trả hàng
              </h3>
            </div>
            <div className="divide-y divide-subtle">
              {returnHistory.map((ret) => (
                <div key={ret.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-bold text-foreground">
                        Phiếu: #{ret.id}
                      </span>
                      <span className="text-xs text-gray-400 ml-3">
                        {formatDate(ret.ngayTao)}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded ${getReturnStatusColor(ret.trangThai)}`}
                    >
                      {ret.trangThai}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">Lý do:</span>{" "}
                    {ret.lyDoTraHang}
                  </p>
                  {ret.linkAnh && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                        Ảnh trả hàng
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(ret.linkAnh)}
                        alt={`Ảnh trả hàng #${ret.id}`}
                        className="rounded border border-subtle object-cover"
                        style={{ width: 120, height: 120 }}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {ret.chiTietTraHangs?.map((ct) => (
                      <div
                        key={ct.id}
                        className="flex items-center gap-3 text-sm bg-section rounded-lg px-3 py-2"
                      >
                        {ct.hinhAnhChinh ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(ct.hinhAnhChinh)}
                            alt={ct.tenSanPham}
                            className="rounded object-cover shrink-0 border border-subtle"
                            style={{ width: 40, height: 40 }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 border border-subtle shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {ct.tenSanPham}
                          </p>
                          <p className="text-xs text-gray-400">
                            {ct.tenMauSac} / {ct.tenKichThuoc} × {ct.soLuong}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(ct.giaSanPham * ct.soLuong)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right">
                    <span className="text-sm text-gray-500">
                      Tổng tiền trả:{" "}
                    </span>
                    <span className="font-bold text-accent">
                      {formatCurrency(ret.tongTien)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exchange History */}
        {exchangeHistory.length > 0 && (
          <div className="border border-subtle bg-card mb-6">
            <div className="px-6 py-4 border-b border-subtle">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Lịch sử đổi hàng
              </h3>
            </div>
            <div className="divide-y divide-subtle">
              {exchangeHistory.map((ex) => (
                <div key={ex.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-bold text-foreground">
                        Phiếu: #{ex.id}
                      </span>
                      <span className="text-xs text-gray-400 ml-3">
                        {formatDate(ex.ngayTao)}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded ${getReturnStatusColor(ex.trangThai)}`}
                    >
                      {ex.trangThai}
                    </span>
                  </div>
                  {ex.ghiTru && (
                    <p className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Lý do:</span> {ex.ghiTru}
                    </p>
                  )}
                  <div className="space-y-3">
                    {ex.chiTietDoiHangs?.map((ct) => (
                      <div
                        key={ct.id}
                        className="bg-section rounded-lg px-3 py-3 space-y-2"
                      >
                        {/* Sản phẩm trả */}
                        <div className="flex items-center gap-3 text-sm">
                          {ct.hinhAnhSanPhamTra ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getImageUrl(ct.hinhAnhSanPhamTra)}
                              alt={ct.tenSanPhamTra}
                              className="rounded object-cover shrink-0 border border-subtle"
                              style={{ width: 40, height: 40 }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 border border-subtle shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-xs text-red-500 font-bold uppercase">
                              Trả
                            </p>
                            <p className="font-medium text-foreground">
                              {ct.tenSanPhamTra}
                            </p>
                            <p className="text-xs text-gray-400">
                              {ct.mauSacTra} / {ct.kichThuocTra} ×{" "}
                              {ct.soLuongTra}
                            </p>
                          </div>
                          <p className="font-semibold text-foreground">
                            {formatCurrency(ct.giaSanPhamTra * ct.soLuongTra)}
                          </p>
                        </div>
                        {/* Sản phẩm đổi */}
                        <div className="flex items-center gap-3 text-sm">
                          {ct.hinhAnhSanPhamDoi ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getImageUrl(ct.hinhAnhSanPhamDoi)}
                              alt={ct.tenSanPhamDoi}
                              className="rounded object-cover shrink-0 border border-subtle"
                              style={{ width: 40, height: 40 }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 border border-subtle shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-xs text-green-600 font-bold uppercase">
                              Đổi
                            </p>
                            <p className="font-medium text-foreground">
                              {ct.tenSanPhamDoi}
                            </p>
                            <p className="text-xs text-gray-400">
                              {ct.mauSacDoi} / {ct.kichThuocDoi} ×{" "}
                              {ct.soLuongTra}
                            </p>
                          </div>
                          <p className="font-semibold text-foreground">
                            {formatCurrency(ct.giaSanPhamDoi * ct.soLuongTra)}
                          </p>
                        </div>
                        {/* Chênh lệch */}
                        <div className="text-right text-xs">
                          <span className="text-gray-500">Chênh lệch: </span>
                          <span
                            className={`font-bold ${ct.chenhLechGia > 0 ? "text-red-500" : ct.chenhLechGia < 0 ? "text-green-600" : "text-gray-500"}`}
                          >
                            {ct.chenhLechGia > 0 ? "+" : ""}
                            {formatCurrency(ct.chenhLechGia)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right">
                    <span className="text-sm text-gray-500">Tổng tiền: </span>
                    <span className="font-bold text-accent">
                      {formatCurrency(ex.tongTien)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
              <h3 className="font-bold text-foreground">Đánh giá sản phẩm</h3>
              <button
                onClick={() => setReviewModal(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Product info */}
              <div className="flex items-center gap-3">
                {reviewItemImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getImageUrl(reviewItemImage)}
                    alt={reviewItemName}
                    className="rounded-lg object-cover shrink-0 border border-subtle"
                    style={{ width: 56, height: 56 }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-section border border-subtle shrink-0" />
                )}
                <p className="text-sm font-semibold text-foreground">
                  {reviewItemName}
                </p>
              </div>

              {/* Star Rating */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Số sao
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewSoSao(star)}
                      className="p-0.5"
                    >
                      <FiStar
                        size={28}
                        className={
                          star <= reviewSoSao
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Nội dung đánh giá
                </label>
                <textarea
                  value={reviewGhiChu}
                  onChange={(e) => setReviewGhiChu(e.target.value)}
                  rows={3}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                  className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Ảnh đánh giá (tuỳ chọn)
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReviewFileChange}
                />
                {reviewPreview ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reviewPreview}
                      alt="Preview"
                      className="object-cover rounded-lg border border-subtle"
                      style={{ width: 100, height: 100 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReviewFile(null);
                        setReviewPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-subtle rounded-lg text-sm text-muted hover:border-accent hover:text-accent transition"
                  >
                    <FiCamera size={16} /> Chọn ảnh
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Video đánh giá (tuỳ chọn)
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleReviewVideoChange}
                />
                {reviewVideoPreview ? (
                  <div className="relative inline-block">
                    <video
                      src={reviewVideoPreview}
                      controls
                      className="rounded-lg border border-subtle"
                      style={{ width: 220, maxHeight: 140 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReviewVideoFile(null);
                        setReviewVideoPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-subtle rounded-lg text-sm text-muted hover:border-accent hover:text-accent transition"
                  >
                    <FiVideo size={16} /> Chọn video
                  </button>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-subtle flex justify-end gap-3">
              <button
                onClick={() => setReviewModal(false)}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                className="px-6 py-2 bg-accent text-white text-sm font-bold rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
              >
                {reviewSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
              <h3 className="font-bold text-foreground">Trả hàng</h3>
              <button
                onClick={() => setReturnModal(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Reason */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Lý do trả hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={3}
                  placeholder="Nhập lý do trả hàng..."
                  className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Ảnh trả hàng (tuỳ chọn)
                </label>
                <input
                  ref={returnImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectReturnImage}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => returnImageInputRef.current?.click()}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-subtle hover:bg-section text-foreground"
                  >
                    Chọn ảnh
                  </button>
                  {returnImageFile && (
                    <button
                      type="button"
                      onClick={handleClearReturnImage}
                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-subtle hover:bg-section text-red-500"
                    >
                      Xoá ảnh
                    </button>
                  )}
                </div>
                {returnImagePreview && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={returnImagePreview}
                      alt="Preview ảnh trả hàng"
                      className="rounded-lg border border-subtle object-cover"
                      style={{ width: 120, height: 120 }}
                    />
                  </div>
                )}
              </div>

              {/* Select items to return */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Chọn sản phẩm trả <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {returnItems.map((item, idx) => (
                    <div
                      key={item.chiTietDonHangId}
                      className={`border rounded-lg p-3 cursor-pointer transition ${
                        item.selected
                          ? "border-accent bg-accent/5"
                          : "border-subtle hover:border-gray-400"
                      }`}
                      onClick={() => toggleReturnItem(idx)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleReturnItem(idx)}
                          className="w-4 h-4 accent-accent shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <p className="text-sm font-medium text-foreground flex-1">
                          {item.tenSanPham}
                        </p>
                      </div>
                      {item.selected && (
                        <div className="mt-2 ml-7">
                          <input
                            type="text"
                            value={item.ghiTru}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateReturnItemNote(idx, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Ghi chú cho sản phẩm này (tuỳ chọn)"
                            className="w-full border border-subtle bg-background text-foreground rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-subtle flex justify-end gap-3">
              <button
                onClick={() => {
                  setReturnModal(false);
                  handleClearReturnImage();
                }}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={returnSubmitting}
                className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
              >
                {returnSubmitting ? "Đang xử lý..." : "Gửi yêu cầu trả hàng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Modal */}
      {exchangeModal && exchangeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
              <h3 className="font-bold text-foreground">Đổi hàng</h3>
              <button
                onClick={() => setExchangeModal(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Current product info */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Sản phẩm hiện tại
                </label>
                <div className="flex items-center gap-3 bg-section rounded-lg p-3">
                  {exchangeItem.hinhAnhChinh ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageUrl(exchangeItem.hinhAnhChinh)}
                      alt={exchangeItem.tenSanPham}
                      className="rounded-lg object-cover shrink-0 border border-subtle"
                      style={{ width: 56, height: 56 }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-200 border border-subtle shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {exchangeItem.tenSanPham}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {exchangeItem.tenMauSac} / {exchangeItem.tenKichThuoc} ×{" "}
                      {exchangeItem.soLuong}
                    </p>
                    <p className="text-sm font-bold text-accent mt-1">
                      {formatCurrency(
                        exchangeItem.giaSanPham * exchangeItem.soLuong,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Lý do đổi hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={exchangeReason}
                  onChange={(e) => setExchangeReason(e.target.value)}
                  rows={2}
                  placeholder="Nhập lý do đổi hàng..."
                  className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {/* Select variant to exchange */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Chọn sản phẩm đổi <span className="text-red-500">*</span>
                </label>
                {exchangeLoadingVariants ? (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    Đang tải sản phẩm...
                  </p>
                ) : exchangeVariants.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    Không có sản phẩm khác để đổi
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {exchangeVariants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`border rounded-lg p-3 cursor-pointer transition ${
                          selectedVariantId === variant.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-subtle hover:border-gray-400"
                        }`}
                        onClick={() => setSelectedVariantId(variant.id)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="exchangeVariant"
                            checked={selectedVariantId === variant.id}
                            onChange={() => setSelectedVariantId(variant.id)}
                            className="w-4 h-4 accent-blue-500 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {variant.tenMauSac} / {variant.tenKichThuoc}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Tồn kho: {variant.soLuong}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(variant.giaBan)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price difference */}
              {selectedVariantId && (
                <div className="bg-section rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giá sản phẩm hiện tại</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(
                        exchangeItem.giaSanPham * exchangeItem.soLuong,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giá sản phẩm đổi</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(
                        getSelectedVariantPrice() * exchangeItem.soLuong,
                      )}
                    </span>
                  </div>
                  <div className="border-t border-subtle pt-2 flex justify-between text-sm">
                    <span className="font-bold text-foreground">
                      Chênh lệch
                    </span>
                    <span
                      className={`font-bold ${
                        getSelectedVariantPrice() - exchangeItem.giaSanPham > 0
                          ? "text-red-500"
                          : getSelectedVariantPrice() -
                                exchangeItem.giaSanPham <
                              0
                            ? "text-green-600"
                            : "text-gray-500"
                      }`}
                    >
                      {getSelectedVariantPrice() - exchangeItem.giaSanPham > 0
                        ? "+"
                        : ""}
                      {formatCurrency(
                        (getSelectedVariantPrice() - exchangeItem.giaSanPham) *
                          exchangeItem.soLuong,
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
                  Ghi chú (tuỳ chọn)
                </label>
                <input
                  type="text"
                  value={exchangeNote}
                  onChange={(e) => setExchangeNote(e.target.value)}
                  placeholder="Ghi chú thêm..."
                  className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-subtle flex justify-end gap-3">
              <button
                onClick={() => setExchangeModal(false)}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitExchange}
                disabled={exchangeSubmitting || !selectedVariantId}
                className="px-6 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {exchangeSubmitting ? "Đang xử lý..." : "Gửi yêu cầu đổi hàng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
