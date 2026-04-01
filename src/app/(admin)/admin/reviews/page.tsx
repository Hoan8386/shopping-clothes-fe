"use client";

import { useEffect, useState } from "react";
import { ResDanhGiaSanPhamDTO } from "@/types";
import { danhGiaService } from "@/services/common.service";
import { formatDate } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiTrash2, FiStar } from "react-icons/fi";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ResDanhGiaSanPhamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await danhGiaService.getAll(page, 20);
      if (res?.data?.result) {
        setReviews(res.data.result);
      } else if (Array.isArray(res)) {
        setReviews(res);
      }
    } catch {
      toast.error("Lỗi tải đánh giá");
    } finally {
      setLoading(false);
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
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-section transition">
                    <td className="px-5 py-3.5 text-muted">#{r.id}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground max-w-[200px] truncate">
                      {r.tenSanPham || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {r.tenKhachHang || "—"}
                    </td>
                    <td className="px-5 py-3.5">{renderStars(r.soSao)}</td>
                    <td className="px-5 py-3.5 text-muted max-w-[300px] truncate">
                      {r.ghiTru}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {formatDate(r.ngayTao)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted">
                      Không có đánh giá
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
