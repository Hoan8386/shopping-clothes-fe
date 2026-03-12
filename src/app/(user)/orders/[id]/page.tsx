"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DonHang } from "@/types";
import { orderService } from "@/services/order.service";
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
import { FiArrowLeft, FiStar, FiX, FiCamera } from "react-icons/fi";

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
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedItems, setReviewedItems] = useState<Set<number>>(new Set());
  const [confirmingReceive, setConfirmingReceive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setReviewModal(true);
  };

  const handleReviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReviewFile(file);
      setReviewPreview(URL.createObjectURL(file));
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
            {order.chiTietDonHangs?.map((item, idx) => (
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
                  {item.giamGia > 0 && (
                    <p className="text-xs text-accent mt-0.5">
                      Giảm giá: {item.giamGia}%
                    </p>
                  )}
                  {/* Review button for delivered orders */}
                  {order.trangThai === "Đã nhận hàng" && item.id && (
                    <div className="mt-2">
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
            ))}
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
          order.trangThai === 3) && (
          <div className="flex justify-end gap-3">
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
                  ref={fileInputRef}
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
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-subtle rounded-lg text-sm text-muted hover:border-accent hover:text-accent transition"
                  >
                    <FiCamera size={16} /> Chọn ảnh
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
    </>
  );
}
