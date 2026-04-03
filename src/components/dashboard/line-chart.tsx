"use client";

interface LinePoint {
  label: string;
  value: number;
  color?: string;
}

interface LineChartProps {
  title: string;
  data: LinePoint[];
  height?: number;
}

export function LineChart({ title, data, height = 280 }: LineChartProps) {
  const width = 640;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const padding = 20;

  const points = data
    .map((item, index) => {
      const x = data.length > 1 ? index * stepX : width / 2;
      const y =
        height - padding - (item.value / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const fillPoints = `0,${height - padding} ${points} ${width},${height - padding}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-160 h-70"
        >
          <defs>
            <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline points={fillPoints} fill="url(#lineFill)" stroke="none" />
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {data.map((item, index) => {
            const x = data.length > 1 ? index * stepX : width / 2;
            const y =
              height -
              padding -
              (item.value / maxValue) * (height - padding * 2);
            return (
              <g key={`${item.label}-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill="#fff"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />
                <text
                  x={x}
                  y={height - 4}
                  textAnchor="middle"
                  className="fill-gray-600 text-[10px]"
                >
                  {item.label}
                </text>
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="fill-gray-900 text-[10px] font-semibold"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
