import apiClient from "@/lib/api";
import {
  DonHang,
  ReqTaoDonHangTaiQuayDTO,
  ResGioHangNhanVienDTO,
  ResKhachHangLookupDTO,
  ReqTaoDonHangDTO,
  RestResponse,
  ResultPaginationDTO,
} from "@/types";

export interface OrderSearchParams {
  cuaHangId?: number;
  nhanVienId?: number;
  trangThai?: number;
  trangThaiThanhToan?: number;
  hinhThucDonHang?: number;
  page?: number;
  size?: number;
}

export const orderService = {
  getAll: async (params?: OrderSearchParams) => {
    const res = await apiClient.get<
      RestResponse<ResultPaginationDTO<DonHang>>
    >("/don-hang", { params });
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<RestResponse<DonHang>>(`/don-hang/${id}`);
    return res.data.data;
  },

  createOnline: async (data: ReqTaoDonHangDTO) => {
    const res = await apiClient.post<RestResponse<DonHang>>(
      "/don-hang/online",
      data
    );
    return res.data.data;
  },

  createVNPayPaymentUrl: async (donHangId: number) => {
    const res = await apiClient.post<
      RestResponse<{ paymentUrl: string }>
    >("/auth/vnpay/create-payment-url", { donHangId });
    return res.data.data.paymentUrl;
  },

  confirmVNPayReturn: async (params: Record<string, string>) => {
    const res = await apiClient.get<RestResponse<Record<string, string>>>(
      "/auth/vnpay/return",
      { params },
    );
    return res.data.data;
  },

  createPOS: async (data: ReqTaoDonHangTaiQuayDTO) => {
    const res = await apiClient.post<RestResponse<DonHang>>(
      "/don-hang/tai-quay",
      data
    );
    return res.data.data;
  },

  lookupCustomerByPhone: async (sdt: string) => {
    const res = await apiClient.get<RestResponse<ResKhachHangLookupDTO | null>>(
      "/khach-hang/lookup",
      { params: { sdt } },
    );
    return res.data.data;
  },

  getStaffCart: async () => {
    const res = await apiClient.get<RestResponse<ResGioHangNhanVienDTO>>(
      "/gio-hang-nhan-vien/hien-tai",
    );
    return res.data.data;
  },

  updateStaffCartCustomer: async (
    payload: { tenNguoiMua?: string; sdt?: string },
    cartId?: number,
  ) => {
    const res = await apiClient.put<RestResponse<ResGioHangNhanVienDTO>>(
      "/gio-hang-nhan-vien/thong-tin-khach",
      payload,
      { params: cartId ? { cartId } : undefined },
    );
    return res.data.data;
  },

  addStaffCartItem: async (
    payload: {
      chiTietSanPhamId?: number;
      maVach?: string;
      soLuong?: number;
    },
    cartId?: number,
  ) => {
    const res = await apiClient.post<RestResponse<ResGioHangNhanVienDTO>>(
      "/gio-hang-nhan-vien/them-san-pham",
      payload,
      { params: cartId ? { cartId } : undefined },
    );
    return res.data.data;
  },

  updateStaffCartItemQty: async (itemId: number, soLuong: number, cartId?: number) => {
    const res = await apiClient.put<RestResponse<ResGioHangNhanVienDTO>>(
      `/gio-hang-nhan-vien/chi-tiet/${itemId}`,
      { soLuong },
      { params: cartId ? { cartId } : undefined },
    );
    return res.data.data;
  },

  removeStaffCartItem: async (itemId: number, cartId?: number) => {
    const res = await apiClient.delete<RestResponse<ResGioHangNhanVienDTO>>(
      `/gio-hang-nhan-vien/chi-tiet/${itemId}`,
      { params: cartId ? { cartId } : undefined },
    );
    return res.data.data;
  },

  updateStaffCartPromotions: async (
    payload: {
      maKhuyenMaiHoaDon?: number;
      maKhuyenMaiDiem?: number;
    },
    cartId?: number,
  ) => {
    const res = await apiClient.put<RestResponse<ResGioHangNhanVienDTO>>(
      "/gio-hang-nhan-vien/khuyen-mai",
      payload,
      { params: cartId ? { cartId } : undefined },
    );
    return res.data.data;
  },

  checkoutStaffCart: async (hinhThucDonHang: number, cartId?: number) => {
    const res = await apiClient.post<RestResponse<DonHang>>(
      "/gio-hang-nhan-vien/thanh-toan",
      { hinhThucDonHang },
      { params: cartId ? { cartId } : undefined },
    );
    return res.data.data;
  },

  getAllDraftCarts: async () => {
    const res = await apiClient.get<
      RestResponse<ResGioHangNhanVienDTO[]>
    >("/gio-hang-nhan-vien/danh-sach");
    return res.data.data;
  },

  getDraftCartById: async (id: number) => {
    const res = await apiClient.get<RestResponse<ResGioHangNhanVienDTO>>(
      `/gio-hang-nhan-vien/${id}`,
    );
    return res.data.data;
  },

  createNewDraftCart: async () => {
    const res = await apiClient.post<RestResponse<ResGioHangNhanVienDTO>>(
      "/gio-hang-nhan-vien/moi",
    );
    return res.data.data;
  },

  update: async (data: Partial<DonHang>) => {
    const res = await apiClient.put<RestResponse<DonHang>>("/don-hang", data);
    return res.data.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/don-hang/${id}`);
  },
};
