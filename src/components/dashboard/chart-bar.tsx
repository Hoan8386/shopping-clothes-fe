"use client";

import React from "react";

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  title: string;
  data: BarData[];
  maxHeight?: number;
}

export function BarChart({ title, data, maxHeight = 300 }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

      <div
        className="flex items-end justify-around gap-4"
        style={{ height: `${maxHeight}px` }}
      >
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            <div
              className={`w-full ${item.color || "bg-blue-500"} rounded-t transition-all hover:opacity-80`}
              style={{
                height: `${(item.value / maxValue) * 100}%`,
                minHeight: "10px",
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs text-gray-600 text-center truncate w-full">
              {item.label}
            </span>
            <span className="text-xs font-medium text-gray-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
