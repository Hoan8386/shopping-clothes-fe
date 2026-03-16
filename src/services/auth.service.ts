import apiClient from "@/lib/api";
import {
  ReqChangePasswordDTO,
  ReqLoginDTO,
  ReqRegisterDTO,
  ReqUpdateProfileDTO,
  ResLoginDTO,
  ResCreateUserDTO,
  RestResponse,
} from "@/types";

export const authService = {
  login: async (data: ReqLoginDTO) => {
    const res = await apiClient.post<RestResponse<ResLoginDTO>>(
      "/auth/login",
      data
    );
    return res.data.data;
  },

  register: async (data: ReqRegisterDTO) => {
    const res = await apiClient.post<RestResponse<ResCreateUserDTO>>(
      "/auth/register",
      data
    );
    return res.data.data;
  },

  getAccount: async () => {
    const res = await apiClient.get<RestResponse<{ user: ResLoginDTO["user"] }>>(
      "/auth/account"
    );
    return res.data.data.user;
  },

  refresh: async () => {
    const res = await apiClient.get<RestResponse<ResLoginDTO>>("/auth/refresh");
    return res.data.data;
  },

  logout: async () => {
    const res = await apiClient.post("/auth/logout");
    return res.data;
  },

  changePassword: async (data: ReqChangePasswordDTO) => {
    const res = await apiClient.put<RestResponse<void>>("/auth/change-password", data);
    return res.data;
  },

  updateProfile: async (data: ReqUpdateProfileDTO) => {
    const formData = new FormData();
    if (data.name !== undefined) {
      formData.append("name", data.name);
    }
    if (data.sdt !== undefined) {
      formData.append("sdt", data.sdt);
    }
    if (data.avatar) {
      formData.append("avatar", data.avatar);
    }

    const res = await apiClient.put<RestResponse<{ user: ResLoginDTO["user"] }>>(
      "/auth/profile",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data.data.user;
  },
};
