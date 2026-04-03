"use client";

import { useEffect, useState } from "react";
import { NhanVien, ReqNhanVienDTO, CuaHang, Role } from "@/types";
import { nhanVienService } from "@/services/employee.service";
import { cuaHangService, roleService } from "@/services/common.service";
import { formatDate } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiUsers } from "react-icons/fi";

function getStatusText(s: number) {
  return s === 1 ? "Đang làm" : "Nghỉ việc";
}
function getStatusColor(s: number) {
  return s === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
}

const INITIAL_FORM: ReqNhanVienDTO = {
  tenNhanVien: "",
  email: "",
  soDienThoai: "",
  matKhau: "",
  trangThai: 1,
};

const GMAIL_REGEX = /^[A-Za-z0-9._%+-]+@gmail\.com$/;
const PHONE_10_DIGITS_REGEX = /^\d{10}$/;

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<NhanVien[]>([]);
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStoreId, setFilterStoreId] = useState<number | undefined>();

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NhanVien | null>(null);
  const [form, setForm] = useState<ReqNhanVienDTO>({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);

  // Detail modal
  const [selected, setSelected] = useState<NhanVien | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<NhanVien | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empData, storeData, roleData] = await Promise.all([
        nhanVienService.getAll(),
        cuaHangService.getAll(),
        roleService.getAll(),
      ]);
      const normalizedEmployees = Array.isArray(empData) ? empData : [];
      setEmployees(
        normalizedEmployees.sort(
          (a, b) => Number(b.id || 0) - Number(a.id || 0),
        ),
      );
      setStores(Array.isArray(storeData) ? storeData : []);
      setRoles(Array.isArray(roleData) ? roleData : []);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...INITIAL_FORM });
    setShowModal(true);
  };

  const openEdit = (emp: NhanVien) => {
    setEditing(emp);
    setForm({
      id: emp.id,
      tenNhanVien: emp.tenNhanVien,
      email: emp.email,
      soDienThoai: emp.soDienThoai,
      matKhau: "",
      ngayBatDauLam: emp.ngayBatDauLam || "",
      ngayKetThucLam: emp.ngayKetThucLam || "",
      trangThai: emp.trangThai,
      cuaHang: emp.cuaHang ? { id: emp.cuaHang.id } : undefined,
      role: emp.role ? { id: emp.role.id } : undefined,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const name = form.tenNhanVien?.trim() || "";
    const email = form.email?.trim().toLowerCase() || "";
    const phone = form.soDienThoai?.trim() || "";
    const password = form.matKhau?.trim() || "";

    if (!name || !email) {
      toast.error("Vui lòng nhập tên và email nhân viên");
      return;
    }

    if (!GMAIL_REGEX.test(email)) {
      toast.error("Email phải có định dạng @gmail.com");
      return;
    }

    if (!PHONE_10_DIGITS_REGEX.test(phone)) {
      toast.error("Số điện thoại phải gồm đúng 10 chữ số");
      return;
    }

    if (!editing && !password) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }

    if (password && password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    const payload: ReqNhanVienDTO = {
      ...form,
      tenNhanVien: name,
      email,
      soDienThoai: phone,
      matKhau: password || undefined,
    };

    try {
      setSaving(true);
      if (editing) {
        await nhanVienService.update(payload);
        toast.success("Cập nhật nhân viên thành công");
      } else {
        await nhanVienService.create(payload);
        toast.success("Tạo nhân viên thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (
              err as {
                response?: { data?: { message?: string | string[] } };
              }
            ).response?.data?.message
          : undefined;
      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Thao tác thất bại",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await nhanVienService.delete(deleteTarget.id);
      toast.success("Đã xóa nhân viên");
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    filterStoreId ? emp.cuaHang?.id === filterStoreId : true,
  );

  const activeCount = filteredEmployees.filter((e) => e.trangThai === 1).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Quản lý nhân viên
          </h1>
          <p className="text-sm text-muted mt-1">
            Thêm, sửa, xóa và quản lý thông tin nhân viên.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition"
        >
          <FiPlus size={16} /> Thêm nhân viên
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-subtle p-4">
        <select
          value={filterStoreId ?? ""}
          onChange={(e) =>
            setFilterStoreId(
              e.target.value ? Number(e.target.value) : undefined,
            )
          }
          className="h-10 px-3 rounded-lg bg-section border border-subtle text-sm md:w-1/3 w-full"
        >
          <option value="">Tất cả cửa hàng</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.tenCuaHang}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Tổng nhân viên
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {filteredEmployees.length}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Đang làm</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {activeCount}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Nghỉ việc
          </p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {filteredEmployees.length - activeCount}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-16 text-muted">
          Chưa có nhân viên nào
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="px-4 py-3 border-b border-subtle bg-section/60 text-xs text-muted flex items-center gap-2">
            <FiUsers size={14} />
            <span>Tổng cộng {filteredEmployees.length} nhân viên.</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-225">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Tên nhân viên
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    SĐT
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Cửa hàng
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Vai trò
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Ngày vào
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold">#{emp.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {emp.tenNhanVien}
                    </td>
                    <td className="px-4 py-3 text-muted">{emp.email}</td>
                    <td className="px-4 py-3 text-muted">{emp.soDienThoai}</td>
                    <td className="px-4 py-3 text-muted">
                      {emp.cuaHang?.tenCuaHang || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {emp.role?.description || emp.role?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {emp.ngayBatDauLam ? formatDate(emp.ngayBatDauLam) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(emp.trangThai)}`}
                      >
                        {getStatusText(emp.trangThai)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => setSelected(emp)}
                          className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                          title="Xem"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(emp)}
                          className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded"
                          title="Sửa"
                        >
                          <FiEdit size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                          title="Xóa"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <h2 className="font-bold text-lg text-foreground">
                Nhân viên #{selected.id}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted">Họ tên: </span>
                  <span className="font-medium text-foreground">
                    {selected.tenNhanVien}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Email: </span>
                  <span className="font-medium text-foreground">
                    {selected.email}
                  </span>
                </div>
                <div>
                  <span className="text-muted">SĐT: </span>
                  <span className="font-medium text-foreground">
                    {selected.soDienThoai}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Trạng thái: </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selected.trangThai)}`}
                  >
                    {getStatusText(selected.trangThai)}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Bắt đầu: </span>
                  <span className="font-medium text-foreground">
                    {selected.ngayBatDauLam
                      ? formatDate(selected.ngayBatDauLam)
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Kết thúc: </span>
                  <span className="font-medium text-foreground">
                    {selected.ngayKetThucLam
                      ? formatDate(selected.ngayKetThucLam)
                      : "—"}
                  </span>
                </div>
              </div>
              <hr className="border-subtle" />
              <div>
                <span className="text-muted">Cửa hàng: </span>
                <span className="font-medium text-foreground">
                  {selected.cuaHang?.tenCuaHang || "—"}
                </span>
                {selected.cuaHang?.diaChi && (
                  <p className="text-xs text-muted mt-0.5">
                    {selected.cuaHang.diaChi}
                  </p>
                )}
              </div>
              <div>
                <span className="text-muted">Vai trò: </span>
                <span className="font-medium text-foreground">
                  {selected.role?.description || selected.role?.name || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-subtle sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg text-foreground">
                {editing ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Tên */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tên nhân viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.tenNhanVien}
                  onChange={(e) =>
                    setForm({ ...form, tenNhanVien: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-subtle rounded-lg bg-section text-foreground text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  placeholder="Nhập tên nhân viên"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-subtle rounded-lg bg-section text-foreground text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  placeholder="email@example.com"
                />
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={form.soDienThoai}
                  onChange={(e) =>
                    setForm({ ...form, soDienThoai: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-subtle rounded-lg bg-section text-foreground text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  placeholder="09xxxxxxxx"
                />
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Mật khẩu {!editing && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={form.matKhau || ""}
                  onChange={(e) =>
                    setForm({ ...form, matKhau: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-subtle rounded-lg bg-section text-foreground text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  placeholder={
                    editing ? "Bỏ trống nếu không đổi" : "Nhập mật khẩu"
                  }
                />
              </div>

              {/* Cửa hàng */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Cửa hàng
                </label>
                <select
                  value={form.cuaHang?.id || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cuaHang: e.target.value
                        ? { id: Number(e.target.value) }
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-subtle rounded-lg bg-section text-foreground text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                >
                  <option value="">-- Chọn cửa hàng --</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tenCuaHang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Vai trò
                </label>
                <select
                  value={form.role?.id || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value
                        ? { id: Number(e.target.value) }
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-subtle rounded-lg bg-section text-foreground text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                >
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.description || r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày bắt đầu / kết thúc */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={form.ngayBatDauLam?.slice(0, 16) || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ngayBatDauLam: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-subtle rounded-lg bg-section text-foreground text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={form.ngayKetThucLam?.slice(0, 16) || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ngayKetThucLam: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-subtle rounded-lg bg-section text-foreground text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  />
                </div>
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Trạng thái
                </label>
                <select
                  value={form.trangThai}
                  onChange={(e) =>
                    setForm({ ...form, trangThai: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-subtle rounded-lg bg-section text-foreground text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                >
                  <option value={1}>Đang làm</option>
                  <option value={0}>Nghỉ việc</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-medium hover:bg-section transition"
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition"
                >
                  {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-foreground mb-2">
              Xóa nhân viên?
            </h3>
            <p className="text-sm text-muted mb-4">
              Bạn có chắc muốn xóa nhân viên{" "}
              <span className="font-medium text-foreground">
                {deleteTarget.tenNhanVien}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-subtle text-foreground rounded-lg text-sm font-medium hover:bg-section transition"
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
