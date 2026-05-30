"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiTrash2,
  FiUpload,
  FiPlay,
  FiX,
} from "react-icons/fi";
import { tryOnStorage, type TryOnSelectedProduct } from "@/lib/try-on";
import { virtualTryOnService } from "@/services/virtualTryOn.service";
import toast from "react-hot-toast";

type TryOnCategory = "tops" | "bottoms" | "one-pieces";

const CATEGORY_OPTIONS: Array<{ value: TryOnCategory; label: string }> = [
  { value: "tops", label: "Áo / Tops" },
  { value: "bottoms", label: "Quần / Bottoms" },
  { value: "one-pieces", label: "Đầm / One-piece" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const urlToFile = async (imageUrl: string, fileName: string) => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Không tải được ảnh sản phẩm để thử đồ");
  }
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
};

type TryOnProcessResponse = {
  status?: string;
  stage?: string;
  progress?: number;
  message?: string;
  image_url?: string;
  result?: {
    file_name?: string;
    image_url?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export default function TryOnPage() {
  const [items, setItems] = useState<TryOnSelectedProduct[]>([]);
  const [selectedTopId, setSelectedTopId] = useState<number | null>(null);
  const [selectedBottomId, setSelectedBottomId] = useState<number | null>(null);
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string>("");
  const [category, setCategory] = useState<TryOnCategory>("bottoms");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [resultImageUrl, setResultImageUrl] = useState<string>("");
  const [resultFileName, setResultFileName] = useState<string>("");
  const [requestId, setRequestId] = useState<string>("");
  const [progressIntervalId, setProgressIntervalId] = useState<number | null>(
    null,
  );
  // Tải danh sách sản phẩm đã lưu từ Storage khi component mount
  useEffect(() => {
    const stored = tryOnStorage.getAll();
    setItems(stored);
  }, []);

  // Giải phóng URL preview khi component unmount hoặc đổi ảnh để tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => {
      if (personPreview) URL.revokeObjectURL(personPreview);
      if (progressIntervalId !== null) window.clearInterval(progressIntervalId);
    };
  }, [personPreview, progressIntervalId]);

  useEffect(() => {
    if (
      selectedTopId !== null &&
      !items.some((item) => item.id === selectedTopId)
    ) {
      setSelectedTopId(null);
    }
    if (
      selectedBottomId !== null &&
      !items.some((item) => item.id === selectedBottomId)
    ) {
      setSelectedBottomId(null);
    }
  }, [items, selectedTopId, selectedBottomId]);

  const selectedTopItem = useMemo(
    () => items.find((item) => item.id === selectedTopId) || null,
    [items, selectedTopId],
  );

  const selectedBottomItem = useMemo(
    () => items.find((item) => item.id === selectedBottomId) || null,
    [items, selectedBottomId],
  );

  const selectedItem = useMemo(
    () =>
      (category === "tops"
        ? selectedTopItem || selectedBottomItem
        : category === "bottoms"
          ? selectedBottomItem || selectedTopItem
          : selectedTopItem || selectedBottomItem) || null,
    [category, selectedTopItem, selectedBottomItem],
  );

  const resolvedResultImageUrl = useMemo(() => {
    if (resultImageUrl) return resultImageUrl;
    if (resultFileName) return virtualTryOnService.getResultUrl(resultFileName);
    return "";
  }, [resultImageUrl, resultFileName]);

  const selectedItemImage = selectedItem ? selectedItem.imageUrl : "";

  const handlePersonFileChange = (file: File | null) => {
    if (personPreview) URL.revokeObjectURL(personPreview);
    setPersonFile(file);
    if (file) {
      setPersonPreview(URL.createObjectURL(file));
    } else {
      setPersonPreview("");
    }
  };

  const handleRun = async () => {
    if (!selectedItem) {
      toast.error("Vui lòng chọn một sản phẩm để thử đồ");
      return;
    }
    if (!personFile) {
      toast.error("Vui lòng chọn ảnh người trước khi thử đồ");
      return;
    }

    setLoading(true);
    setStatus("Đang kiểm tra ảnh người...");
    setProgress(0);
    setResultImageUrl("");
    setResultFileName("");

    try {
      // 1. Kiểm tra tính hợp lệ của ảnh người
      const check = await virtualTryOnService.checkPerson(personFile);
      if (!check?.data?.has_person) {
        throw new Error(
          "Ảnh không có người. Vui lòng chọn ảnh có người rõ ràng.",
        );
      }

      // 2. Khởi tạo một Request ID mới từ Server
      const request = await virtualTryOnService.createRequestId();
      const newRequestId = request.request_id as string;
      setRequestId(newRequestId);
      setStatus("Đang chuẩn bị dữ liệu sản phẩm...");

      // 3. Chuyển đổi URL ảnh sản phẩm thành đối tượng File
      const garmentFile = await urlToFile(
        selectedItemImage,
        `${selectedItem.tenSanPham}-${selectedItem.id}`,
      );
      // Giữ nguyên type ảnh sản phẩm (không ép sang JPG)
      // const garmentJpgFile = await convertImageToJpgFile(garmentFile);
      const garmentJpgFile = garmentFile;

      setStatus("Đang gửi yêu cầu thử đồ lên hệ thống AI...");

      // 4. Dùng setInterval thuần để lấy tiến độ cho tới khi hoàn thành
      const intervalId = window.setInterval(async () => {
        try {
          const progressData =
            await virtualTryOnService.getProgress(newRequestId);
          setProgress((prev) => Math.max(prev, progressData.progress ?? 0));
          setStatus(
            progressData.message || progressData.status || "Đang xử lý...",
          );

          if (
            progressData.status === "completed" ||
            progressData.status === "cancelled" ||
            progressData.status === "error"
          ) {
            window.clearInterval(intervalId);
            setProgressIntervalId(null);
          }
        } catch {
          // Bỏ qua lỗi ngắt quãng từ mạng/ngrok, interval sẽ tự poll lại.
        }
      }, 1000);

      setProgressIntervalId(intervalId);

      // 5. Đẩy yêu cầu xử lý AI chạy ngầm dưới dạng Background Promise
      virtualTryOnService
        .process({
          requestId: newRequestId,
          personFile,
          garmentFile: garmentJpgFile,
          category,
        })
        .then((result) => {
          const payload = result as TryOnProcessResponse;
          // Khi Server xử lý hoàn tất hoàn toàn tác vụ chính
          window.clearInterval(intervalId);
          setProgressIntervalId(null);
          setProgress(100);
          setStatus(payload.message || "Thử đồ ảo hoàn tất.");
          const imageUrl = payload.image_url || payload.result?.image_url;
          if (imageUrl) {
            setResultImageUrl(imageUrl);
          }
          if (payload.result?.file_name) {
            setResultFileName(payload.result.file_name);
          }
          toast.success("Thử đồ hoàn tất");
        })
        .catch((error) => {
          // Xử lý lỗi xảy ra từ API process
          window.clearInterval(intervalId);
          setProgressIntervalId(null);
          const message =
            error?.message ||
            error?.detail?.message ||
            error?.detail ||
            "Không thể chạy thử đồ ảo";
          setStatus(message);
          toast.error(message);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        detail?: { message?: string } | string;
      };
      const detailMessage =
        typeof err?.detail === "string" ? err.detail : err?.detail?.message;
      const message =
        err?.message ||
        detailMessage ||
        "Có lỗi xảy ra trong quá trình khởi tạo.";
      setStatus(message);
      toast.error(message);
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!requestId) return;
    try {
      if (progressIntervalId !== null) {
        window.clearInterval(progressIntervalId);
        setProgressIntervalId(null);
      }
      await virtualTryOnService.cancel(requestId);
      toast.success("Đã gửi yêu cầu hủy tiến trình");
      setStatus("Đã hủy tiến trình thử đồ.");
      setLoading(false);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || "Không hủy được tiến trình");
    }
  };

  const handleClearAll = () => {
    tryOnStorage.clear();
    setItems([]);
    setSelectedTopId(null);
    setSelectedBottomId(null);
    toast.success("Đã xóa danh sách chọn");
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-rose-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="flex items-center gap-3 text-sm text-muted mb-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 hover:text-accent transition"
          >
            <FiArrowLeft size={14} />
            Quay lại sản phẩm
          </Link>
        </div>

        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="rounded-3xl border border-white/60 bg-white/90 backdrop-blur shadow-xl shadow-rose-100/40 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-accent font-semibold">
                  Virtual Try-On
                </p>
                <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-foreground">
                  Trang thử đồ
                </h1>
                <p className="mt-3 text-sm text-muted max-w-2xl">
                  Chọn một sản phẩm đã lưu, tải ảnh người lên và hệ thống sẽ gọi
                  BE AI thử đồ ảo theo đúng luồng trong tài liệu API.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold">
                  Check person
                </div>
                <div className="px-4 py-2 rounded-full bg-sky-500/10 text-sky-700 text-xs font-semibold">
                  Request ID + Process
                </div>
                <div className="px-4 py-2 rounded-full bg-amber-500/10 text-amber-700 text-xs font-semibold">
                  Async Progress
                </div>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)] gap-6 lg:gap-8 items-start">
            <div className="rounded-3xl border border-subtle bg-card shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Sản phẩm đã chọn
                  </h2>
                  <p className="text-sm text-muted">
                    Chọn 1 sản phẩm để làm ảnh quần áo thử.
                  </p>
                </div>
                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700"
                >
                  <FiTrash2 size={14} />
                  Xóa danh sách
                </button>
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                    <FiUpload size={22} />
                  </div>
                  <p className="font-medium text-foreground">
                    Chưa có sản phẩm nào được thêm
                  </p>
                  <p className="mt-2 text-sm">
                    Vào trang chi tiết sản phẩm và bấm{" "}
                    <span className="font-semibold">Thêm và thử đồ</span>.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 lg:p-6">
                  {items.map((item) => {
                    const topActive = item.id === selectedTopId;
                    const bottomActive = item.id === selectedBottomId;
                    const active = topActive || bottomActive;
                    return (
                      <div
                        key={item.id}
                        className={`text-left rounded-2xl border p-4 transition-all duration-200 ${
                          active
                            ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                            : "border-subtle bg-background hover:border-muted"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-section border border-subtle">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.tenSanPham}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-foreground line-clamp-2">
                                  {item.tenSanPham}
                                </h3>
                                <p className="text-sm text-muted mt-1">
                                  {item.tenMauSac} • {item.tenKichThuoc}
                                </p>
                              </div>
                              {active && (
                                <FiCheckCircle
                                  className="text-accent shrink-0"
                                  size={18}
                                />
                              )}
                            </div>
                            <div className="mt-3 text-sm font-semibold text-accent">
                              {formatCurrency(item.price)}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedTopId(item.id)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                  topActive
                                    ? "bg-sky-500 text-white"
                                    : "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20"
                                }`}
                              >
                                Chọn áo
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedBottomId(item.id)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                  bottomActive
                                    ? "bg-emerald-500 text-white"
                                    : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                                }`}
                              >
                                Chọn quần
                              </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {topActive && (
                                <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                                  Đã chọn cho áo
                                </span>
                              )}
                              {bottomActive && (
                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                  Đã chọn cho quần
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="rounded-3xl border border-subtle bg-card shadow-lg p-6 lg:p-7 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Thiết lập thử đồ
                </h2>
                <p className="text-sm text-muted mt-1">
                  Chọn ảnh người, kiểu sản phẩm và chạy AI.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Ảnh người
                </label>
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-subtle bg-section/40 p-4 text-center hover:border-accent transition">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handlePersonFileChange(e.target.files?.[0] || null)
                    }
                  />
                  {personPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={personPreview}
                      alt="Ảnh người"
                      className="max-h-72 rounded-xl object-contain"
                    />
                  ) : (
                    <>
                      <FiUpload size={26} className="text-accent" />
                      <span className="mt-3 font-medium text-foreground">
                        Nhấn để chọn ảnh người
                      </span>
                      <span className="mt-1 text-xs text-muted">
                        JPG / PNG, nên chọn ảnh rõ dáng đứng
                      </span>
                    </>
                  )}
                </label>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Loại sản phẩm
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TryOnCategory)}
                  className="w-full rounded-2xl border border-subtle bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-subtle bg-section p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-muted font-semibold">
                    Bộ đã chọn
                  </p>
                  <p className="text-[11px] text-muted text-right">
                    Có thể chọn cùng lúc cả áo và quần
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-subtle bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                      Áo
                    </p>
                    {selectedTopItem ? (
                      <div className="mt-2 flex items-start gap-3">
                        <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-section border border-subtle">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedTopItem.imageUrl}
                            alt={selectedTopItem.tenSanPham}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground line-clamp-2">
                            {selectedTopItem.tenSanPham}
                          </h3>
                          <p className="mt-1 text-sm text-muted">
                            {selectedTopItem.tenMauSac} •{" "}
                            {selectedTopItem.tenKichThuoc}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted">Chưa chọn áo.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-subtle bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                      Quần
                    </p>
                    {selectedBottomItem ? (
                      <div className="mt-2 flex items-start gap-3">
                        <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-section border border-subtle">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedBottomItem.imageUrl}
                            alt={selectedBottomItem.tenSanPham}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground line-clamp-2">
                            {selectedBottomItem.tenSanPham}
                          </h3>
                          <p className="mt-1 text-sm text-muted">
                            {selectedBottomItem.tenMauSac} •{" "}
                            {selectedBottomItem.tenKichThuoc}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted">Chưa chọn quần.</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted">
                  Khi bấm chạy, hệ thống sẽ dùng ảnh theo loại đang chọn ở
                  dropdown.
                </p>
              </div>

              {selectedItem && (
                <div className="rounded-2xl border border-subtle bg-section p-4">
                  <p className="text-xs uppercase tracking-wider text-muted font-semibold">
                    Ảnh sẽ gửi lên để xử lý
                  </p>
                  <div className="mt-3 flex items-start gap-3">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-background border border-subtle">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedItem.imageUrl}
                        alt={selectedItem.tenSanPham}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {selectedItem.tenSanPham}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {selectedItem.tenMauSac} • {selectedItem.tenKichThuoc}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleRun}
                  disabled={loading || !selectedItem}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-pink-500 to-purple-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-pink-200/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPlay size={14} />
                  {loading ? "Đang xử lý..." : "Bắt đầu thử đồ"}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={!requestId || !loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-subtle bg-background px-4 py-3.5 text-sm font-semibold text-foreground hover:border-rose-300 hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiX size={14} />
                  Hủy tiến trình
                </button>
              </div>

              <div className="rounded-2xl bg-slate-950 text-white p-4">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Tiến độ</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-200">
                  {status || "Sẵn sàng chạy thử đồ."}
                </p>
                {requestId && (
                  <p className="mt-2 text-[11px] text-slate-400 break-all">
                    request_id: {requestId}
                  </p>
                )}
              </div>
            </aside>
          </section>

          <section className="rounded-3xl border border-subtle bg-card shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-subtle">
              <h2 className="text-lg font-semibold text-foreground">Kết quả</h2>
              <p className="text-sm text-muted">
                Ảnh trả về từ BE AI sẽ hiển thị ở đây.
              </p>
            </div>
            <div className="p-4 lg:p-6">
              {resolvedResultImageUrl ? (
                <div className="block overflow-hidden rounded-3xl border border-subtle bg-section/40">
                  <div className="flex min-h-64 items-center justify-center p-3 lg:p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolvedResultImageUrl}
                      alt="Kết quả thử đồ"
                      className="max-h-135 w-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-subtle bg-section/40 text-center text-muted">
                  <div>
                    <p className="font-medium text-foreground">
                      Chưa có kết quả
                    </p>
                    <p className="mt-2 text-sm">
                      Chọn ảnh và bấm{" "}
                      <span className="font-semibold">Bắt đầu thử đồ</span> để
                      chạy AI.
                    </p>
                  </div>
                </div>
              )}

              {resultFileName && (
                <p className="mt-4 text-xs text-muted break-all">
                  file: {resultFileName}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
