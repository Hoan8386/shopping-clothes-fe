// ============ COMMON ============
export interface RestResponse<T> {
  statusCode: number;
  error: string | null;
  message: string | string[];
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export interface ResultPaginationDTO<T> {
  meta: PaginationMeta;
  result: T[];
}

// ============ AUTH ============
export interface ReqLoginDTO {
  username: string;
  password: string;
}

export interface ResLoginUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  diemTichLuy?: number | null;
}

export interface ResLoginDTO {
  access_token: string;
  user: ResLoginUser;
}

export interface ResCreateUserDTO {
  id: number;
  tenKhachHang: string;
  email: string;
  sdt: string;
}

export interface ReqRegisterDTO {
  tenKhachHang: string;
  sdt: string;
  email: string;
  password: string;
}

// ============ PRODUCT ============
export interface ResSanPhamDTO {
  id: number;
  tenSanPham: string;
  giaVon: number;
  giaBan: number;
  giaGiam: number;
  hinhAnhChinh: string;
  moTa: string;
  soLuong: number;
  trangThai: number;
  tenKieuSanPham: string;
  tenBoSuuTap: string;
  tenThuongHieu: string;
}

// ============ PRODUCT VARIANT ============
export interface ResChiTietSanPhamDTO {
  id: number;
  maPhieuNhap: number;
  tenCuaHang: string;
  soLuong: number;
  trangThai: number;
  moTa: string;
  ghiTru: string;
  tenSanPham: string;
  tenMauSac: string;
  tenKichThuoc: string;
  hinhAnhUrls: string[];
}

// ============ CART ============
export interface ResChiTietGioHang {
  maChiTietGioHang: number;
  maChiTietSanPham: number;
  tenSanPham: string;
  kichThuoc: string;
  mauSac: string;
  giaBan: number;
  soLuong: number;
  thanhTien: number;
}

export interface ResGioHangDTO {
  maGioHang: number;
  tongSoLuong: number;
  tongTien: number;
  chiTietGioHangs: ResChiTietGioHang[];
}

export interface ReqThemGioHangDTO {
  maChiTietSanPham: number;
  soLuong: number;
}

// ============ ORDER ============
export interface ChiTietDonHang {
  id?: number;
  chiTietSanPhamId?: number;
  tenSanPham?: string;
  hinhAnhChinh?: string;
  tenMauSac?: string;
  tenKichThuoc?: string;
  giaSanPham: number;
  giamGia: number;
  giaGiam: number;
  soLuong: number;
  thanhTien: number;
}

export interface KhuyenMaiHoaDon {
  id: number;
  tenKhuyenMai: string;
  phanTramGiam: number;
  giamToiDa: number;
  hoaDonToiDa: number;
  tienDaGiam: number;
}

export interface KhuyenMaiDiem {
  id: number;
  tenKhuyenMai: string;
  phanTramGiam: number;
  giamToiDa: number;
  hoaDonToiDa: number;
  diemToiThieu: number;
  tienDaGiam: number;
}

export interface DonHang {
  id: number;
  cuaHang?: CuaHang;
  khachHang?: KhachHang;
  nhanVien?: NhanVien;
  khuyenMaiHoaDon?: KhuyenMaiHoaDon;
  khuyenMaiDiem?: KhuyenMaiDiem;
  maKhuyenMaiHoaDon?: number;
  maKhuyenMaiDiem?: number;
  sdt?: string;
  diaChi: string;
  tongTien: number;
  tienGiam: number;
  tongTienGiam: number;
  tongTienTra: number;
  trangThai: string | number;
  trangThaiThanhToan: string | number;
  hinhThucDonHang: string | number;
  chiTietDonHangs: ChiTietDonHang[];
  ngayTao: string;
  ngayCapNhat: string;
}

export interface ReqTaoDonHangDTO {
  sdt?: string;
  diaChi?: string;
  cuaHangId?: number;
  maKhuyenMaiHoaDon?: number;
  maKhuyenMaiDiem?: number;
  khachHangId?: number;
}

// ============ CUSTOMER ============
export interface KhachHang {
  id: number;
  tenKhachHang: string;
  sdt: string;
  email: string;
  diemTichLuy: number;
}

