"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  FiUser,
  FiPackage,
  FiStar,
  FiLogOut,
  FiShield,
  FiAward,
  FiLock,
  FiSave,
} from "react-icons/fi";

export default function AccountPage() {
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [sdt, setSdt] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setSdt(user.sdt ?? "");
    }
  }, [user]);

  const avatarPreview = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }
    return user?.avatar ?? null;
  }, [avatarFile, user?.avatar]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    logout();
    toast.success("Đăng xuất thành công");
    router.push("/");
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSavingProfile(true);
      const updatedUser = await authService.updateProfile({
        name: name.trim(),
        sdt: sdt.trim(),
        avatar: avatarFile,
      });
      setUser(updatedUser);
      setAvatarFile(null);
      toast.success("Cập nhật thông tin thành công");
    } catch {
      toast.error("Không thể cập nhật thông tin");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp");
      return;
    }

    try {
      setSavingPassword(true);
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đổi mật khẩu thành công");
    } catch {
      toast.error("Không thể đổi mật khẩu");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-section py-8 text-center">
        <h2 className="text-3xl font-extrabold text-foreground mb-1">
          Tài khoản
        </h2>
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent">Tài khoản của tôi</span>
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* User Profile Card */}
        <div className="border border-subtle bg-card mb-8">
          <div className="px-8 py-8 flex items-center gap-6">
            <div className="w-20 h-20 bg-section flex items-center justify-center shrink-0 overflow-hidden">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="text-foreground" size={32} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground">{user.name}</h3>
              <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
              {user.sdt && (
                <p className="text-gray-400 text-sm mt-0.5">SĐT: {user.sdt}</p>
              )}
              {user.role && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-section text-foreground text-xs font-bold uppercase tracking-wider">
                  <FiShield size={12} /> {user.role.name}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="px-8 pb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Họ và tên
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3 border border-subtle bg-section text-foreground outline-none"
                  placeholder="Nhập họ tên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Số điện thoại
                </label>
                <input
                  value={sdt}
                  onChange={(e) => setSdt(e.target.value)}
                  className="w-full h-11 px-3 border border-subtle bg-section text-foreground outline-none"
                  placeholder="0xxxxxxxxx"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ảnh đại diện
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                className="w-full h-11 px-3 border border-subtle bg-section text-foreground outline-none file:mr-3 file:border-0 file:bg-accent file:text-white file:px-3 file:py-2"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white font-medium disabled:opacity-60"
            >
              <FiSave size={16} />
              {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </form>

          {user.role?.name === "KHACH_HANG" && (
            <div className="px-8 pb-8">
              <div className="bg-section p-5 flex items-center gap-3">
                <FiAward className="text-accent shrink-0" size={24} />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Điểm tích lũy
                  </p>
                  <p className="text-2xl font-extrabold text-foreground">
                    {user.diemTichLuy ?? 0}
                    <span className="text-sm font-normal text-gray-400 ml-1">
                      điểm
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border border-subtle bg-card mb-8 p-8">
          <div className="flex items-center gap-2 mb-4">
            <FiLock size={18} className="text-accent" />
            <h3 className="text-lg font-bold text-foreground">Đổi mật khẩu</h3>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-11 px-3 border border-subtle bg-section text-foreground outline-none"
                placeholder="Mật khẩu hiện tại"
                required
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-11 px-3 border border-subtle bg-section text-foreground outline-none"
                placeholder="Mật khẩu mới"
                required
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 px-3 border border-subtle bg-section text-foreground outline-none"
                placeholder="Xác nhận mật khẩu"
                required
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background font-medium disabled:opacity-60"
            >
              <FiLock size={16} />
              {savingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </form>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/orders"
            className="group border border-subtle bg-card p-6 flex items-center gap-5 hover:border-foreground transition"
          >
            <div className="w-14 h-14 bg-section flex items-center justify-center group-hover:bg-foreground transition">
              <FiPackage
                className="text-foreground group-hover:text-background transition"
                size={22}
              />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">
                Đơn hàng
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Xem lịch sử đơn hàng
              </p>
            </div>
          </Link>

          <Link
            href="/reviews"
            className="group border border-subtle bg-card p-6 flex items-center gap-5 hover:border-foreground transition"
          >
            <div className="w-14 h-14 bg-section flex items-center justify-center group-hover:bg-foreground transition">
              <FiStar
                className="text-foreground group-hover:text-background transition"
                size={22}
              />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">
                Đánh giá
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Đánh giá sản phẩm đã mua
              </p>
            </div>
          </Link>

          {user.role?.name === "ADMIN" && (
            <Link
              href="/admin"
              className="group border border-subtle bg-card p-6 flex items-center gap-5 hover:border-foreground transition"
            >
              <div className="w-14 h-14 bg-section flex items-center justify-center group-hover:bg-foreground transition">
                <FiShield
                  className="text-foreground group-hover:text-background transition"
                  size={22}
                />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">
                  Quản trị
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Truy cập trang quản trị
                </p>
              </div>
            </Link>
          )}

          {user.role?.name === "NHAN_VIEN" && (
            <Link
              href="/staff"
              className="group border border-subtle bg-card p-6 flex items-center gap-5 hover:border-foreground transition"
            >
              <div className="w-14 h-14 bg-section flex items-center justify-center group-hover:bg-foreground transition">
                <FiShield
                  className="text-foreground group-hover:text-background transition"
                  size={22}
                />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">
                  Nhân viên
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Truy cập trang nhân viên
                </p>
              </div>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="group border border-subtle bg-card p-6 flex items-center gap-5 hover:border-accent transition text-left"
          >
            <div className="w-14 h-14 bg-section flex items-center justify-center group-hover:bg-accent transition">
              <FiLogOut
                className="text-accent group-hover:text-background transition"
                size={22}
              />
            </div>
            <div>
              <h4 className="font-bold text-accent text-sm uppercase tracking-wider">
                Đăng xuất
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">Thoát tài khoản</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
