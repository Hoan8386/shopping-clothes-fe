import apiClient from "@/lib/api";
import { ResGioHangDTO, ReqThemGioHangDTO, RestResponse } from "@/types";

export const cartService = {
  getMyCart: async () => {
    const res = await apiClient.get<RestResponse<ResGioHangDTO>>(
      "/gio-hang/cua-toi"
    );
    return res.data.data;
  },

  addToCart: async (data: ReqThemGioHangDTO) => {
    const res = await apiClient.post("/gio-hang/them-san-pham", data);
    return res.data.data;
  },

  removeCartItem: async (maChiTietGioHang: number) => {
    await apiClient.delete(`/gio-hang/chi-tiet/${maChiTietGioHang}`);
  },
};
