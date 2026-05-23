"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSent(true);
      toast.success("Đã gửi email đặt lại mật khẩu");
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Không thể gửi email đặt lại mật khẩu";
      toast.error(message || "Không thể gửi email đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">
          Quên mật khẩu
        </h2>
        <p className="text-sm text-gray-400">
          <Link href="/login" className="hover:text-accent">
            Đăng nhập
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">Quên mật khẩu</span>
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 py-14">
        {sent ? (
          <div className="border border-emerald-300 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <p className="font-semibold">Đã gửi email đặt lại mật khẩu.</p>
            <p className="mt-1">
              Vui lòng kiểm tra hộp thư của bạn. Trong email sẽ có đường link để
              đặt lại mật khẩu mới.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                className="w-full border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-white py-3 text-sm font-bold uppercase tracking-wider hover:bg-accent disabled:opacity-50 transition"
            >
              {loading ? "Đang gửi..." : "Gửi mã reset mật khẩu"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          <Link
            href="/login"
            className="text-accent font-medium hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </>
  );
}
