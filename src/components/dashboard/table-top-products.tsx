"use client";

import React from "react";

interface TopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  profitMargin: number;
}

interface TopProductsTableProps {
  data: TopProduct[];
  isLoading?: boolean;
}

export function TopProductsTable({ data, isLoading }: TopProductsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sản phẩm bán chạy
        </h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Top 10 Sản phẩm bán chạy
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-700 py-3">
                Sản phẩm
              </th>
              <th className="text-right text-xs font-semibold text-gray-700 py-3">
                Số lượng
              </th>
              <th className="text-right text-xs font-semibold text-gray-700 py-3">
                Doanh thu
              </th>
              <th className="text-right text-xs font-semibold text-gray-700 py-3">
                Lợi nhuận
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((product, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-4 text-sm font-medium text-gray-900">
                  {product.productName}
                </td>
                <td className="text-right py-4 text-sm text-gray-600">
                  {product.quantitySold}
                </td>
                <td className="text-right py-4 text-sm text-gray-900 font-medium">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(product.totalRevenue)}
                </td>
                <td className="text-right py-4">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    {product.profitMargin.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
