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
  sdt?: string | null;
  avatar?: string | null;
  role: Role;
  diemTichLuy?: number | null;
  cuaHangId?: number;
  nhanVienId?: number;
}

export interface ReqChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ReqUpdateProfileDTO {
  name?: string;
  sdt?: string;
  avatar?: File | null;
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
  sanPhamId: number;
  maPhieuNhap: number;
  maCuaHang?: number;
  tenCuaHang: string;
  soLuong: number;
  giaBan: number;
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
  sanPhamId?: number;
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
  paymentRef?: string | null;
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
  hinhThucDonHang?: number;
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
export interface NhanVienCuaHangInfo {
  id: number;
  tenCuaHang: string;
  diaChi: string;
  soDienThoai: string;
  email: string;
  trangThai: number;
}

export interface NhanVienRoleInfo {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export interface NhanVien {
  id: number;
  tenNhanVien: string;
  email: string;
  soDienThoai: string;
  ngayBatDauLam?: string;
  ngayKetThucLam?: string;
  trangThai: number;
  cuaHang?: NhanVienCuaHangInfo;
  role?: NhanVienRoleInfo;
}

export interface ReqNhanVienDTO {
  id?: number;
  cuaHang?: { id: number };
  tenNhanVien: string;
  email: string;
  soDienThoai: string;
  matKhau?: string;
  ngayBatDauLam?: string;
  ngayKetThucLam?: string;
  trangThai: number;
  role?: { id: number };
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
  latitude: number | null;
  longitude: number | null;
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
  linkVideo?: string | null;
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

// ============ TRA HANG (RETURN) ============
export interface ChiTietTraHang {
  id: number;
  chiTietDonHangId: number;
  tenSanPham: string;
  hinhAnhChinh: string;
  tenMauSac: string;
  tenKichThuoc: string;
  giaSanPham: number;
  giaSanPhamGiam?: number;
  soLuong: number;
  thanhTien: number;
  ghiTru: string;
  trangThai: string;
}

export interface TraHang {
  id: number;
  donHangId: number;
  lyDoTraHang: string;
  phuongThucHoanTien: string;
  thongTinChuyenKhoan?: string;
  paymentRef?: string;
  linkAnh?: string;
  trangThai: string;
  tongTien: number;
  ngayTao: string;
  ngayCapNhat: string;
  chiTietTraHangs: ChiTietTraHang[];
}

export interface ReqTraHangDTO {
  donHangId: number;
  lyDoTraHang: string;
  phuongThucHoanTien: number;
  thongTinChuyenKhoan?: string;
  paymentRef?: string;
  chiTietTraHangs: {
    chiTietDonHangId: number;
    ghiTru?: string;
  }[];
}

// ============ DOI HANG (EXCHANGE) ============
export interface ChiTietDoiHang {
  id: number;
  ghiTru: string;
  trangThai: string;
  chiTietDonHangId: number;
  tenSanPhamTra: string;
  hinhAnhSanPhamTra: string;
  mauSacTra: string;
  kichThuocTra: string;
  giaSanPhamTra: number;
  soLuongTra: number;
  chiTietSanPhamId: number;
  tenSanPhamDoi: string;
  hinhAnhSanPhamDoi: string;
  mauSacDoi: string;
  kichThuocDoi: string;
  giaSanPhamDoi: number;
  chenhLechGia: number;
}

export interface DoiHang {
  id: number;
  donHangId: number;
  ghiTru: string;
  trangThai: string;
  tongTien: number;
  ngayTao: string;
  ngayCapNhat: string;
  chiTietDoiHangs: ChiTietDoiHang[];
}

export interface ReqDoiHangDTO {
  donHangId: number;
  ghiTru?: string;
  chiTietDoiHangs: {
    chiTietDonHangId: number;
    chiTietSanPhamId: number;
    ghiTru?: string;
  }[];
}

// ============ LOAI DON LUAN CHUYEN ============
export interface LoaiDonLuanChuyen {
  id: number;
  tenLoai: string;
  moTa: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

// ============ DON LUAN CHUYEN (TRANSFER) ============
export interface ChiTietDonLuanChuyenDTO {
  id: number;
  chiTietSanPhamId: number;
  tenSanPham: string;
  hinhAnhSanPham: string;
  mauSac: string;
  kichThuoc: string;
  hinhAnh: string;
  soLuong: number;
  trangThai: string;
  ghiTru: string;
  ghiTruKiemHang: string;
}

export interface DonLuanChuyen {
  id: number;
  tenDon: string;
  ghiTru: string;
  ghiTruKiemHang: string;
  trangThai: string;
  thoiGianGiao: string;
  thoiGianNhan: string;
  ngayTao: string;
  ngayCapNhat: string;
  cuaHangDatId: number;
  tenCuaHangDat: string;
  cuaHangGuiId: number;
  tenCuaHangGui: string;
  loaiDonLuanChuyenId: number;
  tenLoaiDonLuanChuyen: string;
  chiTietDonLuanChuyens: ChiTietDonLuanChuyenDTO[];
}

export interface ReqDonLuanChuyenDTO {
  cuaHangDatId: number;
  cuaHangGuiId: number;
  loaiDonLuanChuyenId: number;
  tenDon: string;
  ghiTru?: string;
  chiTietDonLuanChuyens: {
    chiTietSanPhamId: number;
    soLuong: number;
    ghiTru?: string;
  }[];
}

// ============ KIEM KE (STOCK CHECK) ============
export interface LoaiKiemKe {
  id: number;
  tenLoaiKiemKe: string;
  moTa?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

export interface ReqLoaiKiemKeDTO {
  id?: number;
  tenLoaiKiemKe: string;
  moTa?: string;
}

export interface KiemKeChiTiet {
  id: number;
  chiTietSanPhamId: number;
  tenSanPham?: string;
  tenMauSac?: string;
  tenKichThuoc?: string;
  soLuongHeThong?: number;
  soLuongThucTe?: number;
  chenhLech?: number;
  ghiChu?: string;
}

export interface KiemKeHangHoa {
  id: number;
  tenPhieuKiemKe: string;
  trangThai: number;
  trangThaiText: string;
  ghiChu?: string;
  lyDoYeuCauKiemKeLai?: string;
  ngayKiemKe?: string;
  ngayXacNhan?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
  loaiKiemKe?: {
    id: number;
    tenLoaiKiemKe: string;
  };
  cuaHang?: {
    id: number;
    tenCuaHang: string;
    diaChi?: string;
  };
  nhanVienTao?: {
    id: number;
    tenNhanVien: string;
    email?: string;
  };
  nhanVienDuyet?: {
    id: number;
    tenNhanVien: string;
    email?: string;
  };
  chiTietKiemKes: KiemKeChiTiet[];
}

export interface ReqChiTietKiemKeDTO {
  id?: number;
  chiTietSanPhamId: number;
  soLuongThucTe: number;
  ghiChu?: string;
}

export interface ReqKiemKeHangHoaDTO {
  id?: number;
  loaiKiemKeId?: number;
  cuaHangId?: number;
  tenPhieuKiemKe: string;
  ghiChu?: string;
  ngayKiemKe?: string;
  chiTietKiemKes: ReqChiTietKiemKeDTO[];
}

// ============ CA LAM VIEC (SHIFTS) ============
export interface CaLamViec {
  id: number;
  tenCaLam: string;
  gioBatDau: string;  // HH:mm:ss
  gioKetThuc: string; // HH:mm:ss
  trangThai: number;  // 1=Hoạt động, 0=Không HĐ
  json?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

export interface ReqCaLamViecDTO {
  id?: number;
  tenCaLam: string;
  gioBatDau: string;
  gioKetThuc: string;
  trangThai: number;
}

// ============ LICH LAM VIEC (SCHEDULES) ============
export interface LichLamViec {
  id: number;
  nhanVien?: NhanVien;
  ngayLamViec: string; // yyyy-MM-dd
  trangThai: number;   // 1=Đang làm, 0=Nghỉ
  json?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

export interface ReqLichLamViecDTO {
  id?: number;
  nhanVien: { id: number };
  ngayLamViec: string;
  trangThai: number;
}

// ============ CHI TIET LICH LAM (SCHEDULE DETAILS) ============
export interface ChiTietLichLam {
  id: number;
  lichLamViec?: LichLamViec;
  caLamViec?: CaLamViec;
  trangThai: number; // 1=Xác nhận, 0=Chờ duyệt
  ngayTao?: string;
  ngayCapNhat?: string;
}

export interface ReqChiTietLichLamDTO {
  id?: number;
  lichLamViec: { id: number };
  caLamViec: { id: number };
  trangThai: number;
}

// ============ LUONG CO BAN (BASIC SALARY) ============
export interface LuongCoBan {
  id: number;
  nhanVien?: NhanVien;
  luongCoBan: number; // VNĐ
  ngayApDung: string; // LocalDateTime
  trangThai: number;  // 1=Đang áp dụng, 0=Hết hiệu lực
  json?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

export interface ReqLuongCoBanDTO {
  id?: number;
  nhanVien: { id: number };
  luongCoBan: number;
  ngayApDung: string;
  trangThai: number;
}

// ============ LUONG THUONG (BONUSES) ============
export interface LuongThuong {
  id: number;
  nhanVien?: NhanVien;
  tienThuong: number;  // VNĐ
  ngayBatDau: string;  // LocalDateTime
  ngayKetThuc: string; // LocalDateTime
  trangThai: number;   // 1=Đã chi, 0=Chờ chi
  json?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

export interface ReqLuongThuongDTO {
  id?: number;
  nhanVien: { id: number };
  tienThuong: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: number;
}

// ============ DOI CA (SHIFT SWAPS) ============
export interface DoiCa {
  id: number;
  lichLamViec?: LichLamViec;
  chiTietLichLam?: ChiTietLichLam;
  nhanVienNhanCa?: NhanVien;
  trangThai: number; // 0=Chờ, 1=Đồng ý, 2=Từ chối
  json?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

export interface ReqDoiCaDTO {
  id?: number;
  lichLamViec: { id: number };
  chiTietLichLam: { id: number };
  nhanVienNhanCa: { id: number };
  trangThai: number;
}

// ============ LOI PHAT SINH (INCIDENTS) ============
export interface LoiPhatSinh {
  id: number;
  lichLamViec?: LichLamViec;
  chiTietLichLam?: ChiTietLichLam;
  tenLoiPhatSinh: string; // Mô tả lỗi
  soTienTru: number;      // VNĐ
  trangThai: number;      // 1=Đã xử lý, 0=Chờ xử lý
  json?: string;
  ngayTao?: string;
  ngayCapNhat?: string;
}

export interface ReqLoiPhatSinhDTO {
  id?: number;
  lichLamViec: { id: number };
  chiTietLichLam: { id: number };
  tenLoiPhatSinh: string;
  soTienTru: number;
  trangThai: number;
}
