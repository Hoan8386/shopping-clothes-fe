import apiClient from "@/lib/api";
import { ReqDoiHangDTO, RestResponse, DoiHang } from "@/types";

interface PaginationResult {
  meta: { page: number; pageSize: number; pages: number; total: number };
  result: DoiHang[];
}

export const doiHangService = {
  create: async (data: ReqDoiHangDTO) => {
    const res = await apiClient.post<RestResponse<DoiHang>>("/doi-hang", data);
    return res.data.data;
  },

  getAll: async (page = 1, size = 15) => {
    const res = await apiClient.get<RestResponse<PaginationResult>>(
      "/doi-hang",
      { params: { page: page - 1, size, sort: "ngayTao,desc" } }
    );
    return res.data.data;
  },

  getByDonHangId: async (donHangId: number) => {
    const res = await apiClient.get<RestResponse<DoiHang[]>>(
      `/doi-hang/don-hang/${donHangId}`
    );
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<DoiHang>>(`/doi-hang/${id}`);
    return res.data.data;
  },

  updateStatus: async (id: number, trangThai: number) => {
    const res = await apiClient.put<RestResponse<DoiHang>>(
      `/doi-hang/${id}/trang-thai`,
      null,
      { params: { trangThai } }
    );
    return res.data.data;
  },
};
