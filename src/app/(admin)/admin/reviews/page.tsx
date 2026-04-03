"use client";

import { useEffect, useState } from "react";
import { ResDanhGiaSanPhamDTO } from "@/types";
import { danhGiaService } from "@/services/common.service";
import { formatDate, getImageUrl } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiMessageSquare, FiTrash2, FiStar } from "react-icons/fi";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ResDanhGiaSanPhamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] =
    useState<ResDanhGiaSanPhamDTO | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await danhGiaService.getAll(page, 20);
      const list = Array.isArray(res) ? res : [];
      list.sort((a, b) => b.id - a.id);
      setReviews(list);
    } catch {
      toast.error("Lỗi tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (review: ResDanhGiaSanPhamDTO) => {
    setSelectedReview(review);
    setReplyText(review.adminPhanHoi || "");
  };

  const handleReply = async () => {
    if (!selectedReview) return;
    const content = replyText.trim();
    if (!content) {
      toast.error("Nội dung phản hồi không được để trống");
      return;
    }
    try {
      setReplying(true);
      const updated = await danhGiaService.adminReply(
        selectedReview.id,
        content,
      );
      setSelectedReview(updated);
      setReviews((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success("Đã phản hồi đánh giá");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Không thể phản hồi đánh giá",
      );
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa đánh giá này?")) return;
    setDeleting(true);
    try {
      await danhGiaService.delete(id);
      toast.success("Đã xóa");
      fetchReviews();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          size={14}
          className={
            s <= count ? "fill-yellow-400 text-yellow-400" : "text-muted/40"
          }
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý đánh giá</h1>
        <p className="text-sm text-muted mt-1">
          Đánh giá sản phẩm từ khách hàng
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-section border-b border-subtle">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Sao
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Bình luận
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Phản hồi admin
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-section transition">
                    <td className="px-5 py-3.5 text-muted">#{r.id}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground max-w-50 truncate">
                      {r.tenSanPham || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {r.tenKhachHang || "—"}
                    </td>
                    <td className="px-5 py-3.5">{renderStars(r.soSao)}</td>
                    <td className="px-5 py-3.5 text-muted max-w-75 truncate">
                      {r.ghiTru}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {formatDate(r.ngayTao)}
                    </td>
                    <td className="px-5 py-3.5 text-muted max-w-65">
                      <p className="truncate">
                        {r.adminPhanHoi || "Chưa phản hồi"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetail(r)}
                          className="p-2 rounded-lg text-accent hover:bg-accent/10 transition"
                          title="Chi tiết và phản hồi"
                        >
                          <FiMessageSquare size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deleting}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Xóa đánh giá"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted">
                      Không có đánh giá
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-subtle rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Chi tiết đánh giá #{selectedReview.id}
                </h2>
                <p className="text-sm text-muted mt-1">
                  {selectedReview.tenKhachHang || "Khách hàng"} -{" "}
                  {selectedReview.tenSanPham || "Sản phẩm"}
                </p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="px-3 py-1.5 rounded-lg border border-subtle text-muted hover:bg-section"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="rounded-xl border border-subtle p-4 bg-background/40">
                <p className="text-xs text-muted mb-1">Số sao</p>
                {renderStars(selectedReview.soSao)}
                <p className="text-xs text-muted mt-3">Bình luận</p>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                  {selectedReview.ghiTru || "Không có bình luận"}
                </p>
                <p className="text-xs text-muted mt-3">
                  Ngày tạo: {formatDate(selectedReview.ngayTao)}
                </p>
              </div>

              <div className="rounded-xl border border-subtle p-4 bg-background/40 space-y-3">
                {selectedReview.hinhAnh ? (
                  <img
                    src={getImageUrl(selectedReview.hinhAnh)}
                    alt="Review"
                    className="w-full h-40 object-cover rounded-lg border border-subtle"
                  />
                ) : (
                  <div className="w-full h-40 rounded-lg border border-dashed border-subtle flex items-center justify-center text-sm text-muted">
                    Không có ảnh
                  </div>
                )}

                {selectedReview.linkVideo ? (
                  <video
                    src={getImageUrl(selectedReview.linkVideo)}
                    controls
                    className="w-full rounded-lg border border-subtle"
                  />
                ) : (
                  <div className="w-full h-12 rounded-lg border border-dashed border-subtle flex items-center justify-center text-sm text-muted">
                    Không có video
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-subtle p-4 bg-background/40 space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Trả lời đánh giá (chỉ Admin)
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full border border-subtle bg-card text-foreground rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                placeholder="Nhập nội dung phản hồi cho khách hàng"
              />
              {selectedReview.adminPhanHoiAt && (
                <p className="text-xs text-muted">
                  Phản hồi gần nhất: {formatDate(selectedReview.adminPhanHoiAt)}
                  {selectedReview.adminPhanHoiBy
                    ? ` bởi ${selectedReview.adminPhanHoiBy}`
                    : ""}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={replying}
                  className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {replying ? "Đang gửi..." : "Gửi phản hồi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
