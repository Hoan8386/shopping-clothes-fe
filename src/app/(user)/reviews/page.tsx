"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ResDanhGiaSanPhamDTO } from "@/types";
import { danhGiaService } from "@/services/common.service";
import { useAuthStore } from "@/store/auth.store";
import { formatDate, getImageUrl } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiStar, FiTrash2, FiEdit2, FiX, FiCamera } from "react-icons/fi";
import Link from "next/link";

export default function MyReviewsPage() {
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<ResDanhGiaSanPhamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editReview, setEditReview] = useState<ResDanhGiaSanPhamDTO | null>(
    null,
  );
  const [editSoSao, setEditSoSao] = useState(5);
  const [editGhiChu, setEditGhiChu] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchReviews();
  }, [isAuthenticated, router]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await danhGiaService.getMyReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa đánh giá này?")) return;
    try {
      await danhGiaService.delete(id);
      toast.success("Đã xóa đánh giá");
      fetchReviews();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const openEditModal = (review: ResDanhGiaSanPhamDTO) => {
    setEditReview(review);
    setEditSoSao(review.soSao);
    setEditGhiChu(review.ghiTru || "");
    setEditFile(null);
    setEditPreview(review.hinhAnh ? getImageUrl(review.hinhAnh) : null);
    setEditModal(true);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFile(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitEdit = async () => {
    if (!editReview) return;
    if (editSoSao < 1 || editSoSao > 5) {
      toast.error("Số sao phải từ 1 đến 5");
      return;
    }
    setEditSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("soSao", editSoSao.toString());
      if (editGhiChu) formData.append("ghiTru", editGhiChu);
      if (editFile) formData.append("file", editFile);
      await danhGiaService.update(editReview.id, formData);
      toast.success("Cập nhật đánh giá thành công!");
      setEditModal(false);
      fetchReviews();
    } catch {
      toast.error("Không thể cập nhật đánh giá");
    } finally {
      setEditSubmitting(false);
    }
  };

  const renderStars = (count: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <FiStar
        key={i}
        size={14}
        className={i < count ? "text-accent fill-accent" : "text-gray-200"}
      />
    ));

  if (loading) return <Loading />;

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">
          Đánh giá
        </h2>
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">Đánh giá của tôi</span>
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {reviews.length === 0 ? (
          <div className="text-center py-20">
            <FiStar className="mx-auto text-gray-200 mb-6" size={60} />
            <p className="text-gray-400 text-sm">Bạn chưa có đánh giá nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-subtle bg-card hover:border-subtle transition"
              >
                <div className="px-6 py-5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground text-sm">
                      {review.tenSanPham}
                    </h4>
                    <div className="flex items-center gap-0.5 mt-2">
                      {renderStars(review.soSao)}
                    </div>
                    {review.ghiTru && (
                      <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                        {review.ghiTru}
                      </p>
                    )}
                    {review.hinhAnh && (
                      <div className="mt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImageUrl(review.hinhAnh)}
                          alt="Review"
                          className="object-cover border border-subtle rounded-lg"
                          style={{ width: 80, height: 80 }}
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-300 mt-3 uppercase tracking-wider">
                      {formatDate(review.ngayTao)}
                      {review.ngayCapNhat && (
                        <span className="ml-2">
                          (đã sửa {formatDate(review.ngayCapNhat)})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(review)}
                      className="text-gray-300 hover:text-blue-500 transition p-1"
                      title="Sửa đánh giá"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-gray-300 hover:text-accent transition p-1"
                      title="Xóa đánh giá"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Review Modal */}
      {editModal && editReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-foreground">Sửa đánh giá</h3>
              <button
                onClick={() => setEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm font-medium text-foreground">
                {editReview.tenSanPham}
              </p>

              {/* Star Rating */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                  Số sao
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditSoSao(star)}
                      className="p-0.5"
                    >
                      <FiStar
                        size={24}
                        className={
                          star <= editSoSao
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
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                  Nội dung đánh giá
                </label>
                <textarea
                  value={editGhiChu}
                  onChange={(e) => setEditGhiChu(e.target.value)}
                  rows={3}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                  Ảnh đánh giá (tùy chọn)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEditFileChange}
                />
                {editPreview ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editPreview}
                      alt="Preview"
                      className="object-cover rounded-lg border border-subtle"
                      style={{ width: 100, height: 100 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditFile(null);
                        setEditPreview(null);
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
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-accent hover:text-accent transition"
                  >
                    <FiCamera size={16} /> Chọn ảnh
                  </button>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={editSubmitting}
                className="px-6 py-2 bg-accent text-white text-sm font-bold uppercase tracking-wider hover:bg-accent-hover transition disabled:opacity-50"
              >
                {editSubmitting ? "Đang lưu..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
