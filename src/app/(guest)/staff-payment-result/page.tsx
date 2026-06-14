"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Loading from "@/components/ui/Loading";
import { orderService } from "@/services/order.service";
import { traHangService } from "@/services/return.service";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiArrowLeft,
} from "react-icons/fi";

type Status = "loading" | "success" | "error";

export default function StaffPaymentResultPage() {
  return (
    <Suspense fallback={<Loading />}>
      <StaffPaymentResultContent />
    </Suspense>
  );
}

function StaffPaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasProcessedRef = useRef(false);

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [redirectPath, setRedirectPath] = useState("/staff/orders");

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const txnRef = searchParams.get("vnp_TxnRef") ?? "";
    const queryObject = Object.fromEntries(Array.from(searchParams.entries()));

    const processReturn = async () => {
      try {
        // Xử lý trả hàng (TRH_)
        if (txnRef.startsWith("TRH_")) {
          setRedirectPath("/staff/returns");
          const data = await traHangService.confirmVNPayReturn(queryObject);
          if (data?.success === "true") {
            setStatus("success");
            setMessage("Thanh toán VNPay thành công! Phiếu trả hàng đã được duyệt.");
          } else {
            setStatus("error");
            setMessage("Thanh toán VNPay chưa thành công. Phiếu trả hàng chưa được duyệt.");
          }
          return;
        }

        // Xử lý đơn hàng tại quầy (GHNV_)
        if (txnRef.startsWith("GHNV_")) {
          setRedirectPath("/staff/orders");
          const data = await orderService.confirmVNPayReturn(queryObject);
          if (data?.success === "true") {
            setStatus("success");
            setMessage("Thanh toán VNPay thành công! Đơn hàng tại quầy đã được tạo.");
          } else {
            setStatus("error");
            setMessage("Thanh toán VNPay chưa thành công. Đơn hàng tại quầy chưa được tạo.");
          }
          return;
        }

        // Không nhận ra loại giao dịch
        setStatus("error");
        setMessage("Không nhận ra loại giao dịch: " + txnRef);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể đồng bộ kết quả thanh toán VNPAY";
        setStatus("error");
        setMessage(msg);
      }
    };

    processReturn();
  }, [searchParams]);

  // Tự động redirect sau 4 giây khi có kết quả
  useEffect(() => {
    if (status === "loading") return;
    const timer = setTimeout(() => {
      router.replace(redirectPath);
    }, 4000);
    return () => clearTimeout(timer);
  }, [status, redirectPath, router]);

  const responseCode = searchParams.get("vnp_ResponseCode");
  const transactionNo = searchParams.get("vnp_TransactionNo");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-subtle bg-card shadow-xl p-8 flex flex-col items-center text-center gap-5">
        {status === "loading" && (
          <>
            <FiLoader className="animate-spin text-accent" size={56} />
            <h1 className="text-xl font-bold text-foreground">
              Đang xử lý kết quả thanh toán...
            </h1>
            <p className="text-sm text-muted">Vui lòng không đóng trang này.</p>
          </>
        )}

        {status === "success" && (
          <>
            <FiCheckCircle className="text-green-500" size={56} />
            <h1 className="text-xl font-bold text-foreground text-green-600">
              Thanh toán thành công!
            </h1>
            <p className="text-sm text-muted">{message}</p>
            {transactionNo && (
              <p className="text-xs text-muted">
                Mã giao dịch VNPay: <span className="font-mono font-semibold">{transactionNo}</span>
              </p>
            )}
            <p className="text-xs text-muted italic">
              Tự động chuyển trang sau 4 giây...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <FiAlertCircle className="text-amber-500" size={56} />
            <h1 className="text-xl font-bold text-foreground">
              {responseCode === "00" ? "Có lỗi xảy ra" : "Thanh toán chưa thành công"}
            </h1>
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 w-full">
              {message}
            </p>
            {responseCode && (
              <p className="text-xs text-muted">
                Mã phản hồi VNPay: <span className="font-mono font-semibold">{responseCode}</span>
              </p>
            )}
            <p className="text-xs text-muted italic">
              Tự động chuyển về trang quản lý sau 4 giây...
            </p>
          </>
        )}

        <button
          onClick={() => router.replace(redirectPath)}
          className="mt-2 flex items-center gap-2 text-sm text-accent hover:underline"
        >
          <FiArrowLeft size={14} />
          Quay lại ngay
        </button>
      </div>
    </div>
  );
}
