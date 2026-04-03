"use client";

import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number; // percentage change
  trendUp?: boolean;
  bgColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp = true,
  bgColor = "bg-blue-50",
}: StatCardProps) {
  return (
    <div
      className={`${bgColor} rounded-lg p-6 shadow-sm border border-gray-100`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="text-3xl text-gray-400 opacity-50">{icon}</div>
        )}
      </div>

      {trend !== undefined && (
        <div className="flex items-center mt-4">
          <span
            className={`text-sm font-medium ${trendUp ? "text-green-600" : "text-red-600"}`}
          >
            {trendUp ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-gray-500 ml-2">so với kỳ trước</span>
        </div>
      )}
    </div>
  );
}
