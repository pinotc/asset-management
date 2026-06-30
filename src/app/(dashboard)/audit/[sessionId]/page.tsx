// src/app/(dashboard)/audit/[sessionId]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, FileQuestion, ScanLine, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function AuditReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = await params;
  const sessionId = resolvedParams.sessionId;

  // 1. Lấy thông tin phiên và danh sách máy ĐÃ QUÉT
  const session = await prisma.auditSession.findUnique({
    where: { id: sessionId },
    include: {
      inspections: {
        include: { asset: true },
        orderBy: { scannedAt: 'desc' }
      }
    }
  });

  if (!session) redirect("/audit");

  // 2. Lấy TẤT CẢ máy trên hệ thống (Loại trừ các máy đã thanh lý - DISPOSED)
  const allAssets = await prisma.asset.findMany({
    where: { status: { not: "DISPOSED" } },
    select: { id: true, assetCode: true, name: true, status: true }
  });

  // 3. Tính toán đối chiếu
  const auditedAssetIds = new Set(session.inspections.map(i => i.assetId));
  const unauditedAssets = allAssets.filter(a => !auditedAssetIds.has(a.id));
  
  const totalAssets = allAssets.length;
  const auditedCount = auditedAssetIds.size;
  const progressPercent = totalAssets > 0 ? Math.round((auditedCount / totalAssets) * 100) : 0;

  // Render Badge Trạng thái Kiểm kê
  const getAuditStatusBadge = (status: string) => {
    switch (status) {
      case "FOUND": return <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200"><CheckCircle2 className="h-3.5 w-3.5"/> BÌNH THƯỜNG</span>;
      case "DAMAGED": return <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md text-xs font-bold border border-orange-200"><XCircle className="h-3.5 w-3.5"/> HƯ HỎNG</span>;
      case "WRONG_LOCATION": return <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200"><AlertTriangle className="h-3.5 w-3.5"/> SAI VỊ TRÍ</span>;
      case "NOT_FOUND": return <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200"><FileQuestion className="h-3.5 w-3.5"/> MẤT TÍCH</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/audit" className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              Trạng thái: 
              {session.status === "OPEN" 
                ? <span className="text-emerald-600 font-bold flex items-center gap-1"><ScanLine className="h-3.5 w-3.5"/> Đang mở quét</span> 
                : <span className="text-gray-500 font-bold">Đã chốt sổ</span>}
            </p>
          </div>
        </div>
        
        <a 
          href={`/api/audit/${sessionId}/export`}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-700 transition shadow-sm"
        >
          <FileSpreadsheet className="h-4 w-4" /> Xuất báo cáo Excel
        </a>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Tiến độ kiểm kê</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-samsung">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-samsung h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-medium mb-1 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> Đã quét</p>
          <p className="text-2xl font-bold text-gray-900">{auditedCount} <span className="text-sm font-normal text-gray-500">thiết bị</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-medium mb-1 flex items-center gap-1.5"><AlertCircle className="h-4 w-4 text-red-500"/> Chưa quét (Thất lạc)</p>
          <p className="text-2xl font-bold text-red-600">{unauditedAssets.length} <span className="text-sm font-normal text-gray-500">thiết bị</span></p>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CỘT 1: ĐÃ QUÉT */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-600px">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-800">Lịch sử thiết bị ĐÃ QUÉT ({auditedCount})</h2>
          </div>
          <div className="overflow-y-auto p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white sticky top-0 shadow-sm z-10 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Thiết bị</th>
                  <th className="px-4 py-3 font-medium">Tình trạng</th>
                  <th className="px-4 py-3 font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {session.inspections.map(insp => (
                  <tr key={insp.id} className="hover:bg-blue-50/50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-samsung">{insp.asset.assetCode}</p>
                      <p className="text-xs text-gray-500 truncate max-w-150px">{insp.asset.name}</p>
                    </td>
                    <td className="px-4 py-3">{getAuditStatusBadge(insp.status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(insp.scannedAt), "HH:mm dd/MM/yy")}</td>
                  </tr>
                ))}
                {session.inspections.length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-400">Chưa có thiết bị nào được quét.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CỘT 2: CHƯA QUÉT */}
        <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-600px">
          <div className="p-4 border-b border-red-100 bg-red-50">
            <h2 className="font-bold text-red-800">Cảnh báo: THIẾT BỊ CHƯA QUÉT ({unauditedAssets.length})</h2>
          </div>
          <div className="overflow-y-auto p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white sticky top-0 shadow-sm z-10 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã & Tên</th>
                  <th className="px-4 py-3 font-medium">Trạng thái hệ thống gốc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {unauditedAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-red-50/30">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-800">{asset.assetCode}</p>
                      <p className="text-xs text-gray-500 truncate max-w-200px">{asset.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">{asset.status}</span>
                    </td>
                  </tr>
                ))}
                {unauditedAssets.length === 0 && (
                  <tr><td colSpan={2} className="p-8 text-center text-emerald-500 font-medium">Tuyệt vời! Đã kiểm kê toàn bộ 100% thiết bị.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}