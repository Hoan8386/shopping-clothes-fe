"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiTrash2,
  FiUpload,
  FiPlay,
  FiX,
  FiDownload,
  FiSave,
  FiShoppingCart,
  FiClock,
  FiCamera,
  FiCalendar,
  FiPackage,
} from "react-icons/fi";
import { tryOnStorage, type TryOnSelectedProduct } from "@/lib/try-on";
import { virtualTryOnService } from "@/services/virtualTryOn.service";
import { cartService } from "@/services/cart.service";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import toast from "react-hot-toast";

// ─── Lịch sử thử đồ (lưu vào localStorage) ───────────────────────────────────
const TRY_ON_HISTORY_KEY = "try_on_history";

export type TryOnHistoryEntry = {
  id: string;
  savedAt: string;
  resultImageUrl: string;
  products: Array<{
    role: "top" | "bottom" | "single";
    id: number;
    sanPhamId: number;
    tenSanPham: string;
    tenMauSac: string;
    tenKichThuoc: string;
    imageUrl: string;
    price: number;
  }>;
};

const tryOnHistoryStorage = {
  getAll: (): TryOnHistoryEntry[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(TRY_ON_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as TryOnHistoryEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  addEntry: (entry: TryOnHistoryEntry) => {
    if (typeof window === "undefined") return;
    const current = tryOnHistoryStorage.getAll();
    const next = [entry, ...current].slice(0, 50);
    window.localStorage.setItem(TRY_ON_HISTORY_KEY, JSON.stringify(next));
  },
  removeEntry: (id: string) => {
    if (typeof window === "undefined") return;
    const next = tryOnHistoryStorage.getAll().filter((e) => e.id !== id);
    window.localStorage.setItem(TRY_ON_HISTORY_KEY, JSON.stringify(next));
  },
  clearAll: () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TRY_ON_HISTORY_KEY);
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const urlToFile = async (imageUrl: string, fileName: string) => {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Không tải được ảnh sản phẩm để thử đồ");
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
};

const convertToRelativeUrl = (absoluteUrl: string): string => {
  try {
    const urlObj = new URL(absoluteUrl);
    return urlObj.pathname;
  } catch {
    return absoluteUrl;
  }
};

const resultUrlToFile = async (url: string, fileName: string): Promise<File> => {
  const relativeUrl = convertToRelativeUrl(url);
  const response = await fetch(relativeUrl, {
    headers: { "ngrok-skip-browser-warning": "true" },
  });
  if (!response.ok) throw new Error("Không thể nạp ảnh kết quả bước 1 để xử lý bước 2");
  const blob = await response.blob();
  return new File([blob], fileName, { type: "image/jpeg" });
};

type TryOnProcessResponse = {
  status?: string;
  stage?: string;
  progress?: number;
  message?: string;
  image_url?: string;
  result?: { file_name?: string; image_url?: string; [key: string]: unknown };
  [key: string]: unknown;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TryOnPage() {
  const { isAuthenticated } = useAuthStore();
  const { setCartCount } = useCartStore();

  // ── Tab state
  const [activeTab, setActiveTab] = useState<"try-on" | "history">("try-on");
  const [history, setHistory] = useState<TryOnHistoryEntry[]>([]);

  // ── Try-on state
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
  const [progressIntervalId, setProgressIntervalId] = useState<number | null>(null);

  // ── Adding to cart states per product (keyed by product id)
  const [addingToCartIds, setAddingToCartIds] = useState<Set<number>>(new Set());

  const abortControllerRef = useRef(false);

  useEffect(() => {
    setItems(tryOnStorage.getAll());
    // Migration: lọc bỏ các entry cũ không có field products (trước khi tính năng này được thêm)
    const raw = tryOnHistoryStorage.getAll();
    const valid = raw.filter((e) => Array.isArray(e.products));
    if (valid.length !== raw.length) {
      window.localStorage.setItem(TRY_ON_HISTORY_KEY, JSON.stringify(valid));
    }
    setHistory(valid);
  }, []);

  useEffect(() => {
    return () => {
      if (personPreview) URL.revokeObjectURL(personPreview);
      if (progressIntervalId !== null) window.clearInterval(progressIntervalId);
    };
  }, [personPreview, progressIntervalId]);

  useEffect(() => {
    if (selectedTopId !== null && !items.some((item) => item.id === selectedTopId)) {
      setSelectedTopId(null);
    }
    if (selectedBottomId !== null && !items.some((item) => item.id === selectedBottomId)) {
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

  const resolvedResultImageUrl = useMemo(() => {
    if (resultImageUrl) return resultImageUrl;
    if (resultFileName) return virtualTryOnService.getResultUrl(resultFileName);
    return "";
  }, [resultImageUrl, resultFileName]);

  // ── Handlers
  const handlePersonFileChange = (file: File | null) => {
    if (personPreview) URL.revokeObjectURL(personPreview);
    setPersonFile(file);
    setPersonPreview(file ? URL.createObjectURL(file) : "");
  };

  const executeSingleTryOnStep = (
    currentPersonFile: File,
    targetItem: TryOnSelectedProduct,
    targetCategory: TryOnCategory,
    stepLabel: string,
  ): Promise<TryOnProcessResponse> => {
    return new Promise(async (resolve, reject) => {
      let intervalId: number | null = null;
      try {
        if (abortControllerRef.current) throw new Error("Tiến trình đã bị hủy kích hoạt.");

        setStatus(`[${stepLabel}] Đang khởi tạo phiên xử lý AI...`);
        const request = await virtualTryOnService.createRequestId();
        const newRequestId = request.request_id as string;
        setRequestId(newRequestId);

        if (abortControllerRef.current) {
          await virtualTryOnService.cancel(newRequestId).catch(() => {});
          throw new Error("Tiến trình đã bị hủy kích hoạt.");
        }

        setStatus(`[${stepLabel}] Đang chuẩn bị dữ liệu sản phẩm...`);
        const garmentFile = await urlToFile(targetItem.imageUrl, `${targetItem.tenSanPham}-${targetItem.id}`);

        setStatus(`[${stepLabel}] Hệ thống AI bắt đầu xử lý...`);

        intervalId = window.setInterval(async () => {
          try {
            const progressData = await virtualTryOnService.getProgress(newRequestId);
            setProgress(Math.max(0, progressData.progress ?? 0));
            setStatus(`[${stepLabel}] ${progressData.message || progressData.status || "Đang tính toán..."}`);
            if (
              progressData.status === "completed" ||
              progressData.status === "cancelled" ||
              progressData.status === "error"
            ) {
              if (intervalId !== null) { window.clearInterval(intervalId); intervalId = null; }
            }
          } catch { /* ignore */ }
        }, 1000);

        setProgressIntervalId(intervalId);

        const result = await virtualTryOnService.process({
          requestId: newRequestId,
          personFile: currentPersonFile,
          garmentFile,
          category: targetCategory,
        });

        if (intervalId !== null) { window.clearInterval(intervalId); intervalId = null; }
        resolve(result as TryOnProcessResponse);
      } catch (error) {
        if (intervalId !== null) window.clearInterval(intervalId);
        reject(error);
      }
    });
  };

  const handleRun = async () => {
    const hasTop = selectedTopItem !== null;
    const hasBottom = selectedBottomItem !== null;

    if (!hasTop && !hasBottom) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm (áo hoặc quần) để thử đồ");
      return;
    }
    if (!personFile) {
      toast.error("Vui lòng chọn ảnh người trước khi thử đồ");
      return;
    }

    setLoading(true);
    abortControllerRef.current = false;
    setProgress(0);
    setStatus("Đang kiểm tra tính hợp lệ của ảnh người...");
    setResultImageUrl("");
    setResultFileName("");

    try {
      const check = await virtualTryOnService.checkPerson(personFile);
      if (!check?.data?.has_person) {
        throw new Error("Ảnh không có người. Vui lòng chọn ảnh diện mạo rõ dáng đứng.");
      }

      let finalImageUrl = "";
      let finalFileName = "";

      if (hasTop && hasBottom) {
        const step1Result = await executeSingleTryOnStep(personFile, selectedTopItem!, "tops", "Bước 1/2: Thử Áo");
        const step1Url = step1Result.image_url || step1Result.result?.image_url;
        if (!step1Url) throw new Error("Không nhận được phản hồi ảnh từ Bước 1 (Thử Áo)");
        if (abortControllerRef.current) return;

        setStatus("Đang đồng bộ hóa dữ liệu chuyển tiếp sang bước 2...");
        const step2PersonFile = await resultUrlToFile(step1Url, "step1_output.jpg");

        const step2Result = await executeSingleTryOnStep(step2PersonFile, selectedBottomItem!, "bottoms", "Bước 2/2: Thử Quần");
        finalImageUrl = step2Result.image_url || step2Result.result?.image_url || "";
        finalFileName = step2Result.result?.file_name || "";
      } else {
        const targetItem = selectedTopItem || selectedBottomItem;
        const targetCategory = selectedTopItem ? "tops" : hasBottom ? "bottoms" : category;
        const singleResult = await executeSingleTryOnStep(personFile, targetItem!, targetCategory, "Đang xử lý thử đồ");
        finalImageUrl = singleResult.image_url || singleResult.result?.image_url || "";
        finalFileName = singleResult.result?.file_name || "";
      }

      if (progressIntervalId !== null) window.clearInterval(progressIntervalId);
      setProgressIntervalId(null);
      setProgress(100);
      setStatus("Thử trọn bộ trang phục hoàn tất!");
      if (finalImageUrl) setResultImageUrl(finalImageUrl);
      if (finalFileName) setResultFileName(finalFileName);
      toast.success("Thử đồ hoàn tất thành công!");
    } catch (error: unknown) {
      if (progressIntervalId !== null) window.clearInterval(progressIntervalId);
      setProgressIntervalId(null);
      const err = error as { message?: string; detail?: { message?: string } | string };
      const detailMessage = typeof err?.detail === "string" ? err.detail : err?.detail?.message;
      const message = err?.message || detailMessage || "Quá trình thực thi thử đồ gặp gián đoạn.";
      setStatus(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    abortControllerRef.current = true;
    if (progressIntervalId !== null) { window.clearInterval(progressIntervalId); setProgressIntervalId(null); }
    if (requestId) {
      try {
        await virtualTryOnService.cancel(requestId);
        toast.success("Đã gửi yêu cầu hủy tiến trình lên hệ thống");
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error(err?.message || "Không thể hủy tiến trình trên máy chủ");
      }
    }
    setStatus("Đã chủ động hủy tiến trình thử đồ.");
    setLoading(false);
  };

  const handleClearAll = () => {
    tryOnStorage.clear();
    setItems([]);
    setSelectedTopId(null);
    setSelectedBottomId(null);
    toast.success("Đã làm sạch danh sách chọn");
  };

  const handleDownloadImage = async () => {
    if (!resolvedResultImageUrl) { toast.error("Chưa có ảnh kết quả để tải về!"); return; }
    try {
      const relativeUrl = convertToRelativeUrl(resolvedResultImageUrl);
      const response = await fetch(relativeUrl, { headers: { "ngrok-skip-browser-warning": "true" } });
      if (!response.ok) throw new Error("Không thể tải ảnh");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resultFileName || `try-on-result-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Đã tải ảnh kết quả về máy!");
    } catch {
      toast.error("Tải ảnh thất bại, vui lòng thử lại!");
    }
  };

  const handleSaveSession = () => {
    if (!resolvedResultImageUrl) { toast.error("Chưa có ảnh kết quả để lưu phiên!"); return; }
    const products: TryOnHistoryEntry["products"] = [];
    if (selectedTopItem && selectedBottomItem) {
      products.push({ role: "top", id: selectedTopItem.id, sanPhamId: selectedTopItem.sanPhamId, tenSanPham: selectedTopItem.tenSanPham, tenMauSac: selectedTopItem.tenMauSac, tenKichThuoc: selectedTopItem.tenKichThuoc, imageUrl: selectedTopItem.imageUrl, price: selectedTopItem.price });
      products.push({ role: "bottom", id: selectedBottomItem.id, sanPhamId: selectedBottomItem.sanPhamId, tenSanPham: selectedBottomItem.tenSanPham, tenMauSac: selectedBottomItem.tenMauSac, tenKichThuoc: selectedBottomItem.tenKichThuoc, imageUrl: selectedBottomItem.imageUrl, price: selectedBottomItem.price });
    } else {
      const single = selectedTopItem || selectedBottomItem;
      if (single) {
        products.push({ role: "single", id: single.id, sanPhamId: single.sanPhamId, tenSanPham: single.tenSanPham, tenMauSac: single.tenMauSac, tenKichThuoc: single.tenKichThuoc, imageUrl: single.imageUrl, price: single.price });
      }
    }
    const entry: TryOnHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
      resultImageUrl: resolvedResultImageUrl,
      products,
    };
    tryOnHistoryStorage.addEntry(entry);
    setHistory(tryOnHistoryStorage.getAll());
    toast.success("Đã lưu phiên thử đồ vào lịch sử!");
  };

  const handleDeleteHistoryEntry = (id: string) => {
    tryOnHistoryStorage.removeEntry(id);
    setHistory(tryOnHistoryStorage.getAll());
    toast.success("Đã xóa phiên thử đồ khỏi lịch sử");
  };

  const handleClearHistory = () => {
    tryOnHistoryStorage.clearAll();
    setHistory([]);
    toast.success("Đã xóa toàn bộ lịch sử thử đồ");
  };

  const handleAddToCart = async (productId: number, productName: string) => {
    if (!isAuthenticated) { toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng"); return; }
    setAddingToCartIds((prev) => new Set(prev).add(productId));
    try {
      await cartService.addToCart({ maChiTietSanPham: productId, soLuong: 1 });
      const cart = await cartService.getMyCart();
      setCartCount(cart.tongSoLuong);
      toast.success(`Đã thêm "${productName}" vào giỏ hàng!`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Lỗi thêm giỏ hàng");
    } finally {
      setAddingToCartIds((prev) => { const s = new Set(prev); s.delete(productId); return s; });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-rose-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-3 text-sm text-muted mb-6">
          <Link href="/products" className="inline-flex items-center gap-2 hover:text-accent transition">
            <FiArrowLeft size={14} />
            Quay lại sản phẩm
          </Link>
        </div>

        {/* ── Hero header ── */}
        <div className="rounded-3xl border border-white/60 bg-white/90 backdrop-blur shadow-xl shadow-rose-100/40 p-6 lg:p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-accent font-semibold">
                Virtual Try-On • Multi-Garment Flow
              </p>
              <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-foreground">
                Thử đồ ảo thông minh
              </h1>
              <p className="mt-3 text-sm text-muted max-w-2xl">
                Thử trang phục ảo với AI, lưu kết quả và dễ dàng thêm sản phẩm yêu thích vào giỏ hàng.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold">Auto Sequence (2 Steps)</div>
              <div className="px-4 py-2 rounded-full bg-sky-500/10 text-sky-700 text-xs font-semibold">Check person</div>
            </div>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="flex border-b border-subtle mb-6 bg-white/60 dark:bg-slate-900/60 rounded-t-2xl overflow-hidden">
          <button
            onClick={() => setActiveTab("try-on")}
            className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === "try-on"
                ? "text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            <FiCamera size={15} />
            Thử đồ ảo
            {activeTab === "try-on" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setHistory(tryOnHistoryStorage.getAll());
            }}
            className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === "history"
                ? "text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            <FiClock size={15} />
            Kết quả thử đồ
            {history.length > 0 && (
              <span className="ml-1 rounded-full bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                {history.length}
              </span>
            )}
            {activeTab === "history" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 1 – Thử đồ ảo                                     */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === "try-on" && (
          <div className="flex flex-col gap-6 lg:gap-8">
            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)] gap-6 lg:gap-8 items-start">
              {/* Left: product list */}
              <div className="rounded-3xl border border-subtle bg-card shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Sản phẩm đã chọn</h2>
                    <p className="text-sm text-muted">Có thể bấm chọn cả 1 Áo và 1 Quần cùng lúc để thử trọn bộ.</p>
                  </div>
                  <button onClick={handleClearAll} className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700">
                    <FiTrash2 size={14} />
                    Xóa danh sách
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="p-8 text-center text-muted">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                      <FiUpload size={22} />
                    </div>
                    <p className="font-medium text-foreground">Chưa có sản phẩm nào được thêm</p>
                    <p className="mt-2 text-sm">Vào trang chi tiết sản phẩm và bấm <span className="font-semibold">Thêm và thử đồ</span>.</p>
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
                            active ? "border-accent bg-accent/5 shadow-md shadow-accent/10" : "border-subtle bg-background hover:border-muted"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-section border border-subtle">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.imageUrl} alt={item.tenSanPham} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-foreground line-clamp-2">{item.tenSanPham}</h3>
                                  <p className="text-sm text-muted mt-1">{item.tenMauSac} • {item.tenKichThuoc}</p>
                                </div>
                                {active && <FiCheckCircle className="text-accent shrink-0" size={18} />}
                              </div>
                              <div className="mt-3 text-sm font-semibold text-accent">{formatCurrency(item.price)}</div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTopId(item.id === selectedTopId ? null : item.id)}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${topActive ? "bg-sky-500 text-white" : "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20"}`}
                                >
                                  {topActive ? "Hủy chọn áo" : "Chọn áo"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedBottomId(item.id === selectedBottomId ? null : item.id)}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${bottomActive ? "bg-emerald-500 text-white" : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"}`}
                                >
                                  {bottomActive ? "Hủy chọn quần" : "Chọn quần"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: controls */}
              <aside className="rounded-3xl border border-subtle bg-card shadow-lg p-6 lg:p-7 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Thiết lập thử đồ</h2>
                  <p className="text-sm text-muted mt-1">Chọn ảnh người, kiểm tra các sản phẩm được kích hoạt và bấm nút chạy.</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-foreground">Ảnh người mẫu đầu vào</label>
                  <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-subtle bg-section/40 p-4 text-center hover:border-accent transition">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePersonFileChange(e.target.files?.[0] || null)} />
                    {personPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={personPreview} alt="Ảnh người" className="max-h-72 rounded-xl object-contain" />
                    ) : (
                      <>
                        <FiUpload size={26} className="text-accent" />
                        <span className="mt-3 font-medium text-foreground">Nhấn để chọn ảnh người</span>
                        <span className="mt-1 text-xs text-muted">JPG / PNG, nên chọn ảnh rõ dáng đứng</span>
                      </>
                    )}
                  </label>
                </div>

                {(!selectedTopItem || !selectedBottomItem) && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-foreground">Loại sản phẩm đơn lẻ (Chỉ dùng khi thử một món)</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TryOnCategory)}
                      className="w-full rounded-2xl border border-subtle bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="rounded-2xl border border-subtle bg-section p-4 space-y-4">
                  <p className="text-xs uppercase tracking-wider text-muted font-semibold">Set đồ phối hợp hiện tại</p>
                  <div className="space-y-3">
                    <div className={`rounded-xl border p-3 ${selectedTopItem ? "border-sky-300 bg-sky-500/5" : "border-subtle bg-background"}`}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Áo (Sẽ thử ở Bước 1)</p>
                      {selectedTopItem ? (
                        <div className="mt-2 flex items-start gap-3">
                          <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-background border border-subtle">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={selectedTopItem.imageUrl} alt={selectedTopItem.tenSanPham} className="h-full w-full object-cover" />
                          </div>
                          <h3 className="font-semibold text-foreground line-clamp-2 text-sm">{selectedTopItem.tenSanPham}</h3>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted">Chưa chọn áo.</p>
                      )}
                    </div>
                    <div className={`rounded-xl border p-3 ${selectedBottomItem ? "border-emerald-300 bg-emerald-500/5" : "border-subtle bg-background"}`}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Quần (Sẽ thử ở Bước 2)</p>
                      {selectedBottomItem ? (
                        <div className="mt-2 flex items-start gap-3">
                          <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-background border border-subtle">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={selectedBottomItem.imageUrl} alt={selectedBottomItem.tenSanPham} className="h-full w-full object-cover" />
                          </div>
                          <h3 className="font-semibold text-foreground line-clamp-2 text-sm">{selectedBottomItem.tenSanPham}</h3>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted">Chưa chọn quần.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleRun}
                    disabled={loading || (!selectedTopItem && !selectedBottomItem)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-pink-500 to-purple-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-pink-200/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiPlay size={14} />
                    {loading ? "Đang xử lý tổ hợp..." : "Bắt đầu thử đồ"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={!loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-subtle bg-background px-4 py-3.5 text-sm font-semibold text-foreground hover:border-rose-300 hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiX size={14} />
                    Hủy tiến trình
                  </button>
                </div>

                <div className="rounded-2xl bg-slate-950 text-white p-4">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Tiến độ bước hiện tại</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-200 font-medium">{status || "Sẵn sàng chạy thử phối đồ."}</p>
                  {requestId && <p className="mt-2 text-[11px] text-slate-400 break-all">current_request_id: {requestId}</p>}
                </div>
              </aside>
            </section>

            {/* Result section */}
            <section className="rounded-3xl border border-subtle bg-card shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-subtle flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Kết quả phối đồ hoàn thiện</h2>
                  <p className="text-sm text-muted">Ảnh hiển thị cuối cùng sau khi kết hợp toàn bộ trang phục đã chọn.</p>
                </div>
                {resolvedResultImageUrl && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveSession}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-500/20 transition"
                    >
                      <FiSave size={14} />
                      Lưu phiên thử
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-500/20 transition"
                    >
                      <FiDownload size={14} />
                      Tải ảnh về
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 lg:p-6">
                {resolvedResultImageUrl ? (
                  <div className="overflow-hidden rounded-3xl border border-subtle bg-section/40">
                    <div className="flex min-h-64 items-center justify-center p-3 lg:p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={resolvedResultImageUrl} alt="Kết quả thử đồ phối hợp" className="max-h-135 w-full object-contain" />
                    </div>
                    {(selectedTopItem || selectedBottomItem) && (
                      <div className="border-t border-subtle px-4 py-4 bg-background/60">
                        <p className="text-xs uppercase tracking-wider font-semibold text-muted mb-3">Sản phẩm đã thử trong phiên này</p>
                        <div className="flex flex-wrap gap-3">
                          {selectedTopItem && (
                            <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-500/5 px-3 py-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={selectedTopItem.imageUrl} alt={selectedTopItem.tenSanPham} className="h-10 w-8 rounded-lg object-cover border border-subtle" />
                              <div>
                                <p className="text-xs font-semibold text-foreground line-clamp-1">{selectedTopItem.tenSanPham}</p>
                                <p className="text-[11px] text-muted">{selectedTopItem.tenMauSac} • {selectedTopItem.tenKichThuoc}</p>
                                <p className="text-[11px] font-semibold text-sky-600">{formatCurrency(selectedTopItem.price)}</p>
                              </div>
                              <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 uppercase">Áo</span>
                            </div>
                          )}
                          {selectedBottomItem && (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-500/5 px-3 py-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={selectedBottomItem.imageUrl} alt={selectedBottomItem.tenSanPham} className="h-10 w-8 rounded-lg object-cover border border-subtle" />
                              <div>
                                <p className="text-xs font-semibold text-foreground line-clamp-1">{selectedBottomItem.tenSanPham}</p>
                                <p className="text-[11px] text-muted">{selectedBottomItem.tenMauSac} • {selectedBottomItem.tenKichThuoc}</p>
                                <p className="text-[11px] font-semibold text-emerald-600">{formatCurrency(selectedBottomItem.price)}</p>
                              </div>
                              <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">Quần</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-subtle bg-section/40 text-center text-muted">
                    <div>
                      <p className="font-medium text-foreground">Chưa có kết quả phối đồ</p>
                      <p className="mt-2 text-sm">Chọn đủ set Áo + Quần rồi bấm <span className="font-semibold">Bắt đầu thử đồ</span> để chạy luồng thông minh.</p>
                    </div>
                  </div>
                )}
                {resultFileName && <p className="mt-4 text-xs text-muted break-all">file_output: {resultFileName}</p>}
              </div>
            </section>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 2 – Kết quả thử đồ (lịch sử)                     */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">Kết quả đã lưu</h2>
                <p className="text-sm text-muted mt-1">
                  {history.length > 0
                    ? `${history.length} phiên thử đồ đã lưu — Nhấn "Thêm vào giỏ" để mua ngay sản phẩm đã thử.`
                    : "Chưa có phiên thử đồ nào được lưu."}
                </p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-400 rounded-xl px-4 py-2 transition"
                >
                  <FiTrash2 size={14} />
                  Xóa tất cả
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-subtle bg-section/40 py-20 text-center text-muted">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                  <FiClock size={28} />
                </div>
                <p className="font-semibold text-foreground text-lg">Chưa có lịch sử thử đồ</p>
                <p className="mt-2 text-sm max-w-sm">
                  Hãy thử đồ ảo ở tab{" "}
                  <button onClick={() => setActiveTab("try-on")} className="font-semibold text-accent hover:underline">
                    Thử đồ ảo
                  </button>{" "}
                  và nhấn <span className="font-semibold">Lưu phiên thử</span> để xem kết quả ở đây.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((entry) => (
                  <div key={entry.id} className="rounded-3xl border border-subtle bg-card shadow-lg overflow-hidden">
                    {/* Entry header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle bg-section/40">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <FiCalendar size={13} />
                        <span className="font-medium text-foreground">{formatDate(entry.savedAt)}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteHistoryEntry(entry.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 transition"
                      >
                        <FiTrash2 size={12} />
                        Xóa
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-0 lg:divide-x divide-subtle">
                      {/* Left: result image */}
                      <div className="flex items-center justify-center bg-section/30 p-4 min-h-64">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.resultImageUrl}
                          alt="Kết quả thử đồ"
                          className="max-h-96 w-full object-contain rounded-2xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>

                      {/* Right: products */}
                      <div className="p-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <FiPackage size={15} className="text-accent" />
                          <p className="text-sm font-semibold text-foreground">
                            Sản phẩm đã thử ({(entry.products ?? []).length} món)
                          </p>
                        </div>

                        <div className="space-y-3">
                          {(entry.products ?? []).length === 0 ? (
                            <p className="text-sm text-muted italic">Không có thông tin sản phẩm trong phiên này.</p>
                          ) : (
                            (entry.products ?? []).map((product) => {
                              const isAdding = addingToCartIds.has(product.id);
                              const roleBadge =
                                product.role === "top"
                                  ? { label: "Áo", cls: "bg-sky-100 text-sky-700" }
                                  : product.role === "bottom"
                                    ? { label: "Quần", cls: "bg-emerald-100 text-emerald-700" }
                                    : { label: "Đơn lẻ", cls: "bg-purple-100 text-purple-700" };

                              return (
                                <div
                                  key={`${entry.id}-${product.id}`}
                                  className="flex items-center gap-3 rounded-2xl border border-subtle bg-background p-3 hover:border-accent/40 transition"
                                >
                                  {/* Thumbnail */}
                                  <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-subtle bg-section">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={product.imageUrl} alt={product.tenSanPham} className="h-full w-full object-cover" />
                                  </div>

                                  {/* Info */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${roleBadge.cls}`}>
                                        {roleBadge.label}
                                      </span>
                                    </div>
                                    <Link
                                      href={`/products/${product.sanPhamId}`}
                                      className="text-sm font-semibold text-foreground hover:text-accent transition line-clamp-1"
                                    >
                                      {product.tenSanPham}
                                    </Link>
                                    <p className="text-xs text-muted mt-0.5">
                                      {product.tenMauSac} • {product.tenKichThuoc}
                                    </p>
                                    <p className="text-sm font-bold text-accent mt-1">{formatCurrency(product.price)}</p>
                                  </div>

                                  {/* Add to cart button */}
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(product.id, product.tenSanPham)}
                                    disabled={isAdding}
                                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition"
                                  >
                                    <FiShoppingCart size={13} />
                                    {isAdding ? "Đang thêm..." : "Thêm vào giỏ"}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-subtle">
                          <a
                            href={entry.resultImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-semibold text-muted hover:text-foreground hover:border-muted transition"
                          >
                            <FiDownload size={12} />
                            Xem / Tải ảnh
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
