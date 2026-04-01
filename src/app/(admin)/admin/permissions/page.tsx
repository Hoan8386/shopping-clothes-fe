"use client";

import { useEffect, useState } from "react";
import { Permission } from "@/types";
import { permissionService } from "@/services/common.service";
import Loading from "@/components/ui/Loading";
import Pagination from "@/components/ui/Pagination";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2, FiSearch } from "react-icons/fi";

const METHODS = ["GET", "POST", "PUT", "DELETE"];
const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
};

export default function AdminPermissionsPage() {
  const [items, setItems] = useState<Permission[]>([]);
  const [filtered, setFiltered] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Permission | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [form, setForm] = useState({
    name: "",
    apiPath: "",
    method: "GET",
    module: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = items;
    if (search)
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.apiPath.toLowerCase().includes(search.toLowerCase()),
      );
    if (filterModule) result = result.filter((p) => p.module === filterModule);
    if (filterMethod) result = result.filter((p) => p.method === filterMethod);
    setFiltered(result);
    setPage(1);
  }, [search, filterModule, filterMethod, items]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await permissionService.getAll(1, 1000);
      setItems(res?.result || []);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const modules = Array.from(
    new Set(items.map((p) => p.module).filter(Boolean)),
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", apiPath: "", method: "GET", module: "" });
    setShowModal(true);
  };

  const openEdit = (item: Permission) => {
    setEditing(item);
    setForm({
      name: item.name,
      apiPath: item.apiPath,
      method: item.method,
      module: item.module,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) {
        await permissionService.update({ id: editing.id, ...form });
        toast.success("Cập nhật thành công");
      } else {
        await permissionService.create(form);
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
    if (!confirm("Xóa quyền này?")) return;
    try {
      setDeleting(true);
      await permissionService.delete(id);
      toast.success("Đã xóa");
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý quyền hạn
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách quyền truy cập API
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm font-medium text-sm"
        >
          <FiPlus size={16} /> Thêm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
            />
          </div>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
          >
            <option value="">Tất cả module</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
          >
            <option value="">Tất cả method</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Tổng: {filtered.length} quyền
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tên quyền
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      API Path
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-indigo-50/30 transition"
                    >
                      <td className="px-5 py-3.5 text-gray-500">#{item.id}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-600">
                        {item.apiPath}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium ${METHOD_COLORS[item.method] || "bg-gray-100"}`}
                        >
                          {item.method}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {item.module}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <FiEdit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-gray-400"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">
              {editing ? "Sửa" : "Thêm"} quyền
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên quyền
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  API Path
                </label>
                <input
                  type="text"
                  value={form.apiPath}
                  onChange={(e) =>
                    setForm({ ...form, apiPath: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  required
                  placeholder="/api/v1/..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Method
                  </label>
                  <select
                    value={form.method}
                    onChange={(e) =>
                      setForm({ ...form, method: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  >
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Module
                  </label>
                  <input
                    type="text"
                    value={form.module}
                    onChange={(e) =>
                      setForm({ ...form, module: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    required
                  />
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
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm font-medium text-sm"
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
