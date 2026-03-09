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
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa vai trò này?")) return;
    try {
      await roleService.delete(id);
      toast.success("Đã xóa");
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý vai trò</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiPlus /> Thêm mới
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Tên vai trò</th>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-left">Quyền</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{role.id}</td>
                  <td className="px-4 py-3 font-medium">{role.name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                    {role.description}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-blue-600">
                      {role.permissions?.length || 0} quyền
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${role.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {role.active ? "Hoạt động" : "Ngưng"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(role)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
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
                  className="w-full border rounded-lg px-3 py-2"
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
                  className="w-full border rounded-lg px-3 py-2"
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
                />
                <label htmlFor="active" className="text-sm">
                  Hoạt động
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phân quyền
                </label>
                <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-3">
                  {Object.entries(permsByModule).map(([mod, perms]) => (
                    <div key={mod}>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        {mod}
                      </h4>
                      <div className="grid grid-cols-2 gap-1">
                        {perms.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(p.id)}
                              onChange={() => togglePerm(p.id)}
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

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editing ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
