"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResDanhGiaSanPhamDTO } from "@/types";
import { danhGiaService } from "@/services/common.service";
import { useAuthStore } from "@/store/auth.store";
import { formatDate, getImageUrl } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiStar, FiTrash2 } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";

export default function MyReviewsPage() {
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<ResDanhGiaSanPhamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const renderStars = (count: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <FiStar
        key={i}
        size={14}
        className={
          i < count ? "text-accent fill-accent" : "text-gray-200"
        }
      />
    ));

  if (loading) return <Loading />;

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">Đánh giá</h2>
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
                    {review.ghiChu && (
                      <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                        {review.ghiChu}
                      </p>
                    )}
                    {review.hinhAnh && (
                      <div className="mt-3">
                        <Image
                          src={getImageUrl(review.hinhAnh)}
                          alt="Review"
                          width={80}
                          height={80}
                          className="object-cover border border-subtle"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-300 mt-3 uppercase tracking-wider">
                      {formatDate(review.ngayTao)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-gray-300 hover:text-accent transition p-1 shrink-0"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
