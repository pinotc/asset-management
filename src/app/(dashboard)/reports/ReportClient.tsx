// src/app/(dashboard)/reports/ReportClient.tsx
"use client";

import { 
  Monitor, DollarSign, ArrowRightLeft, Wrench, 
  PieChart, Building2, Tags, Download, FileQuestion, HelpCircle
} from "lucide-react";

interface ReportData {
  summary: {
    totalAssets: number;
    totalValue: number;
    inStock: number;
    assigned: number;
    repairing: number;
    lost: number; // Thêm chỉ số tổng số lượng mất tích
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
    if (!total || total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  // Đảm bảo các trường không bị undefined khi truy vấn dữ liệu trống
  const totalAssets = data.summary.totalAssets || 0;
  const lostCount = data.summary.lost || data.statusDistribution.LOST || 0;

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

      {/* Dãy Card Thống Kê Tổng Quan - Nâng cấp lên 5 cột để bao quát đủ vòng đời */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Monitor className="h-5 w-5 text-blue-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Tổng thiết bị</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{totalAssets}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Tổng định giá</p>
            <p className="text-base font-black text-gray-800 mt-0.5 truncate">{formatCurrency(data.summary.totalValue || 0)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="h-5 w-5 text-purple-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Đang cấp phát</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{data.summary.assigned || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5 text-amber-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Sự cố / Bảo trì</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{data.summary.repairing || 0}</p>
          </div>
        </div>

        {/* CARD MỚI BỔ SUNG: TÀI SẢN BÁO MẤT QUA KIỂM KÊ */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <FileQuestion className="h-5 w-5 text-red-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider truncate">Tài sản báo mất</p>
            <p className="text-xl font-black text-red-600 mt-0.5">{lostCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tỉ lệ phân bổ theo trạng thái hoạt động toàn diện */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <PieChart className="h-5 w-5 text-samsung" /> Trạng thái hoạt động chi tiết
          </h2>
          <div className="space-y-4">
            {[
              { label: "Sẵn sàng trong kho (IN_STOCK)", value: data.statusDistribution.IN_STOCK || 0, color: "bg-blue-500" },
              { label: "Đang sử dụng vận hành (ASSIGNED)", value: data.statusDistribution.ASSIGNED || 0, color: "bg-emerald-500" },
              { label: "Đang sửa chữa / Kiểm tra (UNDER_REPAIR)", value: data.statusDistribution.UNDER_REPAIR || 0, color: "bg-amber-500" },
              { label: "Hư hỏng vật lý (DAMAGED)", value: data.statusDistribution.DAMAGED || 0, color: "bg-orange-500" },
              { label: "Thất thoát / Chưa tìm thấy (LOST)", value: lostCount, color: "bg-red-500" },
              { label: "Đã thanh lý bãi bỏ (DISPOSED)", value: data.statusDistribution.DISPOSED || 0, color: "bg-gray-400" },
            ].map((stat, idx) => {
              const pct = calculatePercentage(stat.value, totalAssets);
              return (
                <div key={idx} className="group">
                  <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                    <span>{stat.label}</span>
                    <span className="text-gray-500 group-hover:text-gray-900 transition-colors">
                      {stat.value} thiết bị ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`${stat.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phân bổ theo Phòng ban */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-samsung" /> Mật độ cấp phát Phòng ban
          </h2>
          <div className="space-y-4 max-h-320px overflow-y-auto pr-2">
            {data.departmentDistribution && data.departmentDistribution.length > 0 ? (
              data.departmentDistribution.map((dept, idx) => {
                const pct = calculatePercentage(dept.count, totalAssets);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-full">
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                        <span className="truncate max-w-240px font-semibold text-gray-600">{dept.name}</span>
                        <span className="font-bold text-gray-900">{dept.count} máy</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <HelpCircle className="h-8 w-8 stroke-1 mb-2" />
                <p className="text-sm font-medium">Chưa ghi nhận dữ liệu phân bổ phòng ban</p>
              </div>
            )}
          </div>
        </div>

        {/* Phân bổ theo Danh mục chủng loại */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Tags className="h-5 w-5 text-samsung" /> Cơ cấu chủng loại tài sản vận hành
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.categoryDistribution && data.categoryDistribution.length > 0 ? (
              data.categoryDistribution.map((cat, idx) => {
                const pct = calculatePercentage(cat.count, totalAssets);
                return (
                  <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-samsung/30 transition-all duration-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-700 truncate pr-2" title={cat.name}>{cat.name}</span>
                      <span className="text-xs font-black bg-white px-2.5 py-1 rounded-md border text-samsung shadow-sm shrink-0">
                        {cat.count} chiếc
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                      <div 
                        className="bg-samsung h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 p-4 text-center lg:col-span-3">Chưa có dữ liệu danh mục phân loại thiết bị.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}