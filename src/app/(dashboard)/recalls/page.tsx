// src/app/(dashboard)/recalls/page.tsx
import { prisma } from "@/lib/prisma";
import { Undo2, Monitor, User, Calendar, ShieldAlert } from "lucide-react";
import RecallButton from "./RecallButton";

export const dynamic = "force-dynamic";

export default async function RecallsPage() {
  // LẤY SONG SONG DỮ LIỆU: DANH SÁCH THU HỒI VÀ DANH SÁCH VỊ TRÍ
  const [activeAssignments, locations] = await Promise.all([
    prisma.assetAssignment.findMany({
      where: { returnDate: null },
      include: {
        asset: { select: { assetCode: true, name: true, status: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { assignedDate: 'desc' }
    }),
    prisma.assetLocation.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ]);

  const getAssetStatusBadge = (status: string) => {
    switch (status) {
      case "ASSIGNED": 
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-200">Đang dùng</span>;
      case "UNDER_REPAIR": 
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md border border-amber-200">Đang sửa chữa</span>;
      case "DAMAGED": 
        return <span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-md border border-orange-200">Hư hỏng</span>;
      case "LOST": 
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-200">Thất lạc</span>;
      default: 
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-bold rounded-md border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Undo2 className="h-6 w-6 text-red-500" />
          Quản lý Thu hồi Thiết bị
        </h1>
        <p className="text-sm text-gray-500 mt-1">Danh sách các thiết bị đang được cấp phát ngoài xưởng chờ thu hồi về kho.</p>
      </div>

      <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 shadow-sm">
        <ShieldAlert className="h-6 w-6 text-red-500" />
        <div>
          <h3 className="text-sm font-bold text-red-800">Đang có {activeAssignments.length} thiết bị chưa thu hồi</h3>
          <p className="text-xs text-red-600 mt-0.5">Chú ý trạng thái của thiết bị. Nếu máy hỏng, khi thu hồi hệ thống sẽ tự động giữ nguyên trạng thái lỗi để tránh đưa nhầm vào kho sẵn sàng.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-6 py-4">Mã tài sản</th>
                <th className="px-6 py-4">Tên thiết bị</th>
                <th className="px-6 py-4">Người đang sử dụng</th>
                <th className="px-6 py-4">Trạng thái máy</th>
                <th className="px-6 py-4">Ngày bàn giao</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-samsung">
                    {assignment.asset.assetCode}
                  </td>
                  <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-gray-400" />
                    {assignment.asset.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                      <User className="h-4 w-4 text-gray-400" />
                      {assignment.user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getAssetStatusBadge(assignment.asset.status as string)}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {new Date(assignment.assignedDate).toLocaleDateString("vi-VN")}
                    </div>
                  </td>
                  <td className="px-6 py-4 flex justify-center">
                    {/* TRUYỀN BIẾN LOCATIONS VÀO ĐÂY ĐỂ NÚT BẤM KHÔNG BỊ LỖI */}
                    <RecallButton 
                      assignmentId={assignment.id} 
                      assetCode={assignment.asset.assetCode} 
                      locations={locations}
                    />
                  </td>
                </tr>
              ))}
              {activeAssignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Tất cả thiết bị đã được thu hồi đầy đủ về kho.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}