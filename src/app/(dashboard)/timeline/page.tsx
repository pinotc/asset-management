// src/app/(dashboard)/timeline/page.tsx
import { prisma } from "@/lib/prisma";
import { History, Search, Cpu, Calendar, User, Tag, MapPin, CheckCircle2, ArrowRightLeft, Undo2, Wrench, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const resolvedParams = await searchParams;
  const assetCode = resolvedParams.code || "";

  let assetData = null;
  let errorMsg = null;

  // Thực hiện truy vấn trực tiếp trên Server nếu có tham số tìm kiếm
  if (assetCode) {
    const data = await prisma.asset.findUnique({
      where: { assetCode: assetCode.trim().toUpperCase() },
      include: {
        category: { select: { name: true } },
        location: { select: { name: true } },
        logs: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    
    if (data) {
      assetData = data;
    } else {
      errorMsg = `Không tìm thấy thiết bị nào có mã: ${assetCode}`;
    }
  }

  // Hàm sinh cấu trúc icon và màu sắc tương ứng với từng trạng thái vòng đời
  const getTimelineMarker = (action: string) => {
    switch (action) {
      case "CREATED":
        return { icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, bg: "bg-emerald-50 border-emerald-200" };
      case "ASSIGNED":
        return { icon: <ArrowRightLeft className="h-4 w-4 text-blue-600" />, bg: "bg-blue-50 border-blue-200" };
      case "RECALLED":
        return { icon: <Undo2 className="h-4 w-4 text-gray-600" />, bg: "bg-gray-100 border-gray-300" };
      case "REPAIR_REQUESTED":
        return { icon: <Wrench className="h-4 w-4 text-orange-600" />, bg: "bg-orange-50 border-orange-200" };
      case "STATUS_CHANGED":
        return { icon: <ShieldAlert className="h-4 w-4 text-red-600" />, bg: "bg-red-50 border-red-200" };
      default:
        return { icon: <History className="h-4 w-4 text-slate-600" />, bg: "bg-slate-50 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="h-6 w-6 text-samsung" />
          Hồ sơ & Dòng thời gian tài sản
        </h1>
        <p className="text-sm text-gray-500 mt-1">Tra cứu toàn bộ vòng đời biến động, lịch sử bàn giao và sửa chữa của một thiết bị.</p>
      </div>

      {/* Thanh công cụ tìm kiếm */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <form method="GET" className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input 
              name="code"
              defaultValue={assetCode}
              required
              placeholder="Nhập mã tài sản để tra cứu (VD: AST-2026-000001)..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-samsung bg-gray-50 focus:bg-white transition-all uppercase font-bold text-gray-800"
            />
          </div>
          <button type="submit" className="bg-samsung text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm">
            Tra cứu dữ liệu
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl flex items-center gap-2 max-w-xl">
          <ShieldAlert className="h-5 w-5" /> {errorMsg}
        </div>
      )}

      {/* Kết quả Tra cứu */}
      {assetData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Khối bên trái: Thẻ tóm tắt thông tin thiết bị hiện tại */}
          <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 sticky top-6">
            <div className="border-b pb-3">
              <span className="text-[10px] bg-blue-50 text-samsung font-black px-2.5 py-1 rounded uppercase tracking-wider">
                {assetData.status}
              </span>
              <h2 className="text-lg font-black text-gray-800 mt-2 flex items-center gap-1.5">
                <Cpu className="h-5 w-5 text-gray-400" /> {assetData.name}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Mã hệ thống: {assetData.assetCode}</p>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2"><Tag className="h-4 w-4 text-gray-400"/> Danh mục: <strong className="text-gray-800">{assetData.category?.name || "—"}</strong></p>
              <p className="flex items-center gap-2"><Cpu className="h-4 w-4 text-gray-400"/> Model: <strong className="text-gray-800">{assetData.model || "—"}</strong></p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400"/> Vị trí hiện tại: <strong className="text-gray-800">{assetData.location?.name || "Trong kho / Chưa gán"}</strong></p>
              <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400"/> Ngày nhập kho: <strong className="text-gray-800">{assetData.purchaseDate ? format(new Date(assetData.purchaseDate), "dd/MM/yyyy") : "—"}</strong></p>
            </div>
          </div>

          {/* Khối bên phải: Trục thời gian đứng (Timeline) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
              <History className="h-4 w-4 text-gray-400" /> Trục lịch sử biến động dữ liệu ({assetData.logs.length})
            </h2>

            <div className="relative border-l-2 border-gray-100 pl-6 ml-3 space-y-6">
              {assetData.logs.map((log) => {
                const marker = getTimelineMarker(log.action);
                return (
                  <div key={log.id} className="relative group">
                    {/* Điểm nút trên trục đứng */}
                    <div className={`absolute -left-35px top-0.5 p-1.5 rounded-full border bg-white shadow-sm z-10 transition-transform group-hover:scale-110 ${marker.bg}`}>
                      {marker.icon}
                    </div>

                    {/* Nội dung chi tiết sự kiện */}
                    <div className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-all">
                      <div className="flex items-center justify-between gap-4 mb-1.5">
                        <span className="text-xs font-bold text-gray-800 tracking-wide uppercase">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          {format(new Date(log.createdAt), "HH:mm:ss - dd/MM/yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">{log.details}</p>
                      
                      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-gray-100/60 text-xs text-gray-400 font-medium">
                        <User className="h-3.5 w-3.5" />
                        Người thực hiện: <span className="text-gray-600 font-semibold">{log.user?.name || "Hệ thống"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {assetData.logs.length === 0 && (
                <p className="text-sm text-gray-400 py-4">Thiết bị này chưa ghi nhận lịch sử biến động nào.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {!assetCode && (
        <div className="p-12 text-center text-gray-400 border border-dashed rounded-xl bg-white max-w-xl mx-auto">
          <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          Hãy quét mã QR trên thiết bị hoặc gõ mã tài sản vào ô tìm kiếm ở trên để xem dòng thời gian vòng đời.
        </div>
      )}
    </div>
  );
}