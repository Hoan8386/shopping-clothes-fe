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

export interface ReportFilterParams {
  fromDate?: string;
  toDate?: string;
  lowStockThreshold?: number;
  limit?: number;
}

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const API_ROOT = RAW_API_BASE.replace(/\/api\/v1\/?$/, "");
const REPORT_BASE = `${RAW_API_BASE}/thong-ke`;

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

const downloadExcel = async (
  endpoint: string,
  fileName: string,
  params: ReportFilterParams = {}
) => {
  const res = await apiClient.get(`${REPORT_BASE}/${endpoint}`, {
    params,
    responseType: "blob",
  });

  const blob = new Blob([res.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const reportAPI = {
  getRevenue: async <T = unknown>(params: ReportFilterParams = {}) => {
    const res = await apiClient.get<DashboardResponse<T>>(`${REPORT_BASE}/doanh-thu`, {
      params,
    });
    return res.data;
  },
  exportRevenue: async (params: ReportFilterParams = {}) => {
    await downloadExcel("doanh-thu/export", "thong-ke-doanh-thu.xlsx", params);
  },

  getOrderPerformance: async <T = unknown>(params: ReportFilterParams = {}) => {
    const res = await apiClient.get<DashboardResponse<T>>(`${REPORT_BASE}/hieu-suat-don-hang`, {
      params,
    });
    return res.data;
  },
  exportOrderPerformance: async (params: ReportFilterParams = {}) => {
    await downloadExcel(
      "hieu-suat-don-hang/export",
      "thong-ke-hieu-suat-don-hang.xlsx",
      params
    );
  },

  getInventoryAlert: async <T = unknown>(params: ReportFilterParams = {}) => {
    const res = await apiClient.get<DashboardResponse<T>>(`${REPORT_BASE}/ton-kho-canh-bao`, {
      params,
    });
    return res.data;
  },
  exportInventoryAlert: async (params: ReportFilterParams = {}) => {
    await downloadExcel(
      "ton-kho-canh-bao/export",
      "thong-ke-ton-kho-canh-bao.xlsx",
      params
    );
  },

  getTopProducts: async <T = unknown>(params: ReportFilterParams = {}) => {
    const res = await apiClient.get<DashboardResponse<T>>(`${REPORT_BASE}/top-san-pham`, {
      params,
    });
    return res.data;
  },
  exportTopProducts: async (params: ReportFilterParams = {}) => {
    await downloadExcel("top-san-pham/export", "thong-ke-top-san-pham.xlsx", params);
  },

  getImportSupplier: async <T = unknown>(params: ReportFilterParams = {}) => {
    const res = await apiClient.get<DashboardResponse<T>>(`${REPORT_BASE}/nhap-hang-ncc`, {
      params,
    });
    return res.data;
  },
  exportImportSupplier: async (params: ReportFilterParams = {}) => {
    await downloadExcel("nhap-hang-ncc/export", "thong-ke-nhap-hang-ncc.xlsx", params);
  },

  getReturnExchange: async <T = unknown>(params: ReportFilterParams = {}) => {
    const res = await apiClient.get<DashboardResponse<T>>(`${REPORT_BASE}/tra-doi`, {
      params,
    });
    return res.data;
  },
  exportReturnExchange: async (params: ReportFilterParams = {}) => {
    await downloadExcel("tra-doi/export", "thong-ke-tra-doi.xlsx", params);
  },

  getPromotion: async <T = unknown>(params: ReportFilterParams = {}) => {
    const res = await apiClient.get<DashboardResponse<T>>(`${REPORT_BASE}/khuyen-mai`, {
      params,
    });
    return res.data;
  },
  exportPromotion: async (params: ReportFilterParams = {}) => {
    await downloadExcel("khuyen-mai/export", "thong-ke-khuyen-mai.xlsx", params);
  },

  getStaffPerformance: async <T = unknown>(params: ReportFilterParams = {}) => {
    const res = await apiClient.get<DashboardResponse<T>>(
      `${REPORT_BASE}/nang-suat-nhan-vien`,
      {
        params,
      }
    );
    return res.data;
  },
  exportStaffPerformance: async (params: ReportFilterParams = {}) => {
    await downloadExcel(
      "nang-suat-nhan-vien/export",
      "thong-ke-nang-suat-nhan-vien.xlsx",
      params
    );
  },
};
