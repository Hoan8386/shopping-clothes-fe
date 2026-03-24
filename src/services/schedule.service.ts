import apiClient from "@/lib/api";
import {
  RestResponse,
  CaLamViec,
  ReqCaLamViecDTO,
  LichLamViec,
  ReqLichLamViecDTO,
  ChiTietLichLam,
  ReqChiTietLichLamDTO,
  LuongCoBan,
  ReqLuongCoBanDTO,
  LuongThuong,
  ReqLuongThuongDTO,
  DoiCa,
  ReqDoiCaDTO,
  LoiPhatSinh,
  ReqLoiPhatSinhDTO,
} from "@/types";

// ============ CA LAM VIEC ============
export const caLamViecService = {
  getAll: async (): Promise<CaLamViec[]> => {
    const res = await apiClient.get<RestResponse<CaLamViec[]>>("/ca-lam-viec");
    return res.data.data;
  },

  getById: async (id: number): Promise<CaLamViec> => {
    const res = await apiClient.get<RestResponse<CaLamViec>>(`/ca-lam-viec/${id}`);
    return res.data.data;
  },

  create: async (data: ReqCaLamViecDTO): Promise<CaLamViec> => {
    const res = await apiClient.post<RestResponse<CaLamViec>>("/ca-lam-viec", data);
    return res.data.data;
  },

  update: async (data: ReqCaLamViecDTO): Promise<CaLamViec> => {
    const res = await apiClient.put<RestResponse<CaLamViec>>("/ca-lam-viec", data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ca-lam-viec/${id}`);
  },
};

// ============ LICH LAM VIEC ============
export const lichLamViecService = {
  getAll: async (): Promise<LichLamViec[]> => {
    const res = await apiClient.get<RestResponse<LichLamViec[]>>("/lich-lam-viec");
    return res.data.data;
  },

  getById: async (id: number): Promise<LichLamViec> => {
    const res = await apiClient.get<RestResponse<LichLamViec>>(`/lich-lam-viec/${id}`);
    return res.data.data;
  },

  getByNhanVien: async (nhanVienId: number): Promise<LichLamViec[]> => {
    const res = await apiClient.get<RestResponse<LichLamViec[]>>(
      `/lich-lam-viec/nhan-vien/${nhanVienId}`
    );
    return res.data.data;
  },

  getByCuaHangId: async (cuaHangId: number): Promise<LichLamViec[]> => {
    const res = await apiClient.get<RestResponse<LichLamViec[]>>(
      `/lich-lam-viec/cua-hang/${cuaHangId}`
    );
    return res.data.data;
  },

  getByCuaHangAndMonth: async (cuaHangId: number, year: number, month: number): Promise<LichLamViec[]> => {
    const res = await apiClient.get<RestResponse<LichLamViec[]>>(
      `/lich-lam-viec/cua-hang/${cuaHangId}/thang`,
      { params: { year, month } }
    );
    return res.data.data;
  },

  create: async (data: ReqLichLamViecDTO): Promise<LichLamViec> => {
    const res = await apiClient.post<RestResponse<LichLamViec>>("/lich-lam-viec", data);
    return res.data.data;
  },

  importExcel: async (cuaHangId: number, file: File): Promise<LichLamViec[]> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post<RestResponse<LichLamViec[]>>(
      `/lich-lam-viec/cua-hang/${cuaHangId}/import`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  downloadTemplate: async (cuaHangId: number, year: number, month: number): Promise<Blob> => {
    const res = await apiClient.get(`/lich-lam-viec/cua-hang/${cuaHangId}/download-template`, {
      params: { year, month },
      responseType: "blob",
    });
    return res.data;
  },

  updateDayStatus: async (cuaHangId: number, date: string, status: number): Promise<void> => {
    await apiClient.put(`/lich-lam-viec/cua-hang/${cuaHangId}/ngay/trang-thai`, null, {
      params: { date, status }
    });
  },

  addShift: async (cuaHangId: number, nhanVienId: number, caLamViecId: number, date: string): Promise<void> => {
    await apiClient.post(`/lich-lam-viec/cua-hang/${cuaHangId}/ngay/ca-lam-viec`, null, {
      params: { nhanVienId, caLamViecId, date }
    });
  },

  removeShift: async (cuaHangId: number, nhanVienId: number, caLamViecId: number, date: string): Promise<void> => {
    await apiClient.delete(`/lich-lam-viec/cua-hang/${cuaHangId}/ngay/ca-lam-viec`, {
      params: { nhanVienId, caLamViecId, date }
    });
  },

  update: async (data: ReqLichLamViecDTO): Promise<LichLamViec> => {
    const res = await apiClient.put<RestResponse<LichLamViec>>("/lich-lam-viec", data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/lich-lam-viec/${id}`);
  },
};

