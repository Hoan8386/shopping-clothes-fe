import apiClient from "@/lib/api";
import {
  ResSanPhamDTO,
  ResChiTietSanPhamDTO,
  HinhAnh,
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

export interface ProductVariantSearchParams {
  sanPhamId?: number;
  mauSacId?: number;
  kichThuocId?: number;
  maCuaHang?: number;
  trangThai?: number;
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
  getAll: async (params?: ProductVariantSearchParams) => {
    const res = await apiClient.get<RestResponse<ResChiTietSanPhamDTO[]>>(
      "/chi-tiet-san-pham",
      { params }
    );
    return res.data.data ?? [];
  },

  getByProduct: async (sanPhamId: number) => {
    const res = await apiClient.get<RestResponse<ResChiTietSanPhamDTO[]>>(
      `/chi-tiet-san-pham/san-pham/${sanPhamId}`
    );
    return res.data.data;
  },

  getByCurrentStore: async () => {
    const res = await apiClient.get<RestResponse<ResChiTietSanPhamDTO[]>>(
      "/chi-tiet-san-pham/san-pham-tai-cua-hang"
    );
    return res.data.data ?? [];
  },

  getByProductCurrentStore: async (sanPhamId: number) => {
    const variants = await productVariantService.getByCurrentStore();
    return variants.filter((item) => item.sanPhamId === sanPhamId);
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

  getStoresWithInventoryForImport: async (sanPhamId: number) => {
    const res = await apiClient.get<RestResponse<ResChiTietSanPhamDTO[]>>(
      `/chi-tiet-san-pham/san-pham/${sanPhamId}`
    );
    const variants = res.data.data ?? [];
    return variants
      .filter((item) => (item.soLuong ?? 0) > 0)
      .sort((a, b) => (b.soLuong ?? 0) - (a.soLuong ?? 0));
  },
};

export const variantImageService = {
  getByChiTietSanPham: async (chiTietSanPhamId: number) => {
    const res = await apiClient.get<RestResponse<HinhAnh[]>>(
      `/hinh-anh/chi-tiet-san-pham/${chiTietSanPhamId}`,
    );
    return res.data.data ?? [];
  },

  delete: async (id: number) => {
    await apiClient.delete(`/hinh-anh/${id}`);
  },
};
