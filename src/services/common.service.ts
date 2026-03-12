import apiClient from "@/lib/api";
import {
  BoSuuTap,
  KieuSanPham,
  ThuongHieu,
  MauSac,
  KichThuoc,
  CuaHang,
  NhaCungCap,
  KhuyenMaiTheoHoaDon,
  KhuyenMaiTheoDiem,
  ResDanhGiaSanPhamDTO,
  PhieuNhap,
  ChiTietPhieuNhap,
  ReqChiTietPhieuNhapDTO,
  RestResponse,
  ResultPaginationDTO,
  Role,
  Permission,
} from "@/types";

// ============ BoSuuTap ============
export const boSuuTapService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<BoSuuTap[]>>("/bo-suu-tap");
    return res.data.data;
  },
  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<BoSuuTap>>(`/bo-suu-tap/${id}`);
    return res.data.data;
  },
  create: async (data: Partial<BoSuuTap>) => {
    const res = await apiClient.post<RestResponse<BoSuuTap>>("/bo-suu-tap", data);
    return res.data.data;
  },
  update: async (data: Partial<BoSuuTap>) => {
    const res = await apiClient.put<RestResponse<BoSuuTap>>("/bo-suu-tap", data);
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/bo-suu-tap/${id}`);
  },
};

// ============ KieuSanPham ============
export const kieuSanPhamService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<KieuSanPham[]>>("/kieu-san-pham");
    return res.data.data;
  },
  create: async (data: Partial<KieuSanPham>) => {
    const res = await apiClient.post<RestResponse<KieuSanPham>>("/kieu-san-pham", data);
    return res.data.data;
  },
  update: async (data: Partial<KieuSanPham>) => {
    const res = await apiClient.put<RestResponse<KieuSanPham>>("/kieu-san-pham", data);
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/kieu-san-pham/${id}`);
  },
};

// ============ ThuongHieu ============
export const thuongHieuService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<ThuongHieu[]>>("/thuong-hieu");
    return res.data.data;
  },
  create: async (data: Partial<ThuongHieu>) => {
    const res = await apiClient.post<RestResponse<ThuongHieu>>("/thuong-hieu", data);
    return res.data.data;
  },
  update: async (data: Partial<ThuongHieu>) => {
    const res = await apiClient.put<RestResponse<ThuongHieu>>("/thuong-hieu", data);
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/thuong-hieu/${id}`);
  },
};

// ============ MauSac ============
export const mauSacService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<MauSac[]>>("/mau-sac");
    return res.data.data;
  },
  create: async (data: Partial<MauSac>) => {
    const res = await apiClient.post<RestResponse<MauSac>>("/mau-sac", data);
    return res.data.data;
  },
  update: async (data: Partial<MauSac>) => {
    const res = await apiClient.put<RestResponse<MauSac>>("/mau-sac", data);
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/mau-sac/${id}`);
  },
};

// ============ KichThuoc ============
export const kichThuocService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<KichThuoc[]>>("/kich-thuoc");
    return res.data.data;
  },
  create: async (data: Partial<KichThuoc>) => {
    const res = await apiClient.post<RestResponse<KichThuoc>>("/kich-thuoc", data);
    return res.data.data;
  },
  update: async (data: Partial<KichThuoc>) => {
    const res = await apiClient.put<RestResponse<KichThuoc>>("/kich-thuoc", data);
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/kich-thuoc/${id}`);
  },
};

// ============ CuaHang ============
export const cuaHangService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<CuaHang[]>>("/cua-hang");
    return res.data.data;
  },
  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<CuaHang>>(`/cua-hang/${id}`);
    return res.data.data;
  },
  create: async (data: Partial<CuaHang>) => {
    const res = await apiClient.post<RestResponse<CuaHang>>("/cua-hang", data);
    return res.data.data;
  },
  update: async (data: Partial<CuaHang>) => {
    const res = await apiClient.put<RestResponse<CuaHang>>("/cua-hang", data);
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/cua-hang/${id}`);
  },
};

