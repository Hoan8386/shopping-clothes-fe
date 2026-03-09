"use client";

import Link from "next/link";
import { FiLock, FiArrowLeft } from "react-icons/fi";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-section p-6">
            <FiLock className="text-accent" size={48} />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-foreground mb-3">
          403 – Không có quyền truy cập
        </h1>

        <p className="text-gray-400 text-sm mb-8">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên
          nếu bạn cho rằng đây là lỗi.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 bg-foreground text-background px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition"
          >
            <FiArrowLeft size={16} />
            Về trang chủ
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 border border-subtle text-foreground px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-foreground hover:text-background hover:border-foreground transition"
          >
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </div>
  );
}
