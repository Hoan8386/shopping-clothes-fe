'use client';

import { useEffect, useMemo, useState } from 'react';
import { reportAPI } from '@/services/dashboard.service';
import { cuaHangService } from '@/services/common.service';
import { CuaHang } from '@/types';

interface RevenueReport {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
}

interface OrderPerformanceReport {
    paidOrders: number;
    successRate: number;
    cancelRate: number;
}

interface InventoryAlertReport {
    totalStock: number;
    outOfStockCount: number;
    lowStockCount: number;
}

interface TopProductItem {
    tenSanPham: string;
    soLuongBan: number;
}

interface TopProductReport {
    topProducts: TopProductItem[];
}

interface ImportSupplierReport {
    totalReceipts: number;
    totalImportValue: number;
}

interface ReturnExchangeReport {
    totalReturns: number;
    totalExchanges: number;
}

interface PromotionReport {
    totalDiscountAmount: number;
    usedHoaDonPromotions: number;
    usedDiemPromotions: number;
}

interface StaffPerformanceItem {
    tenNhanVien: string;
    doanhThu: number;
}

interface StaffPerformanceReport {
    totalStaff: number;
    staffs: StaffPerformanceItem[];
}

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const cloneDate = (date: Date) => new Date(date.getTime());

const startOfQuarter = (date: Date) => {
    const month = date.getMonth();
    const quarterStartMonth = month - (month % 3);
    return new Date(date.getFullYear(), quarterStartMonth, 1);
};

const startOfRelativeMonthRange = (months: number) => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() - Math.max(0, months - 1), 1);
};

const setFullRange = (start: Date, end: Date) => ({
    fromDate: toIsoDate(start),
    toDate: toIsoDate(end),
});

