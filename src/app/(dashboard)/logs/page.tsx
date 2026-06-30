// src/app/(dashboard)/logs/page.tsx
import { prisma } from "@/lib/prisma";
import { History, Search, Monitor, User, ShieldAlert, Tag } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AssetLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; action?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.query || "";
  const actionFilter = resolvedParams.action || "";

  // 1. Truy vấn danh sách logs kèm bộ lọc tìm kiếm
  const logs = await prisma.assetLog.findMany({
    where: {
      AND: [
        actionFilter ? { action: actionFilter } : {},
        query
          ? {
              asset: {
                OR: [
                  { assetCode: { contains: query, mode: "insensitive" } },
                  { name: { contains: query, mode: "insensitive" } },
                ],
              },
            }
          : {},
      ],
    },
    include: {
      asset: { select: { assetCode: true, name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Định dạng màu sắc trực quan cho từng loại hành động (Action)
  const getActionBadge = (action: string) => {
    switch (action) {
      case "ASSIGNED":
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-200">CẤP PHÁT</span>;
      case "RECALLED":
        return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded border border-gray-200">THU HỒI</span>;
      case "REPAIR_REQUESTED":
        return <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 text-xs font-bold rounded border border-orange-200">BÁO HỎNG</span>;
      case "STATUS_CHANGED":
        return <span className="px-2.5 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200">ĐỔI TRẠNG THÁI</span>;
      case "AUDIT_SCANNED":
        return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-bold rounded border border-purple-200">KIỂM KÊ</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-50 text-slate-700 text-xs font-bold rounded border border-slate-200">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="h-6 w-6 text-samsung" />
          Sổ cái Nhật ký Hệ thống
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lịch sử vết cấu hình, bàn giao, báo lỗi và kiểm kê thiết bị (Không thể xóa/sửa).
        </p>
      </div>

      {/* Thanh Bộ lọc công cụ (Filters) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <form method="GET" className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              name="query"
              defaultValue={query}
              placeholder="Tìm theo Mã tài sản hoặc Tên thiết bị..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-samsung transition bg-gray-50 focus:bg-white"
            />
          </div>

          <select
            name="action"
            defaultValue={actionFilter}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-samsung bg-white"
          >
            <option value="">-- Tất cả hành động --</option>
            <option value="ASSIGNED">Cấp phát</option>
            <option value="RECALLED">Thu hồi</option>
            <option value="REPAIR_REQUESTED">Báo hỏng</option>
            <option value="STATUS_CHANGED">Đổi trạng thái</option>
            <option value="AUDIT_SCANNED">Kiểm kê</option>
          </select>

          <button type="submit" className="bg-samsung text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition">
            Lọc dữ liệu
          </button>
        </form>
      </div>

      {/* Bảng hiển thị dữ liệu nhật ký */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Thiết bị</th>
                <th className="px-6 py-4">Hành động</th>
                <th className="px-6 py-4">Nội dung chi tiết diễn giải</th>
                <th className="px-6 py-4">Người thực hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium text-gray-400">
                    {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-samsung">{log.asset?.assetCode || "N/A"}</span>
                      <span className="text-xs text-gray-400 max-w-160px truncate">{log.asset?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-md whitespace-normal wrap-break-words leading-relaxed text-xs font-medium">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {log.user?.name || "Hệ thống"}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <ShieldAlert className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    Không tìm thấy dữ liệu nhật ký nào khớp với bộ lọc.
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