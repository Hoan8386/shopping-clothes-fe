"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { authService } from "@/services/auth.service";
import { cartService } from "@/services/cart.service";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";
import {
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiSearch,
  FiSun,
  FiMoon,
  FiShoppingBag,
} from "react-icons/fi";
import { useThemeStore } from "@/store/theme.store";

export default function Header() {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const { cartCount, setCartCount } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && !isAuthenticated) {
      authService
        .getAccount()
        .then((u) => setUser(u))
        .catch(() => {});
    }
  }, [isAuthenticated, setUser]);

  useEffect(() => {
    if (isAuthenticated) {
      cartService
        .getMyCart()
        .then((cart) => setCartCount(cart.tongSoLuong))
        .catch(() => {});
    }
  }, [isAuthenticated, setCartCount]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    logout();
    setCartCount(0);
    toast.success("Đăng xuất thành công");
    await signOut({ callbackUrl: "/" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(
        `/products?tenSanPham=${encodeURIComponent(searchTerm.trim())}`,
      );
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Sản phẩm" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Main Header */}
      <div className="bg-[#0c0c0c] py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <FiShoppingBag className="text-pink-500" size={22} />
            <span className="text-xl font-extrabold tracking-tight text-white underline underline-offset-4 decoration-2">
              LUXE
            </span>
          </Link>

          {/* Desktop Nav - Center */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-wide py-2 transition-colors ${
                  isActive(link.href)
                    ? "text-purple-400"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link
                  href="/orders"
                  className={`text-sm font-medium tracking-wide py-2 transition-colors ${
                    isActive("/orders")
                      ? "text-purple-400"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Đơn hàng
                </Link>
                <Link
                  href="/account"
                  className={`text-sm font-medium tracking-wide py-2 transition-colors ${
                    isActive("/account")
                      ? "text-purple-400"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Tài khoản
                </Link>
              </>
            )}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-5">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-gray-300 hover:text-white transition"
            >
              <FiSearch size={20} />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="text-gray-300 hover:text-white transition"
              title={theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
            >
              {theme === "light" ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {/* User dropdown / Login */}
            {isAuthenticated ? (
              <div className="relative group hidden lg:block">
                <button className="text-gray-300 hover:text-white transition">
                  <FiUser size={20} />
                </button>
                <div className="absolute right-0 top-full mt-3 w-52 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <Link
                    href="/account"
                    className="block px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-purple-400 transition"
                  >
                    Tài khoản
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-purple-400 transition"
                  >
                    Đơn hàng
                  </Link>
                  <Link
                    href="/reviews"
                    className="block px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-purple-400 transition"
                  >
                    Đánh giá
                  </Link>
                  {user?.role?.name === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-purple-400 transition"
                    >
                      Quản trị
                    </Link>
                  )}
                  {user?.role?.name === "NHAN_VIEN" && (
                    <Link
                      href="/staff"
                      className="block px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-purple-400 transition"
                    >
                      Nhân viên
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-pink-500 hover:bg-white/5 flex items-center gap-2 border-t border-white/10 transition"
                  >
                    <FiLogOut size={14} /> Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden lg:block text-gray-300 hover:text-white transition"
              >
                <FiUser size={20} />
              </Link>
            )}

            {/* Cart */}
            {isAuthenticated && (
              <Link
                href="/cart"
                className="relative text-gray-300 hover:text-white transition"
              >
                <FiShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-linear-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              className="lg:hidden text-gray-300"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Gradient bottom border */}
        <div className="h-0.5 bg-linear-to-r from-purple-600 via-pink-500 to-purple-600" />
      </div>

      {/* Search Bar Dropdown */}
      {searchOpen && (
        <div className="border-b border-white/10 bg-[#0c0c0c]">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <input
                type="text"
                autoFocus
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="submit"
                className="bg-linear-to-r from-purple-500 to-pink-500 text-white px-6 py-3 text-sm font-semibold rounded-full hover:from-purple-600 hover:to-pink-600 transition"
              >
                Tìm kiếm
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden border-b border-white/10 bg-[#0c0c0c]">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="bg-linear-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 text-sm font-semibold rounded-full"
                >
                  <FiSearch size={16} />
                </button>
              </div>
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2.5 text-sm font-medium tracking-wide ${
                  isActive(link.href) ? "text-purple-400" : "text-gray-300"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/cart"
                  className="block py-2.5 text-sm font-medium tracking-wide text-gray-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Giỏ hàng ({cartCount})
                </Link>
                <Link
                  href="/orders"
                  className="block py-2.5 text-sm font-medium tracking-wide text-gray-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Đơn hàng
                </Link>
                <Link
                  href="/account"
                  className="block py-2.5 text-sm font-medium tracking-wide text-gray-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Tài khoản
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="block py-2.5 text-sm font-medium tracking-wide text-pink-500"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block py-2.5 text-sm font-medium tracking-wide text-gray-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="block py-2.5 text-sm font-medium tracking-wide text-purple-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
