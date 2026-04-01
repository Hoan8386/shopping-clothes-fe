"use client";

import { useEffect, useState } from "react";
import { Role, Permission } from "@/types";
import { roleService, permissionService } from "@/services/common.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: "", description: "", active: true });
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        roleService.getAll(),
        permissionService.getAll(),
      ]);
      setRoles(rolesData?.result || []);
      setAllPermissions(permsData?.result || []);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", active: true });
    setSelectedPerms([]);
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setForm({
      name: role.name,
      description: role.description || "",
      active: role.active ?? true,
    });
    setSelectedPerms(role.permissions?.map((p) => p.id) || []);
    setShowModal(true);
  };

  const togglePerm = (id: number) => {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        permissions: selectedPerms.map((id) => ({ id })) as Permission[],
      };
      if (editing) {
        await roleService.update({ id: editing.id, ...payload });
        toast.success("Cập nhật thành công");
      } else {
        await roleService.create(payload);
        toast.success("Thêm thành công");
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa vai trò này?")) return;
    setDeleting(true);
    try {
      await roleService.delete(id);
      toast.success("Đã xóa");
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  // Group permissions by module
  const permsByModule = allPermissions.reduce<Record<string, Permission[]>>(
    (acc, p) => {
      const mod = p.module || "Khác";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý vai trò</h1>
          <p className="text-sm text-gray-500 mt-1">
            Phân quyền và quản lý vai trò người dùng
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm font-medium text-sm"
        >
          <FiPlus size={16} /> Thêm mới
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tên vai trò
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Quyền
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-indigo-50/30 transition"
                  >
                    <td className="px-5 py-3.5 text-gray-500">#{role.id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {role.name}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[200px] truncate">
                      {role.description}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {role.permissions?.length || 0} quyền
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${role.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                      >
                        {role.active ? "Hoạt động" : "Ngưng"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(role)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <FiEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(role.id)}
                          disabled={deleting}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">
              {editing ? "Sửa" : "Thêm"} vai trò
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên vai trò
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="active" className="text-sm">
                  Hoạt động
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phân quyền
                </label>
                <div className="border border-gray-200 rounded-xl p-3 max-h-60 overflow-y-auto space-y-3">
                  {Object.entries(permsByModule).map(([mod, perms]) => (
                    <div key={mod}>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1 tracking-wider">
                        {mod}
                      </h4>
                      <div className="grid grid-cols-2 gap-1">
                        {perms.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-indigo-50/30 px-2 py-1.5 rounded-lg transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.id)}
                              onChange={() => togglePerm(p.id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="truncate">{p.name}</span>
                            <span
                              className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                p.method === "GET"
                                  ? "bg-green-100 text-green-700"
                                  : p.method === "POST"
                                    ? "bg-blue-100 text-blue-700"
                                    : p.method === "PUT"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                              }`}
                            >
                              {p.method}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
