"use client";

import Image from "next/image";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Loading from "@/components/ui/Loading";
import { formatDate } from "@/lib/utils";
import {
  KiemKeHangHoa,
  LoaiKiemKe,
  ReqChiTietKiemKeDTO,
  ReqKiemKeHangHoaDTO,
  ResSanPhamDTO,
  ResChiTietSanPhamDTO,
} from "@/types";
import {
  productService,
  productVariantService,
} from "@/services/product.service";
import {
  kiemKeHangHoaService,
  loaiKiemKeService,
} from "@/services/stock-check.service";
import toast from "react-hot-toast";
import {
  FiCamera,
  FiEdit,
  FiEye,
  FiFilePlus,
  FiPlus,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";

const DRAFT = 0;
const WAITING = 1;
const RECHECK = 2;
const CONFIRMED = 3;

function getStatusColor(status: number) {
  switch (status) {
    case DRAFT:
      return "bg-gray-100 text-gray-700";
    case WAITING:
      return "bg-yellow-100 text-yellow-800";
    case RECHECK:
      return "bg-orange-100 text-orange-800";
    case CONFIRMED:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

type FormRow = {
  sanPhamId: number;
  chiTietSanPhamId: number;
  soLuongThucTe: number;
  ghiChu: string;
};

function toInputDateTime(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

export default function StaffStockChecksPage() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<KiemKeHangHoa[]>([]);
  const [types, setTypes] = useState<LoaiKiemKe[]>([]);
  const [products, setProducts] = useState<ResSanPhamDTO[]>([]);
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [filterStatus, setFilterStatus] = useState<number | "ALL">("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KiemKeHangHoa | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<KiemKeHangHoa | null>(null);

  const [form, setForm] = useState({
    tenPhieuKiemKe: "",
    loaiKiemKeId: 0,
    ghiChu: "",
    ngayKiemKe: "",
  });
  const [rows, setRows] = useState<FormRow[]>([]);
  const [productDetailCodeInput, setProductDetailCodeInput] = useState("");
  const [uploadingBarcodeImage, setUploadingBarcodeImage] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturingImage, setCapturingImage] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImageFile, setCapturedImageFile] = useState<File | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(
    null,
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const capturedPreviewUrlRef = useRef<string | null>(null);

  const variantById = useMemo(
    () => new Map(variants.map((item) => [item.id, item])),
    [variants],
  );

  const productOptions = useMemo(
    () =>
      products.map((item) => ({ id: item.id, tenSanPham: item.tenSanPham })),
    [products],
  );

  const filteredChecks = useMemo(() => {
    if (filterStatus === "ALL") return checks;
    return checks.filter((item) => item.trangThai === filterStatus);
  }, [checks, filterStatus]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [checkData, typeData, variantData, productData] = await Promise.all(
        [
          kiemKeHangHoaService.getAll(),
          loaiKiemKeService.getAll(),
          productVariantService.getByCurrentStore().catch(() => []),
          productService
            .getAll({ page: 1, size: 1000 })
            .catch(() => ({ result: [] })),
        ],
      );
      setChecks(Array.isArray(checkData) ? checkData : []);
      setTypes(Array.isArray(typeData) ? typeData : []);
      setVariants(Array.isArray(variantData) ? variantData : []);
      setProducts(Array.isArray(productData?.result) ? productData.result : []);
    } catch {
      toast.error("Không thể tải dữ liệu kiểm kê");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canEdit = (item: KiemKeHangHoa) =>
    item.trangThai === DRAFT || item.trangThai === RECHECK;

  const clearCapturedPreview = useCallback(() => {
    setCapturedImageFile(null);
    if (capturedPreviewUrlRef.current) {
      URL.revokeObjectURL(capturedPreviewUrlRef.current);
      capturedPreviewUrlRef.current = null;
    }
    setCapturedPreviewUrl(null);
  }, []);

  const setCapturedPreview = useCallback((file: File) => {
    if (capturedPreviewUrlRef.current) {
      URL.revokeObjectURL(capturedPreviewUrlRef.current);
      capturedPreviewUrlRef.current = null;
    }
    const previewUrl = URL.createObjectURL(file);
    capturedPreviewUrlRef.current = previewUrl;
    setCapturedPreviewUrl(previewUrl);
    setCapturedImageFile(file);
  }, []);

  const handleCloseCamera = useCallback(() => {
    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setCameraOpen(false);
  }, []);

  const resetQuickScanState = useCallback(() => {
    setProductDetailCodeInput("");
    clearCapturedPreview();
    handleCloseCamera();
  }, [clearCapturedPreview, handleCloseCamera]);

  const upsertRowByVariant = useCallback((variant: ResChiTietSanPhamDTO) => {
    setRows((prev) => {
      const existingIndex = prev.findIndex(
        (row) => row.chiTietSanPhamId === variant.id,
      );

      if (existingIndex >= 0) {
        return prev.map((row, idx) =>
          idx === existingIndex
            ? {
                ...row,
                soLuongThucTe: Math.max(0, (row.soLuongThucTe || 0) + 1),
              }
            : row,
        );
      }

      return [
        ...prev,
        {
          sanPhamId: variant.sanPhamId,
          chiTietSanPhamId: variant.id,
          soLuongThucTe: 1,
          ghiChu: "",
        },
      ];
    });
  }, []);

  const handleAddByProductDetailCode = async () => {
    const codeText = productDetailCodeInput.trim();
    if (!codeText) {
      toast.error("Vui lòng nhập mã chi tiết sản phẩm");
      return;
    }

    const productDetailId = Number(codeText);
    if (!Number.isInteger(productDetailId) || productDetailId <= 0) {
      toast.error("Mã chi tiết sản phẩm không hợp lệ");
      return;
    }

    try {
      const fromCache = variantById.get(productDetailId);
      const variant =
        fromCache || (await productVariantService.getById(productDetailId));
      upsertRowByVariant(variant);
      setProductDetailCodeInput("");
      toast.success("Đã thêm sản phẩm vào chi tiết kiểm kê");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không tìm thấy chi tiết sản phẩm theo mã";
      toast.error(message);
    }
  };

  const scanBarcodeFromImageFile = async (file: File) => {
    if (!file || file.size === 0) {
      toast.error("Ảnh chưa hợp lệ, vui lòng thử lại");
      return;
    }

    try {
      setUploadingBarcodeImage(true);
      const variant = await productVariantService.scanByBarcodeImage(file);
      upsertRowByVariant(variant);
      toast.success("Đã quét mã từ ảnh và thêm vào phiếu kiểm kê");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không nhận diện được mã vạch từ ảnh";
      toast.error(message);
    } finally {
      setUploadingBarcodeImage(false);
    }
  };

  const handleScanBarcodeImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await scanBarcodeFromImageFile(file);
    e.target.value = "";
  };

  const handleOpenCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Trình duyệt không hỗ trợ mở camera");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraOpen(true);
      setCameraReady(false);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {
            toast.error("Không thể phát camera");
          });
        }
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không thể truy cập camera";
      toast.error(message);
      handleCloseCamera();
    }
  };

  const handleCaptureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("Camera chưa sẵn sàng");
      return;
    }
    if (!cameraReady) {
      toast.error("Camera đang khởi động, vui lòng thử lại");
      return;
    }

    try {
      setCapturingImage(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        toast.error("Chưa nhận được khung hình từ camera");
        return;
      }

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        toast.error("Không thể chụp ảnh từ camera");
        return;
      }

      context.drawImage(video, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), "image/jpeg", 0.92);
      });

      let captureBlob = blob;
      if (!captureBlob || captureBlob.size === 0) {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1];
        if (!base64) {
          toast.error("Không thể tạo ảnh chụp");
          return;
        }
        const binaryString = atob(base64);
        const binaryLength = binaryString.length;
        const buffer = new Uint8Array(binaryLength);
        for (let i = 0; i < binaryLength; i += 1) {
          buffer[i] = binaryString.charCodeAt(i);
        }
        captureBlob = new Blob([buffer], { type: "image/jpeg" });
      }

      if (!captureBlob || captureBlob.size === 0) {
        toast.error("Không thể tạo ảnh chụp");
        return;
      }

      const file = new File([captureBlob], `camera-capture-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      if (!file.size) {
        toast.error("Ảnh chụp rỗng, vui lòng thử lại");
        return;
      }

      setCapturedPreview(file);
      handleCloseCamera();
      toast.success("Đã chụp ảnh, vui lòng xác nhận quét");
    } finally {
      setCapturingImage(false);
    }
  };

  const handleScanCapturedImage = async () => {
    if (!capturedImageFile) {
      toast.error("Chưa có ảnh để quét");
      return;
    }

    await scanBarcodeFromImageFile(capturedImageFile);
    clearCapturedPreview();
  };

  useEffect(() => {
    if (!showForm) {
      resetQuickScanState();
    }
  }, [showForm, resetQuickScanState]);

  useEffect(() => {
    return () => {
      const stream = cameraStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (capturedPreviewUrlRef.current) {
        URL.revokeObjectURL(capturedPreviewUrlRef.current);
      }
    };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      tenPhieuKiemKe: "",
      loaiKiemKeId: types[0]?.id ?? 0,
      ghiChu: "",
      ngayKiemKe: toInputDateTime(new Date().toISOString()),
    });
    setRows([]);
    resetQuickScanState();
    setShowForm(true);
  };

  const openEdit = (item: KiemKeHangHoa) => {
    setEditing(item);
    setForm({
      tenPhieuKiemKe: item.tenPhieuKiemKe,
      loaiKiemKeId: item.loaiKiemKe?.id ?? 0,
      ghiChu: item.ghiChu ?? "",
      ngayKiemKe: toInputDateTime(item.ngayKiemKe),
    });
    setRows(
      (item.chiTietKiemKes ?? []).map((ct) => ({
        sanPhamId: variantById.get(ct.chiTietSanPhamId)?.sanPhamId ?? 0,
        chiTietSanPhamId: ct.chiTietSanPhamId,
        soLuongThucTe: ct.soLuongThucTe ?? 0,
        ghiChu: ct.ghiChu ?? "",
      })),
    );
    resetQuickScanState();
    setShowForm(true);
  };

  const openDetail = async (id: number) => {
    try {
      const data = await kiemKeHangHoaService.getById(id);
      setSelected(data);
      setShowDetail(true);
    } catch {
      toast.error("Không thể tải chi tiết phiếu kiểm kê");
    }
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { sanPhamId: 0, chiTietSanPhamId: 0, soLuongThucTe: 0, ghiChu: "" },
    ]);
  };

  const updateRow = (idx: number, patch: Partial<FormRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.tenPhieuKiemKe.trim()) {
      toast.error("Vui lòng nhập tên phiếu kiểm kê");
      return;
    }
    if (!form.loaiKiemKeId) {
      toast.error("Vui lòng chọn loại kiểm kê");
      return;
    }

    const validRows: ReqChiTietKiemKeDTO[] = rows
      .filter((r) => r.sanPhamId > 0 && r.chiTietSanPhamId > 0)
      .map((r) => ({
        chiTietSanPhamId: r.chiTietSanPhamId,
        soLuongThucTe: Number.isFinite(r.soLuongThucTe) ? r.soLuongThucTe : 0,
        ghiChu: r.ghiChu || undefined,
      }));

    if (validRows.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 dòng chi tiết kiểm kê");
      return;
    }

    const payload: ReqKiemKeHangHoaDTO = {
      tenPhieuKiemKe: form.tenPhieuKiemKe.trim(),
      loaiKiemKeId: form.loaiKiemKeId,
      ghiChu: form.ghiChu.trim() || undefined,
      ngayKiemKe: form.ngayKiemKe || undefined,
      chiTietKiemKes: validRows,
    };

    try {
      setSubmitting(true);
      if (editing) {
        await kiemKeHangHoaService.update({ ...payload, id: editing.id });
        toast.success("Đã cập nhật phiếu kiểm kê");
      } else {
        await kiemKeHangHoaService.create(payload);
        toast.success("Đã tạo phiếu kiểm kê");
      }
      setShowForm(false);
      await fetchData();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Lưu phiếu kiểm kê thất bại";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuiDuyet = async (id: number) => {
    if (!confirm("Gửi phiếu này lên admin để duyệt?")) return;
    try {
      await kiemKeHangHoaService.guiDuyet(id);
      toast.success("Đã gửi duyệt phiếu kiểm kê");
      fetchData();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gửi duyệt thất bại";
      toast.error(message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-card rounded-2xl border border-subtle p-4 lg:p-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Phiếu kiểm kê hàng hóa
          </h2>
          <p className="text-sm text-muted mt-1">
            Nhân viên tạo phiếu, điền số lượng thực tế và gửi admin duyệt.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-red-700 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <FiFilePlus size={16} /> Tạo phiếu kiểm kê
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-subtle p-4 flex flex-wrap gap-2">
        {[
          { label: "Tất cả", value: "ALL" as const },
          { label: "Nháp", value: DRAFT },
          { label: "Chờ duyệt", value: WAITING },
          { label: "Yêu cầu kiểm kê lại", value: RECHECK },
          { label: "Đã xác nhận", value: CONFIRMED },
        ].map((item) => (
          <button
            key={String(item.value)}
            onClick={() => setFilterStatus(item.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filterStatus === item.value
                ? "bg-accent text-red-700"
                : "bg-section text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-225">
            <thead className="bg-section border-b border-subtle">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Tên phiếu
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Loại kiểm kê
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Ngày kiểm kê
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filteredChecks.map((item) => (
                <tr key={item.id} className="hover:bg-section transition">
                  <td className="px-4 py-3 font-semibold">#{item.id}</td>
                  <td className="px-4 py-3 text-foreground font-medium max-w-64 truncate">
                    {item.tenPhieuKiemKe}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {item.loaiKiemKe?.tenLoaiKiemKe ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(item.ngayKiemKe || "")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.trangThai)}`}
                    >
                      {item.trangThaiText}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => openDetail(item.id)}
                        className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"
                        title="Xem chi tiết"
                      >
                        <FiEye size={15} />
                      </button>
                      {canEdit(item) && (
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded"
                          title="Chỉnh sửa"
                        >
                          <FiEdit size={15} />
                        </button>
                      )}
                      {canEdit(item) && (
                        <button
                          onClick={() => handleGuiDuyet(item.id)}
                          className="p-1.5 text-green-600 hover:bg-green-600/10 rounded"
                          title="Gửi duyệt"
                        >
                          <FiSend size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredChecks.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-muted">
                    Chưa có phiếu kiểm kê nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-5xl bg-card border border-subtle rounded-2xl">
              <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {editing
                    ? `Cập nhật phiếu #${editing.id}`
                    : "Tạo phiếu kiểm kê"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-muted hover:text-foreground"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted mb-1">
                      Tên phiếu kiểm kê
                    </label>
                    <input
                      value={form.tenPhieuKiemKe}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          tenPhieuKiemKe: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-subtle bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">
                      Loại kiểm kê
                    </label>
                    <select
                      value={form.loaiKiemKeId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          loaiKiemKeId: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-subtle bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value={0}>Chọn loại kiểm kê</option>
                      {types.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.tenLoaiKiemKe}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">
                      Ngày kiểm kê
                    </label>
                    <input
                      type="datetime-local"
                      value={form.ngayKiemKe}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          ngayKiemKe: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-subtle bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">
                      Ghi chú
                    </label>
                    <input
                      value={form.ghiChu}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, ghiChu: e.target.value }))
                      }
                      className="w-full rounded-lg border border-subtle bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="bg-section border border-subtle rounded-xl p-4">
                  <div className="mb-4 space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Nhập mã chi tiết sản phẩm để thêm nhanh
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={productDetailCodeInput}
                        onChange={(e) =>
                          setProductDetailCodeInput(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddByProductDetailCode();
                          }
                        }}
                        placeholder="Ví dụ: 100245"
                        className="flex-1 border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={handleAddByProductDetailCode}
                        className="px-3 py-2 rounded-lg bg-foreground text-background text-sm hover:opacity-90"
                      >
                        Thêm
                      </button>
                    </div>

                    <label className="block text-xs text-muted mt-2">
                      Tải ảnh hoặc chụp camera để quét mã vạch
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScanBarcodeImage}
                        disabled={uploadingBarcodeImage || capturingImage}
                        className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2 text-xs file:mr-3 file:border-0 file:bg-accent file:text-white file:px-2 file:py-1 file:rounded file:cursor-pointer disabled:opacity-50"
                      />
                      {!cameraOpen ? (
                        <button
                          type="button"
                          onClick={handleOpenCamera}
                          disabled={uploadingBarcodeImage || capturingImage}
                          className="px-3 py-2 rounded-lg border border-subtle text-sm hover:bg-section disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                        >
                          <FiCamera size={14} /> Mở camera
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCloseCamera}
                          disabled={capturingImage}
                          className="px-3 py-2 rounded-lg border border-subtle text-sm hover:bg-section disabled:opacity-50"
                        >
                          Đóng camera
                        </button>
                      )}
                    </div>

                    {cameraOpen && (
                      <div className="rounded-lg border border-subtle p-2 space-y-2">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          onLoadedData={() => setCameraReady(true)}
                          className="w-full max-h-64 rounded-md bg-black object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <button
                          type="button"
                          onClick={handleCaptureFromCamera}
                          disabled={
                            uploadingBarcodeImage ||
                            capturingImage ||
                            !cameraReady
                          }
                          className="w-full px-3 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
                        >
                          {capturingImage
                            ? "Đang chụp ảnh..."
                            : cameraReady
                              ? "Chụp ảnh để quét"
                              : "Đang khởi động camera..."}
                        </button>
                      </div>
                    )}

                    {capturedPreviewUrl && (
                      <div className="rounded-lg border border-subtle p-2 space-y-2">
                        <p className="text-xs text-muted">
                          Ảnh đã chụp (preview)
                        </p>
                        <Image
                          src={capturedPreviewUrl}
                          alt="Ảnh chụp mã vạch"
                          width={1280}
                          height={720}
                          unoptimized
                          className="w-full max-h-64 rounded-md object-cover border border-subtle"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleScanCapturedImage}
                            disabled={uploadingBarcodeImage || capturingImage}
                            className="px-3 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
                          >
                            Quét ảnh này
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              clearCapturedPreview();
                              handleOpenCamera();
                            }}
                            disabled={uploadingBarcodeImage || capturingImage}
                            className="px-3 py-2 rounded-lg border border-subtle text-sm hover:bg-section disabled:opacity-50"
                          >
                            Chụp lại
                          </button>
                        </div>
                      </div>
                    )}

                    {uploadingBarcodeImage && (
                      <p className="text-xs text-muted">
                        Đang tải ảnh và quét mã vạch trên server...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-foreground">
                      Chi tiết kiểm kê
                    </h4>
                    <button
                      type="button"
                      onClick={addRow}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-red-700 text-xs hover:bg-primary/90 transition"
                    >
                      <FiPlus size={14} /> Thêm dòng
                    </button>
                  </div>

                  <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-1">
                    <p className="col-span-3 text-xs text-muted">Sản phẩm</p>
                    <p className="col-span-3 text-xs text-muted">
                      Chi tiết sản phẩm
                    </p>
                    <p className="col-span-2 text-xs text-muted">
                      SL trong kho
                    </p>
                    <p className="col-span-1 text-xs text-muted">SL hiện tại</p>
                    <p className="col-span-1 text-xs text-muted">Chênh lệch</p>
                    <p className="col-span-1 text-xs text-muted">Ghi chú</p>
                    <p className="col-span-1 text-xs text-muted text-right">
                      Xóa
                    </p>
                  </div>

                  <div className="space-y-3">
                    {rows.map((row, idx) => {
                      const variant = variantById.get(row.chiTietSanPhamId);
                      const variantsByProduct = variants.filter(
                        (item) => item.sanPhamId === row.sanPhamId,
                      );
                      const soLuongHeThong = variant?.soLuong ?? 0;
                      const chenhLech = soLuongHeThong - row.soLuongThucTe;
                      return (
                        <div
                          key={`${idx}-${row.sanPhamId}-${row.chiTietSanPhamId}`}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <div className="col-span-12 md:col-span-3">
                            <label className="block md:hidden text-xs text-muted mb-1">
                              Sản phẩm
                            </label>
                            <select
                              value={row.sanPhamId}
                              onChange={(e) =>
                                updateRow(idx, {
                                  sanPhamId: Number(e.target.value),
                                  chiTietSanPhamId: 0,
                                  soLuongThucTe: 0,
                                })
                              }
                              className="w-full rounded-lg border border-subtle bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              <option value={0}>Chọn sản phẩm</option>
                              {productOptions.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.tenSanPham}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-12 md:col-span-3">
                            <label className="block md:hidden text-xs text-muted mb-1">
                              Chi tiết sản phẩm
                            </label>
                            <select
                              value={row.chiTietSanPhamId}
                              onChange={(e) =>
                                updateRow(idx, {
                                  chiTietSanPhamId: Number(e.target.value),
                                })
                              }
                              disabled={row.sanPhamId === 0}
                              className="w-full rounded-lg border border-subtle bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              <option value={0}>Chọn chi tiết sản phẩm</option>
                              {variantsByProduct.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.tenMauSac} - {item.tenKichThuoc} (tồn:{" "}
                                  {item.soLuong})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-6 md:col-span-2">
                            <label className="block md:hidden text-xs text-muted mb-1">
                              Số lượng trong kho
                            </label>
                            <input
                              type="number"
                              value={soLuongHeThong}
                              readOnly
                              className="w-full rounded-lg border border-subtle bg-section px-3 py-2 text-sm text-muted"
                              placeholder="SL trong kho"
                            />
                          </div>
                          <div className="col-span-6 md:col-span-1">
                            <label className="block md:hidden text-xs text-muted mb-1">
                              Số lượng hiện tại
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={row.soLuongThucTe}
                              onChange={(e) =>
                                updateRow(idx, {
                                  soLuongThucTe: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-subtle bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="SL hiện tại"
                            />
                          </div>
                          <div className="col-span-6 md:col-span-1">
                            <label className="block md:hidden text-xs text-muted mb-1">
                              Chênh lệch
                            </label>
                            <input
                              type="number"
                              value={Number.isFinite(chenhLech) ? chenhLech : 0}
                              readOnly
                              className="w-full rounded-lg border border-subtle bg-section px-3 py-2 text-sm text-muted"
                              placeholder="Chênh lệch"
                            />
                          </div>
                          <div className="col-span-12 md:col-span-1">
                            <label className="block md:hidden text-xs text-muted mb-1">
                              Ghi chú
                            </label>
                            <input
                              value={row.ghiChu}
                              onChange={(e) =>
                                updateRow(idx, { ghiChu: e.target.value })
                              }
                              className="w-full rounded-lg border border-subtle bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="Ghi chú"
                            />
                          </div>
                          <div className="col-span-12 md:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {rows.length === 0 && (
                      <p className="text-sm text-muted text-center py-5">
                        Chưa có dòng kiểm kê. Nhấn &quot;Thêm dòng&quot; để bắt
                        đầu.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-subtle flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-subtle rounded-lg text-sm text-foreground hover:bg-section transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-red-700 rounded-lg text-sm hover:bg-primary/90 transition disabled:opacity-60"
                >
                  {submitting
                    ? "Đang lưu..."
                    : editing
                      ? "Cập nhật phiếu"
                      : "Tạo phiếu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetail && selected && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-4xl bg-card border border-subtle rounded-2xl">
              <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Chi tiết phiếu kiểm kê #{selected.id}
                </h3>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-muted hover:text-foreground"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted">Tên phiếu: </span>
                    <span className="font-medium text-foreground">
                      {selected.tenPhieuKiemKe}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Trạng thái: </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selected.trangThai)}`}
                    >
                      {selected.trangThaiText}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Loại kiểm kê: </span>
                    <span className="font-medium text-foreground">
                      {selected.loaiKiemKe?.tenLoaiKiemKe ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Cửa hàng: </span>
                    <span className="font-medium text-foreground">
                      {selected.cuaHang?.tenCuaHang ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Ngày kiểm kê: </span>
                    <span className="font-medium text-foreground">
                      {formatDate(selected.ngayKiemKe || "")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Ngày xác nhận: </span>
                    <span className="font-medium text-foreground">
                      {selected.ngayXacNhan
                        ? formatDate(selected.ngayXacNhan)
                        : "-"}
                    </span>
                  </div>
                </div>

                {selected.lyDoYeuCauKiemKeLai && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                    <strong>Lý do yêu cầu kiểm kê lại:</strong>{" "}
                    {selected.lyDoYeuCauKiemKeLai}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-180 text-sm">
                    <thead>
                      <tr className="bg-section border-y border-subtle">
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Sản phẩm
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Hệ thống
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Thực tế
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Chênh lệch
                        </th>
                        <th className="px-3 py-2 text-left text-muted font-medium">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {selected.chiTietKiemKes?.map((ct) => (
                        <tr key={ct.id}>
                          <td className="px-3 py-2 text-foreground">
                            {ct.tenSanPham} - {ct.tenMauSac} - {ct.tenKichThuoc}
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {ct.soLuongHeThong ?? 0}
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {ct.soLuongThucTe ?? 0}
                          </td>
                          <td
                            className={`px-3 py-2 font-medium ${(ct.chenhLech ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {ct.chenhLech ?? 0}
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {ct.ghiChu || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-subtle flex justify-end">
                <button
                  onClick={() => setShowDetail(false)}
                  className="px-4 py-2 border border-subtle rounded-lg text-sm text-foreground hover:bg-section transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
