// src/app/(dashboard)/page.tsx
import { prisma } from "@/lib/prisma";
import { Monitor, Wrench, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import AssetStatusChart from "@/components/dashboard/AssetStatusChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const totalAssets = await prisma.asset.count({ where: { status: { not: "DISPOSED" } } });
  
  const inStockCount = await prisma.asset.count({ where: { status: "IN_STOCK" } });
  const assignedCount = await prisma.asset.count({ where: { status: "ASSIGNED" } });
  const repairingCount = await prisma.asset.count({ where: { status: "UNDER_REPAIR" } });
  const damagedLostCount = await prisma.asset.count({ where: { status: { in: ["DAMAGED", "LOST"] } } });

  // Đã fix: Đổi assignedAt thành assignedDate
  const recentAssignments = await prisma.assetAssignment.findMany({
    take: 5,
    orderBy: { assignedDate: 'desc' },
    include: { 
      asset: { select: { assetCode: true, name: true } }, 
      user: { select: { name: true } } 
    }
  });

  const chartData = [
    { name: "Sẵn sàng (Kho)", value: inStockCount, color: "#10b981" },
    { name: "Đang cấp phát", value: assignedCount, color: "#3b82f6" },
    { name: "Đang sửa chữa", value: repairingCount, color: "#f59e0b" },
    { name: "Lỗi / Thất lạc", value: damagedLostCount, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan Hệ thống MES</h1>
        <p className="text-sm text-gray-500 mt-1">Báo cáo số liệu và tình trạng tài sản theo thời gian thực.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Tổng thiết bị</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalAssets}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl"><Monitor className="h-6 w-6 text-samsung" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Đang rảnh (Trong kho)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{inStockCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl"><ShieldCheck className="h-6 w-6 text-emerald-600" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Đang bảo trì / Sửa chữa</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{repairingCount}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl"><Wrench className="h-6 w-6 text-amber-600" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Cần xử lý (Lỗi/Mất)</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{damagedLostCount}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-gray-800 mb-6">Tỷ lệ phân bổ tài sản</h2>
          <div className="flex-1 flex items-center justify-center">
            <AssetStatusChart data={chartData} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-800">Hoạt động bàn giao gần đây</h2>
            <Link href="/assignments" className="text-sm font-semibold text-samsung flex items-center gap-1 hover:underline">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="pb-3 font-medium">Thiết bị</th>
                  <th className="pb-3 font-medium">Nhân sự</th>
                  <th className="pb-3 font-medium">Hành động</th>
                  <th className="pb-3 font-medium text-right">Ngày thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="py-3">
                      <span className="font-semibold text-gray-900">{assignment.asset.assetCode}</span>
                    </td>
                    <td className="py-3 text-gray-600">{assignment.user.name}</td>
                    <td className="py-3">
                      {/* Đã fix: Logic check thu hồi dựa vào returnDate thay vì status */}
                      {!assignment.returnDate 
                        ? <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">Cấp phát</span>
                        : <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">Đã thu hồi</span>
                      }
                    </td>
                    <td className="py-3 text-right text-gray-500 text-xs">
                      {/* Đã fix: Hiển thị returnDate nếu đã thu hồi, ngược lại hiện assignedDate */}
                      {new Date(assignment.returnDate || assignment.assignedDate).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
                {recentAssignments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">Chưa có giao dịch nào gần đây.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}