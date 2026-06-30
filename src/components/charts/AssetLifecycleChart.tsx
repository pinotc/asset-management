"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "Sẵn sàng (In Stock)", value: 356, color: "#10B981" }, // Emerald 500
  { name: "Đang Cấp phát", value: 842, color: "#4F46E5" },      // Indigo 600
  { name: "Đang Sửa chữa", value: 45, color: "#F59E0B" },       // Amber 500
  { name: "Thất lạc / Hỏng", value: 5, color: "#EF4444" },        // Red 500
];

export default function AssetLifecycleChart() {
  return (
    <div className="h-full w-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Trạng thái Vòng đời</h3>
      <div className="flex-1 min-h-75">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [`${value} thiết bị`, "Số lượng"]}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}