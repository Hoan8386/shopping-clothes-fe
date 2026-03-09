import apiClient from "@/lib/api";
import {
  DonHang,
  ReqTaoDonHangDTO,
  RestResponse,
  ResultPaginationDTO,
} from "@/types";

export interface OrderSearchParams {
  cuaHangId?: number;
  nhanVienId?: number;
  trangThai?: number;
  trangThaiThanhToan?: number;
  hinhThucDonHang?: number;
  page?: number;
  size?: number;
}

export const orderService = {
  getAll: async (params?: OrderSearchParams) => {
    const res = await apiClient.get<
      RestResponse<ResultPaginationDTO<DonHang>>
    >("/don-hang", { params });
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<DonHang>>(`/don-hang/${id}`);
    return res.data.data;
  },

  createOnline: async (data: ReqTaoDonHangDTO) => {
    const res = await apiClient.post<RestResponse<DonHang>>(
      "/don-hang/online",
      data
    );
    return res.data.data;
  },

  createPOS: async (data: DonHang) => {
    const res = await apiClient.post<RestResponse<DonHang>>(
      "/don-hang/tai-quay",
      data
    );
    return res.data.data;
  },

  update: async (data: Partial<DonHang>) => {
    const res = await apiClient.put<RestResponse<DonHang>>("/don-hang", data);
    return res.data.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/don-hang/${id}`);
  },
};
