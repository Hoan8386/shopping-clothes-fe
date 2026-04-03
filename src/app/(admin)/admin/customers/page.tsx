"use client";

import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiUsers } from "react-icons/fi";
import { KhachHang } from "@/types";
import { khachHangService } from "@/services/common.service";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<KhachHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await khachHangService.getAll();
        setCustomers(Array.isArray(data) ? data : []);
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
            : message || "Không thể tải danh sách khách hàng",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return customers;
    return customers.filter((item) => {
      const combined =
        `${item.tenKhachHang || ""} ${item.email || ""} ${item.sdt || ""}`
          .toLowerCase()
          .trim();
      return combined.includes(key);
    });
  }, [customers, keyword]);

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-2xl border border-subtle p-4 lg:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Quản lý khách hàng
          </p>
          <p className="text-sm text-muted mt-1">
            Danh sách tài khoản khách hàng đã đăng ký và đăng nhập trên shop.
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-section text-muted border border-subtle">
          {filteredCustomers.length} khách hàng
        </span>
      </div>

      <div className="bg-card rounded-2xl border border-subtle p-4">
        <div className="relative max-w-md">
          <FiSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            size={14}
          />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="w-full pl-10 pr-3 py-2.5 border border-subtle bg-background text-foreground rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
          />
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-14 text-muted text-sm bg-card rounded-2xl border border-subtle">
          <FiUsers size={22} className="mx-auto mb-2" />
          Chưa có khách hàng nào
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-180">
              <thead className="bg-section border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Tên khách hàng
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted">
                    Số điện thoại
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted">
                    Điểm tích lũy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {filteredCustomers.map((item) => (
                  <tr key={item.id} className="hover:bg-section/60 transition">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      #{item.id}
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {item.tenKhachHang}
                    </td>
                    <td className="px-4 py-3 text-muted">{item.email}</td>
                    <td className="px-4 py-3 text-muted">{item.sdt}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {item.diemTichLuy ?? 0}
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
