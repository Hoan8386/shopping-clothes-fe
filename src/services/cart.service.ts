import apiClient from "@/lib/api";
import {
  ResGioHangDTO,
  ReqThemGioHangDTO,
  ResApDungKhuyenMaiDTO,
  ResKhuyenMaiHopLeDTO,
  RestResponse,
} from "@/types";

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

  updateCartItemQuantity: async (maChiTietGioHang: number, soLuong: number) => {
    const res = await apiClient.put(`/gio-hang/chi-tiet/${maChiTietGioHang}`, {
      soLuong,
    });
    return res.data.data;
  },

  getKhuyenMaiHopLe: async () => {
    const res = await apiClient.get<RestResponse<ResKhuyenMaiHopLeDTO>>(
      "/gio-hang/khuyen-mai-hop-le"
    );
    return res.data.data;
  },

  apDungKhuyenMai: async (data: {
    maKhuyenMaiHoaDon?: number;
    maKhuyenMaiDiem?: number;
  }) => {
    const res = await apiClient.post<RestResponse<ResApDungKhuyenMaiDTO>>(
      "/gio-hang/ap-dung-khuyen-mai",
      data
    );
    return res.data.data;
  },
};