// ============ CHI TIET LICH LAM ============
export const chiTietLichLamService = {
  getAll: async (): Promise<ChiTietLichLam[]> => {
    const res = await apiClient.get<RestResponse<ChiTietLichLam[]>>("/chi-tiet-lich-lam");
    return res.data.data;
  },

  getById: async (id: number): Promise<ChiTietLichLam> => {
    const res = await apiClient.get<RestResponse<ChiTietLichLam>>(`/chi-tiet-lich-lam/${id}`);
    return res.data.data;
  },

  getByLichLamViec: async (lichLamViecId: number): Promise<ChiTietLichLam[]> => {
    const res = await apiClient.get<RestResponse<ChiTietLichLam[]>>(
      `/chi-tiet-lich-lam/lich-lam-viec/${lichLamViecId}`
    );
    return res.data.data;
  },

  create: async (data: ReqChiTietLichLamDTO): Promise<ChiTietLichLam> => {
    const res = await apiClient.post<RestResponse<ChiTietLichLam>>("/chi-tiet-lich-lam", data);
    return res.data.data;
  },

  update: async (data: ReqChiTietLichLamDTO): Promise<ChiTietLichLam> => {
    const res = await apiClient.put<RestResponse<ChiTietLichLam>>("/chi-tiet-lich-lam", data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/chi-tiet-lich-lam/${id}`);
  },
};

// ============ LUONG CO BAN ============
export const luongCoBanService = {
  getAll: async (): Promise<LuongCoBan[]> => {
    const res = await apiClient.get<RestResponse<LuongCoBan[]>>("/luong-co-ban");
    return res.data.data;
  },

  getById: async (id: number): Promise<LuongCoBan> => {
    const res = await apiClient.get<RestResponse<LuongCoBan>>(`/luong-co-ban/${id}`);
    return res.data.data;
  },

  getByNhanVien: async (nhanVienId: number): Promise<LuongCoBan[]> => {
    const res = await apiClient.get<RestResponse<LuongCoBan[]>>(
      `/luong-co-ban/nhan-vien/${nhanVienId}`
    );
    return res.data.data;
  },

  create: async (data: ReqLuongCoBanDTO): Promise<LuongCoBan> => {
    const res = await apiClient.post<RestResponse<LuongCoBan>>("/luong-co-ban", data);
    return res.data.data;
  },

  update: async (data: ReqLuongCoBanDTO): Promise<LuongCoBan> => {
    const res = await apiClient.put<RestResponse<LuongCoBan>>("/luong-co-ban", data);
    return res.data.data;
  },
};

// ============ LUONG THUONG ============
export const luongThuongService = {
  getAll: async (): Promise<LuongThuong[]> => {
    const res = await apiClient.get<RestResponse<LuongThuong[]>>("/luong-thuong");
    return res.data.data;
  },

  getById: async (id: number): Promise<LuongThuong> => {
    const res = await apiClient.get<RestResponse<LuongThuong>>(`/luong-thuong/${id}`);
    return res.data.data;
  },

  getByNhanVien: async (nhanVienId: number): Promise<LuongThuong[]> => {
    const res = await apiClient.get<RestResponse<LuongThuong[]>>(
      `/luong-thuong/nhan-vien/${nhanVienId}`
    );
    return res.data.data;
  },

  create: async (data: ReqLuongThuongDTO): Promise<LuongThuong> => {
    const res = await apiClient.post<RestResponse<LuongThuong>>("/luong-thuong", data);
    return res.data.data;
  },

  update: async (data: ReqLuongThuongDTO): Promise<LuongThuong> => {
    const res = await apiClient.put<RestResponse<LuongThuong>>("/luong-thuong", data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/luong-thuong/${id}`);
  },
};

// ============ DOI CA ============
export const doiCaService = {
  getAll: async (): Promise<DoiCa[]> => {
    const res = await apiClient.get<RestResponse<DoiCa[]>>("/doi-ca");
    return res.data.data;
  },

  getById: async (id: number): Promise<DoiCa> => {
    const res = await apiClient.get<RestResponse<DoiCa>>(`/doi-ca/${id}`);
    return res.data.data;
  },

  getByLichLamViec: async (lichLamViecId: number): Promise<DoiCa[]> => {
    const res = await apiClient.get<RestResponse<DoiCa[]>>(
      `/doi-ca/lich-lam-viec/${lichLamViecId}`
    );
    return res.data.data;
  },

  create: async (data: ReqDoiCaDTO): Promise<DoiCa> => {
    const res = await apiClient.post<RestResponse<DoiCa>>("/doi-ca", data);
    return res.data.data;
  },

  update: async (data: ReqDoiCaDTO): Promise<DoiCa> => {
    const res = await apiClient.put<RestResponse<DoiCa>>("/doi-ca", data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/doi-ca/${id}`);
  },
};

// ============ LOI PHAT SINH ============
export const loiPhatSinhService = {
  getAll: async (): Promise<LoiPhatSinh[]> => {
    const res = await apiClient.get<RestResponse<LoiPhatSinh[]>>("/loi-phat-sinh");
    return res.data.data;
  },

  getById: async (id: number): Promise<LoiPhatSinh> => {
    const res = await apiClient.get<RestResponse<LoiPhatSinh>>(`/loi-phat-sinh/${id}`);
    return res.data.data;
  },

  getByLichLamViec: async (lichLamViecId: number): Promise<LoiPhatSinh[]> => {
    const res = await apiClient.get<RestResponse<LoiPhatSinh[]>>(
      `/loi-phat-sinh/lich-lam-viec/${lichLamViecId}`
    );
    return res.data.data;
  },

  create: async (data: ReqLoiPhatSinhDTO): Promise<LoiPhatSinh> => {
    const res = await apiClient.post<RestResponse<LoiPhatSinh>>("/loi-phat-sinh", data);
    return res.data.data;
  },

  update: async (data: ReqLoiPhatSinhDTO): Promise<LoiPhatSinh> => {
    const res = await apiClient.put<RestResponse<LoiPhatSinh>>("/loi-phat-sinh", data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/loi-phat-sinh/${id}`);
  },
};
