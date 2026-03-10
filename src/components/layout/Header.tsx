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
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
  }, []);
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
    <header className="sticky top-0 z-50 bg-background border-b border-subtle shadow-sm transition-colors">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <FiShoppingBag className="text-accent" size={22} />
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            LUXE
          </span>
        </Link>

        {/* Desktop Nav - Center */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide py-2 transition-colors relative ${
                isActive(link.href)
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
              )}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <Link
                href="/orders"
                className={`text-sm font-medium tracking-wide py-2 transition-colors relative ${
                  isActive("/orders")
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Đơn hàng
                {isActive("/orders") && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                )}
              </Link>
              <Link
                href="/account"
                className={`text-sm font-medium tracking-wide py-2 transition-colors relative ${
                  isActive("/account")
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Tài khoản
                {isActive("/account") && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                )}
              </Link>
            </>
          )}
        </nav>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-muted hover:text-foreground transition p-1.5 rounded-lg hover:bg-section"
          >
            <FiSearch size={18} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="text-muted hover:text-foreground transition p-1.5 rounded-lg hover:bg-section"
            title={
              mounted
                ? theme === "light"
                  ? "Chế độ tối"
                  : "Chế độ sáng"
                : undefined
            }
          >
            {mounted ? (
              theme === "light" ? (
                <FiMoon size={18} />
              ) : (
                <FiSun size={18} />
              )
            ) : (
              <FiMoon size={18} />
            )}
          </button>

          {/* User dropdown / Login */}
          {isAuthenticated ? (
            <div className="relative group hidden lg:block">
              <button className="text-muted hover:text-foreground transition p-1.5 rounded-lg hover:bg-section">
                <FiUser size={18} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-subtle rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-3 border-b border-subtle">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/account"
                    className="block px-4 py-2.5 text-sm text-muted hover:bg-section hover:text-accent transition"
                  >
                    Tài khoản
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-2.5 text-sm text-muted hover:bg-section hover:text-accent transition"
                  >
                    Đơn hàng
                  </Link>
                  <Link
                    href="/reviews"
                    className="block px-4 py-2.5 text-sm text-muted hover:bg-section hover:text-accent transition"
                  >
                    Đánh giá
                  </Link>
                  {user?.role?.name === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2.5 text-sm text-muted hover:bg-section hover:text-accent transition"
                    >
                      Quản trị
                    </Link>
                  )}
                  {user?.role?.name === "NHAN_VIEN" && (
                    <Link
                      href="/staff"
                      className="block px-4 py-2.5 text-sm text-muted hover:bg-section hover:text-accent transition"
                    >
                      Nhân viên
                    </Link>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-section flex items-center gap-2 border-t border-subtle transition"
                >
                  <FiLogOut size={14} /> Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden lg:block text-muted hover:text-foreground transition p-1.5 rounded-lg hover:bg-section"
            >
              <FiUser size={18} />
            </Link>
          )}

          {/* Cart */}
          {isAuthenticated && (
            <Link
              href="/cart"
              className="relative text-muted hover:text-foreground transition p-1.5 rounded-lg hover:bg-section"
            >
              <FiShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden text-muted hover:text-foreground transition p-1.5 rounded-lg hover:bg-section"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Search Bar Dropdown */}
      {searchOpen && (
        <div className="border-t border-subtle bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <input
                type="text"
                autoFocus
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-section border border-subtle text-foreground placeholder-muted rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-accent transition"
              />
              <button
                type="submit"
                className="bg-accent hover:bg-accent-hover text-white px-6 py-3 text-sm font-semibold rounded-xl transition"
              >
                Tìm kiếm
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-subtle bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-section border border-subtle text-foreground placeholder-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="bg-accent hover:bg-accent-hover text-white px-4 py-2.5 text-sm font-semibold rounded-xl"
                >
                  <FiSearch size={16} />
                </button>
              </div>
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2.5 text-sm font-medium tracking-wide transition-colors ${
                  isActive(link.href)
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
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
                  className="block py-2.5 text-sm font-medium tracking-wide text-muted hover:text-foreground transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Giỏ hàng ({cartCount})
                </Link>
                <Link
                  href="/orders"
                  className="block py-2.5 text-sm font-medium tracking-wide text-muted hover:text-foreground transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Đơn hàng
                </Link>
                <Link
                  href="/account"
                  className="block py-2.5 text-sm font-medium tracking-wide text-muted hover:text-foreground transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Tài khoản
                </Link>
                <div className="pt-2 mt-2 border-t border-subtle">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="block py-2.5 text-sm font-medium tracking-wide text-accent"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block py-2.5 text-sm font-medium tracking-wide text-muted hover:text-foreground transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="block py-2.5 text-sm font-medium tracking-wide text-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Gradient bottom border */}
      <div className="h-0.5 bg-linear-to-r from-purple-600 via-pink-500 to-purple-600" />
    </header>
  );
}
