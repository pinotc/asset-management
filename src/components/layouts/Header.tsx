import { Bell, Search, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function Header() {
  // Lấy 5 phiếu sửa chữa đang OPEN mới nhất để làm thông báo thả xuống
  const pendingRepairs = await prisma.assetRepair.findMany({
    where: { status: "OPEN" },
    include: {
      asset: { select: { assetCode: true, name: true } },
      creator: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const hasUnread = pendingRepairs.length > 0;

  return (
    <header className="h-16 bg-white border-b border-factory-border flex items-center justify-between px-6 z-10">
      <form 
        action="/search" 
        className="flex items-center text-gray-500 bg-gray-100 rounded-md px-3 py-1.5 w-96 focus-within:ring-2 focus-within:ring-samsung/50 transition-all"
      >
        <Search className="h-4 w-4 mr-2 shrink-0" />
        <input 
          type="text" 
          name="q"
          placeholder="Tìm kiếm tài sản, mã serial, phiếu sửa chữa..." 
          className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400"
          autoComplete="off"
          required
        />
      </form>

      <div className="flex items-center gap-4">
        {/* Dùng group của Tailwind để hiển thị dropdown khi Hover chuột */}
        <div className="relative group">
          <button className="relative p-2 text-gray-500 hover:text-samsung transition-colors">
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                {/* Hiệu ứng chớp nháy (Ping) để thu hút sự chú ý khi có yêu cầu mới */}
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
              </span>
            )}
          </button>

          {/* KHUNG DROPDOWN THÔNG BÁO (Tự hiện khi trỏ chuột vào chuông) */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-sm text-gray-800">Yêu cầu sửa chữa</span>
              {hasUnread && (
                <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingRepairs.length} MỚI
                </span>
              )}
            </div>
            
            <div className="max-h-300px overflow-y-auto">
              {hasUnread ? (
                pendingRepairs.map((repair) => (
                  <Link 
                    href={`/repairs/${repair.id}`} 
                    key={repair.id} 
                    className="flex gap-3 p-3 border-b border-gray-50 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-amber-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                        {repair.creator?.name || "Hệ thống"} báo hỏng
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {repair.asset.assetCode} - {repair.asset.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">
                        {format(new Date(repair.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-gray-500 font-medium">
                  Hiện không có yêu cầu sửa chữa nào đang chờ.
                </div>
              )}
            </div>
            
            {hasUnread && (
              <Link 
                href="/repairs" 
                className="block w-full p-2.5 text-center text-xs font-bold text-samsung bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                Xem tất cả phiếu bảo trì
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}