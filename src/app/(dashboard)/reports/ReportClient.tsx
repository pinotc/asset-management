// src/app/(dashboard)/reports/ReportClient.tsx
"use client";

import { 
  Monitor, DollarSign, ArrowRightLeft, Wrench, 
  PieChart, Building2, Tags, Download 
} from "lucide-react";

interface ReportData {
  summary: {
    totalAssets: number;
    totalValue: number;
    inStock: number;
    assigned: number;
    repairing: number;
  };
  statusDistribution: Record<string, number>;
  categoryDistribution: { name: string; count: number }[];
  departmentDistribution: { name: string; count: number }[];
}

export default function ReportClient({ data }: { data: ReportData }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const calculatePercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Nút chức năng */}
      <div className="flex justify-end">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition"
        >
          <Download className="h-4 w-4" /> Xuất báo cáo PDF
        </button>
      </div>

      {/* Dãy Card Thống Kê Tổng Quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Monitor className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Tổng thiết bị</p>
            <p className="text-2xl font-black text-gray-800">{data.summary.totalAssets}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <DollarSign className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Tổng định giá</p>
            <p className="text-xl font-black text-gray-800">{formatCurrency(data.summary.totalValue)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Đang cấp phát</p>
            <p className="text-2xl font-black text-gray-800">{data.summary.assigned}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Wrench className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Sự cố / Bảo trì</p>
            <p className="text-2xl font-black text-gray-800">{data.summary.repairing}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tỉ lệ phân bổ theo trạng thái */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <PieChart className="h-5 w-5 text-samsung" /> Trạng thái hoạt động
          </h2>
          <div className="space-y-5">
            {[
              { label: "Sẵn sàng (Kho)", value: data.statusDistribution.IN_STOCK, color: "bg-blue-500" },
              { label: "Đang sử dụng", value: data.statusDistribution.ASSIGNED, color: "bg-emerald-500" },
              { label: "Đang sửa chữa", value: data.statusDistribution.UNDER_REPAIR, color: "bg-amber-500" },
              { label: "Hư hỏng nặng", value: data.statusDistribution.DAMAGED, color: "bg-red-500" },
              { label: "Đã thanh lý", value: data.statusDistribution.DISPOSED, color: "bg-gray-500" },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                  <span>{stat.label}</span>
                  <span>{stat.value} thiết bị ({calculatePercentage(stat.value, data.summary.totalAssets)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`${stat.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${calculatePercentage(stat.value, data.summary.totalAssets)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phân bổ theo Phòng ban */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-samsung" /> Mật độ cấp phát Phòng ban
          </h2>
          <div className="space-y-4 max-h-300px overflow-y-auto pr-2">
            {data.departmentDistribution.length > 0 ? data.departmentDistribution.map((dept, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-full">
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span className="truncate max-w-200px">{dept.name}</span>
                    <span className="font-bold">{dept.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${calculatePercentage(dept.count, data.summary.totalAssets)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu phòng ban.</p>
            )}
          </div>
        </div>

        {/* Phân bổ theo Danh mục */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Tags className="h-5 w-5 text-samsung" /> Cơ cấu chủng loại tài sản
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.categoryDistribution.length > 0 ? data.categoryDistribution.map((cat, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700 truncate">{cat.name}</span>
                  <span className="text-xs font-black bg-white px-2 py-1 rounded shadow-sm text-samsung">{cat.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-samsung h-1.5 rounded-full"
                    style={{ width: `${calculatePercentage(cat.count, data.summary.totalAssets)}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-400">Chưa có dữ liệu danh mục.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}