// ============ NhaCungCap ============
export const nhaCungCapService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<NhaCungCap[]>>("/nha-cung-cap");
    return res.data.data;
  },
  create: async (data: Partial<NhaCungCap>) => {
    const res = await apiClient.post<RestResponse<NhaCungCap>>("/nha-cung-cap", data);
    return res.data.data;
  },
  update: async (data: Partial<NhaCungCap>) => {
    const res = await apiClient.put<RestResponse<NhaCungCap>>("/nha-cung-cap", data);
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/nha-cung-cap/${id}`);
  },
};

// ============ KhuyenMaiTheoHoaDon ============
export const khuyenMaiHoaDonService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<KhuyenMaiTheoHoaDon[]>>(
      "/khuyen-mai-theo-hoa-don"
    );
    return res.data.data;
  },
  create: async (data: Partial<KhuyenMaiTheoHoaDon>) => {
    const res = await apiClient.post<RestResponse<KhuyenMaiTheoHoaDon>>(
      "/khuyen-mai-theo-hoa-don",
      data
    );
    return res.data.data;
  },
  update: async (data: Partial<KhuyenMaiTheoHoaDon>) => {
    const res = await apiClient.put<RestResponse<KhuyenMaiTheoHoaDon>>(
      "/khuyen-mai-theo-hoa-don",
      data
    );
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/khuyen-mai-theo-hoa-don/${id}`);
  },
};

// ============ KhuyenMaiTheoDiem ============
export const khuyenMaiDiemService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<KhuyenMaiTheoDiem[]>>(
      "/khuyen-mai-theo-diem"
    );
    return res.data.data;
  },
  create: async (data: Partial<KhuyenMaiTheoDiem>) => {
    const res = await apiClient.post<RestResponse<KhuyenMaiTheoDiem>>(
      "/khuyen-mai-theo-diem",
      data
    );
    return res.data.data;
  },
  update: async (data: Partial<KhuyenMaiTheoDiem>) => {
    const res = await apiClient.put<RestResponse<KhuyenMaiTheoDiem>>(
      "/khuyen-mai-theo-diem",
      data
    );
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/khuyen-mai-theo-diem/${id}`);
  },
};

// ============ DanhGiaSanPham ============
export const danhGiaService = {
  getByProduct: async (sanPhamId: number) => {
    const res = await apiClient.get<RestResponse<ResDanhGiaSanPhamDTO[]>>(
      `/danh-gia-san-pham/san-pham/${sanPhamId}`
    );
    return res.data.data ?? [];
  },
  getMyReviews: async () => {
    const res = await apiClient.get<RestResponse<ResDanhGiaSanPhamDTO[]>>(
      "/danh-gia-san-pham/cua-toi"
    );
    return res.data.data;
  },
  create: async (formData: FormData) => {
    const res = await apiClient.post<RestResponse<ResDanhGiaSanPhamDTO>>(
      "/danh-gia-san-pham",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },
  update: async (id: number, formData: FormData) => {
    const res = await apiClient.put<RestResponse<ResDanhGiaSanPhamDTO>>(
      `/danh-gia-san-pham/${id}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },
  getByChiTietDonHang: async (chiTietDonHangId: number) => {
    const res = await apiClient.get<RestResponse<ResDanhGiaSanPhamDTO[]>>(
      `/danh-gia-san-pham/chi-tiet-don-hang/${chiTietDonHangId}`
    );
    return res.data.data ?? [];
  },
  delete: async (id: number) => {
    await apiClient.delete(`/danh-gia-san-pham/${id}`);
  },
  getAll: async (page = 1, size = 20) => {
    const res = await apiClient.get<
      RestResponse<ResultPaginationDTO<ResDanhGiaSanPhamDTO>>
    >("/danh-gia-san-pham", { params: { page, size } });
    return res.data;
  },
};

