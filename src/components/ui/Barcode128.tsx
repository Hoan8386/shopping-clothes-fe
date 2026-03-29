"use client";

import { useEffect, useMemo, useRef } from "react";
import JsBarcode from "jsbarcode";

interface Barcode128Props {
  value?: string | null;
  className?: string;
  height?: number;
}

export default function Barcode128({
  value,
  className,
  height = 64,
}: Barcode128Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const normalizedValue = useMemo(() => {
    const next = (value || "").trim();
    return next.length > 0 ? next : "";
  }, [value]);

  useEffect(() => {
    if (!svgRef.current || !normalizedValue) {
      return;
    }

    try {
      JsBarcode(svgRef.current, normalizedValue, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        lineColor: "#111827",
        height,
        margin: 0,
        width: 1.5,
      });
    } catch {
      // Keep component resilient when barcode value is invalid.
    }
  }, [normalizedValue, height]);

  if (!normalizedValue) {
    return (
      <div className={className} role="status" aria-live="polite">
        <p className="text-xs text-muted">Chưa có mã vạch</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <svg ref={svgRef} className="w-full max-w-xs" />
    </div>
  );
}
