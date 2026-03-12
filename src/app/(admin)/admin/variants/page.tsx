"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ResChiTietSanPhamDTO,
  ResSanPhamDTO,
  MauSac,
  KichThuoc,
  CuaHang,
} from "@/types";
import {
  productService,
  productVariantService,
} from "@/services/product.service";
import {
  mauSacService,
  kichThuocService,
  cuaHangService,
} from "@/services/common.service";
import { getImageUrl } from "@/lib/utils";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiEye } from "react-icons/fi";

type VariantForm = {
  sanPhamId: number;
  mauSacId: number;
  kichThuocId: number;
  maCuaHang: number;
  soLuong: number;
  trangThai: number;
  moTa: string;
  ghiTru: string;
};

type StoreStockRow = {
  storeKey: string;
  storeName: string;
  quantity: number;
  visibleCount: number;
  hiddenCount: number;
};

export default function AdminVariantsPage() {
  const [variants, setVariants] = useState<ResChiTietSanPhamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ResSanPhamDTO[]>([]);
  const [colors, setColors] = useState<MauSac[]>([]);
  const [sizes, setSizes] = useState<KichThuoc[]>([]);
  const [stores, setStores] = useState<CuaHang[]>([]);
  const [filterProductId, setFilterProductId] = useState<number | "">("");
  const [filterColorId, setFilterColorId] = useState<number | "">("");
  const [filterSizeId, setFilterSizeId] = useState<number | "">("");
  const [filterStoreId, setFilterStoreId] = useState<number | "">("");
  const [filterTrangThai, setFilterTrangThai] = useState<number | "">("");
  const [search, setSearch] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ResChiTietSanPhamDTO | null>(null);
  const [form, setForm] = useState<VariantForm>({
    sanPhamId: 0,
    mauSacId: 0,
    kichThuocId: 0,
    maCuaHang: 0,
    soLuong: 0,
    trangThai: 1,
    moTa: "",
    ghiTru: "",
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockRows, setStockRows] = useState<StoreStockRow[]>([]);
  const [stockModalTitle, setStockModalTitle] = useState("");

  const toRecord = (value: unknown): Record<string, unknown> =>
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  const extractImageUrls = (variant: ResChiTietSanPhamDTO): string[] => {
    const raw = toRecord(variant as unknown);
    const direct = Array.isArray(raw.hinhAnhUrls)
      ? (raw.hinhAnhUrls as string[])
      : Array.isArray(variant.hinhAnhUrls)
        ? variant.hinhAnhUrls
        : [];
    if (direct.length > 0) return direct;

    if (Array.isArray(raw.hinhAnhs)) {
      return (raw.hinhAnhs as Array<Record<string, unknown>>)
        .map((img) => String(img.tenHinhAnh || ""))
        .filter(Boolean);
    }
    return [];
  };

  const getVariantProductName = (variant: ResChiTietSanPhamDTO): string => {
    const raw = toRecord(variant as unknown);
    return variant.tenSanPham || String(toRecord(raw.sanPham).tenSanPham || "");
  };

  const getVariantColorName = (variant: ResChiTietSanPhamDTO): string => {
    const raw = toRecord(variant as unknown);
    return variant.tenMauSac || String(toRecord(raw.mauSac).tenMauSac || "");
  };

  const getVariantSizeName = (variant: ResChiTietSanPhamDTO): string => {
    const raw = toRecord(variant as unknown);
    return (
      variant.tenKichThuoc || String(toRecord(raw.kichThuoc).tenKichThuoc || "")
    );
  };

  const getVariantStoreName = (variant: ResChiTietSanPhamDTO): string => {
    const raw = toRecord(variant as unknown);
    if (variant.tenCuaHang) return variant.tenCuaHang;
    const nested = String(toRecord(raw.cuaHang).tenCuaHang || "");
    if (nested) return nested;
    const storeId = Number(raw.maCuaHang ?? raw.cuaHangId ?? 0);
    return stores.find((s) => s.id === storeId)?.tenCuaHang || "";
  };

  const getVariantProductId = (variant: ResChiTietSanPhamDTO): number => {
    const raw = toRecord(variant as unknown);
    const id = Number(
      raw.sanPhamId ?? raw.maSanPham ?? toRecord(raw.sanPham).id,
    );
    if (id > 0) return id;
    return (
      products.find((p) => p.tenSanPham === getVariantProductName(variant))
        ?.id || 0
    );
  };

  const getVariantColorId = (variant: ResChiTietSanPhamDTO): number => {
    const raw = toRecord(variant as unknown);
    const id = Number(raw.mauSacId ?? raw.maMauSac ?? toRecord(raw.mauSac).id);
    if (id > 0) return id;
    return (
      colors.find((c) => c.tenMauSac === getVariantColorName(variant))?.id || 0
    );
  };

  const getVariantSizeId = (variant: ResChiTietSanPhamDTO): number => {
    const raw = toRecord(variant as unknown);
    const id = Number(
      raw.kichThuocId ?? raw.maKichThuoc ?? toRecord(raw.kichThuoc).id,
    );
    if (id > 0) return id;
    return (
      sizes.find((s) => s.tenKichThuoc === getVariantSizeName(variant))?.id || 0
    );
  };

  const getVariantStoreId = (variant: ResChiTietSanPhamDTO): number => {
    const raw = toRecord(variant as unknown);
    return Number(
      raw.maCuaHang ?? raw.cuaHangId ?? toRecord(raw.cuaHang).id ?? 0,
    );
  };

  const isSameVariantCore = (
    current: ResChiTietSanPhamDTO,
    target: ResChiTietSanPhamDTO,
  ): boolean => {
    const currentProductId = getVariantProductId(current);
    const targetProductId = getVariantProductId(target);
    const currentColorId = getVariantColorId(current);
    const targetColorId = getVariantColorId(target);
    const currentSizeId = getVariantSizeId(current);
    const targetSizeId = getVariantSizeId(target);

    const sameProduct =
      currentProductId > 0 && targetProductId > 0
        ? currentProductId === targetProductId
        : getVariantProductName(current) === getVariantProductName(target);
    const sameColor =
      currentColorId > 0 && targetColorId > 0
        ? currentColorId === targetColorId
        : getVariantColorName(current) === getVariantColorName(target);
    const sameSize =
      currentSizeId > 0 && targetSizeId > 0
        ? currentSizeId === targetSizeId
        : getVariantSizeName(current) === getVariantSizeName(target);

    return sameProduct && sameColor && sameSize;
  };

  const openStockDetailModal = (variant: ResChiTietSanPhamDTO) => {
    const related = variants.filter((v) => isSameVariantCore(v, variant));
    const source = related.length > 0 ? related : [variant];

    const grouped = source.reduce<Record<string, StoreStockRow>>(
      (acc, item) => {
        const storeName = getVariantStoreName(item) || "Chưa rõ cửa hàng";
        const storeId = getVariantStoreId(item);
        const storeKey = storeId > 0 ? String(storeId) : storeName;

        if (!acc[storeKey]) {
          acc[storeKey] = {
            storeKey,
            storeName,
            quantity: 0,
            visibleCount: 0,
            hiddenCount: 0,
          };
        }

        acc[storeKey].quantity += Number(item.soLuong || 0);
        if (item.trangThai === 1) {
          acc[storeKey].visibleCount += 1;
        } else {
          acc[storeKey].hiddenCount += 1;
        }

        return acc;
      },
      {},
    );

    const rows = Object.values(grouped).sort((a, b) =>
      a.storeName.localeCompare(b.storeName, "vi"),
    );

    setStockRows(rows);
    setStockModalTitle(
      `${getVariantProductName(variant) || "Sản phẩm"} • ${getVariantColorName(variant) || "-"} • ${getVariantSizeName(variant) || "-"}`,
    );
    setShowStockModal(true);
  };

  const buildBaseForm = (overrides?: Partial<VariantForm>): VariantForm => ({
    sanPhamId: 0,
    mauSacId: 0,
    kichThuocId: 0,
    maCuaHang: 0,
    soLuong: 0,
    trangThai: 1,
    moTa: "",
    ghiTru: "",
    ...overrides,
  });

  const cleanupPreviewState = () => {
    newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewImagePreviews([]);
    setExistingImages([]);
    setFiles(null);
  };

  const closeModal = () => {
    cleanupPreviewState();
    setShowModal(false);
  };

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);

  useEffect(() => {
    Promise.all([
      productService
        .getAll({ page: 1, size: 1000 })
        .catch(() => ({ result: [], meta: { pages: 0 } })),
      mauSacService.getAll().catch(() => []),
      kichThuocService.getAll().catch(() => []),
      cuaHangService.getAll().catch(() => []),
    ]).then(([prodData, cols, szs, sts]) => {
      setProducts(Array.isArray(prodData.result) ? prodData.result : []);
      setColors(Array.isArray(cols) ? cols : []);
      setSizes(Array.isArray(szs) ? szs : []);
      setStores(Array.isArray(sts) ? sts : []);
    });
  }, []);

  const fetchVariants = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterProductId) params.set("sanPhamId", String(filterProductId));
      if (filterColorId) params.set("mauSacId", String(filterColorId));
      if (filterSizeId) params.set("kichThuocId", String(filterSizeId));
      if (filterStoreId) params.set("maCuaHang", String(filterStoreId));
      if (filterTrangThai !== "")
        params.set("trangThai", String(filterTrangThai));

      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/chi-tiet-san-pham${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const json = await res.json();
      setVariants(Array.isArray(json.data) ? json.data : []);
    } catch {
      toast.error("Không thể tải biến thể");
    } finally {
      setLoading(false);
    }
  }, [
    filterProductId,
    filterColorId,
    filterSizeId,
    filterStoreId,
    filterTrangThai,
  ]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const openCreateModal = () => {
    setEditing(null);
    setForm(
      buildBaseForm({
        sanPhamId: products[0]?.id || 0,
        mauSacId: colors[0]?.id || 0,
        kichThuocId: sizes[0]?.id || 0,
        maCuaHang: stores[0]?.id || 0,
      }),
    );
    cleanupPreviewState();
    setShowModal(true);
  };

  const openEditModal = async (variant: ResChiTietSanPhamDTO) => {
    setEditing(variant);
    setExistingImages(extractImageUrls(variant).map((u) => getImageUrl(u)));
    setNewImagePreviews([]);

    const findProductId = () =>
      products.find((p) => p.tenSanPham === getVariantProductName(variant))
        ?.id || 0;
    const findColorId = () =>
      colors.find((c) => c.tenMauSac === getVariantColorName(variant))?.id || 0;
    const findSizeId = () =>
      sizes.find((s) => s.tenKichThuoc === getVariantSizeName(variant))?.id ||
      0;
    const findStoreId = () =>
      stores.find((s) => s.tenCuaHang === getVariantStoreName(variant))?.id ||
      0;

    const fallbackForm = buildBaseForm({
      sanPhamId: findProductId(),
      mauSacId: findColorId(),
      kichThuocId: findSizeId(),
      maCuaHang: findStoreId(),
      soLuong: variant.soLuong,
      trangThai: variant.trangThai,
      moTa: variant.moTa || "",
      ghiTru: variant.ghiTru || "",
    });
    setForm(fallbackForm);

    try {
      const detail = (await productVariantService.getById(
        variant.id,
      )) as unknown as Record<string, unknown>;

      const sanPhamId = Number(
        detail.sanPhamId ??
          detail.maSanPham ??
          (detail.sanPham as Record<string, unknown> | undefined)?.id ??
          findProductId(),
      );
      const mauSacId = Number(
        detail.mauSacId ??
          detail.maMauSac ??
          (detail.mauSac as Record<string, unknown> | undefined)?.id ??
          findColorId(),
      );
      const kichThuocId = Number(
        detail.kichThuocId ??
          detail.maKichThuoc ??
          (detail.kichThuoc as Record<string, unknown> | undefined)?.id ??
          findSizeId(),
      );
      const maCuaHang = Number(
        detail.maCuaHang ??
          detail.cuaHangId ??
          (detail.cuaHang as Record<string, unknown> | undefined)?.id ??
          findStoreId(),
      );

      const detailImages = (
        Array.isArray(detail.hinhAnhUrls)
          ? (detail.hinhAnhUrls as string[])
          : Array.isArray(detail.hinhAnhs)
            ? (detail.hinhAnhs as Array<Record<string, unknown>>)
                .map((img) => String(img.tenHinhAnh || ""))
                .filter(Boolean)
            : []
      ).map((u) => getImageUrl(u));

      if (detailImages.length > 0) {
        setExistingImages(detailImages);
      }

      setForm(
        buildBaseForm({
          sanPhamId,
          mauSacId,
          kichThuocId,
          maCuaHang,
          soLuong: Number(detail.soLuong ?? variant.soLuong ?? 0),
          trangThai: Number(detail.trangThai ?? variant.trangThai ?? 1),
          moTa: String(detail.moTa ?? variant.moTa ?? ""),
          ghiTru: String(detail.ghiTru ?? variant.ghiTru ?? ""),
        }),
      );
    } catch {
      setForm(fallbackForm);
      toast.error("Không tải đủ dữ liệu chi tiết, đã dùng dữ liệu hiện có");
    }

    setFiles(null);
    setShowModal(true);
  };

  const handleFilesChange = (nextFiles: FileList | null) => {
    newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setFiles(nextFiles);
    if (!nextFiles || nextFiles.length === 0) {
      setNewImagePreviews([]);
      return;
    }
    const urls = Array.from(nextFiles).map((f) => URL.createObjectURL(f));
    setNewImagePreviews(urls);
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      if (editing) {
        // Cập nhật: gửi đầy đủ thông tin theo từng cửa hàng
        formData.append("id", editing.id.toString());
        if (form.sanPhamId)
          formData.append("sanPhamId", form.sanPhamId.toString());
        if (form.mauSacId)
          formData.append("mauSacId", form.mauSacId.toString());
        if (form.kichThuocId)
          formData.append("kichThuocId", form.kichThuocId.toString());
        if (form.maCuaHang)
          formData.append("maCuaHang", form.maCuaHang.toString());
        formData.append("soLuong", form.soLuong.toString());
        formData.append("trangThai", form.trangThai.toString());
        if (form.moTa) formData.append("moTa", form.moTa);
        if (form.ghiTru) formData.append("ghiTru", form.ghiTru);
        if (files) {
          for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
          }
        }
        await productVariantService.update(formData);
        toast.success("Cập nhật biến thể thành công");
      } else {
        // Tạo mới: tự động tạo cho tất cả cửa hàng, soLuong = 0
        if (form.sanPhamId)
          formData.append("sanPhamId", form.sanPhamId.toString());
        if (form.mauSacId)
          formData.append("mauSacId", form.mauSacId.toString());
        if (form.kichThuocId)
          formData.append("kichThuocId", form.kichThuocId.toString());
        formData.append("trangThai", form.trangThai.toString());
        if (form.moTa) formData.append("moTa", form.moTa);
        if (form.ghiTru) formData.append("ghiTru", form.ghiTru);
        if (files) {
          for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
          }
        }
        await productVariantService.create(formData);
        toast.success("Tạo biến thể thành công cho tất cả cửa hàng");
      }
      closeModal();
      fetchVariants();
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa biến thể này?")) return;
    try {
      await productVariantService.delete(id);
      toast.success("Đã xóa biến thể");
      fetchVariants();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const keyword = search.trim().toLowerCase();
  const filteredVariants = keyword
    ? variants.filter((v) => {
        const productName = getVariantProductName(v).toLowerCase();
        const colorName = getVariantColorName(v).toLowerCase();
        const sizeName = getVariantSizeName(v).toLowerCase();
        return (
          productName.includes(keyword) ||
          colorName.includes(keyword) ||
          sizeName.includes(keyword)
        );
      })
    : variants;

  if (loading && variants.length === 0) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý biến thể sản phẩm
          </h1>
          <p className="text-sm text-muted mt-1">
            Chi tiết sản phẩm theo màu sắc, kích thước
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition shadow-sm text-sm font-medium"
        >
          <FiPlus size={16} /> Thêm biến thể
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-subtle p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-50">
            <FiSearch
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-subtle bg-background text-foreground rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
            />
          </div>
          <select
            value={filterProductId}
            onChange={(e) =>
              setFilterProductId(e.target.value ? Number(e.target.value) : "")
            }
            className="border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
          >
            <option value="">Tất cả sản phẩm</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.tenSanPham}
              </option>
            ))}
          </select>
          <select
            value={filterColorId}
            onChange={(e) =>
              setFilterColorId(e.target.value ? Number(e.target.value) : "")
            }
            className="border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
          >
            <option value="">Tất cả màu sắc</option>
            {colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tenMauSac}
              </option>
            ))}
          </select>
          <select
            value={filterSizeId}
            onChange={(e) =>
              setFilterSizeId(e.target.value ? Number(e.target.value) : "")
            }
            className="border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
          >
            <option value="">Tất cả kích thước</option>
            {sizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.tenKichThuoc}
              </option>
            ))}
          </select>
          <select
            value={filterStoreId}
            onChange={(e) =>
              setFilterStoreId(e.target.value ? Number(e.target.value) : "")
            }
            className="border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
          >
            <option value="">Tất cả cửa hàng</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.tenCuaHang}
              </option>
            ))}
          </select>
          <select
            value={filterTrangThai}
            onChange={(e) =>
              setFilterTrangThai(
                e.target.value !== "" ? Number(e.target.value) : "",
              )
            }
            className="border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
          >
            <option value="">Tất cả trạng thái</option>
            <option value={1}>Hiển thị</option>
            <option value={0}>Ẩn</option>
          </select>
          {(filterProductId !== "" ||
            filterColorId !== "" ||
            filterSizeId !== "" ||
            filterStoreId !== "" ||
            filterTrangThai !== "") && (
            <button
              onClick={() => {
                setFilterProductId("");
                setFilterColorId("");
                setFilterSizeId("");
                setFilterStoreId("");
                setFilterTrangThai("");
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 border border-subtle text-muted hover:text-foreground hover:bg-section rounded-xl text-sm transition"
            >
              <FiX size={14} /> Xóa filter
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-section border-b border-subtle">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  Ảnh
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  Màu sắc
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  Kích thước
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  Cửa hàng
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted">
                    Không có biến thể nào
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => {
                  const firstImage = extractImageUrls(v)[0];
                  return (
                    <tr key={v.id} className="hover:bg-section transition">
                      <td className="px-5 py-3.5 text-muted">#{v.id}</td>
                      <td className="px-5 py-3.5">
                        {firstImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(firstImage)}
                            alt={getVariantProductName(v) || "variant"}
                            width={40}
                            height={40}
                            loading="lazy"
                            className="rounded-lg object-cover border border-subtle"
                            style={{ width: 40, height: 40 }}
                            onError={(e) => {
                              e.currentTarget.src = "/images/placeholder.png";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-section rounded-lg flex items-center justify-center text-muted text-xs border border-subtle">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        {getVariantProductName(v) || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {getVariantColorName(v) || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {getVariantSizeName(v) || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {getVariantStoreName(v) || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="bg-section text-foreground px-2 py-0.5 rounded-md text-xs font-semibold border border-subtle">
                          {v.soLuong}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
                            v.trangThai === 1
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {v.trangThai === 1 ? "Hiển thị" : "Ẩn"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openStockDetailModal(v)}
                            className="p-2 rounded-lg text-sky-600 hover:bg-sky-500/10 transition"
                            title="Xem tồn kho theo cửa hàng"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-2 rounded-lg text-accent hover:bg-accent/10 transition"
                          >
                            <FiEdit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-subtle sticky top-0 bg-card/95 backdrop-blur rounded-t-2xl">
              <div>
                <h3 className="font-bold text-foreground">
                  {editing ? "Cập nhật biến thể" : "Tạo biến thể mới"}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {editing
                    ? "Cập nhật số lượng, trạng thái cho cửa hàng này."
                    : "Tự động tạo cho tất cả cửa hàng. Số lượng ban đầu = 0, cập nhật sau khi nhập hàng."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4 rounded-xl border border-subtle bg-section/45 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Thông tin biến thể
                  </p>
                  {/* Product */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Sản phẩm
                    </label>
                    <select
                      value={form.sanPhamId}
                      onChange={(e) =>
                        setForm({ ...form, sanPhamId: Number(e.target.value) })
                      }
                      className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                      disabled={!!editing}
                    >
                      <option value={0}>-- Chọn sản phẩm --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.tenSanPham}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Màu sắc
                    </label>
                    <select
                      value={form.mauSacId}
                      onChange={(e) =>
                        setForm({ ...form, mauSacId: Number(e.target.value) })
                      }
                      className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                    >
                      <option value={0}>-- Chọn màu --</option>
                      {colors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.tenMauSac}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Kích thước
                    </label>
                    <select
                      value={form.kichThuocId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          kichThuocId: Number(e.target.value),
                        })
                      }
                      className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                    >
                      <option value={0}>-- Chọn size --</option>
                      {sizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.tenKichThuoc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-subtle bg-section/45 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Trạng thái và media
                  </p>
                  {/* Store - chỉ hiển thị khi chỉnh sửa */}
                  {editing && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Cửa hàng
                      </label>
                      <select
                        value={form.maCuaHang}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            maCuaHang: Number(e.target.value),
                          })
                        }
                        className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                      >
                        <option value={0}>-- Chọn cửa hàng --</option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.tenCuaHang}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quantity - chỉ hiển thị khi chỉnh sửa */}
                  {editing && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.soLuong}
                        onChange={(e) =>
                          setForm({ ...form, soLuong: Number(e.target.value) })
                        }
                        className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                      />
                    </div>
                  )}

                  {/* Thông báo khi tạo mới */}
                  {!editing && (
                    <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-xs text-blue-600 dark:text-blue-400">
                      Biến thể sẽ được tạo tự động cho{" "}
                      <strong>tất cả cửa hàng</strong>. Số lượng ban đầu = 0,
                      cập nhật sau khi nhập hàng qua phiếu nhập.
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={form.trangThai}
                      onChange={(e) =>
                        setForm({ ...form, trangThai: Number(e.target.value) })
                      }
                      className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                    >
                      <option value={1}>Hiển thị</option>
                      <option value={0}>Ẩn</option>
                    </select>
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Hình ảnh
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFilesChange(e.target.files)}
                      className="w-full text-sm border border-subtle rounded-xl px-3 py-2 bg-background file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent/10 file:text-accent hover:file:bg-accent/20 transition"
                    />
                    <div className="mt-2 space-y-2">
                      {newImagePreviews.length > 0 ? (
                        <>
                          <p className="text-xs text-muted">
                            Ảnh mới (xem trước)
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {newImagePreviews.map((url, idx) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={`${url}-${idx}`}
                                src={url}
                                alt={`preview-${idx + 1}`}
                                className="w-full h-14 rounded-lg object-cover border border-subtle"
                              />
                            ))}
                          </div>
                        </>
                      ) : existingImages.length > 0 ? (
                        <>
                          <p className="text-xs text-muted">Ảnh hiện tại</p>
                          <div className="grid grid-cols-4 gap-2">
                            {existingImages.map((url, idx) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={`${url}-${idx}`}
                                src={url}
                                alt={`existing-${idx + 1}`}
                                className="w-full h-14 rounded-lg object-cover border border-subtle"
                              />
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-subtle bg-section/45 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Mô tả bổ sung
                </p>
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={form.moTa}
                    onChange={(e) => setForm({ ...form, moTa: e.target.value })}
                    rows={2}
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={form.ghiTru}
                    onChange={(e) =>
                      setForm({ ...form, ghiTru: e.target.value })
                    }
                    className="w-full border border-subtle bg-background text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-subtle flex justify-end gap-3 sticky bottom-0 bg-card/95 backdrop-blur">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 border border-subtle text-foreground rounded-xl hover:bg-section transition font-medium text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition shadow-sm font-medium text-sm"
              >
                {editing ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-subtle sticky top-0 bg-card/95 backdrop-blur rounded-t-2xl">
              <div>
                <h3 className="font-bold text-foreground">
                  Chi tiết tồn kho theo cửa hàng
                </h3>
                <p className="text-xs text-muted mt-0.5">{stockModalTitle}</p>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-xl border border-subtle overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-section border-b border-subtle">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                        Cửa hàng
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                        Tổng số lượng
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                        Trạng thái bản ghi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {stockRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-10 text-center text-muted"
                        >
                          Không có dữ liệu tồn kho theo cửa hàng
                        </td>
                      </tr>
                    ) : (
                      stockRows.map((row) => (
                        <tr
                          key={row.storeKey}
                          className="hover:bg-section transition"
                        >
                          <td className="px-4 py-3.5 text-foreground font-medium">
                            {row.storeName}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="bg-section text-foreground px-2 py-0.5 rounded-md text-xs font-semibold border border-subtle">
                              {row.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-muted">
                            {row.visibleCount > 0
                              ? `Hiển thị: ${row.visibleCount}`
                              : "Hiển thị: 0"}
                            {" • "}
                            {row.hiddenCount > 0
                              ? `Ẩn: ${row.hiddenCount}`
                              : "Ẩn: 0"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-subtle flex justify-end sticky bottom-0 bg-card/95 backdrop-blur">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-5 py-2.5 border border-subtle text-foreground rounded-xl hover:bg-section transition font-medium text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
