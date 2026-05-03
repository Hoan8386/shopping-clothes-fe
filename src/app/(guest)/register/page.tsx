"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import toast from "react-hot-toast";

const VIETNAM_PHONE_REGEX = /^(0\d{9}|\+84\d{9})$/;

export default function RegisterPage() {
  const [form, setForm] = useState({
    tenKhachHang: "",
    email: "",
    sdt: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    const phone = form.sdt.trim();
    if (!VIETNAM_PHONE_REGEX.test(phone)) {
      toast.error(
        "Số điện thoại không hợp lệ. Dùng 0xxxxxxxxx hoặc +84xxxxxxxxx",
      );
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        tenKhachHang: form.tenKhachHang,
        email: form.email,
        sdt: phone,
        password: form.password,
      });
      toast.success(
        "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
      );
      router.push(
        `/login?registered=1&email=${encodeURIComponent(form.email)}`,
      );
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[]; error?: string } };
        message?: string;
      };

      const serverMessage = err.response?.data?.message;
      const fallbackError = err.response?.data?.error;
      const msg = Array.isArray(serverMessage)
        ? serverMessage[0]
        : serverMessage || fallbackError || err.message || "Đăng ký thất bại";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">
          Đăng ký
        </h2>
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">Đăng ký</span>
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 py-14">
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
              Họ và tên
            </label>
            <input
              type="text"
              name="tenKhachHang"
              value={form.tenKhachHang}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className="w-full border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className="w-full border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
              Số điện thoại
            </label>
            <input
              type="tel"
              name="sdt"
              value={form.sdt}
              onChange={handleChange}
              placeholder="0123456789"
              className="w-full border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••"
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
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••"
              className="w-full border border-subtle px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-white py-3 text-sm font-bold uppercase tracking-wider hover:bg-accent disabled:opacity-50 transition"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="text-accent font-medium hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </>
  );
}
