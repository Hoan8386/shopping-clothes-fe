"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ResSanPhamDTO,
  KieuSanPham,
  BoSuuTap,
  ThuongHieu,
  ResChiTietSanPhamDTO,
} from "@/types";
import {
  productService,
  productVariantService,
  ProductSearchParams,
} from "@/services/product.service";
import {
  kieuSanPhamService,
  boSuuTapService,
  thuongHieuService,
} from "@/services/common.service";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import Loading from "@/components/ui/Loading";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiBox,
  FiX,
  FiImage,
  FiEye,
} from "react-icons/fi";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ResSanPhamDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<KieuSanPham[]>([]);
  const [collections, setCollections] = useState<BoSuuTap[]>([]);
  const [brands, setBrands] = useState<ThuongHieu[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editing, setEditing] = useState<ResSanPhamDTO | null>(null);
  const [form, setForm] = useState({
    tenSanPham: "",
    giaVon: 0,
    giaBan: 0,
    giaGiam: 0,
    moTa: "",
    trangThai: 1,
    kieuSanPhamId: 0,
    boSuuTapId: 0,
    thuongHieuId: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // View detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ResSanPhamDTO | null>(
    null,
  );
  const [detailVariants, setDetailVariants] = useState<ResChiTietSanPhamDTO[]>(
    [],
  );
  const [detailVariantLoading, setDetailVariantLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailForm, setDetailForm] = useState<typeof form | null>(null);

  const openDetailModal = async (product: ResSanPhamDTO) => {
    setDetailProduct(product);
    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailVariantLoading(true);
    setDetailVariants([]);
    setDetailForm(null);

    const fallbackCategoryId = findCategoryId(product.tenKieuSanPham);
    const fallbackCollectionId = findCollectionId(product.tenBoSuuTap);
    const fallbackBrandId = findBrandId(product.tenThuongHieu);

    try {
      const [detailResult, variantResult] = await Promise.allSettled([
        productService.getById(product.id),
        productVariantService.getByProduct(product.id),
      ]);

      if (variantResult.status === "fulfilled") {
        setDetailVariants(
          Array.isArray(variantResult.value) ? variantResult.value : [],
        );
      }

      if (detailResult.status === "fulfilled") {
        const detail = detailResult.value as unknown as Record<string, unknown>;
        const detailCategoryId = Number(
          detail.kieuSanPhamId ??
            detail.maKieuSanPham ??
            (detail.kieuSanPham as Record<string, unknown> | undefined)?.id ??
            0,
        );
        const detailCollectionId = Number(
          detail.boSuuTapId ??
            detail.maBoSuuTap ??
            (detail.boSuuTap as Record<string, unknown> | undefined)?.id ??
            0,
        );
        const detailBrandId = Number(
          detail.thuongHieuId ??
            detail.maThuongHieu ??
            (detail.thuongHieu as Record<string, unknown> | undefined)?.id ??
            0,
        );
        setDetailForm({
          tenSanPham: String(detail.tenSanPham ?? product.tenSanPham ?? ""),
          giaVon: Number(detail.giaVon ?? product.giaVon ?? 0),
          giaBan: Number(detail.giaBan ?? product.giaBan ?? 0),
          giaGiam: Number(detail.giaGiam ?? product.giaGiam ?? 0),
          moTa: String(detail.moTa ?? product.moTa ?? ""),
          trangThai: Number(detail.trangThai ?? product.trangThai ?? 1),
          kieuSanPhamId:
            detailCategoryId > 0 ? detailCategoryId : fallbackCategoryId,
          boSuuTapId:
            detailCollectionId > 0 ? detailCollectionId : fallbackCollectionId,
          thuongHieuId: detailBrandId > 0 ? detailBrandId : fallbackBrandId,
        });
      } else {
        setDetailForm({
          tenSanPham: product.tenSanPham,
          giaVon: product.giaVon,
          giaBan: product.giaBan,
          giaGiam: product.giaGiam,
          moTa: product.moTa,
          trangThai: product.trangThai,
          kieuSanPhamId: fallbackCategoryId,
          boSuuTapId: fallbackCollectionId,
          thuongHieuId: fallbackBrandId,
        });
      }
    } finally {
      setDetailLoading(false);
      setDetailVariantLoading(false);
    }
  };

  const resetModalState = () => {
    setShowModal(false);
    setFile(null);
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    if (nextFile) {
      setImagePreview(URL.createObjectURL(nextFile));
      return;
    }

    if (editing?.hinhAnhChinh) {
      setImagePreview(getImageUrl(editing.hinhAnhChinh));
      return;
    }

    setImagePreview(null);
  };

  const clearSelectedFile = () => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setFile(null);
    if (editing?.hinhAnhChinh) {
      setImagePreview(getImageUrl(editing.hinhAnhChinh));
      return;
    }
    setImagePreview(null);
  };

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const findCategoryId = (name?: string) =>
    categories.find((c) => c.tenKieuSanPham === name)?.id || 0;
  const findCollectionId = (name?: string) =>
    collections.find((c) => c.tenSuuTap === name)?.id || 0;
  const findBrandId = (name?: string) =>
    brands.find((b) => b.tenThuongHieu === name)?.id || 0;

  useEffect(() => {
    Promise.all([
      kieuSanPhamService.getAll().catch(() => []),
      boSuuTapService.getAll().catch(() => []),
      thuongHieuService.getAll().catch(() => []),
    ]).then(([cats, cols, brs]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setCollections(Array.isArray(cols) ? cols : []);
      setBrands(Array.isArray(brs) ? brs : []);
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: ProductSearchParams = {
        page,
        size: 10,
      };
      if (search) params.tenSanPham = search;
      const data = await productService.getAll(params);
      setProducts(data.result);
      setTotalPages(data.meta.pages);
    } catch {
      toast.error("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({
      tenSanPham: "",
      giaVon: 0,
      giaBan: 0,
      giaGiam: 0,
      moTa: "",
      trangThai: 1,
      kieuSanPhamId: categories[0]?.id || 0,
      boSuuTapId: collections[0]?.id || 0,
      thuongHieuId: brands[0]?.id || 0,
    });
    setFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = async (product: ResSanPhamDTO) => {
    setEditing(product);
    setShowModal(true);
    setModalLoading(true);
    setFile(null);
    setImagePreview(
      product.hinhAnhChinh ? getImageUrl(product.hinhAnhChinh) : null,
    );

    const fallbackCategoryId = findCategoryId(product.tenKieuSanPham);
    const fallbackCollectionId = findCollectionId(product.tenBoSuuTap);
    const fallbackBrandId = findBrandId(product.tenThuongHieu);

    try {
      const [detailResult] = await Promise.allSettled([
        productService.getById(product.id),
      ]);

      if (detailResult.status !== "fulfilled") {
        throw new Error("load-detail-failed");
      }

      const detail = detailResult.value as unknown as Record<string, unknown>;

      const detailCategoryId = Number(
        detail.kieuSanPhamId ??
          detail.maKieuSanPham ??
          (detail.kieuSanPham as Record<string, unknown> | undefined)?.id ??
          0,
      );
      const detailCollectionId = Number(
        detail.boSuuTapId ??
          detail.maBoSuuTap ??
          (detail.boSuuTap as Record<string, unknown> | undefined)?.id ??
          0,
      );
      const detailBrandId = Number(
        detail.thuongHieuId ??
          detail.maThuongHieu ??
          (detail.thuongHieu as Record<string, unknown> | undefined)?.id ??
          0,
      );

      setForm({
        tenSanPham: String(detail.tenSanPham ?? product.tenSanPham ?? ""),
        giaVon: Number(detail.giaVon ?? product.giaVon ?? 0),
        giaBan: Number(detail.giaBan ?? product.giaBan ?? 0),
        giaGiam: Number(detail.giaGiam ?? product.giaGiam ?? 0),
        moTa: String(detail.moTa ?? product.moTa ?? ""),
        trangThai: Number(detail.trangThai ?? product.trangThai ?? 1),
        kieuSanPhamId:
          detailCategoryId > 0 ? detailCategoryId : fallbackCategoryId,
        boSuuTapId:
          detailCollectionId > 0 ? detailCollectionId : fallbackCollectionId,
        thuongHieuId: detailBrandId > 0 ? detailBrandId : fallbackBrandId,
      });
    } catch {
      setForm({
        tenSanPham: product.tenSanPham,
        giaVon: product.giaVon,
        giaBan: product.giaBan,
        giaGiam: product.giaGiam,
        moTa: product.moTa,
        trangThai: product.trangThai,
        kieuSanPhamId: fallbackCategoryId,
        boSuuTapId: fallbackCollectionId,
        thuongHieuId: fallbackBrandId,
      });
      toast.error("Không tải đủ dữ liệu chi tiết, đã dùng dữ liệu hiện có");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      form.kieuSanPhamId <= 0 ||
      form.boSuuTapId <= 0 ||
      form.thuongHieuId <= 0
    ) {
      toast.error("Vui lòng chọn đầy đủ kiểu, bộ sưu tập và thương hiệu");
      return;
    }

    const fd = new FormData();
    if (editing) fd.append("id", String(editing.id));
    fd.append("tenSanPham", form.tenSanPham);
    fd.append("giaVon", String(form.giaVon));
    fd.append("giaBan", String(form.giaBan));
    fd.append("giaGiam", String(form.giaGiam));
    fd.append("moTa", form.moTa);
    fd.append("trangThai", String(form.trangThai));
    fd.append("kieuSanPhamId", String(form.kieuSanPhamId));
    fd.append("boSuuTapId", String(form.boSuuTapId));
    fd.append("thuongHieuId", String(form.thuongHieuId));
    if (file) fd.append("file", file);

    try {
      if (editing) {
        await productService.update(fd);
        toast.success("Cập nhật thành công");
      } else {
        await productService.create(fd);
        toast.success("Thêm sản phẩm thành công");
      }
      setFile(null);
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
      setShowModal(false);
      fetchProducts();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (
              err as {
                response?: { data?: { message?: string } };
              }
            ).response?.data?.message
          : undefined;
      toast.error(msg || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    try {
      await productService.delete(id);
      toast.success("Đã xóa");
      fetchProducts();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý sản phẩm
          </h1>
          <p className="text-sm text-muted mt-1">
            Quản lý danh sách sản phẩm của cửa hàng
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl hover:bg-accent-hover transition shadow-sm font-medium text-sm"
        >
          <FiPlus size={16} /> Thêm mới
        </button>
      </div>

      {/* Search */}
      <div className="bg-card rounded-2xl border border-subtle p-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full border border-subtle bg-background text-foreground rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition"
          />
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            size={16}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : (
        <div className="bg-card rounded-2xl border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-section border-b border-subtle">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Hình
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Tên sản phẩm
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Kiểu
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Thương hiệu
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-section transition">
                    <td className="px-5 py-3.5 text-muted">#{p.id}</td>
                    <td className="px-5 py-3.5">
                      {p.hinhAnhChinh ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getImageUrl(p.hinhAnhChinh)}
                          alt={p.tenSanPham}
                          width={48}
                          height={48}
                          loading="lazy"
                          className="rounded-lg object-cover ring-1 ring-gray-100"
                          style={{ width: 48, height: 48 }}
                          onError={(e) => {
                            e.currentTarget.src = "/images/placeholder.png";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-section border border-subtle" />
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground max-w-50 truncate">
                      {p.tenSanPham}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-accent">
                      {formatCurrency(p.giaBan)}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {p.tenKieuSanPham}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {p.tenThuongHieu}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetailModal(p)}
                          className="p-2 rounded-lg text-muted hover:bg-section hover:text-foreground transition"
                          title="Xem chi tiết"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 rounded-lg text-accent hover:bg-accent/10 transition"
                          title="Sửa"
                        >
                          <FiEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                          title="Xóa"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted">
                      <FiBox className="mx-auto mb-2" size={24} />
                      Không có sản phẩm nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* View Detail Modal */}
      {showDetailModal && detailProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-subtle rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-subtle px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Chi tiết sản phẩm
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {detailProduct.tenSanPham}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <div className="py-8">
                  <Loading />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* Left: info */}
                  <div className="lg:col-span-3 rounded-xl border border-subtle bg-section/45 p-4 space-y-4">
                    <div className="pb-2 border-b border-subtle">
                      <p className="text-sm font-semibold text-foreground">
                        Thông tin cơ bản
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-0.5">Tên sản phẩm</p>
                      <p className="text-sm font-medium text-foreground">
                        {detailForm?.tenSanPham || detailProduct.tenSanPham}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-muted mb-0.5">Giá vốn</p>
                        <p className="text-sm text-foreground">
                          {formatCurrency(
                            detailForm?.giaVon ?? detailProduct.giaVon,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-0.5">Giá bán</p>
                        <p className="text-sm font-semibold text-accent">
                          {formatCurrency(
                            detailForm?.giaBan ?? detailProduct.giaBan,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-0.5">
                          Giảm giá (%)
                        </p>
                        <p className="text-sm text-foreground">
                          {detailForm?.giaGiam ?? detailProduct.giaGiam}%
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-0.5">Mô tả</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {detailForm?.moTa || detailProduct.moTa || "—"}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-muted mb-0.5">
                          Kiểu sản phẩm
                        </p>
                        <p className="text-sm text-foreground">
                          {categories.find(
                            (c) => c.id === detailForm?.kieuSanPhamId,
                          )?.tenKieuSanPham ||
                            detailProduct.tenKieuSanPham ||
                            "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-0.5">Bộ sưu tập</p>
                        <p className="text-sm text-foreground">
                          {collections.find(
                            (c) => c.id === detailForm?.boSuuTapId,
                          )?.tenSuuTap ||
                            detailProduct.tenBoSuuTap ||
                            "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-0.5">Thương hiệu</p>
                        <p className="text-sm text-foreground">
                          {brands.find((b) => b.id === detailForm?.thuongHieuId)
                            ?.tenThuongHieu ||
                            detailProduct.tenThuongHieu ||
                            "—"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-0.5">Trạng thái</p>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                          (detailForm?.trangThai ?? detailProduct.trangThai) ===
                          1
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {(detailForm?.trangThai ?? detailProduct.trangThai) ===
                        1
                          ? "Đang bán"
                          : "Ngừng bán"}
                      </span>
                    </div>
                  </div>

                  {/* Right: image + variants */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-xl border border-subtle bg-section/45 p-4 space-y-3">
                      <p className="text-sm font-medium text-foreground">
                        Ảnh sản phẩm
                      </p>
                      <div className="border border-subtle rounded-xl bg-section/50 p-3">
                        {detailProduct.hinhAnhChinh ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(detailProduct.hinhAnhChinh)}
                            alt={detailProduct.tenSanPham}
                            className="w-full h-52 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/images/placeholder.png";
                            }}
                          />
                        ) : (
                          <div className="w-full h-52 rounded-lg border border-dashed border-subtle bg-card flex flex-col items-center justify-center text-muted gap-2">
                            <FiImage size={20} />
                            <span className="text-xs">Chưa có ảnh</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border border-subtle rounded-xl p-4 bg-section/45">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">
                          Chi tiết sản phẩm
                        </p>
                        <span className="text-xs px-2 py-1 rounded-full bg-card border border-subtle text-muted">
                          {detailVariantLoading
                            ? "Đang tải..."
                            : `${detailVariants.length} chi tiết`}
                        </span>
                      </div>
                      {detailVariantLoading ? (
                        <div className="py-2">
                          <Loading />
                        </div>
                      ) : detailVariants.length === 0 ? (
                        <p className="text-xs text-muted">
                          Sản phẩm này chưa có biến thể chi tiết.
                        </p>
                      ) : (
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {detailVariants.map((v) => (
                            <div
                              key={v.id}
                              className="border border-subtle rounded-lg px-2.5 py-2 bg-card"
                            >
                              <p className="text-xs text-foreground font-medium">
                                {v.tenMauSac} / {v.tenKichThuoc}
                              </p>
                              <p className="text-[11px] text-muted mt-0.5">
                                Tồn kho:{" "}
                                <span className="font-semibold">
                                  {v.soLuong}
                                </span>
                              </p>
                              <p className="text-[11px] text-muted mt-0.5">
                                Cửa hàng:{" "}
                                <span className="font-medium text-foreground">
                                  {v.tenCuaHang || "—"}
                                </span>
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-subtle rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-subtle px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Điền thông tin và chọn ảnh để xem trước trước khi lưu.
                </p>
              </div>
              <button
                onClick={resetModalState}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-section transition"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="p-6">
              {modalLoading ? (
                <div className="py-8">
                  <Loading />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-3 rounded-xl border border-subtle bg-section/45 p-4 space-y-4">
                      <div className="pb-2 border-b border-subtle">
                        <p className="text-sm font-semibold text-foreground">
                          Thông tin cơ bản
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          Cập nhật nội dung hiển thị và thuộc tính sản phẩm.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">
                          Tên sản phẩm
                        </label>
                        <input
                          type="text"
                          value={form.tenSanPham}
                          onChange={(e) =>
                            setForm({ ...form, tenSanPham: e.target.value })
                          }
                          className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-foreground">
                            Giá vốn
                          </label>
                          <input
                            type="number"
                            value={form.giaVon}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                giaVon: Number(e.target.value),
                              })
                            }
                            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-foreground">
                            Giá bán
                          </label>
                          <input
                            type="number"
                            value={form.giaBan}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                giaBan: Number(e.target.value),
                              })
                            }
                            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-foreground">
                            Giảm giá (%)
                          </label>
                          <input
                            type="number"
                            value={form.giaGiam}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                giaGiam: Number(e.target.value),
                              })
                            }
                            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">
                          Mô tả
                        </label>
                        <textarea
                          value={form.moTa}
                          onChange={(e) =>
                            setForm({ ...form, moTa: e.target.value })
                          }
                          rows={3}
                          className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Kiểu
                          </label>
                          <select
                            value={form.kieuSanPhamId}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                kieuSanPhamId: Number(e.target.value),
                              })
                            }
                            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2"
                          >
                            <option value={0}>-- Chọn --</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.tenKieuSanPham}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Bộ sưu tập
                          </label>
                          <select
                            value={form.boSuuTapId}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                boSuuTapId: Number(e.target.value),
                              })
                            }
                            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2"
                          >
                            <option value={0}>-- Chọn --</option>
                            {collections.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.tenSuuTap}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Thương hiệu
                          </label>
                          <select
                            value={form.thuongHieuId}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                thuongHieuId: Number(e.target.value),
                              })
                            }
                            className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2"
                          >
                            <option value={0}>-- Chọn --</option>
                            {brands.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.tenThuongHieu}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">
                          Trạng thái
                        </label>
                        <select
                          value={form.trangThai}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              trangThai: Number(e.target.value),
                            })
                          }
                          className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2"
                        >
                          <option value={1}>Đang bán</option>
                          <option value={0}>Ngừng bán</option>
                        </select>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                      <div className="rounded-xl border border-subtle bg-section/45 p-4 space-y-3">
                        <p className="text-sm font-medium text-foreground">
                          Ảnh sản phẩm
                        </p>
                        {editing && (
                          <p className="text-xs text-muted">
                            {file
                              ? "Đang xem ảnh tạm thời. Lưu để cập nhật ảnh sản phẩm."
                              : "Đang hiển thị ảnh hiện tại của sản phẩm."}
                          </p>
                        )}
                        <div className="border border-subtle rounded-xl bg-section/50 p-3">
                          {imagePreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-52 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-full h-52 rounded-lg border border-dashed border-subtle bg-card flex flex-col items-center justify-center text-muted gap-2">
                              <FiImage size={20} />
                              <span className="text-xs">
                                Chưa có ảnh xem trước
                              </span>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileChange(e.target.files?.[0] || null)
                          }
                          className="w-full border border-subtle bg-background text-foreground rounded-lg px-3 py-2"
                        />
                        {file ? (
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <p className="text-muted truncate">{file.name}</p>
                            <button
                              type="button"
                              onClick={clearSelectedFile}
                              className="text-accent hover:text-accent-hover whitespace-nowrap"
                            >
                              Bỏ ảnh đã chọn
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-subtle -mx-6 px-6 pt-3 pb-1 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={resetModalState}
                      className="px-4 py-2 border border-subtle text-foreground rounded-lg hover:bg-section"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover"
                    >
                      {editing ? "Cập nhật" : "Thêm mới"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
