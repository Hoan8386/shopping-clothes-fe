"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const registeredEmail = searchParams.get("email") || "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Đăng nhập thất bại. Kiểm tra lại thông tin.");
      } else {
        toast.success("Đăng nhập thành công!");
        const callbackUrl = searchParams.get("callbackUrl") || "/";
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">
          Đăng nhập
        </h2>
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">Đăng nhập</span>
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 py-14">
        {registered && (
          <div className="mb-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold">Đăng ký thành công.</p>
            <p>
              Vui lòng kiểm tra email
              {registeredEmail ? ` ${registeredEmail}` : ""} và bấm liên kết xác
              nhận trước khi đăng nhập.
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="email@example.com"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="text-accent font-medium hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