// ============ EMPLOYEE ============
export interface NhanVien {
  id: number;
  tenNhanVien: string;
  email: string;
  soDienThoai: string;
  trangThai: number;
}

// ============ SIMPLE ENTITIES ============
export interface BoSuuTap {
  id: number;
  tenSuuTap: string;
  moTa: string;
}

export interface KieuSanPham {
  id: number;
  tenKieuSanPham: string;
}

export interface ThuongHieu {
  id: number;
  tenThuongHieu: string;
  trangThaiHoatDong: number;
  trangThaiHienThi: number;
}

export interface MauSac {
  id: number;
  tenMauSac: string;
}

export interface KichThuoc {
  id: number;
  tenKichThuoc: string;
}

export interface CuaHang {
  id: number;
  tenCuaHang: string;
  diaChi: string;
  viTri: string;
  soDienThoai: string;
  email: string;
  trangThai: number;
}

export interface NhaCungCap {
  id: number;
  tenNhaCungCap: string;
  soDienThoai: string;
  email: string;
  diaChi: string;
  ghiTru: string;
  trangThai: number;
}

export interface HinhAnh {
  id: number;
  chiTietSanPham?: ResChiTietSanPhamDTO;
  tenHinhAnh: string;
}

// ============ PROMOTIONS ============
export interface KhuyenMaiTheoHoaDon {
  id: number;
  tenKhuyenMai: string;
  giamToiDa: number;
  hoaDonToiDa: number;
  phanTramGiam: number;
  hinhThuc: number;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  soLuong: number;
  trangThai: number;
}

export interface KhuyenMaiTheoDiem {
  id: number;
  tenKhuyenMai: string;
  giamToiDa: number;
  hoaDonToiDa: number;
  phanTramGiam: number;
  hinhThuc: number;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  soLuong: number;
  trangThai: number;
}

// ============ REVIEW ============
export interface ResDanhGiaSanPhamDTO {
  id: number;
  khachHangId: number;
  tenKhachHang: string;
  chiTietDonHangId: number;
  sanPhamId: number;
  tenSanPham: string;
  donHangId: number;
  soSao: number;
  ghiTru: string;
  hinhAnh: string;
  ngayTao: string;
  ngayCapNhat: string;
}

// ============ PHIEU NHAP ============
export interface PhieuNhap {
  id: number;
  cuaHang?: CuaHang;
  nhaCungCap?: NhaCungCap;
  tenPhieuNhap: string;
  trangThai: number;
  trangThaiText?: string;
  ngayDatHang: string;
  ngayNhanHang: string;
  chiTietPhieuNhaps?: ChiTietPhieuNhap[];
  ngayTao: string;
  ngayCapNhat: string;
}

export interface ChiTietPhieuNhap {
  id: number;
  phieuNhapId?: number;
  tenPhieuNhap?: string;
  chiTietSanPham?: ResChiTietSanPhamDTO;
  soLuong: number;
  soLuongThieu?: number | null;
  soLuongDaNhap?: number | null;
  ghiTru?: string | null;
  ghiTruKiemHang?: string | null;
  trangThai: number;
  trangThaiText?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

export interface ReqChiTietPhieuNhapDTO {
  id?: number;
  phieuNhapId: number;
  chiTietSanPhamId: number;
  soLuong: number;
  soLuongThieu?: number | null;
  ghiTru?: string | null;
  ghiTruKiemHang?: string | null;
  trangThai?: number;
}

// ============ RBAC ============
export interface Permission {
  id: number;
  name: string;
  apiPath: string;
  method: string;
  module: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  active?: boolean;
  permissions?: Permission[];
}

// ============ KHUYEN MAI PREVIEW ============
export interface ResApDungKhuyenMaiDTO {
  tongTienGoc: number;
  maKhuyenMaiHoaDon?: number;
  tenKhuyenMaiHoaDon?: string;
  tienGiamHoaDon?: number;
  maKhuyenMaiDiem?: number;
  tenKhuyenMaiDiem?: string;
  tienGiamDiem?: number;
  tongTienGiam: number;
  tongTienTra: number;
}

export interface ResKhuyenMaiHopLeDTO {
  khuyenMaiHoaDon: KhuyenMaiTheoHoaDon[];
  khuyenMaiDiem: KhuyenMaiTheoDiem[];
}
