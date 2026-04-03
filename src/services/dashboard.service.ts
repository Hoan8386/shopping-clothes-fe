/**
 * Dashboard API Service
 * Centralized functions for fetching dashboard data from backend APIs
 */

import apiClient from "@/lib/api";

export interface DashboardResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const API_ROOT = RAW_API_BASE.replace(/\/api\/v1\/?$/, "");

// Admin Dashboard APIs
export const adminDashboardAPI = {
  getSummary: async <T = unknown>() => {
    const res = await apiClient.get<DashboardResponse<T>>(
      `${API_ROOT}/api/admin/dashboard/summary`
    );
    return res.data;
  },
};

// Staff Dashboard APIs
export const staffDashboardAPI = {
  getSummary: async <T = unknown>(employeeId: string | number) => {
    const res = await apiClient.get<DashboardResponse<T>>(
      `${API_ROOT}/api/staff/dashboard/summary`,
      { params: { employeeId } }
    );
    return res.data;
  },
};
