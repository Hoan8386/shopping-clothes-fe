import apiClient from "@/lib/api";
import { RestResponse, LoaiDonLuanChuyen, DonLuanChuyen } from "@/types";

interface PaginationResult {
  meta: { page: number; pageSize: number; pages: number; total: number };
  result: DonLuanChuyen[];
}

export const loaiDonLuanChuyenService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<LoaiDonLuanChuyen[]>>("/loai-don-luan-chuyen");
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<LoaiDonLuanChuyen>>(`/loai-don-luan-chuyen/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<LoaiDonLuanChuyen>) => {
    const res = await apiClient.post<RestResponse<LoaiDonLuanChuyen>>("/loai-don-luan-chuyen", data);
    return res.data.data;
  },

  update: async (data: Partial<LoaiDonLuanChuyen>) => {
    const res = await apiClient.put<RestResponse<LoaiDonLuanChuyen>>("/loai-don-luan-chuyen", data);
    return res.data.data;
  },

  delete: async (id: number) => {
    const res = await apiClient.delete<RestResponse<void>>(`/loai-don-luan-chuyen/${id}`);
    return res.data;
  },
};

export const donLuanChuyenService = {
  create: async (data: unknown) => {
    const res = await apiClient.post<RestResponse<DonLuanChuyen>>("/don-luan-chuyen", data);
    return res.data.data;
  },

  getAll: async (page = 1, size = 15) => {
    const res = await apiClient.get<RestResponse<PaginationResult>>(
      "/don-luan-chuyen",
      { params: { page: page - 1, size, sort: "ngayTao,desc" } }
    );
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<DonLuanChuyen>>(`/don-luan-chuyen/${id}`);
    return res.data.data;
  },

  getByCuaHangDat: async (cuaHangId: number) => {
    const res = await apiClient.get<RestResponse<DonLuanChuyen[]>>(
      `/don-luan-chuyen/cua-hang-dat/${cuaHangId}`
    );
    return res.data.data;
  },

  getByCuaHangGui: async (cuaHangId: number) => {
    const res = await apiClient.get<RestResponse<DonLuanChuyen[]>>(
      `/don-luan-chuyen/cua-hang-gui/${cuaHangId}`
    );
    return res.data.data;
  },

  updateStatus: async (id: number, trangThai: number) => {
    const res = await apiClient.put<RestResponse<DonLuanChuyen>>(
      `/don-luan-chuyen/${id}/trang-thai`,
      null,
      { params: { trangThai } }
    );
    return res.data.data;
  },
};
