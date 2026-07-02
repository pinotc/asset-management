//src\app\(dashboard)\audit\page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardCheck, Plus, Play, Lock, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { createAuditSession, closeAuditSession } from "@/actions/audit.actions";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  // Lấy danh sách các phiên trực tiếp từ bảng AuditSession
  const sessions = await prisma.auditSession.findMany({
    include: {
      _count: { select: { inspections: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-samsung" />
            Hệ thống Kiểm kê
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và khóa sổ các đợt audit tài sản trong nhà máy.</p>
        </div>
      </div>

      {/* Form tạo phiên mới */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-emerald-600" /> Khởi tạo phiên kiểm kê mới
        </h2>
        <form action={async (formData) => {
          "use server";
          await createAuditSession(formData);
        }} className="flex gap-3 max-w-xl">
          <input 
            name="title" required 
            placeholder="VD: Kiểm kê tài sản Line SMT - Tháng 06" 
            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-gray-50 focus:bg-white transition"
          />
          <button type="submit" className="bg-samsung text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition">
            Tạo đợt mới
          </button>
        </form>
      </div>

      {/* Danh sách các phiên */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {sessions.map((session) => (
          <div key={session.id} className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between transition-all ${session.status === 'OPEN' ? 'bg-white border-emerald-200 hover:border-emerald-400' : 'bg-gray-50 border-gray-200'}`}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                {session.status === "OPEN" ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider rounded-md animate-pulse">Đang diễn ra</span>
                ) : (
                  <span className="px-2.5 py-1 bg-gray-200 text-gray-600 text-[10px] font-extrabold uppercase tracking-wider rounded-md">Đã chốt sổ</span>
                )}
                <span className="text-xs text-gray-400 font-medium">{format(new Date(session.createdAt), "dd/MM/yyyy")}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-base leading-tight mb-3">{session.title}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-2 mb-4">
                <ClipboardCheck className="h-4 w-4 text-gray-400" /> Đã quét: <strong className="text-gray-900">{session._count.inspections} thiết bị</strong>
              </p>
            </div>
            
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <Link 
                href={`/audit/${session.id}`}
                className="flex items-center justify-center gap-1.5 p-2 text-samsung bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                title="Xem Báo cáo chi tiết"
              >
                <ClipboardCheck className="h-5 w-5" /> Báo cáo
              </Link>
              
              {session.status === "OPEN" ? (
                <>
                  <Link 
                    href={`/audit/scanner?sessionId=${session.id}`}
                    className="flex-1 flex justify-center items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-100 transition"
                  >
                    <Play className="h-4 w-4 fill-emerald-700" /> Quét tiếp
                  </Link>
                  <form action={async () => { "use server"; await closeAuditSession(session.id); }}>
                    <button type="submit" className="flex items-center justify-center p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition" title="Chốt/Khóa phiên">
                      <Lock className="h-5 w-5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-sm font-medium py-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <ShieldAlert className="h-4 w-4" /> Đã khóa dữ liệu
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}