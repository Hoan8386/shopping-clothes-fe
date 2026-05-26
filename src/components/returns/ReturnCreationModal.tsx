"use client";

import { useCallback, useMemo, useState } from "react";
import { DonHang, ReqTraHangDTO, TraHang } from "@/types";
import { traHangService } from "@/services/return.service";
import { orderService } from "@/services/order.service";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface ReturnCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
}

function getReturnedQuantity(returns: TraHang[], chiTietDonHangId: number) {
  return returns.reduce((sum, phieu) => {
    const detailSum = (phieu.chiTietTraHangs || []).reduce(
      (detailSumAcc, ct) => {
        if (ct.chiTietDonHangId !== chiTietDonHangId) {
          return detailSumAcc;
        }
        return detailSumAcc + Number(ct.soLuong ?? 0);
      },
      0,
    );
    return sum + detailSum;
  }, 0);
}

function getUnitReturnPrice(detail: DonHang["chiTietDonHangs"][number]) {
  if (detail.soLuong > 0 && detail.thanhTien > 0) {
    return detail.thanhTien / detail.soLuong;
  }
  return Number(detail.giaGiam ?? detail.giaSanPham ?? 0);
}

export function ReturnCreationModal({
  isOpen,
  onClose,
  onCreated,
}: ReturnCreationModalProps) {
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchingOrder, setSearchingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DonHang | null>(null);
  const [existingReturns, setExistingReturns] = useState<TraHang[]>([]);
  const [returnQuantities, setReturnQuantities] = useState<
    Record<number, number>
  >({});
  const [returnReason, setReturnReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<0 | 1>(0);
  const [refundInfo, setRefundInfo] = useState("");
  const [creatingReturn, setCreatingReturn] = useState(false);

  const resetReturnForm = useCallback(() => {
    setSearchOrderId("");
    setSelectedOrder(null);
    setExistingReturns([]);
    setReturnQuantities({});
    setReturnReason("");
    setRefundMethod(0);
    setRefundInfo("");
  }, []);

  const handleClose = useCallback(() => {
    resetReturnForm();
    onClose();
  }, [onClose, resetReturnForm]);

  const getRemainingQuantity = useCallback(
    (detail: DonHang["chiTietDonHangs"][number]) => {
      const purchased = Number(detail.soLuong ?? 0);
      const returned = getReturnedQuantity(existingReturns, detail.id ?? 0);
      return Math.max(purchased - returned, 0);
    },
    [existingReturns],
  );

  const handleSearchOrder = useCallback(async () => {
    const id = Number(searchOrderId);
    if (!id || Number.isNaN(id)) {
      toast.error("Vui lòng nhập mã đơn hợp lệ");
      return;
    }

    try {
      setSearchingOrder(true);
      const [orderData, returnHistory] = await Promise.all([
        orderService.getById(id),
        traHangService.getByDonHangId(id),
      ]);

      setSelectedOrder(orderData);
      setExistingReturns(returnHistory || []);
      setReturnQuantities(
        (orderData.chiTietDonHangs || []).reduce<Record<number, number>>(
          (acc, detail) => {
            acc[detail.id ?? 0] = 0;
            return acc;
          },
          {},
        ),
      );
      setReturnReason("");
      setRefundMethod(0);
      setRefundInfo("");
    } catch (err: any) {
      setSelectedOrder(null);
      setExistingReturns([]);
      setReturnQuantities({});
      const resp = err?.response?.data;
      let msg = "Không thể tải dữ liệu";

      if (resp) {
        // Prefer server-provided message or error field; otherwise show full response object
        if (typeof resp === "string") {
          msg = resp;
        } else if (typeof resp.message === "string" && resp.message.trim()) {
          msg = resp.message;
        } else if (typeof resp.error === "string" && resp.error.trim()) {
          msg = resp.error;
        } else {
          try {
            msg = JSON.stringify(resp);
          } catch {
            msg = String(resp);
          }
        }
      } else if (err?.message) {
        msg = err.message;
      }

      toast.error(msg);
    } finally {
      setSearchingOrder(false);
    }
  }, [searchOrderId]);

  const handleCreateReturn = useCallback(async () => {
    if (!selectedOrder) {
      toast.error("Vui lòng tìm đơn hàng trước");
      return;
    }

    const selectedItems = (selectedOrder.chiTietDonHangs || [])
      .map((detail) => {
        const soLuong = Number(returnQuantities[detail.id ?? 0] ?? 0);
        return {
          chiTietDonHangId: detail.id ?? 0,
          soLuong,
          ghiTru: "",
          remaining: getRemainingQuantity(detail),
        };
      })
      .filter((item) => item.soLuong > 0);

    if (!returnReason.trim()) {
      toast.error("Vui lòng nhập lý do trả hàng");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để trả");
      return;
    }

    const invalidItem = selectedItems.find(
      (item) => item.soLuong > item.remaining,
    );
    if (invalidItem) {
      toast.error("Số lượng trả vượt quá số lượng còn lại có thể trả");
      return;
    }

    const payload: ReqTraHangDTO = {
      donHangId: selectedOrder.id,
      lyDoTraHang: returnReason.trim(),
      phuongThucHoanTien: refundMethod,
      thongTinChuyenKhoan: refundMethod === 1 ? refundInfo.trim() : undefined,
      paymentRef: selectedOrder.paymentRef ?? undefined,
      chiTietTraHangs: selectedItems.map(
        ({ chiTietDonHangId, soLuong, ghiTru }) => ({
          chiTietDonHangId,
          soLuong,
          ghiTru,
        }),
      ),
    };

    try {
      setCreatingReturn(true);
      await traHangService.create(payload);
      toast.success("Tạo phiếu trả hàng thành công");
      await onCreated?.();
      handleClose();
    } catch (err: any) {
      const resp = err?.response?.data;
      let msg = "Không thể tạo phiếu trả hàng";

      if (resp) {
        if (typeof resp === "string") {
          msg = resp;
        } else if (typeof resp.message === "string" && resp.message.trim()) {
          msg = resp.message;
        } else if (typeof resp.error === "string" && resp.error.trim()) {
          msg = resp.error;
        } else {
          try {
            msg = JSON.stringify(resp);
          } catch {
            msg = String(resp);
          }
        }
      } else if (err?.message) {
        msg = err.message;
      }

      toast.error(msg);
    } finally {
      setCreatingReturn(false);
    }
  }, [
    handleClose,
    onCreated,
    refundInfo,
    refundMethod,
    returnQuantities,
    returnReason,
    selectedOrder,
    getRemainingQuantity,
  ]);

  const selectedReturnCount = useMemo(
    () =>
      Object.values(returnQuantities).filter((qty) => Number(qty) > 0).length,
    [returnQuantities],
  );

  const selectedReturnTotal = useMemo(() => {
    if (!selectedOrder) {
      return 0;
    }

    return selectedOrder.chiTietDonHangs.reduce((sum, detail) => {
      const qty = Number(returnQuantities[detail.id ?? 0] ?? 0);
      if (qty <= 0) {
        return sum;
      }
      return sum + getUnitReturnPrice(detail) * qty;
    }, 0);
  }, [returnQuantities, selectedOrder]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-subtle bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-subtle bg-card px-5 py-4 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Tạo phiếu trả hàng
            </h2>
            <p className="text-sm text-muted mt-1">
              Tìm đơn hàng theo mã, chọn sản phẩm và số lượng cần trả.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg border border-subtle px-3 py-2 text-sm font-medium text-foreground transition hover:bg-section"
          >
            Đóng
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Mã đơn hàng
              </label>
              <input
                type="number"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                placeholder="Nhập mã đơn hàng..."
                className="w-full rounded-lg border border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={handleSearchOrder}
              disabled={searchingOrder}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
            >
              {searchingOrder ? "Đang tìm..." : "Tìm đơn hàng"}
            </button>
            <button
              onClick={resetReturnForm}
              className="rounded-lg border border-subtle px-4 py-2 text-sm font-medium text-foreground transition hover:bg-section"
            >
              Xóa form
            </button>
          </div>

          {selectedOrder ? (
            <div className="space-y-4 border-t border-subtle pt-4">
              <div className="grid grid-cols-1 gap-3 text-sm lg:grid-cols-3">
                <div className="rounded-lg bg-section p-3">
                  <p className="text-muted">Đơn hàng</p>
                  <p className="font-semibold text-foreground">
                    #{selectedOrder.id}
                  </p>
                </div>
                <div className="rounded-lg bg-section p-3">
                  <p className="text-muted">Trạng thái</p>
                  <p className="font-semibold text-foreground">
                    {selectedOrder.trangThai}
                  </p>
                </div>
                <div className="rounded-lg bg-section p-3">
                  <p className="text-muted">Tổng tiền</p>
                  <p className="font-semibold text-blue-600">
                    {formatCurrency(
                      selectedOrder.tongTienTra ?? selectedOrder.tongTien ?? 0,
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Lý do trả hàng
                  </label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    placeholder="Nhập lý do trả hàng..."
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Phương thức hoàn tiền
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) =>
                        setRefundMethod(Number(e.target.value) as 0 | 1)
                      }
                      className="w-full rounded-lg border border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    >
                      <option value={0}>Tiền mặt</option>
                      <option value={1}>Chuyển khoản</option>
                    </select>
                  </div>
                  {refundMethod === 1 && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">
                        Thông tin chuyển khoản
                      </label>
                      <input
                        type="text"
                        value={refundInfo}
                        onChange={(e) => setRefundInfo(e.target.value)}
                        className="w-full rounded-lg border border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                        placeholder="Số tài khoản, ngân hàng, chủ tài khoản..."
                      />
                    </div>
                  )}
                  <div className="rounded-lg bg-section p-3 text-sm">
                    <p className="text-muted">Số dòng đã chọn</p>
                    <p className="font-semibold text-foreground">
                      {selectedReturnCount}
                    </p>
                    <p className="mt-2 text-muted">Tổng tiền trả dự kiến</p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(selectedReturnTotal)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-subtle">
                <table className="min-w-225 w-full text-sm">
                  <thead className="border-b border-subtle bg-section">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted">
                        Sản phẩm
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-muted">
                        Phân loại
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted">
                        Đã mua
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted">
                        Đã trả
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted">
                        Còn trả
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted">
                        Số lượng trả
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {selectedOrder.chiTietDonHangs?.map((detail) => {
                      const returnedQty = getReturnedQuantity(
                        existingReturns,
                        detail.id ?? 0,
                      );
                      const remainingQty = getRemainingQuantity(detail);
                      const currentQty = Number(
                        returnQuantities[detail.id ?? 0] ?? 0,
                      );
                      const unitPrice = getUnitReturnPrice(detail);

                      return (
                        <tr key={detail.id} className="hover:bg-section/60">
                          <td className="px-3 py-2">
                            <p className="max-w-56 truncate text-sm font-medium text-foreground">
                              {detail.tenSanPham}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              {formatCurrency(unitPrice)} / sản phẩm
                            </p>
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {detail.tenMauSac} / {detail.tenKichThuoc}
                          </td>
                          <td className="px-3 py-2 text-right text-muted">
                            {detail.soLuong}
                          </td>
                          <td className="px-3 py-2 text-right text-muted">
                            {returnedQty}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-green-700">
                            {remainingQty}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              max={remainingQty}
                              value={currentQty}
                              onChange={(e) => {
                                const nextValue = Number(e.target.value);
                                setReturnQuantities((prev) => ({
                                  ...prev,
                                  [detail.id ?? 0]: Math.max(
                                    0,
                                    Math.min(
                                      Number.isNaN(nextValue) ? 0 : nextValue,
                                      remainingQty,
                                    ),
                                  ),
                                }));
                              }}
                              className="w-24 rounded-lg border border-subtle bg-background px-2 py-1 text-right text-sm outline-none focus:border-accent"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCreateReturn}
                  disabled={creatingReturn}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {creatingReturn ? "Đang tạo..." : "Tạo phiếu trả hàng"}
                </button>
                <button
                  onClick={handleClose}
                  className="rounded-lg border border-subtle px-4 py-2 text-sm font-medium text-foreground transition hover:bg-section"
                >
                  Đóng form
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-subtle bg-section/40 px-4 py-10 text-center text-sm text-muted">
              Nhập mã đơn hàng và bấm Tìm đơn hàng để hiển thị chi tiết và chọn
              số lượng trả.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
