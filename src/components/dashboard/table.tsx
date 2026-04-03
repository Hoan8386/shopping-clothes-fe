"use client";

interface TableProps<T extends object> {
  title: string;
  columns: {
    key: keyof T;
    label: string;
    format?: (value: T[keyof T]) => string;
  }[];
  data: T[];
  isLoading?: boolean;
}

export function Table<T extends object>({
  title,
  columns,
  data,
  isLoading,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Không có dữ liệu</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="text-left py-3 px-4 font-semibold text-gray-700"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="py-3 px-4 text-gray-900"
                    >
                      {col.format
                        ? col.format(row[col.key])
                        : String(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
