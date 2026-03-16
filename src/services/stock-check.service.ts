import apiClient from "@/lib/api";
import {
  KiemKeHangHoa,
  LoaiKiemKe,
  ReqKiemKeHangHoaDTO,
  ReqLoaiKiemKeDTO,
  RestResponse,
} from "@/types";

export const loaiKiemKeService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<LoaiKiemKe[]>>("/loai-kiem-ke");
    return res.data.data ?? [];
  },

  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<LoaiKiemKe>>(`/loai-kiem-ke/${id}`);
    return res.data.data;
  },

  create: async (payload: ReqLoaiKiemKeDTO) => {
    const res = await apiClient.post<RestResponse<LoaiKiemKe>>("/loai-kiem-ke", payload);
    return res.data.data;
  },

  update: async (payload: ReqLoaiKiemKeDTO) => {
    const res = await apiClient.put<RestResponse<LoaiKiemKe>>("/loai-kiem-ke", payload);
    return res.data.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/loai-kiem-ke/${id}`);
  },
};

export const kiemKeHangHoaService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<KiemKeHangHoa[]>>("/kiem-ke-hang-hoa");
    return res.data.data ?? [];
  },

  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<KiemKeHangHoa>>(`/kiem-ke-hang-hoa/${id}`);
    return res.data.data;
  },

  create: async (payload: ReqKiemKeHangHoaDTO) => {
    const res = await apiClient.post<RestResponse<KiemKeHangHoa>>("/kiem-ke-hang-hoa", payload);
    return res.data.data;
  },

  update: async (payload: ReqKiemKeHangHoaDTO) => {
    const res = await apiClient.put<RestResponse<KiemKeHangHoa>>("/kiem-ke-hang-hoa", payload);
    return res.data.data;
  },

  guiDuyet: async (id: number) => {
    const res = await apiClient.put<RestResponse<KiemKeHangHoa>>(
      `/kiem-ke-hang-hoa/${id}/gui-duyet`,
      null,
    );
    return res.data.data;
  },

  duyet: async (id: number, hanhDong: "XAC_NHAN" | "YEU_CAU_KIEM_KE_LAI", lyDo?: string) => {
    const res = await apiClient.put<RestResponse<KiemKeHangHoa>>(
      `/kiem-ke-hang-hoa/${id}/duyet`,
      { hanhDong, lyDo },
    );
    return res.data.data;
  },
};
