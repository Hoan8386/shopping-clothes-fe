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
    try {
      await danhGiaService.delete(id);
      toast.success("Đã xóa");
      fetchReviews();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          size={14}
          className={
            s <= count ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }
        />
      ))}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý đánh giá</h1>

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Sản phẩm</th>
                <th className="px-4 py-3 text-left">Khách hàng</th>
                <th className="px-4 py-3 text-left">Sao</th>
                <th className="px-4 py-3 text-left">Bình luận</th>
                <th className="px-4 py-3 text-left">Ngày</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                    {r.tenSanPham || "—"}
                  </td>
                  <td className="px-4 py-3">{r.tenKhachHang || "—"}</td>
                  <td className="px-4 py-3">{renderStars(r.soSao)}</td>
                  <td className="px-4 py-3 max-w-[300px] truncate">
                    {r.ghiChu}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(r.ngayTao)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Không có đánh giá
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