export default function AdminReportsPage() {
    const [fromDate, setFromDate] = useState<string>(
        toIsoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    );
    const [toDate, setToDate] = useState<string>(toIsoDate(new Date()));
    const [cuaHangId, setCuaHangId] = useState<string>('');
    const [cuaHangs, setCuaHangs] = useState<CuaHang[]>([]);
    const [activePreset, setActivePreset] = useState<string | null>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [exporting, setExporting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [revenue, setRevenue] = useState<RevenueReport | null>(null);
    const [orderPerformance, setOrderPerformance] = useState<OrderPerformanceReport | null>(null);
    const [inventory, setInventory] = useState<InventoryAlertReport | null>(null);
    const [topProducts, setTopProducts] = useState<TopProductReport | null>(null);
    const [importSupplier, setImportSupplier] = useState<ImportSupplierReport | null>(null);
    const [returnExchange, setReturnExchange] = useState<ReturnExchangeReport | null>(null);
    const [promotion, setPromotion] = useState<PromotionReport | null>(null);
    const [staffPerformance, setStaffPerformance] = useState<StaffPerformanceReport | null>(null);

    const params = useMemo(
        () => ({
            fromDate,
            toDate,
            cuaHangId: cuaHangId ? Number(cuaHangId) : undefined,
            lowStockThreshold: 5,
            limit: 10,
        }),
        [fromDate, toDate, cuaHangId],
    );

    const loadReports = async () => {
        try {
            setLoading(true);
            setError(null);

            const [
                revenueRes,
                orderPerfRes,
                inventoryRes,
                topProductsRes,
                importSupplierRes,
                returnExchangeRes,
                promotionRes,
                staffPerfRes,
            ] = await Promise.all([
                reportAPI.getRevenue<RevenueReport>(params),
                reportAPI.getOrderPerformance<OrderPerformanceReport>(params),
                reportAPI.getInventoryAlert<InventoryAlertReport>(params),
                reportAPI.getTopProducts<TopProductReport>(params),
                reportAPI.getImportSupplier<ImportSupplierReport>(params),
                reportAPI.getReturnExchange<ReturnExchangeReport>(params),
                reportAPI.getPromotion<PromotionReport>(params),
                reportAPI.getStaffPerformance<StaffPerformanceReport>(params),
            ]);

            setRevenue(revenueRes.data);
            setOrderPerformance(orderPerfRes.data);
            setInventory(inventoryRes.data);
            setTopProducts(topProductsRes.data);
            setImportSupplier(importSupplierRes.data);
            setReturnExchange(returnExchangeRes.data);
            setPromotion(promotionRes.data);
            setStaffPerformance(staffPerfRes.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tải báo cáo');
        } finally {
            setLoading(false);
        }
    };

    const loadStores = async () => {
        try {
            const stores = await cuaHangService.getAll();
            setCuaHangs(stores);
        } catch {
            setCuaHangs([]);
        }
    };

    useEffect(() => {
        void loadStores();
    }, []);

    useEffect(() => {
        void loadReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyPreset = (
        preset:
            | 'month1'
            | 'month3'
            | 'month6'
            | 'quarter1'
            | 'quarter2'
            | 'quarter3'
            | 'quarter4'
            | 'currentQuarter',
    ) => {
        const today = new Date();

        if (preset === 'currentQuarter') {
            const start = startOfQuarter(today);
            const end = cloneDate(today);
            const range = setFullRange(start, end);
            setFromDate(range.fromDate);
            setToDate(range.toDate);
            setActivePreset(preset);
            return;
        }

        if (preset === 'month1' || preset === 'month3' || preset === 'month6') {
            const months = preset === 'month1' ? 1 : preset === 'month3' ? 3 : 6;
            const start = startOfRelativeMonthRange(months);
            const end = cloneDate(today);
            const range = setFullRange(start, end);
            setFromDate(range.fromDate);
            setToDate(range.toDate);
            setActivePreset(preset);
            return;
        }

        const quarterIndex =
            preset === 'quarter1' ? 0 : preset === 'quarter2' ? 3 : preset === 'quarter3' ? 6 : 9;
        const start = new Date(today.getFullYear(), quarterIndex, 1);
        const end = new Date(today.getFullYear(), quarterIndex + 3, 0);
        const range = setFullRange(start, end > today ? today : end);
        setFromDate(range.fromDate);
        setToDate(range.toDate);
        setActivePreset(preset);
    };

    const handleManualDateChange = (setter: (value: string) => void) => (value: string) => {
        setActivePreset(null);
        setter(value);
    };

    const handleStoreChange = (value: string) => {
        setActivePreset(null);
        setCuaHangId(value);
    };

    const formatCurrency = (value: number | null | undefined) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(value ?? 0);

    const handleExport = async (key: string, action: () => Promise<void>) => {
        try {
            setExporting(key);
            await action();
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:p-6 shadow-sm">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Báo cáo thống kê</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Theo dõi số liệu kinh doanh và tải Excel cho từng nhóm báo cáo.
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Cửa hàng
                        </label>
                        <select
                            value={cuaHangId}
                            onChange={(e) => handleStoreChange(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                        >
                            <option value="">Tất cả cửa hàng</option>
                            {cuaHangs.map((store) => (
                                <option key={store.id} value={store.id}>
                                    {store.tenCuaHang}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => handleManualDateChange(setFromDate)(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => handleManualDateChange(setToDate)(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => void loadReports()}
                            className="w-full rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-medium hover:bg-indigo-700"
                            disabled={loading}
                        >
                            {loading ? 'Đang tải...' : 'Lọc báo cáo'}
                        </button>
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Bộ lọc nhanh</h2>
                            <p className="text-xs text-gray-600 mt-1">
                                Chọn nhanh theo 1, 3, 6 tháng hoặc theo quý.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <QuickFilterButton
                                label="1 tháng"
                                onClick={() => applyPreset('month1')}
                                active={activePreset === 'month1'}
                            />
                            <QuickFilterButton
                                label="3 tháng"
                                onClick={() => applyPreset('month3')}
                                active={activePreset === 'month3'}
                            />
                            <QuickFilterButton
                                label="6 tháng"
                                onClick={() => applyPreset('month6')}
                                active={activePreset === 'month6'}
                            />
                            <QuickFilterButton
                                label="Quý hiện tại"
                                onClick={() => applyPreset('currentQuarter')}
                                active={activePreset === 'currentQuarter'}
                            />
                            <QuickFilterButton
                                label="Q1"
                                onClick={() => applyPreset('quarter1')}
                                active={activePreset === 'quarter1'}
                            />
                            <QuickFilterButton
                                label="Q2"
                                onClick={() => applyPreset('quarter2')}
                                active={activePreset === 'quarter2'}
                            />
                            <QuickFilterButton
                                label="Q3"
                                onClick={() => applyPreset('quarter3')}
                                active={activePreset === 'quarter3'}
                            />
                            <QuickFilterButton
                                label="Q4"
                                onClick={() => applyPreset('quarter4')}
                                active={activePreset === 'quarter4'}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ReportCard
                    title=" Doanh thu bán hàng"
                    lines={[
                        `Tổng đơn: ${revenue?.totalOrders ?? 0}`,
                        `Tổng doanh thu: ${formatCurrency(revenue?.totalRevenue)}`,
                        `Giá trị đơn TB: ${formatCurrency(revenue?.averageOrderValue)}`,
                    ]}
                    onExport={() => handleExport('revenue', () => reportAPI.exportRevenue(params))}
                    exporting={exporting === 'revenue'}
                />

                <ReportCard
                    title=" Hiệu suất đơn hàng"
                    lines={[
                        `Đơn đã thanh toán: ${orderPerformance?.paidOrders ?? 0}`,
                        `Tỷ lệ thành công: ${(orderPerformance?.successRate ?? 0).toFixed(2)}%`,
                        `Tỷ lệ hủy: ${(orderPerformance?.cancelRate ?? 0).toFixed(2)}%`,
                    ]}
                    onExport={() =>
                        handleExport('orderPerformance', () =>
                            reportAPI.exportOrderPerformance(params),
                        )
                    }
                    exporting={exporting === 'orderPerformance'}
                />

                <ReportCard
                    title=" Tồn kho và cảnh báo"
                    lines={[
                        `Tổng tồn: ${inventory?.totalStock ?? 0}`,
                        `Hết hàng: ${inventory?.outOfStockCount ?? 0}`,
                        `Sắp hết: ${inventory?.lowStockCount ?? 0}`,
                    ]}
                    onExport={() =>
                        handleExport('inventory', () => reportAPI.exportInventoryAlert(params))
                    }
                    exporting={exporting === 'inventory'}
                />

                <ReportCard
                    title=" Top sản phẩm"
                    lines={[
                        `Sản phẩm top 1: ${topProducts?.topProducts?.[0]?.tenSanPham ?? '-'}`,
                        `SL bán top 1: ${topProducts?.topProducts?.[0]?.soLuongBan ?? 0}`,
                        `Số sản phẩm trong top: ${topProducts?.topProducts?.length ?? 0}`,
                    ]}
                    onExport={() =>
                        handleExport('topProducts', () => reportAPI.exportTopProducts(params))
                    }
                    exporting={exporting === 'topProducts'}
                />

                <ReportCard
                    title=" Nhập hàng và NCC"
                    lines={[
                        `Tổng phiếu nhập: ${importSupplier?.totalReceipts ?? 0}`,
                        `Giá trị nhập: ${formatCurrency(importSupplier?.totalImportValue)}`,
                    ]}
                    onExport={() =>
                        handleExport('importSupplier', () => reportAPI.exportImportSupplier(params))
                    }
                    exporting={exporting === 'importSupplier'}
                />

                <ReportCard
                    title=" Trả đổi"
                    lines={[
                        `Phiếu trả: ${returnExchange?.totalReturns ?? 0}`,
                        `Phiếu đổi: ${returnExchange?.totalExchanges ?? 0}`,
                    ]}
                    onExport={() =>
                        handleExport('returnExchange', () => reportAPI.exportReturnExchange(params))
                    }
                    exporting={exporting === 'returnExchange'}
                />

                <ReportCard
                    title=" Khuyến mãi"
                    lines={[
                        `Dùng KM hóa đơn: ${promotion?.usedHoaDonPromotions ?? 0}`,
                        `Dùng KM điểm: ${promotion?.usedDiemPromotions ?? 0}`,
                        `Tổng tiền giảm: ${formatCurrency(promotion?.totalDiscountAmount)}`,
                    ]}
                    onExport={() =>
                        handleExport('promotion', () => reportAPI.exportPromotion(params))
                    }
                    exporting={exporting === 'promotion'}
                />

                <ReportCard
                    title=" Năng suất nhân viên"
                    lines={[
                        `Tổng nhân viên: ${staffPerformance?.totalStaff ?? 0}`,
                        `Top doanh thu NV: ${staffPerformance?.staffs?.[0]?.tenNhanVien ?? '-'}`,
                        `Doanh thu top NV: ${formatCurrency(staffPerformance?.staffs?.[0]?.doanhThu)}`,
                    ]}
                    onExport={() =>
                        handleExport('staffPerformance', () =>
                            reportAPI.exportStaffPerformance(params),
                        )
                    }
                    exporting={exporting === 'staffPerformance'}
                />
            </div>
        </div>
    );
}

function ReportCard({
    title,
    lines,
    onExport,
    exporting,
}: {
    title: string;
    lines: string[];
    onExport: () => void;
    exporting: boolean;
}) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
                {lines.map((line) => (
                    <li key={line}>{line}</li>
                ))}
            </ul>
            <button
                onClick={onExport}
                disabled={exporting}
                className="mt-4 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
        </div>
    );
}

function QuickFilterButton({
    label,
    onClick,
    active,
}: {
    label: string;
    onClick: () => void;
    active: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                active
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300'
            }`}
        >
            {label}
        </button>
    );
}
