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
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa quyền này?")) return;
    try {
      await permissionService.delete(id);
      toast.success("Đã xóa");
      fetchData();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý quyền hạn</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiPlus /> Thêm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
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
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tất cả method</option>
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        Tổng: {filtered.length} quyền
      </p>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Tên quyền</th>
                  <th className="px-4 py-3 text-left">API Path</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Module</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{item.id}</td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {item.apiPath}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono ${METHOD_COLORS[item.method] || "bg-gray-100"}`}
                      >
                        {item.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.module}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
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
                  className="w-full border rounded-lg px-3 py-2"
                  required
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
                  className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
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
                    className="w-full border rounded-lg px-3 py-2"
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
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
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
