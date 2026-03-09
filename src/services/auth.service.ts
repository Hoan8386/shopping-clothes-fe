import apiClient from "@/lib/api";
import {
  ReqLoginDTO,
  ReqRegisterDTO,
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
};
