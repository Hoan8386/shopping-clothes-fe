import apiClient from "@/lib/api";
import { ReqTraHangDTO, RestResponse, TraHang } from "@/types";

interface PaginationResult {
  meta: { page: number; pageSize: number; pages: number; total: number };
  result: TraHang[];
}

export const traHangService = {
  create: async (data: ReqTraHangDTO) => {
    const res = await apiClient.post<RestResponse<TraHang>>("/tra-hang", data);
    return res.data.data;
  },

  getAll: async (page = 1, size = 15) => {
    const res = await apiClient.get<RestResponse<PaginationResult>>(
      "/tra-hang",
      { params: { page: page - 1, size, sort: "ngayTao,desc" } }
    );
    return res.data.data;
  },

  getByDonHangId: async (donHangId: number) => {
    const res = await apiClient.get<RestResponse<TraHang[]>>(
      `/tra-hang/don-hang/${donHangId}`
    );
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<TraHang>>(
      `/tra-hang/${id}`
    );
    return res.data.data;
  },

  updateStatus: async (id: number, trangThai: number) => {
    const res = await apiClient.put<RestResponse<TraHang>>(
      `/tra-hang/${id}/trang-thai`,
      null,
      { params: { trangThai } }
    );
    return res.data.data;
  },
};
