"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "SMT Line 1", total: 120 },
  { name: "SMT Line 2", total: 135 },
  { name: "QA Dept", total: 85 },
  { name: "Warehouse", total: 40 },
  { name: "IT Dept", total: 250 },
  { name: "Packing", total: 60 },
];

export default function DepartmentAssetsChart() {
  return (
    <div className="h-full w-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bổ theo Khu vực</h3>
      <div className="flex-1 min-h-75">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E4E8" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <Tooltip 
              cursor={{ fill: '#F8F9FA' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar 
              dataKey="total" 
              fill="#1428A0" /* Xanh Samsung */
              radius={[4, 4, 0, 0]} 
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}