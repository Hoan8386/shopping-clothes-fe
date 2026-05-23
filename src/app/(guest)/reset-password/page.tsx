"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error("Thiếu token đặt lại mật khẩu");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword, confirmPassword });
      setDone(true);
      toast.success("Đặt lại mật khẩu thành công");
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Không thể đặt lại mật khẩu";
      toast.error(message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">
          Đặt lại mật khẩu
        </h2>
        <p className="text-sm text-gray-400">
          <Link href="/login" className="hover:text-accent">
            Đăng nhập
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">Đặt lại mật khẩu</span>
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 py-14">
        {done ? (
          <div className="border border-emerald-300 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <p className="font-semibold">Đã đổi mật khẩu thành công.</p>
            <p className="mt-1">
              Bạn có thể quay lại trang đăng nhập để sử dụng mật khẩu mới.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-white py-3 text-sm font-bold uppercase tracking-wider hover:bg-accent disabled:opacity-50 transition"
            >
              {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          <Link
            href="/forgot-password"
            className="text-accent font-medium hover:underline"
          >
            Gửi lại email reset
          </Link>
        </p>
      </div>
    </>
  );
}