// ============ Role ============
export const roleService = {
  getAll: async (page = 1, size = 100) => {
    const res = await apiClient.get<RestResponse<ResultPaginationDTO<Role>>>("/roles", {
      params: { page, size },
    });
    return res.data.data;
  },
  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<Role>>(`/roles/${id}`);
    return res.data.data;
  },
  create: async (data: Partial<Role>) => {
    const res = await apiClient.post<RestResponse<Role>>("/roles", data);
    return res.data.data;
  },
  update: async (data: Partial<Role>) => {
    const res = await apiClient.put<RestResponse<Role>>("/roles", data);
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/roles/${id}`);
  },
};

// ============ Permission ============
export const permissionService = {
  getAll: async (page = 1, size = 100) => {
    const res = await apiClient.get<RestResponse<ResultPaginationDTO<Permission>>>(
      "/permissions",
      { params: { page, size } }
    );
    return res.data.data;
  },
  create: async (data: Partial<Permission>) => {
    const res = await apiClient.post<RestResponse<Permission>>("/permissions", data);
    return res.data.data;
  },
  update: async (data: Partial<Permission>) => {
    const res = await apiClient.put<RestResponse<Permission>>("/permissions", data);
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/permissions/${id}`);
  },
};

// ============ PhieuNhap ============
export interface PhieuNhapSearchParams {
  tenPhieuNhap?: string;
  trangThai?: number;
  tenCuaHang?: string;
  tenNhaCungCap?: string;
  ngayTaoTu?: string;
  ngayTaoDen?: string;
  ngayDatHangTu?: string;
  ngayDatHangDen?: string;
  ngayNhanHangTu?: string;
  ngayNhanHangDen?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ReqPhieuNhapDTO {
  id?: number;
  tenPhieuNhap: string;
  cuaHangId: number;
  nhaCungCapId: number;
  trangThai?: number;
}

export const phieuNhapService = {
  getAll: async (params?: PhieuNhapSearchParams) => {
    const res = await apiClient.get<RestResponse<ResultPaginationDTO<PhieuNhap>>>(
      "/phieu-nhap",
      { params }
    );
    return res.data.data;
  },
  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<PhieuNhap>>(`/phieu-nhap/${id}`);
    return res.data.data;
  },
  create: async (data: Omit<ReqPhieuNhapDTO, "id" | "trangThai">) => {
    const res = await apiClient.post<RestResponse<PhieuNhap>>("/phieu-nhap", data);
    return res.data.data;
  },
  update: async (data: ReqPhieuNhapDTO & { id: number }) => {
    const res = await apiClient.put<RestResponse<PhieuNhap>>("/phieu-nhap", data);
    return res.data.data;
  },
  kiemKe: async (id: number) => {
    const res = await apiClient.put<RestResponse<PhieuNhap>>(
      `/phieu-nhap/kiem-ke/${id}`,
      {}
    );
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/phieu-nhap/${id}`);
  },
};

// ============ ChiTietPhieuNhap ============
export const chiTietPhieuNhapService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<ChiTietPhieuNhap[]>>(
      "/chi-tiet-phieu-nhap"
    );
    return res.data.data;
  },
  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<ChiTietPhieuNhap>>(
      `/chi-tiet-phieu-nhap/${id}`
    );
    return res.data.data;
  },
  getByPhieuNhap: async (phieuNhapId: number) => {
    const res = await apiClient.get<RestResponse<ChiTietPhieuNhap[]>>(
      `/chi-tiet-phieu-nhap/phieu-nhap/${phieuNhapId}`
    );
    return res.data.data;
  },
  create: async (data: Omit<ReqChiTietPhieuNhapDTO, "id">) => {
    const res = await apiClient.post<RestResponse<ChiTietPhieuNhap>>(
      "/chi-tiet-phieu-nhap",
      data
    );
    return res.data.data;
  },
  update: async (data: ReqChiTietPhieuNhapDTO & { id: number }) => {
    const res = await apiClient.put<RestResponse<ChiTietPhieuNhap>>(
      "/chi-tiet-phieu-nhap",
      data
    );
    return res.data.data;
  },
  delete: async (id: number) => {
    const res = await apiClient.delete<RestResponse<void>>(
      `/chi-tiet-phieu-nhap/${id}`
    );
    return res.data;
  },
};
