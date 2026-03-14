import apiClient from "@/lib/api";
import { NhanVien, ReqNhanVienDTO, RestResponse } from "@/types";

export const nhanVienService = {
  getAll: async () => {
    const res = await apiClient.get<RestResponse<NhanVien[]>>("/nhan-vien");
    return res.data.data ?? [];
  },
  create: async (data: ReqNhanVienDTO) => {
    const res = await apiClient.post<RestResponse<NhanVien>>("/nhan-vien", data);
    return res.data.data;
  },
  update: async (data: ReqNhanVienDTO) => {
    const res = await apiClient.put<RestResponse<NhanVien>>("/nhan-vien", data);
    return res.data.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/nhan-vien/${id}`);
  },
};
