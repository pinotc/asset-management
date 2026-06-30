import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import RepairStatusButton from "../RepairStatusButton"; 

export default async function RepairTicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = await params;
  const ticketId = resolvedParams.ticketId;

  // 1. Lấy dữ liệu
  const [ticket, locations] = await Promise.all([
    prisma.assetRepair.findUnique({
      where: { id: ticketId },
      include: { asset: true, creator: true, technician: true }
    }),
    prisma.assetLocation.findMany({ orderBy: { name: "asc" } })
  ]);

  if (!ticket) redirect("/repairs");

  // 2. FIX LỖI DECIMAL: Chuyển đổi toàn bộ dữ liệu phức tạp (Decimal, Date) thành Plain Object (String/Number)
  // để Next.js có thể truyền xuống Client Component một cách an toàn.
  const serializedTicket = JSON.parse(JSON.stringify(ticket));

  const displayDescription = ticket.description || "Không có mô tả.";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/repairs" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Chi tiết phiếu sửa chữa thiết bị</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div>
            <span className="text-xs text-gray-400 font-bold tracking-wider">MÃ THIẾT BỊ</span>
            <p className="text-xl font-black text-samsung mt-0.5">{ticket.asset.assetCode}</p>
          </div>
          <div className="text-right">
            <span className="inline-block font-bold text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg">
              {ticket.status}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-500" /> Hiện tượng sự cố:
          </h3>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm leading-relaxed">
            {displayDescription}
          </div>
        </div>

        {ticket.status !== "COMPLETED" && (
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thao tác xử lý nghiệp vụ</h4>
            
            <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
              <div className="text-sm text-gray-600 font-medium">
                Sử dụng công cụ xử lý để điều phối thu hồi hoặc nghiệm thu thiết bị.
              </div>
              
              {/* 3. FIX LỖI UI: Bỏ class transform/scale để Modal fixed không bị lỗi hiển thị */}
              <div>
                <RepairStatusButton repair={serializedTicket} locations={locations} />
              </div>
            </div>
          </div>
        )}

        {ticket.status === "COMPLETED" && (
          <div className="pt-4 border-t border-gray-100">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm font-medium">
              Thiết bị đã được sửa chữa hoàn tất và bàn giao thành công.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}