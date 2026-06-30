// src/components/dashboard/AssetStatusChart.tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface ChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export default function AssetStatusChart({ data }: ChartProps) {
  // Bỏ qua biểu đồ nếu không có dữ liệu
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chưa có dữ liệu thống kê</div>;
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ fontWeight: 'bold' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}