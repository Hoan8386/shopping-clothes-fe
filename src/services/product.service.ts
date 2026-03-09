import apiClient from "@/lib/api";
import {
  ResSanPhamDTO,
  ResChiTietSanPhamDTO,
  RestResponse,
  ResultPaginationDTO,
} from "@/types";

export interface ProductSearchParams {
  tenSanPham?: string;
  kieuSanPhamId?: number;
  boSuuTapId?: number;
  thuongHieuId?: number;
  trangThai?: number;
  giaMin?: number;
  giaMax?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export const productService = {
  getAll: async (params?: ProductSearchParams) => {
    const res = await apiClient.get<
      RestResponse<ResultPaginationDTO<ResSanPhamDTO>>
    >("/san-pham", { params });
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<ResSanPhamDTO>>(
      `/san-pham/${id}`
    );
    return res.data.data;
  },

  create: async (formData: FormData) => {
    const res = await apiClient.post<RestResponse<ResSanPhamDTO>>(
      "/san-pham",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  update: async (formData: FormData) => {
    const res = await apiClient.put<RestResponse<ResSanPhamDTO>>(
      "/san-pham",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/san-pham/${id}`);
  },
};

export const productVariantService = {
  getByProduct: async (sanPhamId: number) => {
    const res = await apiClient.get<RestResponse<ResChiTietSanPhamDTO[]>>(
      `/chi-tiet-san-pham/san-pham/${sanPhamId}`
    );
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<ResChiTietSanPhamDTO>>(
      `/chi-tiet-san-pham/${id}`
    );
    return res.data.data;
  },

  create: async (formData: FormData) => {
    const res = await apiClient.post<RestResponse<ResChiTietSanPhamDTO>>(
      "/chi-tiet-san-pham",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  update: async (formData: FormData) => {
    const res = await apiClient.put<RestResponse<ResChiTietSanPhamDTO>>(
      "/chi-tiet-san-pham",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/chi-tiet-san-pham/${id}`);
  },
};
