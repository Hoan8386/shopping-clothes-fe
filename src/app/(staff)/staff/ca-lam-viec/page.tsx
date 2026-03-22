"use client";

import { useEffect, useState, useCallback } from "react";
import { CaLamViec } from "@/types";
import { caLamViecService } from "@/services/schedule.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiClock } from "react-icons/fi";

export default function StaffCaLamViecPage() {
  const [list, setList] = useState<CaLamViec[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await caLamViecService.getAll();
      setList(data ?? []);
    } catch {
      toast.error("Không thể tải danh sách ca làm việc");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeCount = list.filter((c) => c.trangThai === 1).length;

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-2xl border border-subtle p-4 lg:p-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Ca làm việc</h1>
          <p className="text-sm text-muted mt-1">Danh sách các ca làm việc trong hệ thống.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <FiClock size={16} />
          {activeCount} ca đang hoạt động
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card border border-subtle rounded-xl p-4"><p className="text-xs text-muted uppercase tracking-wide">Tổng ca</p><p className="text-2xl font-bold text-foreground mt-1">{list.length}</p></div>
        <div className="bg-card border border-subtle rounded-xl p-4"><p className="text-xs text-muted uppercase tracking-wide">Hoạt động</p><p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p></div>
        <div className="bg-card border border-subtle rounded-xl p-4"><p className="text-xs text-muted uppercase tracking-wide">Không HĐ</p><p className="text-2xl font-bold text-red-500 mt-1">{list.length - activeCount}</p></div>
      </div>

      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-muted">Chưa có ca làm việc nào</div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Tên ca</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Giờ bắt đầu</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Giờ kết thúc</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {list.map((ca) => (
                  <tr key={ca.id} className="hover:bg-section transition">
                    <td className="px-4 py-3 font-semibold text-muted">#{ca.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{ca.tenCaLam}</td>
                    <td className="px-4 py-3 text-muted">
                      <span className="flex items-center gap-1.5"><FiClock size={13} />{ca.gioBatDau?.slice(0, 5)}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="flex items-center gap-1.5"><FiClock size={13} />{ca.gioKetThuc?.slice(0, 5)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ca.trangThai === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                      }`}>
                        {ca.trangThai === 1 ? "Hoạt động" : "Không HĐ"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
