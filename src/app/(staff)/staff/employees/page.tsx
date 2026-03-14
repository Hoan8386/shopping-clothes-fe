"use client";

import { useEffect, useState } from "react";
import { NhanVien } from "@/types";
import { nhanVienService } from "@/services/employee.service";
import { formatDate } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiUsers, FiEye, FiX } from "react-icons/fi";

function getStatusText(s: number) {
  return s === 1 ? "Đang làm" : "Nghỉ việc";
}
function getStatusColor(s: number) {
  return s === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
}

export default function StaffEmployeesPage() {
  const [employees, setEmployees] = useState<NhanVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NhanVien | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await nhanVienService.getAll();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const activeCount = employees.filter((e) => e.trangThai === 1).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <p className="text-sm font-semibold text-foreground">
          Nhân viên cửa hàng
        </p>
        <p className="text-sm text-muted mt-1">
          Xem thông tin nhân viên cùng cửa hàng.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Tổng nhân viên
          </p>
          <p className="text-xl font-bold text-foreground mt-1">
            {employees.length}
          </p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Đang làm</p>
          <p className="text-xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-card border border-subtle rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wide">
            Nghỉ việc
          </p>
          <p className="text-xl font-bold text-red-600 mt-1">
            {employees.length - activeCount}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : employees.length === 0 ? (
        <div className="text-center py-16 text-muted">
          Không có nhân viên nào
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="px-4 py-3 border-b border-subtle bg-section/60 text-xs text-muted flex items-center gap-2">
            <FiUsers size={14} />
            <span>Danh sách nhân viên cùng cửa hàng.</span>
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
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {employees.map((emp) => (
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
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(emp.trangThai)}`}
                      >
                        {getStatusText(emp.trangThai)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setSelected(emp)}
                          className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                          title="Xem chi tiết"
                        >
                          <FiEye size={15} />
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
    </div>
  );
}
