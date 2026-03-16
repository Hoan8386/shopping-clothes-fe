"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiAlertCircle, FiCheckCircle, FiHome, FiList } from "react-icons/fi";
import Loading from "@/components/ui/Loading";
import { orderService } from "@/services/order.service";
import { formatCurrency } from "@/lib/utils";

type ReturnResult = {
  loading: boolean;
  saved: boolean;
  error: string | null;
  backendData: Record<string, string> | null;
};

const DEFAULT_STATE: ReturnResult = {
  loading: true,
  saved: false,
  error: null,
  backendData: null,
};

export default function ThanksPage() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<ReturnResult>(DEFAULT_STATE);
  const hasProcessedRef = useRef(false);

  const queryObject = useMemo(() => {
    const entries = Array.from(searchParams.entries());
    return Object.fromEntries(entries);
  }, [searchParams]);

  const amountText = useMemo(() => {
    const amountRaw = queryObject.vnp_Amount;
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return "-";
    }
    return formatCurrency(amount / 100);
  }, [queryObject.vnp_Amount]);

  useEffect(() => {
    if (hasProcessedRef.current) {
      return;
    }

    const transactionNo = queryObject.vnp_TransactionNo;
    if (!transactionNo) {
      setResult({
        loading: false,
        saved: false,
        error: "Thiếu vnp_TransactionNo từ URL trả về của VNPay.",
        backendData: null,
      });
      return;
    }

    hasProcessedRef.current = true;

    const saveReturnData = async () => {
      try {
        const backendData = await orderService.confirmVNPayReturn(queryObject);
        setResult({
          loading: false,
          saved: true,
          error: null,
          backendData,
        });
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message;
        setResult({
          loading: false,
          saved: false,
          error: msg || "Không thể đồng bộ kết quả thanh toán với hệ thống.",
          backendData: null,
        });
      }
    };

    saveReturnData();
  }, [queryObject]);

  if (result.loading) {
    return <Loading />;
  }

  const responseCode = queryObject.vnp_ResponseCode;
  const transactionStatus = queryObject.vnp_TransactionStatus;
  const isPaySuccess = responseCode === "00" && transactionStatus === "00";

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(229,54,55,0.14),transparent_35%),radial-gradient(circle_at_85%_90%,rgba(34,197,94,0.12),transparent_35%)]" />
      <section className="relative max-w-4xl mx-auto px-4 py-16 md:py-20">
        <div className="rounded-3xl border border-subtle bg-card p-6 md:p-10">
          <div className="flex flex-col items-center text-center gap-3 md:gap-4">
            {isPaySuccess && result.saved ? (
              <FiCheckCircle className="text-green-500" size={64} />
            ) : (
              <FiAlertCircle className="text-amber-500" size={64} />
            )}

            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
              {isPaySuccess && result.saved
                ? "Thanh toán thành công"
                : "Thanh toán chưa hoàn tất"}
            </h1>

            <p className="text-sm md:text-base text-gray-500 max-w-2xl">
              {isPaySuccess && result.saved
                ? "Cảm ơn bạn đã thanh toán qua VNPay. Hệ thống đã ghi nhận giao dịch cho đơn hàng của bạn."
                : "Hệ thống nhận được phản hồi từ VNPay nhưng chưa thể xác nhận hoàn tất. Vui lòng kiểm tra chi tiết bên dưới hoặc liên hệ hỗ trợ."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow
              label="Mã giao dịch VNPay"
              value={queryObject.vnp_TransactionNo || "-"}
            />
            <InfoRow
              label="Mã đơn tham chiếu"
              value={queryObject.vnp_TxnRef || "-"}
            />
            <InfoRow label="Số tiền" value={amountText} />
            <InfoRow
              label="Ngân hàng"
              value={queryObject.vnp_BankCode || "-"}
            />
            <InfoRow label="Mã phản hồi" value={responseCode || "-"} />
            <InfoRow
              label="Trạng thái VNPay"
              value={transactionStatus || "-"}
            />
            <InfoRow
              label="payment_ref đã lưu"
              value={result.backendData?.paymentRef || "-"}
            />
            <InfoRow
              label="Đơn hàng"
              value={result.backendData?.donHangId || "-"}
            />
          </div>

          {result.error && (
            <div className="mt-6 rounded-xl border border-red-300/60 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {result.error}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition"
            >
              <FiList size={16} />
              Xem đơn hàng
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-subtle text-sm font-semibold hover:bg-section transition"
            >
              <FiHome size={16} />
              Về trang chủ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-subtle bg-section px-4 py-3 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-semibold break-all text-foreground">{value}</p>
    </div>
  );
}
